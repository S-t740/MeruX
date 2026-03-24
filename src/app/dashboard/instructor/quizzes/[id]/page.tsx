import { createClient } from "@/lib/supabase/server";
import { QuestionEditor } from "@/components/instructor/QuestionEditor";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Award, FileText } from "lucide-react";

export default async function QuizDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    redirect('/auth/login');
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*, courses(title), quiz_questions(*, quiz_options(*))")
    .eq("id", params.id)
    .single();

  if (!quiz) {
    return <div>Quiz not found or unauthorized</div>;
  }

  // Sort questions by position
  const questions = quiz.quiz_questions?.sort((a: any, b: any) => a.position - b.position) || [];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <Link href="/dashboard/instructor/quizzes" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Quizzes
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{quiz.title}</h1>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${quiz.type === 'final' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {quiz.type === 'final' ? 'Final Exam' : 'Module Quiz'}
              </span>
            </div>
            <p className="text-gray-500">Course: {quiz.courses?.title}</p>
          </div>
          <div className="flex gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-gray-500 text-xs uppercase font-semibold">Time Limit</p>
                <p className="font-medium">{quiz.time_limit ? `${quiz.time_limit} mins` : 'None'}</p>
              </div>
            </div>
            <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-gray-500 text-xs uppercase font-semibold">Passing</p>
                <p className="font-medium">{quiz.passing_score}%</p>
              </div>
            </div>
            <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-gray-500 text-xs uppercase font-semibold">Questions</p>
                <p className="font-medium">{questions.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold dark:text-white">Questions</h2>
        
        {questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((q: any, i: number) => (
              <div key={q.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <span className="font-medium text-gray-500">Question {i + 1} ({q.points} {q.points === 1 ? 'pt' : 'pts'})</span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs font-semibold rounded text-gray-600 dark:text-gray-300">
                    {q.question_type === 'mcq' ? 'Multiple Choice' : q.question_type === 'true_false' ? 'True/False' : 'Short Answer'}
                  </span>
                </div>
                <p className="text-lg font-medium dark:text-gray-200 mb-4">{q.question_text}</p>
                
                {(q.question_type === 'mcq' || q.question_type === 'true_false') && q.quiz_options && (
                  <div className="space-y-2">
                    {q.quiz_options.map((opt: any) => (
                      <div key={opt.id} className={`p-3 rounded-lg border ${opt.is_correct ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${opt.is_correct ? 'border-green-600 bg-green-600' : 'border-gray-400'}`}>
                            {opt.is_correct && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className={`${opt.is_correct ? 'text-green-800 dark:text-green-300 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                            {opt.option_text}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-dashed dark:border-gray-700 text-gray-500">
            No questions added yet. Use the form below to add your first question.
          </div>
        )}

        <div className="mt-8 pt-8 border-t dark:border-gray-700">
          <h3 className="text-xl font-bold dark:text-white mb-6">Add New Question</h3>
          <QuestionEditor quizId={quiz.id} nextPosition={questions.length} />
        </div>
      </div>
    </div>
  );
}
