export type Subject = 'Arithmetic' | 'Math' | 'English' | 'Japanese';
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

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: number;
  target: number;
}

export interface DailyXpPoint {
  date: string;
  xp: number;
  cumulativeXp: number;
}

export interface LevelUpEvent {
  level: number;
  at: string;
}

export interface XpSummary {
  level: number;
  totalXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  attemptCount: number;
  dailyXp: DailyXpPoint[];
  levelUps: LevelUpEvent[];
}

export interface Trophy {
  quizId: string;
  quizTitle: string;
  subject: Subject;
  achievedAt: string;
}

export interface TrophySummary {
  trophies: Trophy[];
  count: number;
}

export interface GameState {
  currentQuestionIndex: number;
  correctCount: number;
  streak: number;
  score: number;
  finished: boolean;
  message: string;
}
