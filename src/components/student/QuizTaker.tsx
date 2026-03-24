"use client";

import { useState, useEffect } from "react";
import { startQuizAttempt, submitQuizAttempt } from "@/lib/actions/quiz-actions";
import { useRouter } from "next/navigation";
import { Clock, AlertCircle, Loader2 } from "lucide-react";

export function QuizTaker({ quiz, questions, existingAttempt }: { quiz: any, questions: any[], existingAttempt?: any }) {
  const router = useRouter();
  const [attemptId, setAttemptId] = useState<string | null>(existingAttempt?.id || null);
  const [answers, setAnswers] = useState<Record<string, { selected_option_id?: string, answer_text?: string }>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Resume or start
  useEffect(() => {
    if (!attemptId) {
      const start = async () => {
        setLoading(true);
        try {
          const attempt = await startQuizAttempt(quiz.id);
          setAttemptId(attempt.id);

          if (quiz.time_limit) {
            const startedAt = new Date(attempt.started_at).getTime();
            const now = new Date().getTime();
            const elapsed = Math.floor((now - startedAt) / 1000);
            const remaining = (quiz.time_limit * 60) - elapsed;
            setTimeLeft(Math.max(0, remaining));
          }
        } catch (err) {
          console.error("Failed to start attempt", err);
        } finally {
          setLoading(false);
        }
      };
      start();
    } else if (quiz.time_limit && existingAttempt) {
       const startedAt = new Date(existingAttempt.started_at).getTime();
       const now = new Date().getTime();
       const elapsed = Math.floor((now - startedAt) / 1000);
       const remaining = (quiz.time_limit * 60) - elapsed;
       setTimeLeft(Math.max(0, remaining));
    }
  }, [attemptId, quiz.id, quiz.time_limit, existingAttempt]);

  // Timer logic
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit(); // Auto-submit when time's up
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev !== null ? prev - 1 : null);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { selected_option_id: optionId }
    }));
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { answer_text: text }
    }));
  };

  const handleSubmit = async () => {
    if (!attemptId || submitting) return;
    
    setSubmitting(true);
    try {
      // Format answers for API
      const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
        question_id: qId,
        ...ans
      }));

      await submitQuizAttempt(attemptId, formattedAnswers);
      router.refresh(); // Refresh page to show results
    } catch (err) {
      console.error(err);
      alert("Failed to submit quiz. Please try again.");
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm sticky top-4 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold dark:text-white">{quiz.title}</h1>
          <p className="text-sm text-gray-500">Answer all questions before submitting.</p>
        </div>
        
        {timeLeft !== null && (
          <div className={`flex items-center gap-2 font-mono text-lg font-bold px-4 py-2 rounded-lg ${timeLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <div className="space-y-8">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
            <div className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                {index + 1}
              </span>
              <div className="flex-1 space-y-4">
                <h3 className="text-lg font-medium dark:text-white pb-2 border-b dark:border-gray-700">
                  {q.question_text}
                  <span className="ml-2 text-sm font-normal text-gray-500">({q.points} pts)</span>
                </h3>

                {(q.question_type === 'mcq' || q.question_type === 'true_false') ? (
                  <div className="space-y-2">
                    {q.quiz_options?.map((opt: any) => (
                      <label 
                        key={opt.id} 
                        className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors
                          ${answers[q.id]?.selected_option_id === opt.id 
                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                            : 'hover:bg-gray-50 border-gray-200 dark:hover:bg-gray-700/50 dark:border-gray-700'
                          }`}
                      >
                        <input
                          type="radio"
                          name={`q_${q.id}`}
                          checked={answers[q.id]?.selected_option_id === opt.id}
                          onChange={() => handleSelectOption(q.id, opt.id)}
                          className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="dark:text-gray-200">{opt.option_text}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    rows={4}
                    value={answers[q.id]?.answer_text || ""}
                    onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full px-4 py-3 border dark:border-gray-600 bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-md transition-colors flex items-center gap-2"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Quiz"}
        </button>
      </div>
    </div>
  );
}
