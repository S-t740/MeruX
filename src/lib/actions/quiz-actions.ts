"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- INSTRUCTOR ACTIONS ---

export async function createQuiz(courseId: string, moduleId: string | null, data: {
  title: string;
  type: 'module' | 'final';
  time_limit: number | null;
  passing_score: number;
  max_attempts: number;
}) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) throw new Error("Unauthorized");

  // Basic check to ensure user is instructor for this course is handled by RLS, 
  // but we can proceed directly.
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .insert({
      course_id: courseId,
      module_id: moduleId,
      ...data
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/instructor/quizzes`);
  return quiz;
}

export async function addQuizQuestion(quizId: string, data: {
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'short_answer';
  points: number;
  position: number;
  options?: { option_text: string; is_correct: boolean }[];
}) {
  const supabase = await createClient();

  const { options, ...questionData } = data;

  // Insert Question
  const { data: question, error: questionError } = await supabase
    .from("quiz_questions")
    .insert({
      quiz_id: quizId,
      ...questionData,
    })
    .select()
    .single();

  if (questionError) throw new Error(questionError.message);

  // Insert Options if applicable
  if ((data.question_type === 'mcq' || data.question_type === 'true_false') && options) {
    const optionsToInsert = options.map(opt => ({
      question_id: question.id,
      ...opt
    }));

    const { error: optionsError } = await supabase
      .from("quiz_options")
      .insert(optionsToInsert);

    if (optionsError) throw new Error(optionsError.message);
  }

  revalidatePath(`/dashboard/instructor/quizzes/${quizId}`);
  return question;
}

// --- STUDENT ACTIONS ---

export async function startQuizAttempt(quizId: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) throw new Error("Unauthorized");

  // Check if active attempt exists
  const { data: existingAttempt } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("quiz_id", quizId)
    .eq("student_id", user.user.id)
    .eq("status", "in_progress")
    .single();

  if (existingAttempt) return existingAttempt;

  // Check max attempts logic (optional, dependent on quiz settings)
  
  // Create new attempt
  const { data: attempt, error } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id: quizId,
      student_id: user.user.id,
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return attempt;
}

export async function submitQuizAttempt(attemptId: string, answers: { question_id: string; selected_option_id?: string; answer_text?: string }[]) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) throw new Error("Unauthorized");

  // Fetch attempt, definitions to calculate grade
  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .select("*, quizzes(id, type, passing_score, course_id, module_id)")
    .eq("id", attemptId)
    .single();

  if (attemptError || !attempt) throw new Error("Attempt not found");

  if (attempt.status !== "in_progress") throw new Error("Attempt already completed");

  // Fetch all quiz questions & correct options
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, points, question_type, quiz_options(id, is_correct)")
    .eq("quiz_id", attempt.quiz_id);

  let totalScore = 0;
  let maxScore = 0;

  const answersToInsert = [];

  for (const answer of answers) {
    const question = questions?.find((q) => q.id === answer.question_id);
    if (!question) continue;

    maxScore += question.points || 0;

    let isCorrect = false;
    let pointsAwarded = 0;

    if (question.question_type === "mcq" || question.question_type === "true_false") {
      const selectedOption = question.quiz_options.find((opt: any) => opt.id === answer.selected_option_id);
      if (selectedOption?.is_correct) {
        isCorrect = true;
        pointsAwarded = question.points || 0;
        totalScore += pointsAwarded;
      }
    } else {
      // Short answer requires manual grading
      pointsAwarded = 0; 
    }

    answersToInsert.push({
      attempt_id: attemptId,
      question_id: answer.question_id,
      selected_option_id: answer.selected_option_id || null,
      answer_text: answer.answer_text || null,
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
    });
  }

  // Insert answers
  if (answersToInsert.length > 0) {
    const { error: answersError } = await supabase.from("quiz_answers").insert(answersToInsert);
    if (answersError) throw new Error("Failed to save answers: " + answersError.message);
  }

  const isManualGradingRequired = questions?.some((q) => q.question_type === "short_answer");
  const finalStatus = isManualGradingRequired ? "submitted" : "graded";

  // Update attempt
  const { error: updateError } = await supabase
    .from("quiz_attempts")
    .update({
      score: totalScore,
      status: finalStatus,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", attemptId);

  if (updateError) throw new Error("Error updating attempt status.");

  // If completed and graded course logic checking (unlocks)
  if (finalStatus === "graded") {
    // We would evaluate whether this passes the module and update course_progress here
    // Ex: verify attempt.score >= attempt.quizzes.passing_score
  }

  revalidatePath(`/dashboard/student/courses/${attempt.quizzes.course_id}`);
  return { success: true, score: totalScore, maxScore, status: finalStatus };
}
