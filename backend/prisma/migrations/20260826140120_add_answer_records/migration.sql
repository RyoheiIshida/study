-- CreateTable
CREATE TABLE "AnswerRecord" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "elapsedMs" INTEGER NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnswerRecord_username_difficulty_answeredAt_idx" ON "AnswerRecord"("username", "difficulty", "answeredAt");

-- AddForeignKey
ALTER TABLE "AnswerRecord" ADD CONSTRAINT "AnswerRecord_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerRecord" ADD CONSTRAINT "AnswerRecord_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
