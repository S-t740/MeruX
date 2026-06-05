// ─── MeruX Lesson JSON Types ───────────────────────────────────────────────

export type BlockType =
  | 'heading'
  | 'subheading'
  | 'paragraph'
  | 'callout'
  | 'table'
  | 'image_prompt'
  | 'flashcards'
  | 'quiz'
  | 'fill_blank'
  | 'lab'
  | 'exam_questions'
  | 'glossary'
  | 'recap'
  | 'next_lesson'
  | 'instructor_note'
  | 'checklist';

// ─── Metadata ─────────────────────────────────────────────────────────────────

export interface LessonMetadata {
  course: string;
  module: string;
  lesson: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_time_minutes: number;
  prerequisites: string[];
  tags: string[];
  learning_outcomes: string[];
}

// ─── Block Data Types ──────────────────────────────────────────────────────────

export interface HeadingData { text: string; }
export interface SubheadingData { text: string; }
export interface ParagraphData { text: string; }

export interface CalloutData {
  variant: 'info' | 'warning' | 'success';
  title: string;
  text: string;
}

export interface TableData {
  title: string;
  columns: string[];
  rows: string[][];
}

export interface ImagePromptData {
  title: string;
  prompt: string;
  purpose: string;
  style: 'infographic' | 'flat illustration' | 'flow diagram' | 'network topology' | 'modern icon style';
}

export interface FlashcardItem { question: string; answer: string; }
export interface FlashcardsData {
  title: string;
  cards: FlashcardItem[];
}

export interface QuizQuestion {
  question: string;
  type: 'mcq' | 'true_false';
  options: string[];
  correct_answer: string;
  explanation: string;
}
export interface QuizData {
  title: string;
  time_limit_minutes: number;
  questions: QuizQuestion[];
}

export interface FillBlankItem { sentence: string; answer: string; }
export interface FillBlankData {
  title: string;
  items: FillBlankItem[];
}

export interface LabData {
  title: string;
  objective: string;
  requirements: string[];
  steps: string[];
  expected_output: string[];
  submission_instructions: string;
}

export interface ExamQuestion {
  question: string;
  type: 'mcq' | 'short_answer' | 'scenario';
  options: string[];
  correct_answer: string;
  explanation: string;
}
export interface ExamQuestionsData {
  title: string;
  questions: ExamQuestion[];
}

export interface GlossaryTerm { term: string; definition: string; }
export interface GlossaryData {
  title: string;
  terms: GlossaryTerm[];
}

export interface RecapData {
  title: string;
  points: string[];
}

export interface NextLessonData { text: string; }
export interface InstructorNoteData { text: string; }

export interface ChecklistItem { text: string; checked: boolean; }
export interface ChecklistData {
  title: string;
  items: ChecklistItem[];
}

// ─── Block Union ───────────────────────────────────────────────────────────────

export type BlockData =
  | HeadingData
  | SubheadingData
  | ParagraphData
  | CalloutData
  | TableData
  | ImagePromptData
  | FlashcardsData
  | QuizData
  | FillBlankData
  | LabData
  | ExamQuestionsData
  | GlossaryData
  | RecapData
  | NextLessonData
  | InstructorNoteData
  | ChecklistData;

export interface LessonBlock {
  id: string;
  type: BlockType;
  data: BlockData;
}

export interface LessonJSON {
  metadata: LessonMetadata;
  blocks: LessonBlock[];
}
