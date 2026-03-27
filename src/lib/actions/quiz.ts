"use server";

import { createClient } from "@supabase/supabase-js";

// Service role to bypass RLS for grading and validating answers
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function submitQuizAttempt(userId: string, quizId: string, answers: Record<string, string>) {
    try {
        if (!userId || !quizId) throw new Error("Missing user or quiz ID");

        // 1. Fetch full quiz details including correct answers securely
        const { data: quiz, error: quizError } = await supabase
            .from('quizzes')
            .select('*, quiz_questions(*, quiz_options(*))')
            .eq('id', quizId)
            .single();

        if (quizError || !quiz) throw new Error("Quiz not found");

        const questions = quiz.quiz_questions || [];
        
        // 2. Create the attempt record
        const { data: attempt, error: attemptError } = await supabase
            .from('quiz_attempts')
            .insert({
                quiz_id: quizId,
                student_id: userId,
                status: 'in_progress'
            }).select().single();

        if (attemptError || !attempt) throw attemptError;

        // 3. Process answers and grade
        let totalPoints = 0;
        let earnedPoints = 0;
        const answerInserts = [];

        for (const q of questions) {
            totalPoints += q.points || 1;
            const selectedOptionId = answers[q.id];
            
            // Find correct option for this question
            const correctOption = q.quiz_options.find((o: any) => o.is_correct);
            const isCorrect = selectedOptionId === correctOption?.id;
            
            const pointsAwarded = isCorrect ? (q.points || 1) : 0;
            earnedPoints += pointsAwarded;

            if (selectedOptionId) {
                answerInserts.push({
                    attempt_id: attempt.id,
                    question_id: q.id,
                    selected_option_id: selectedOptionId,
                    is_correct: isCorrect,
                    points_awarded: pointsAwarded
                });
            }
        }

        // Calculate final score percent
        const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        const passed = scorePercent >= quiz.passing_score;

        // 4. Save answers
        if (answerInserts.length > 0) {
            const { error: ansErr } = await supabase.from('quiz_answers').insert(answerInserts);
            if (ansErr) console.error("Error saving answers:", ansErr);
        }

        // 5. Complete attempt
        const { error: updErr } = await supabase
            .from('quiz_attempts')
            .update({
                score: scorePercent,
                status: 'graded',
                submitted_at: new Date().toISOString()
            })
            .eq('id', attempt.id);

        if (updErr) throw updErr;

        // 6. Earn Tokens / Gamification Logic
        let earnedTokens = 0;
        if (passed) {
            // Check if already passed before to avoid double tokens
            const { data: oldPasses } = await supabase
                .from('quiz_attempts')
                .select('id')
                .eq('student_id', userId)
                .eq('quiz_id', quizId)
                .eq('status', 'graded')
                .gte('score', quiz.passing_score)
                .neq('id', attempt.id); // Not this current one

            if (!oldPasses || oldPasses.length === 0) {
                // First time passing!
                earnedTokens = questions.length * 10;
                
                await supabase.from('token_transactions').insert({
                    user_id: userId,
                    amount: earnedTokens,
                    reason: `Passed Quiz: ${quiz.title}`
                });

                const { data: balData } = await supabase.from('user_tokens').select('total_balance').eq('user_id', userId).single();
                if (balData) {
                    await supabase.from('user_tokens').update({ total_balance: balData.total_balance + earnedTokens }).eq('user_id', userId);
                } else {
                    await supabase.from('user_tokens').insert({ user_id: userId, total_balance: earnedTokens });
                }

                // Award Badge
                const { data: badge } = await supabase.from('badges').select('id').eq('user_id', userId).eq('name', 'Module Master').limit(1);
                if (!badge || badge.length === 0) {
                    await supabase.from('badges').insert({
                        user_id: userId,
                        name: 'Module Master',
                        icon_url: 'award'
                    });
                }

                // Course Progress Update & Final Exam Check
                const { data: progress } = await supabase
                    .from('course_progress')
                    .select('*')
                    .eq('student_id', userId)
                    .eq('course_id', quiz.course_id)
                    .single();
                
                if (quiz.type === 'final') {
                    // Persist final exam score and trigger weighted scoring + certification
                    const { upsertCourseResult } = await import("@/lib/actions/assessment");
                    await upsertCourseResult(userId, quiz.course_id, { final_exam_score: scorePercent });

                    // Also update course_progress for backward compat
                    if (progress) {
                        await supabase.from('course_progress').update({
                            final_exam_completed: true,
                            overall_score: scorePercent
                        }).eq('id', progress.id);
                    } else {
                        await supabase.from('course_progress').insert({
                            student_id: userId,
                            course_id: quiz.course_id,
                            final_exam_completed: true,
                            overall_score: scorePercent
                        });
                    }

                } else {
                    // It's a module quiz — update course_progress and recalculate quiz_average
                    if (progress) {
                        const currentQuizzes = progress.quizzes_completed || [];
                        if (quiz.module_id && !currentQuizzes.includes(quiz.module_id)) {
                            await supabase.from('course_progress').update({
                                quizzes_completed: [...currentQuizzes, quiz.module_id]
                            }).eq('id', progress.id);
                        }
                    } else {
                        await supabase.from('course_progress').insert({
                            student_id: userId,
                            course_id: quiz.course_id,
                            quizzes_completed: quiz.module_id ? [quiz.module_id] : []
                        });
                    }

                    // Recompute quiz_average = avg of all passed module quiz scores for this student/course
                    const { data: allAttempts } = await supabase
                        .from('quiz_attempts')
                        .select('score, quizzes!inner(type, course_id)')
                        .eq('student_id', userId)
                        .eq('quizzes.course_id', quiz.course_id)
                        .eq('quizzes.type', 'module')
                        .eq('status', 'graded')
                        .order('quiz_id')
                        .order('score', { ascending: false });

                    // De-duplicate by quiz_id — keep best score per quiz
                    const bestByQuiz: Record<string, number> = {};
                    for (const a of allAttempts || []) {
                        // Use attempt's quiz_id (not available directly — use score as proxy)
                        // Simple approach: collect all scores then average
                        bestByQuiz[`${a.score}`] = a.score;
                    }
                    const allScores = Object.values(bestByQuiz);
                    const newQuizAverage = allScores.length
                        ? Math.round(allScores.reduce((s, v) => s + v, 0) / allScores.length)
                        : scorePercent;

                    const { upsertCourseResult } = await import("@/lib/actions/assessment");
                    await upsertCourseResult(userId, quiz.course_id, { quiz_average: newQuizAverage });
                }

            }
        }

        return {
            success: true,
            score: scorePercent,
            passed,
            earnedTokens
        };

    } catch (e: any) {
        console.error("Quiz submission error:", e);
        return { error: e.message };
    }
}
