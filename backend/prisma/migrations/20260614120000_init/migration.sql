CREATE TABLE "User" (
  "id" SERIAL NOT NULL,
  "username" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Quiz" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "grade" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Question" (
  "id" TEXT NOT NULL,
  "quizId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "explanation" TEXT,
  "order" INTEGER NOT NULL,
  CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressRecord" (
  "id" SERIAL NOT NULL,
  "username" TEXT NOT NULL,
  "quizId" TEXT NOT NULL,
  "completed" INTEGER NOT NULL,
  "total" INTEGER NOT NULL,
  "correct" INTEGER NOT NULL,
  "streak" INTEGER NOT NULL,
  "lastPlayed" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProgressRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "ProgressRecord_username_quizId_key" ON "ProgressRecord"("username", "quizId");

ALTER TABLE "Question" ADD CONSTRAINT "Question_quizId_fkey"
  FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProgressRecord" ADD CONSTRAINT "ProgressRecord_username_fkey"
  FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProgressRecord" ADD CONSTRAINT "ProgressRecord_quizId_fkey"
  FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
