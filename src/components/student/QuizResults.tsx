"use client";

import Link from "next/link";
import { CheckCircle, XCircle, Award, ArrowRight, RefreshCcw } from "lucide-react";

export function QuizResults({ attempt, quiz, questions }: { attempt: any, quiz: any, questions: any[] }) {
  const isPassed = attempt.score >= quiz.passing_score;
  const isGraded = attempt.status === "graded";

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Summary */}
      <div className={`p-8 rounded-2xl border ${
        !isGraded 
          ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800'
          : isPassed 
            ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' 
            : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'
      }`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {quiz.title} Results
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isGraded ? (
                isPassed ? "Congratulations! You passed the quiz." : "You did not meet the passing score this time."
              ) : "Your quiz has been submitted and is awaiting manual grading."}
            </p>
          </div>
          
          <div className="flex flex-col items-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm min-w-[150px]">
             {isGraded ? (
               <>
                  <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">
                    {Math.round((attempt.score / (quiz.total_marks || 100)) * 100)}%
                  </div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    {attempt.score} / {quiz.total_marks || 100} Points
                  </div>
               </>
             ) : (
                <div className="text-lg font-bold text-gray-500 flex items-center gap-2">
                  <RefreshCcw className="w-5 h-5 animate-spin" /> Pending
                </div>
             )}
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <Link 
            href={`/dashboard/student/courses/${quiz.course_id}`}
            className="px-6 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Back to Course
          </Link>
          {isPassed && quiz.type === 'final' && (
             <button className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2 transition shadow-sm">
                <Award className="w-5 h-5" />
                Claim Certificate
             </button>
          )}
        </div>
      </div>

      {/* Answers Review */}
      <h2 className="text-2xl font-bold dark:text-white px-2">Review Answers</h2>
      
      <div className="space-y-6">
        {questions.map((q, index) => {
          const answer = attempt.quiz_answers?.find((a: any) => a.question_id === q.id);
          const isCorrect = answer?.is_correct;

          return (
            <div key={q.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm relative overflow-hidden">
               {isGraded && (q.question_type === 'mcq' || q.question_type === 'true_false') && (
                 <div className={`absolute top-0 right-0 w-2 h-full ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`} />
               )}

              <div className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center font-bold">
                  {index + 1}
                </span>
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium dark:text-white pr-8">
                      {q.question_text}
                    </h3>
                    {isGraded && (
                       <span className={`text-sm font-bold flex items-center gap-1 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                         {isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                         {answer?.points_awarded || 0} / {q.points} pt
                       </span>
                    )}
                  </div>

                  {(q.question_type === 'mcq' || q.question_type === 'true_false') ? (
                    <div className="space-y-2">
                      {q.quiz_options?.map((opt: any) => {
                        const isSelected = answer?.selected_option_id === opt.id;
                        // Assume we might not know correct answers if we don't fetch them, 
                        // but if we did fetch them, we could highlight correct ones. We only know what student got right.
                        // Wait, typically instructor decides if students can see right answers. We'll show what they selected.
                        
                        return (
                          <div 
                            key={opt.id} 
                            className={`flex items-center gap-3 p-3 rounded-lg border 
                              ${isSelected 
                                ? isCorrect 
                                  ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                                  : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                                : 'border-gray-200 dark:border-gray-700 opacity-70'
                              }`}
                          >
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center
                              ${isSelected 
                                ? isCorrect ? 'border-green-600 bg-green-600' : 'border-red-600 bg-red-600'
                                : 'border-gray-400'
                              }`}
                            >
                               {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <span className="dark:text-gray-200">{opt.option_text}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700">
                      <p className="text-gray-600 dark:text-gray-300">{answer?.answer_text || "No answer provided"}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
