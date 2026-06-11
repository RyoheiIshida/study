import express from 'express';
import cors from 'cors';
import quizRouter from './routes/quiz.js';
import progressRouter from './routes/progress.js';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.use('/api/quizzes', quizRouter);
app.use('/api/progress', progressRouter);

app.get('/', (req, res) => {
  res.send({ message: 'Study Game API is running' });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
