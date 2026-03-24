"use client";

import { useState } from "react";
import { addQuizQuestion } from "@/lib/actions/quiz-actions";
import { Plus, Trash2, Loader2, Save } from "lucide-react";

export function QuestionEditor({ quizId, nextPosition }: { quizId: string, nextPosition: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [questionType, setQuestionType] = useState<"mcq" | "true_false" | "short_answer">("mcq");
  const [questionText, setQuestionText] = useState("");
  const [points, setPoints] = useState(1);
  const [options, setOptions] = useState([
    { option_text: "Option 1", is_correct: true },
    { option_text: "Option 2", is_correct: false },
  ]);

  const handleAddOption = () => {
    setOptions([...options, { option_text: `Option ${options.length + 1}`, is_correct: false }]);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    
    // Ensure at least one is correct if possible
    if (newOptions.length > 0 && !newOptions.some(o => o.is_correct)) {
      newOptions[0].is_correct = true;
    }
    
    setOptions(newOptions);
  };

  const handleOptionChange = (index: number, field: string, value: any) => {
    const newOptions = [...options];
    
    if (field === 'is_correct' && value === true) {
      // In typical MCQ setup with radio buttons, only one is correct
      // But we allow multiple if we want logic for multiple correct. Let's stick to single correct for simplicity
      newOptions.forEach(o => o.is_correct = false);
    }
    
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let finalOptions = options;
      
      if (questionType === 'true_false') {
        finalOptions = [
          { option_text: 'True', is_correct: options[0]?.is_correct || false },
          { option_text: 'False', is_correct: !options[0]?.is_correct }
        ];
      }

      await addQuizQuestion(quizId, {
        question_text: questionText,
        question_type: questionType,
        points: points,
        position: nextPosition,
        options: questionType !== 'short_answer' ? finalOptions : undefined
      });

      // Reset form
      setQuestionText("");
      setOptions([
        { option_text: "Option 1", is_correct: true },
        { option_text: "Option 2", is_correct: false },
      ]);
      setPoints(1);
      
    } catch (err: any) {
      setError(err.message || "Failed to add question.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3">
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Question Text *</label>
          <textarea
            required
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="w-full px-4 py-2 border dark:border-gray-600 bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            placeholder="Type your question here..."
          />
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Type *</label>
            <select
              required
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as any)}
              className="w-full px-4 py-2 border dark:border-gray-600 bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="mcq" className="dark:bg-gray-800">Multiple Choice</option>
              <option value="true_false" className="dark:bg-gray-800">True / False</option>
              <option value="short_answer" className="dark:bg-gray-800">Short Answer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Points *</label>
            <input
              type="number"
              min="1"
              required
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value))}
              className="w-full px-4 py-2 border dark:border-gray-600 bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {questionType === 'mcq' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium dark:text-gray-300">Options</label>
          {options.map((opt, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${opt.is_correct ? 'border-green-500 bg-green-50/10' : 'border-gray-200 dark:border-gray-700'}`}>
              <input 
                type="radio" 
                name="correct_option" 
                checked={opt.is_correct}
                onChange={() => handleOptionChange(i, 'is_correct', true)}
                className="w-5 h-5 text-blue-600"
                title="Mark as correct"
              />
              <input
                type="text"
                required
                value={opt.option_text}
                onChange={(e) => handleOptionChange(i, 'option_text', e.target.value)}
                className="flex-1 bg-transparent border-0 focus:ring-0 p-0 text-gray-900 dark:text-gray-100"
                placeholder={`Option ${i + 1}`}
              />
              {options.length > 2 && (
                <button type="button" onClick={() => handleRemoveOption(i)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddOption}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors py-2"
          >
            <Plus className="w-4 h-4" />
            Add Option
          </button>
        </div>
      )}

      {questionType === 'true_false' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium dark:text-gray-300">Correct Answer</label>
          <div className="flex gap-4">
             <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="tf_correct" 
                  checked={options[0]?.is_correct}
                  onChange={() => {
                    const newOps = [...options];
                    if(newOps[0]) newOps[0].is_correct = true;
                    setOptions(newOps);
                  }}
                  className="w-4 h-4"
                />
                <span className="dark:text-white">True</span>
             </label>
             <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="tf_correct" 
                  checked={!options[0]?.is_correct}
                  onChange={() => {
                    const newOps = [...options];
                    if(newOps[0]) newOps[0].is_correct = false;
                    setOptions(newOps);
                  }}
                  className="w-4 h-4"
                />
                <span className="dark:text-white">False</span>
             </label>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t dark:border-gray-700">
        <button
          type="submit"
          disabled={loading || !questionText.trim()}
          className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Question
        </button>
      </div>
    </form>
  );
}
