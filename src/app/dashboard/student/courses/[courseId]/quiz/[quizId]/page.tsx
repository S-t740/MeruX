import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { QuizTaker } from "@/components/student/QuizTaker";
import { QuizResults } from "@/components/student/QuizResults";

export default async function StudentQuizPage({ params }: { params: { courseId: string, quizId: string } }) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    redirect('/auth/login');
  }

  // Fetch Quiz Details
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*, quiz_questions(*, quiz_options(id, option_text))")
    .eq("id", params.quizId)
    .single();

  if (!quiz) {
    return <div>Quiz not found.</div>;
  }

  // Sort questions
  const questions = quiz.quiz_questions?.sort((a: any, b: any) => a.position - b.position) || [];

  // Check for existing attempt
  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("*, quiz_answers(*)")
    .eq("quiz_id", quiz.id)
    .eq("student_id", user.user.id)
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  // If there's a completed attempt, show results
  if (attempt && (attempt.status === "submitted" || attempt.status === "graded")) {
    return <QuizResults attempt={attempt} quiz={quiz} questions={questions} />;
  }

  // Otherwise show the taker interface
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <QuizTaker quiz={quiz} questions={questions} existingAttempt={attempt} />
    </div>
  );
}
