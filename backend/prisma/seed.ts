import { prisma } from '../src/db.js';
import { defaultQuizzes } from '../src/data/store.js';

async function main() {
  for (const quiz of defaultQuizzes) {
    await prisma.quiz.upsert({
      where: { id: quiz.id },
      update: {
        title: quiz.title,
        subject: quiz.subject,
        grade: quiz.grade,
        description: quiz.description,
      },
      create: {
        id: quiz.id,
        title: quiz.title,
        subject: quiz.subject,
        grade: quiz.grade,
        description: quiz.description,
      },
    });

    for (const [index, question] of quiz.questions.entries()) {
      await prisma.question.upsert({
        where: { id: question.id },
        update: {
          text: question.text,
          answer: question.answer,
          explanation: question.explanation ?? '',
          order: index,
        },
        create: {
          id: question.id,
          quizId: quiz.id,
          text: question.text,
          answer: question.answer,
          explanation: question.explanation ?? '',
          order: index,
        },
      });
    }
  }

  console.log('Seed complete');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
