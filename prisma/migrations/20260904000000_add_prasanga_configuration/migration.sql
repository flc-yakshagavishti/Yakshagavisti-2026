-- Preserve existing enum-backed character values while making names configurable.
CREATE TABLE "Prasanga" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Prasanga_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Prasanga_name_key" ON "Prasanga"("name");

CREATE TABLE "_PrasangaCharacter" (
  "id" TEXT NOT NULL,
  "character" TEXT NOT NULL,
  "prasangaId" TEXT,
  CONSTRAINT "_PrasangaCharacter_pkey" PRIMARY KEY ("id")
);

-- Copy existing character rows into the configurable character table.
INSERT INTO "Prasanga" ("id", "name", "updatedAt")
VALUES ('default-prasanga', 'Default Prasanga', CURRENT_TIMESTAMP);

INSERT INTO "_PrasangaCharacter" ("id", "character", "prasangaId")
SELECT "id", "character"::text, 'default-prasanga' FROM "Character";

ALTER TABLE "Team" ADD COLUMN "prasangaId" TEXT;
ALTER TABLE "Character" ALTER COLUMN "character" TYPE TEXT USING "character"::text;
ALTER TABLE "Character" ADD COLUMN "prasangaId" TEXT;
UPDATE "Character" SET "prasangaId" = 'default-prasanga';
ALTER TABLE "Character" ALTER COLUMN "prasangaId" SET NOT NULL;

ALTER TABLE "Team" ADD CONSTRAINT "Team_prasangaId_fkey" FOREIGN KEY ("prasangaId") REFERENCES "Prasanga"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Character" ADD CONSTRAINT "Character_prasangaId_fkey" FOREIGN KEY ("prasangaId") REFERENCES "Prasanga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE "_PrasangaCharacter";
CREATE UNIQUE INDEX "Character_prasangaId_character_key" ON "Character"("prasangaId", "character");
CREATE INDEX "Character_prasangaId_idx" ON "Character"("prasangaId");
CREATE INDEX "Team_prasangaId_idx" ON "Team"("prasangaId");
