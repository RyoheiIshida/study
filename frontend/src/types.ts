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
  /** Wall-clock time for one play-through. Absent on records saved before session timing existed. */
  durationMs?: number;
  lastPlayed: string;
}

export type LuckyTier = 'lucky' | 'super' | 'miracle';

/** クイズ終了時にサーバーで引いたラッキーボーナスの結果。tier が null ならはずれ。 */
export interface LuckyBonus {
  tier: LuckyTier | null;
  multiplier: number;
  bonusXp: number;
}

/** 保存 API の応答。オフラインで端末に保存したときは抽選していないので luckyBonus がない。 */
export interface SavedProgress extends ProgressRecord {
  luckyBonus?: LuckyBonus;
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
  durationMs: number;
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
  timedAttemptCount: number;
  totalDurationMs: number;
  averageSessionMs: number | null;
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

/** 条件はひみつ。未発見のあいだはヒントしか届かない。 */
export interface SecretTrophy {
  id: string;
  hint: string;
  unlocked: boolean;
  icon?: string;
  name?: string;
  description?: string;
  achievedAt?: string;
}

export interface TrophySummary {
  trophies: Trophy[];
  count: number;
  secrets: SecretTrophy[];
}

export interface GameState {
  currentQuestionIndex: number;
  correctCount: number;
  streak: number;
  bestStreak: number;
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

export interface ExchangeTier {
  level: number;
  monthlyLimit: number;
}

export interface ExchangeLimitInfo {
  level: number;
  unlockLevel: number;
  unlocked: boolean;
  month: string;
  monthlyLimit: number;
  monthlyUsed: number;
  monthlyRemaining: number;
  nextTier: ExchangeTier | null;
  tiers: ExchangeTier[];
}

export interface ExchangeRateInfo {
  rate: number;
  recentAccuracy: number;
  availablePoints: number;
  limit: ExchangeLimitInfo;
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

export interface LoginRateWindow {
  days: number;
  loginDays: number;
  rate: number;
}

export interface LoginDayDot {
  date: string;
  loggedIn: boolean;
  visitCount: number;
}

export interface LoginSummary {
  today: string;
  loggedInToday: boolean;
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
  firstLoginDate: string | null;
  lastLoginDate: string | null;
  totalVisits: number;
  sinceRegistration: LoginRateWindow;
  recentWindow: LoginRateWindow;
  recentDays: LoginDayDot[];
}
