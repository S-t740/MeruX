"use client";

import { useState } from "react";
import { createQuiz } from "@/lib/actions/quiz-actions";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Course = {
  id: string;
  title: string;
  modules: { id: string; title: string }[];
};

export function QuizBuilder({ courses }: { courses: Course[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    course_id: courses[0]?.id || "",
    module_id: "",
    title: "",
    type: "module" as "module" | "final",
    time_limit: 30, // Default 30 minutes
    passing_score: 70, // Default 70% passing score
    max_attempts: 1, // Default 1 attempt
  });

  const selectedCourse = courses.find((c) => c.id === formData.course_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const quiz = await createQuiz(formData.course_id, formData.module_id || null, {
        title: formData.title,
        type: formData.type,
        time_limit: formData.time_limit || null,
        passing_score: formData.passing_score,
        max_attempts: formData.max_attempts,
      });
      
      router.push(`/dashboard/instructor/quizzes/${quiz.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create quiz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">{error}</div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Quiz Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border dark:border-gray-600 bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Introduction to React Quiz"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Course *</label>
            <select
              required
              value={formData.course_id}
              onChange={(e) => setFormData({ ...formData, course_id: e.target.value, module_id: "" })}
              className="w-full px-4 py-2 border dark:border-gray-600 bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Select a course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id} className="dark:bg-gray-800">
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Quiz Type *</label>
            <select
              required
              value={formData.type}
              onChange={(e) => {
                const type = e.target.value as "module" | "final";
                setFormData({ ...formData, type, module_id: type === 'final' ? "" : formData.module_id });
              }}
              className="w-full px-4 py-2 border dark:border-gray-600 bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="module" className="dark:bg-gray-800">Module Quiz</option>
              <option value="final" className="dark:bg-gray-800">Final Exam</option>
            </select>
          </div>
        </div>

        {formData.type === "module" && selectedCourse && (
          <div>
            <label className="block text-sm font-medium mb-1">Select Module *</label>
            <select
              required
              value={formData.module_id}
              onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
              className="w-full px-4 py-2 border dark:border-gray-600 bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Select a module</option>
              {selectedCourse.modules?.map((m) => (
                <option key={m.id} value={m.id} className="dark:bg-gray-800">
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Time Limit (mins)</label>
            <input
              type="number"
              min="0"
              value={formData.time_limit}
              onChange={(e) => setFormData({ ...formData, time_limit: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border dark:border-gray-600 bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Leave 0 for unlimited"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Passing Score (%) *</label>
            <input
              type="number"
              min="1"
              max="100"
              required
              value={formData.passing_score}
              onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border dark:border-gray-600 bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Max Attempts *</label>
            <input
              type="number"
              min="1"
              required
              value={formData.max_attempts}
              onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border dark:border-gray-600 bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t dark:border-gray-700">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Continue to Add Questions
        </button>
      </div>
    </form>
  );
}
