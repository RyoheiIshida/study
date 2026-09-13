import { jstDateKey } from './loginDays.js';

/**
 * Secret trophies add a sense of mystery: the condition stays hidden and only
 * a vague hint is shown until the player stumbles onto it. Everything is
 * derived from records we already keep, so no extra storage is needed and
 * past play counts retroactively.
 */

export interface SecretAttempt {
  quizId: string;
  subject: string;
  total: number;
  correct: number;
  durationMs: number | null;
  playedAt: Date;
}

export interface SecretTrophyInput {
  /** Oldest first. */
  attempts: SecretAttempt[];
  /** JST `YYYY-MM-DD` keys, oldest first. */
  loginDates: string[];
}

export interface SecretTrophy {
  id: string;
  hint: string;
  unlocked: boolean;
  /** The rest stays undefined while locked so the answer never reaches the client. */
  icon?: string;
  name?: string;
  description?: string;
  achievedAt?: string;
}

interface SecretTrophyDefinition {
  id: string;
  icon: string;
  name: string;
  hint: string;
  description: string;
  /** Returns when the condition was first met, or null if it has not been. */
  achievedAt(input: SecretTrophyInput): Date | null;
}

const JST_OFFSET_HOURS = 9;
const DAY_MS = 24 * 60 * 60 * 1000;
const FAST_PERFECT_MIN_QUESTIONS = 5;
const FAST_PERFECT_MS_PER_QUESTION = 3000;
const COMEBACK_MISSES = 3;
const LOGIN_STREAK_DAYS = 7;
const EXPLORER_SUBJECTS = 3;
const VETERAN_ATTEMPTS = 100;

function jstHour(date: Date) {
  return (date.getUTCHours() + JST_OFFSET_HOURS) % 24;
}

function nextDateKey(dateKey: string) {
  return new Date(new Date(`${dateKey}T00:00:00.000Z`).getTime() + DAY_MS).toISOString().slice(0, 10);
}

function isPerfect(attempt: SecretAttempt) {
  return attempt.total > 0 && attempt.correct === attempt.total;
}

function firstAttempt(attempts: SecretAttempt[], predicate: (attempt: SecretAttempt) => boolean) {
  return attempts.find(predicate)?.playedAt ?? null;
}

const definitions: SecretTrophyDefinition[] = [
  {
    id: 'night-owl',
    icon: '🦉',
    name: '夜ふかし博士',
    hint: 'みんなが寝しずまったころに…',
    description: '夜10時から朝4時のあいだにクイズをやりとげた。',
    achievedAt: ({ attempts }) => firstAttempt(attempts, (a) => jstHour(a.playedAt) >= 22 || jstHour(a.playedAt) < 4),
  },
  {
    id: 'early-bird',
    icon: '🐓',
    name: '早起きの達人',
    hint: '太陽よりも先に…',
    description: '朝5時から7時のあいだにクイズをやりとげた。',
    achievedAt: ({ attempts }) => firstAttempt(attempts, (a) => jstHour(a.playedAt) >= 5 && jstHour(a.playedAt) < 7),
  },
  {
    id: 'lightning',
    icon: '⚡',
    name: '電光石火',
    hint: '目にもとまらぬ…',
    description: `${FAST_PERFECT_MIN_QUESTIONS}問以上のクイズを、1問${FAST_PERFECT_MS_PER_QUESTION / 1000}秒未満のペースで全問正解した。`,
    achievedAt: ({ attempts }) =>
      firstAttempt(
        attempts,
        (a) =>
          isPerfect(a) &&
          a.total >= FAST_PERFECT_MIN_QUESTIONS &&
          a.durationMs !== null &&
          a.durationMs / a.total < FAST_PERFECT_MS_PER_QUESTION,
      ),
  },
  {
    id: 'comeback',
    icon: '🌱',
    name: '七転び八起き',
    hint: 'あきらめなかった人だけが…',
    description: `同じクイズで${COMEBACK_MISSES}回以上まちがえたあと、ついに全問正解した。`,
    achievedAt: ({ attempts }) => {
      const missesByQuiz = new Map<string, number>();
      for (const attempt of attempts) {
        const misses = missesByQuiz.get(attempt.quizId) ?? 0;
        if (!isPerfect(attempt)) {
          missesByQuiz.set(attempt.quizId, misses + 1);
        } else if (misses >= COMEBACK_MISSES) {
          return attempt.playedAt;
        }
      }
      return null;
    },
  },
  {
    id: 'lucky-seven',
    icon: '🍀',
    name: 'ラッキーセブン',
    hint: 'ある数字にえんがある日に…',
    description: '7のつく日（7日・17日・27日）に全問正解した。',
    achievedAt: ({ attempts }) =>
      firstAttempt(attempts, (a) => isPerfect(a) && jstDateKey(a.playedAt).endsWith('7')),
  },
  {
    id: 'explorer',
    icon: '🧭',
    name: '知の冒険家',
    hint: 'いろんな世界をのぞいてみると…',
    description: `${EXPLORER_SUBJECTS}つ以上の教科でクイズをやりとげた。`,
    achievedAt: ({ attempts }) => {
      const subjects = new Set<string>();
      for (const attempt of attempts) {
        subjects.add(attempt.subject);
        if (subjects.size >= EXPLORER_SUBJECTS) return attempt.playedAt;
      }
      return null;
    },
  },
  {
    id: 'perfect-week',
    icon: '📅',
    name: '皆勤賞',
    hint: '毎日のつみかさねが…',
    description: `${LOGIN_STREAK_DAYS}日連続でアプリを開いた。`,
    achievedAt: ({ loginDates }) => {
      let run = 0;
      let previous: string | null = null;
      for (const date of loginDates) {
        run = previous !== null && nextDateKey(previous) === date ? run + 1 : 1;
        if (run >= LOGIN_STREAK_DAYS) return new Date(`${date}T00:00:00+09:00`);
        previous = date;
      }
      return null;
    },
  },
  {
    id: 'veteran',
    icon: '⚔️',
    name: '百戦錬磨',
    hint: '数えきれないほど…',
    description: `クイズを${VETERAN_ATTEMPTS}回やりとげた。`,
    achievedAt: ({ attempts }) => attempts[VETERAN_ATTEMPTS - 1]?.playedAt ?? null,
  },
];

export function computeSecretTrophies(input: SecretTrophyInput): SecretTrophy[] {
  return definitions.map((definition) => {
    const achievedAt = definition.achievedAt(input);
    if (!achievedAt) {
      return { id: definition.id, hint: definition.hint, unlocked: false };
    }
    return {
      id: definition.id,
      hint: definition.hint,
      unlocked: true,
      icon: definition.icon,
      name: definition.name,
      description: definition.description,
      achievedAt: achievedAt.toISOString(),
    };
  });
}
