-- CreateEnum
CREATE TYPE "PlayCharacters" AS ENUM ('MITRASAHA', 'MADAYANTHI', 'VANAPAALAKA', 'DHEERGHAAKSHA', 'DHOOMRAAKSHA', 'VASISHTA', 'MEGHAVARNA', 'DEVENDRA', 'NARADA');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARTICIPANT', 'ADMIN', 'JUDGE');

-- CreateEnum
CREATE TYPE "Criterias" AS ENUM ('CRITERIA_1', 'CRITERIA_2', 'CRITERIA_3', 'CRITERIA_4', 'CRITERIA_5');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN DEFAULT false,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PARTICIPANT',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "College" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "password" TEXT,

    CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMembers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "idURL" TEXT NOT NULL,
    "contact" TEXT DEFAULT '',
    "teamId" TEXT NOT NULL,
    "characterId" TEXT,
    "isIdVerified" BOOLEAN NOT NULL DEFAULT false,
    "isAttended" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TeamMembers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "college_id" TEXT,
    "leaderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "remark" TEXT NOT NULL DEFAULT '',
    "editRequested" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "character" "PlayCharacters" NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Criteria" (
    "id" TEXT NOT NULL,
    "name" "Criterias" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Judge" (
    "userId" TEXT NOT NULL,

    CONSTRAINT "Judge_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Submitted" (
    "judgeId" TEXT NOT NULL,
    "teamID" TEXT NOT NULL,
    "submitted" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "IndividualScore" (
    "id" TEXT NOT NULL,
    "teamID" TEXT NOT NULL,
    "criteriaId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "judgeId" TEXT NOT NULL,

    CONSTRAINT "IndividualScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "TeamMembers_teamId_idx" ON "TeamMembers"("teamId");

-- CreateIndex
CREATE INDEX "TeamMembers_characterId_idx" ON "TeamMembers"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMembers_teamId_characterId_key" ON "TeamMembers"("teamId", "characterId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Team_number_key" ON "Team"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Team_college_id_key" ON "Team"("college_id");

-- CreateIndex
CREATE UNIQUE INDEX "Team_leaderId_key" ON "Team"("leaderId");

-- CreateIndex
CREATE INDEX "Team_college_id_idx" ON "Team"("college_id");

-- CreateIndex
CREATE UNIQUE INDEX "Character_character_key" ON "Character"("character");

-- CreateIndex
CREATE UNIQUE INDEX "Criteria_name_key" ON "Criteria"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Judge_userId_key" ON "Judge"("userId");

-- CreateIndex
CREATE INDEX "Submitted_judgeId_idx" ON "Submitted"("judgeId");

-- CreateIndex
CREATE INDEX "Submitted_teamID_idx" ON "Submitted"("teamID");

-- CreateIndex
CREATE UNIQUE INDEX "Submitted_judgeId_teamID_key" ON "Submitted"("judgeId", "teamID");

-- CreateIndex
CREATE INDEX "IndividualScore_teamID_idx" ON "IndividualScore"("teamID");

-- CreateIndex
CREATE INDEX "IndividualScore_criteriaId_idx" ON "IndividualScore"("criteriaId");

-- CreateIndex
CREATE INDEX "IndividualScore_characterId_idx" ON "IndividualScore"("characterId");

-- CreateIndex
CREATE INDEX "IndividualScore_judgeId_idx" ON "IndividualScore"("judgeId");

-- CreateIndex
CREATE UNIQUE INDEX "IndividualScore_teamID_criteriaId_characterId_judgeId_key" ON "IndividualScore"("teamID", "criteriaId", "characterId", "judgeId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

