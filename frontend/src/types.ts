export type Subject = 'Arithmetic' | 'Math' | 'English';
export type Grade = 'Elementary' | 'Middle School';

export type QuizDifficulty = 'Easy' | 'Normal' | 'Hard';

export interface Question {
  id: string;
  text: string;
  answer: string;
  options?: string[];
  explanation?: string;
}

export interface AuthUser {
  username: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface Quiz {
  id: string;
  title: string;
  subject: Subject;
  grade: Grade;
  description: string;
  questions: Question[];
  createdAt?: string;
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
