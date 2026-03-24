import { createClient } from "@/lib/supabase/server";
import { QuizBuilder } from "@/components/instructor/QuizBuilder";
import { redirect } from "next/navigation";

export default async function NewQuizPage() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    redirect('/auth/login');
  }

  // Fetch courses owned by this instructor
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, modules(id, title)")
    .eq("instructor_id", user.user.id);

  if (!courses || courses.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You must create a course before you can create a quiz.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Create New Quiz</h1>
      <QuizBuilder courses={courses} />
    </div>
  );
}
