import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PlusCircle, Clock, CheckCircle, Edit3 } from "lucide-react";

export default async function InstructorQuizzesPage() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  // Fetch quizzes and the associated courses
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*, courses(title, id)")
    .order("created_at", { ascending: false });

  // Only get quizzes for courses this instructor teaches (handled by RLS basically, but here's a strict filter if needed)
  // Our RLS manage policy handles it.

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quiz Management</h1>
          <p className="text-gray-500 mt-2">Create and manage your quizzes and final exams.</p>
        </div>
        <Link 
          href="/dashboard/instructor/quizzes/new" 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          Create Quiz
        </Link>
      </div>

      {quizzes && quizzes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${quiz.type === 'final' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {quiz.type === 'final' ? 'Final Exam' : 'Module Quiz'}
                </span>
                <Link href={`/dashboard/instructor/quizzes/${quiz.id}`} className="text-gray-400 hover:text-blue-500 transition-colors">
                  <Edit3 className="w-5 h-5" />
                </Link>
              </div>
              <h3 className="font-bold text-lg mb-1 dark:text-white line-clamp-1">{quiz.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-1">
                Course: {quiz.courses?.title || 'Unknown Course'}
              </p>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {quiz.time_limit ? `${quiz.time_limit} mins` : 'No limit'}
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Pass: {quiz.passing_score}%
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't created any quizzes yet.</p>
          <Link 
            href="/dashboard/instructor/quizzes/new" 
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            Create Your First Quiz
          </Link>
        </div>
      )}
    </div>
  );
}
