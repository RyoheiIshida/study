export type Subject = '算数' | '数学' | '英語';
export type Grade = '小学校' | '中学校';

export type QuizDifficulty = 'Easy' | 'Normal' | 'Hard';

export interface Question {
  id: string;
  text: string;
  answer: string;
  options?: string[];
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  subject: Subject;
  grade: Grade;
  description: string;
  questions: Question[];
}

export interface ProgressRecord {
  quizId: string;
  completed: number;
  total: number;
  correct: number;
  streak: number;
  lastPlayed: string;
}

export interface GameState {
  currentQuestionIndex: number;
  correctCount: number;
  streak: number;
  score: number;
  finished: boolean;
  message: string;
}
