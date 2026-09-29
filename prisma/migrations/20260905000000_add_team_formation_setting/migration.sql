CREATE TABLE "CompetitionSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "allowTeamFormation" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CompetitionSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "CompetitionSettings" ("id", "allowTeamFormation", "updatedAt")
VALUES ('default', false, CURRENT_TIMESTAMP);
