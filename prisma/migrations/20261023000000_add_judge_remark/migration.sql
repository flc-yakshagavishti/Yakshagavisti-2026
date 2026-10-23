CREATE TABLE IF NOT EXISTS "JudgeRemark" (
    "id" TEXT NOT NULL,
    "judgeId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "remark" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JudgeRemark_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "JudgeRemark_judgeId_teamId_key" ON "JudgeRemark"("judgeId", "teamId");

CREATE INDEX IF NOT EXISTS "JudgeRemark_teamId_idx" ON "JudgeRemark"("teamId");
