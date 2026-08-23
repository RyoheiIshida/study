import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import quizRouter from './routes/quiz.js';
import progressRouter from './routes/progress.js';
import questsRouter from './routes/quests.js';
import xpRouter from './routes/xp.js';
import trophiesRouter from './routes/trophies.js';
import pointsRouter from './routes/points.js';
import familyRouter from './routes/family.js';
import purchaseRequestsRouter from './routes/purchaseRequests.js';
import { prisma } from './db.js';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean);

// Vercel issues a fresh URL for every deployment (production, preview, and
// git-branch aliases), e.g. https://study-app-frontend-<hash>-<team>.vercel.app.
// A fixed allowlist can never keep up with those, so any origin belonging to
// this project's Vercel app is allowed in addition to the explicit list.
const VERCEL_FRONTEND_ORIGIN = /^https:\/\/study-app-frontend[a-z0-9.-]*\.vercel\.app$/;

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins?.includes(origin)) return callback(null, true);
    if (VERCEL_FRONTEND_ORIGIN.test(origin)) return callback(null, true);
    if (!allowedOrigins || allowedOrigins.length === 0) return callback(null, true);
    callback(new Error(`Origin ${origin} is not allowed by CORS.`));
  },
}));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/quizzes', quizRouter);
app.use('/api/progress', progressRouter);
app.use('/api/quests', questsRouter);
app.use('/api/xp', xpRouter);
app.use('/api/trophies', trophiesRouter);
app.use('/api/points', pointsRouter);
app.use('/api/family', familyRouter);
app.use('/api/purchase-requests', purchaseRequestsRouter);

app.get('/', (req, res) => {
  res.send({ message: 'Study Game API is running' });
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'error' });
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
