-- CreateTable
CREATE TABLE "CoachingRecord" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "coachName" TEXT NOT NULL,
    "coachingDate" TIMESTAMP(3) NOT NULL,
    "goals" TEXT NOT NULL,
    "discussionNotes" TEXT NOT NULL,
    "resultOutcome" TEXT NOT NULL,
    "followUpAction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachingRecord_profileId_idx" ON "CoachingRecord"("profileId");

-- CreateIndex
CREATE INDEX "CoachingRecord_coachingDate_idx" ON "CoachingRecord"("coachingDate");

-- AddForeignKey
ALTER TABLE "CoachingRecord" ADD CONSTRAINT "CoachingRecord_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
