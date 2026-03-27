"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─────────────────────────────────────────────
// INSTRUCTOR: Add question to bank
// ─────────────────────────────────────────────
export async function addBankQuestion(
    courseId: string,
    instructorId: string,
    data: {
        topic: string;
        difficulty: "easy" | "medium" | "hard";
        question_type: "mcq" | "true_false" | "short_answer" | "scenario";
        question_text: string;
        explanation?: string;
        options?: { option_text: string; is_correct: boolean; position?: number }[];
    }
) {
    const { options, ...questionData } = data;

    const { data: question, error } = await adminSupabase
        .from("question_bank")
        .insert({
            course_id: courseId,
            created_by: instructorId,
            ...questionData,
        })
        .select()
        .single();

    if (error) return { error: error.message };

    if (options && options.length > 0) {
        const { error: optErr } = await adminSupabase.from("question_options").insert(
            options.map((o, i) => ({
                question_id: question.id,
                option_text: o.option_text,
                is_correct: o.is_correct,
                position: o.position ?? i,
            }))
        );
        if (optErr) return { error: optErr.message };
    }

    revalidatePath(`/dashboard/instructor/question-bank`);
    return { data: question };
}

// ─────────────────────────────────────────────
// INSTRUCTOR: Update question
// ─────────────────────────────────────────────
export async function updateBankQuestion(
    questionId: string,
    data: Partial<{
        topic: string;
        difficulty: string;
        question_type: string;
        question_text: string;
        explanation: string;
        is_active: boolean;
    }>
) {
    const { error } = await adminSupabase
        .from("question_bank")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", questionId);

    if (error) return { error: error.message };

    revalidatePath(`/dashboard/instructor/question-bank`);
    return { success: true };
}

// ─────────────────────────────────────────────
// INSTRUCTOR: Delete question
// ─────────────────────────────────────────────
export async function deleteBankQuestion(questionId: string) {
    const { error } = await adminSupabase
        .from("question_bank")
        .delete()
        .eq("id", questionId);

    if (error) return { error: error.message };

    revalidatePath(`/dashboard/instructor/question-bank`);
    return { success: true };
}

// ─────────────────────────────────────────────
// Get questions for a course (with options, without is_correct for students)
// ─────────────────────────────────────────────
export async function getBankQuestions(courseId: string, isInstructor: boolean = false) {
    const query = adminSupabase
        .from("question_bank")
        .select(`*, question_options(id, option_text, position${isInstructor ? ", is_correct" : ""})`)
        .eq("course_id", courseId)
        .eq("is_active", true)
        .order("topic")
        .order("difficulty");

    const { data, error } = await query;
    if (error) return { error: error.message };
    return { data };
}

// ─────────────────────────────────────────────
// ENGINE: Auto-generate quiz questions from bank
// ─────────────────────────────────────────────
export async function generateQuizFromBank(
    quizId: string,
    courseId: string,
    config: {
        topic?: string;
        easy?: number;
        medium?: number;
        hard?: number;
        total?: number;
        excludeQuestionIds?: string[]; // from previous attempts
    }
) {
    const { topic, easy = 5, medium = 5, hard = 5, excludeQuestionIds = [] } = config;

    const fetchByDifficulty = async (difficulty: string, count: number) => {
        let query = adminSupabase
            .from("question_bank")
            .select("id")
            .eq("course_id", courseId)
            .eq("difficulty", difficulty)
            .eq("is_active", true);

        if (topic) query = query.eq("topic", topic);
        if (excludeQuestionIds.length) query = query.not("id", "in", `(${excludeQuestionIds.join(",")})`);

        const { data } = await query;
        if (!data || data.length === 0) return [];

        // Random shuffle
        const shuffled = data.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count).map((q) => q.id);
    };

    const [easyIds, mediumIds, hardIds] = await Promise.all([
        fetchByDifficulty("easy", easy),
        fetchByDifficulty("medium", medium),
        fetchByDifficulty("hard", hard),
    ]);

    const allIds = [...easyIds, ...mediumIds, ...hardIds];

    if (allIds.length === 0) return { error: "No questions available in the bank for this configuration." };

    // Delete existing generated questions for this quiz (re-generate)
    await adminSupabase.from("quiz_questions").delete().eq("quiz_id", quizId).not("bank_question_id", "is", null);

    const questionsToInsert = allIds.map((qBankId, i) => ({
        quiz_id: quizId,
        bank_question_id: qBankId,
        question_text: "", // will be fetched from bank at runtime
        question_type: "mcq",
        points: 1,
        position: i,
    }));

    const { error: insertErr } = await adminSupabase.from("quiz_questions").insert(questionsToInsert);
    if (insertErr) return { error: insertErr.message };

    revalidatePath(`/dashboard/instructor/quizzes/${quizId}`);
    return { success: true, count: allIds.length };
}

// ─────────────────────────────────────────────
// Get quiz with questions (student-safe: no is_correct)
// ─────────────────────────────────────────────
export async function getQuizForStudent(quizId: string) {
    // First get quiz metadata
    const { data: quiz, error: quizErr } = await adminSupabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();

    if (quizErr || !quiz) return { error: "Quiz not found" };

    // Get quiz_questions joined with bank for bank-generated ones
    const { data: rawQuestions, error: qErr } = await adminSupabase
        .from("quiz_questions")
        .select("*, question_bank(id, question_text, question_type, topic, difficulty, explanation, question_options(id, option_text, position))")
        .eq("quiz_id", quizId)
        .order("position");

    if (qErr) return { error: qErr.message };

    // Resolve questions: if bank-linked, use bank data; otherwise use inline data
    const questions = (rawQuestions || []).map((q: any) => {
        const fromBank = q.question_bank;
        return {
            id: q.id,
            quiz_id: q.quiz_id,
            points: q.points,
            position: q.position,
            question_text: fromBank ? fromBank.question_text : q.question_text,
            question_type: fromBank ? fromBank.question_type : q.question_type,
            topic: fromBank?.topic,
            difficulty: fromBank?.difficulty,
            options: fromBank
                ? (fromBank.question_options || []).sort((a: any, b: any) => a.position - b.position)
                : [],
        };
    });

    if (quiz.randomize_questions) {
        questions.sort(() => Math.random() - 0.5);
    }

    return { data: { ...quiz, questions } };
}

// ─────────────────────────────────────────────
// Get quiz attempt count for a student
// ─────────────────────────────────────────────
export async function getAttemptCount(quizId: string, studentId: string) {
    const { count } = await adminSupabase
        .from("quiz_attempts")
        .select("*", { count: "exact", head: true })
        .eq("quiz_id", quizId)
        .eq("student_id", studentId)
        .neq("status", "in_progress");

    return count ?? 0;
}
