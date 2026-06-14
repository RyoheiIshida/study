import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import quizRouter from './routes/quiz.js';
import progressRouter from './routes/progress.js';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean);

app.use(cors({
  origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true,
}));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/quizzes', quizRouter);
app.use('/api/progress', progressRouter);

app.get('/', (req, res) => {
  res.send({ message: 'Study Game API is running' });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
