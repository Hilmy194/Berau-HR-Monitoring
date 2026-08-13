CREATE TABLE "competency_share_files" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "file_name" TEXT NOT NULL,
  "original_name" TEXT NOT NULL,
  "file_url" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL,
  "mime_type" TEXT,
  "uploaded_by_id" TEXT,
  "uploaded_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "competency_share_files_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "competency_share_files_created_at_idx" ON "competency_share_files"("created_at");
CREATE INDEX "competency_share_files_uploaded_by_id_idx" ON "competency_share_files"("uploaded_by_id");
