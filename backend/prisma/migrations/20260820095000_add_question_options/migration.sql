-- Store answer choices with each question so the API can render authored options.
ALTER TABLE "Question"
ADD COLUMN "options" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
