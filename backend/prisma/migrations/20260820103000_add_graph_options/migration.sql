-- Store structured line data for graph-based answer choices.
ALTER TABLE "Question"
ADD COLUMN "graphOptions" JSONB NOT NULL DEFAULT '[]'::jsonb;
