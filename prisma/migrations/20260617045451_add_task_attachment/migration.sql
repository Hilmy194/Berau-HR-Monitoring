-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProbationTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "notes" TEXT,
    "requiresAttachment" BOOLEAN NOT NULL DEFAULT false,
    "attachmentUrl" TEXT,
    "attachmentName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProbationTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProbationTask" ("createdAt", "description", "dueDate", "id", "notes", "status", "title", "updatedAt", "userId") SELECT "createdAt", "description", "dueDate", "id", "notes", "status", "title", "updatedAt", "userId" FROM "ProbationTask";
DROP TABLE "ProbationTask";
ALTER TABLE "new_ProbationTask" RENAME TO "ProbationTask";
CREATE INDEX "ProbationTask_userId_idx" ON "ProbationTask"("userId");
CREATE INDEX "ProbationTask_status_idx" ON "ProbationTask"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
