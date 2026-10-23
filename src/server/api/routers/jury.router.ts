import { createTRPCRouter, protectedJudgeProcedure } from "../trpc";
import { z } from "zod";
import kalasangamaError from "~/utils/customError";
import { Criterias, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { resolveJudgeCharacters } from "~/utils/scoring";

const scoreInput = z.object({
  teamId: z.string(),
  criteriaName: z.nativeEnum(Criterias),
  characterId: z.string(),
  score: z.number().min(0).max(20),
});

export const JuryRouter = createTRPCRouter({
  getTeams: protectedJudgeProcedure.query(async ({ ctx }) => {
    await ctx.db.judge.upsert({
      where: { userId: ctx.session.user.id },
      update: {},
      create: { userId: ctx.session.user.id },
    });
    return ctx.db.team.findMany({
      where: { attended: true, isComplete: true, prasangaId: { not: null } },
      include: {
        Prasanga: {
          include: { characters: { orderBy: { character: "asc" } } },
        },
        TeamMembers: {
          select: {
            id: true,
            characterId: true,
            characterName: true,
            Character: { select: { id: true, character: true } },
          },
        },
      },
    });
  }),
  addRemark: protectedJudgeProcedure
    .input(z.object({ teamId: z.string(), remark: z.string() }))
    .mutation(async ({ ctx, input }) =>
      // Each judge keeps their own remark for a team
      ctx.db.judgeRemark.upsert({
        where: {
          judgeId_teamId: {
            judgeId: ctx.session.user.id,
            teamId: input.teamId,
          },
        },
        create: {
          judgeId: ctx.session.user.id,
          teamId: input.teamId,
          remark: input.remark,
        },
        update: { remark: input.remark },
      }),
    ),
  getScores: protectedJudgeProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ ctx, input }) => {
      const scores = await ctx.db.individualScore.findMany({
        where: { teamID: input.teamId, judgeId: ctx.session.user.id },
        include: {
          criteria: true,
          characterPlayed: true,
          judge: {
            include: {
              Submitted: {
                where: { teamID: input.teamId, judgeId: ctx.session.user.id },
              },
            },
          },
          team: { include: { College: true, Prasanga: true } },
        },
      });
      return scores;
    }),
  updateScores: protectedJudgeProcedure
    .input(scoreInput)
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.db.team.findUnique({
        where: { id: input.teamId },
        include: {
          Prasanga: { include: { characters: true } },
          TeamMembers: {
            select: { id: true, characterId: true, characterName: true },
          },
          Submitted: {
            where: { judgeId: ctx.session.user.id },
            select: { submitted: true },
          },
        },
      });
      if (!team?.Prasanga)
        throw new kalasangamaError(
          "Score error",
          "Team has no assigned prasanga.",
        );
      if (team.Submitted.some((submission) => submission.submitted))
        throw new kalasangamaError(
          "Score error",
          "Scores are already submitted.",
        );
      const playableCharacters = resolveJudgeCharacters(
        team.TeamMembers,
        team.Prasanga.characters,
      );
      const selectedCharacter = playableCharacters.find(
        (candidate) =>
          candidate.memberId === input.characterId ||
          candidate.characterId === input.characterId ||
          candidate.character === input.characterId,
      );
      if (!selectedCharacter)
        throw new kalasangamaError(
          "Score error",
          "Character does not belong to this team's playable characters.",
        );
      const characterId =
        selectedCharacter.characterId ??
        (
          (await ctx.db.character.findFirst({
            where: {
              prasangaId: team.Prasanga.id,
              character: selectedCharacter.character,
            },
          })) ??
          (await ctx.db.character.create({
            data: {
              prasangaId: team.Prasanga.id,
              character: selectedCharacter.character,
            },
          }))
        ).id;
      const criteria = await ctx.db.criteria.upsert({
        where: { name: input.criteriaName },
        create: { name: input.criteriaName },
        update: {},
      });
      return ctx.db.individualScore.upsert({
        where: {
          teamID_criteriaId_characterId_judgeId: {
            criteriaId: criteria.id,
            characterId,
            teamID: input.teamId,
            judgeId: ctx.session.user.id,
          },
        },
        update: { score: input.score },
        create: {
          criteriaId: criteria.id,
          characterId,
          teamID: input.teamId,
          score: input.score,
          judgeId: ctx.session.user.id,
        },
      });
    }),
  getRemark: protectedJudgeProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ ctx, input }) =>
      ctx.db.judgeRemark.findUnique({
        where: {
          judgeId_teamId: {
            judgeId: ctx.session.user.id,
            teamId: input.teamId,
          },
        },
        select: { remark: true },
      }),
    ),
  scoresUpdate: protectedJudgeProcedure
    .input(
      z.object({
        scores: z.record(z.record(z.number().min(0).max(20))),
        characters: z.array(z.string()),
        criteria: z.array(z.nativeEnum(Criterias)),
        teamId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.db.team.findUnique({
        where: { id: input.teamId },
        include: {
          Prasanga: { include: { characters: true } },
          TeamMembers: {
            select: { id: true, characterId: true, characterName: true },
          },
          Submitted: {
            where: { judgeId: ctx.session.user.id },
            select: { submitted: true },
          },
        },
      });
      if (!team?.Prasanga)
        throw new kalasangamaError(
          "Score error",
          "Team has no assigned prasanga.",
        );
      if (team.Submitted.some((submission) => submission.submitted))
        throw new kalasangamaError(
          "Score error",
          "Scores are already submitted.",
        );
      const playableCharacters = resolveJudgeCharacters(
        team.TeamMembers,
        team.Prasanga.characters,
      );
      const submittedCharacters = input.characters.map((characterKey) =>
        playableCharacters.find(
          (character) =>
            character.memberId === characterKey ||
            character.characterId === characterKey ||
            character.character === characterKey,
        ),
      );
      if (
        input.characters.length !== 10 ||
        new Set(submittedCharacters.map((character) => character?.memberId))
          .size !== 10 ||
        submittedCharacters.some((character) => !character)
      )
        throw new kalasangamaError(
          "Score error",
          "Scores must include exactly this team's 10 playable characters.",
        );
      const criteriaNames = Object.values(Criterias);
      if (
        input.criteria.length !== criteriaNames.length ||
        criteriaNames.some((criteria) => !input.criteria.includes(criteria))
      )
        throw new kalasangamaError(
          "Score error",
          "All five criteria are required.",
        );
      const prasangaId = team.Prasanga.id;

      const scoreValues = playableCharacters.flatMap((character) =>
        criteriaNames.map((criteriaName) => ({
          character,
          criteriaName,
          score:
            input.scores[character.memberId]?.[criteriaName] ??
            input.scores[character.characterId ?? ""]?.[criteriaName] ??
            input.scores[character.character]?.[criteriaName],
        })),
      );
      if (scoreValues.some(({ score }) => score === undefined))
        throw new kalasangamaError("Score error", "Every score is required.");

      return ctx.db.$transaction(
        async (tx) => {
          const missingCharacters = playableCharacters.filter(
            (character) => !character.characterId,
          );
          if (missingCharacters.length)
            await tx.character.createMany({
              data: missingCharacters.map((character) => ({
                prasangaId,
                character: character.character,
              })),
              skipDuplicates: true,
            });

          const characterRows = await tx.character.findMany({
            where: {
              prasangaId,
              OR: [
                {
                  id: {
                    in: playableCharacters.flatMap((character) =>
                      character.characterId ? [character.characterId] : [],
                    ),
                  },
                },
                {
                  character: {
                    in: missingCharacters.map(
                      (character) => character.character,
                    ),
                  },
                },
              ],
            },
            select: { id: true, character: true },
          });
          const characterByName = new Map(
            characterRows.map((character) => [
              character.character,
              character.id,
            ]),
          );
          const scoreCharacters = playableCharacters.map((character) => ({
            ...character,
            characterId:
              character.characterId ??
              characterByName.get(character.character)!,
          }));

          await tx.criteria.createMany({
            data: criteriaNames.map((name) => ({ name })),
            skipDuplicates: true,
          });
          const criteriaRows = await tx.criteria.findMany({
            where: { name: { in: criteriaNames } },
            select: { id: true, name: true },
          });
          const criteriaByName = new Map(
            criteriaRows.map((criteria) => [criteria.name, criteria.id]),
          );
          const scoreRows = scoreValues.map(
            ({ character, criteriaName, score }) =>
              Prisma.sql`(${randomUUID()}, ${input.teamId}, ${criteriaByName.get(criteriaName)}, ${scoreCharacters.find((item) => item.memberId === character.memberId)!.characterId}, ${score}, ${ctx.session.user.id})`,
          );

          await tx.$executeRaw(Prisma.sql`
            INSERT INTO "IndividualScore" ("id", "teamID", "criteriaId", "characterId", "score", "judgeId")
            VALUES ${Prisma.join(scoreRows)}
            ON CONFLICT ("teamID", "criteriaId", "characterId", "judgeId")
            DO UPDATE SET "score" = EXCLUDED."score"
          `);

          return tx.submitted.upsert({
            where: {
              judgeId_teamID: {
                teamID: input.teamId,
                judgeId: ctx.session.user.id,
              },
            },
            create: {
              teamID: input.teamId,
              judgeId: ctx.session.user.id,
              submitted: true,
            },
            update: { submitted: true },
          });
        },
        { timeout: 15000 },
      );
    }),
});
