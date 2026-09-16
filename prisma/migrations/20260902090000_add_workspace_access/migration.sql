CREATE TABLE "UserWorkspaceAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspace" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserWorkspaceAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserWorkspaceAccess_userId_workspace_key" ON "UserWorkspaceAccess"("userId", "workspace");
CREATE INDEX "UserWorkspaceAccess_workspace_isActive_idx" ON "UserWorkspaceAccess"("workspace", "isActive");
ALTER TABLE "UserWorkspaceAccess" ADD CONSTRAINT "UserWorkspaceAccess_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
