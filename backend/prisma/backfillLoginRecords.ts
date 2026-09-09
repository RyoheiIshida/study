/**
 * Seeds LoginRecord from history that predates login tracking.
 *
 * Any day on which a user submitted a quiz attempt or answered a question was
 * necessarily a day they were signed in, so those days are replayed as login
 * records. Days are keyed in JST to match the rest of the app, and existing
 * rows are left untouched, which makes this script safe to re-run.
 */
import 'dotenv/config';
import { prisma } from '../src/db.js';
import { jstDateKey } from '../src/lib/loginDays.js';

async function main() {
  const [attempts, answers] = await Promise.all([
    prisma.quizAttempt.findMany({ select: { username: true, playedAt: true } }),
    prisma.answerRecord.findMany({ select: { username: true, answeredAt: true } }),
  ]);

  const byUserDate = new Map<string, { username: string; date: string; first: Date; last: Date }>();
  const note = (username: string, at: Date) => {
    const date = jstDateKey(at);
    const key = `${username}__${date}`;
    const entry = byUserDate.get(key);
    if (!entry) {
      byUserDate.set(key, { username, date, first: at, last: at });
      return;
    }
    if (at < entry.first) entry.first = at;
    if (at > entry.last) entry.last = at;
  };

  for (const attempt of attempts) note(attempt.username, attempt.playedAt);
  for (const answer of answers) note(answer.username, answer.answeredAt);

  const rows = Array.from(byUserDate.values());
  const result = await prisma.loginRecord.createMany({
    data: rows.map((row) => ({
      username: row.username,
      date: row.date,
      firstSeenAt: row.first,
      lastSeenAt: row.last,
      visitCount: 1,
    })),
    skipDuplicates: true,
  });

  console.log(`Found ${rows.length} historical login days; inserted ${result.count} new records.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
