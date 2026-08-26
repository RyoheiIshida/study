export type Subject = 'Arithmetic' | 'Math' | 'English' | 'Japanese';
export type Grade = 'Elementary' | 'Middle School';

export type QuizDifficulty = 'Easy' | 'Normal' | 'Hard';

export interface Question {
  id: string;
  text: string;
  answer: string;
  options?: string[];
  graphOptions?: GraphOption[];
  explanation?: string;
}

export interface GraphOption {
  id: string;
  slope: number;
  intercept: number;
}

export type Role = 'PARENT' | 'CHILD';

export interface AuthUser {
  username: string;
  role: Role;
}

export interface AuthCredentials {
  username: string;
  password: string;
  role?: Role;
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
  questions: number;
  attempts: number;
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
  studyDays: number;
  dailyXp: DailyXpPoint[];
  levelUps: LevelUpEvent[];
}

export interface PointsSummary {
  totalPoints: number;
  totalCorrect: number;
  totalAttempts: number;
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

export interface FamilyMember {
  username: string;
}

export type FamilyInfo =
  | { role: 'PARENT'; children: FamilyMember[] }
  | { role: 'CHILD'; parent: FamilyMember | null };

export interface ExchangeRateInfo {
  rate: number;
  recentAccuracy: number;
  availablePoints: number;
}

export type PurchaseRequestStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'HANDED_OVER' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseRequest {
  id: number;
  childId: number;
  parentId: number;
  pointsCost: number;
  rate: number;
  cashAmount: number;
  memo: string | null;
  status: PurchaseRequestStatus;
  rejectReason: string | null;
  requestedAt: string;
  respondedAt: string | null;
  handedOverAt: string | null;
  receivedAt: string | null;
  child: FamilyMember;
  parent: FamilyMember;
}

export interface AnswerLogEntry {
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timedOut: boolean;
  explanation?: string;
  elapsedMs: number;
  difficulty: string;
}

export interface AnswerSpeedRecord {
  quizId: string;
  questionId: string;
  difficulty: string;
  isCorrect: boolean;
  elapsedMs: number;
  answeredAt: string;
}

export interface AnswerSpeedTrendPoint {
  date: string;
  difficulty: string;
  averageSeconds: number;
  count: number;
}
