import { createTRPCRouter, protectedJudgeProcedure } from "../trpc";
import { z } from "zod";
import kalasangamaError from "~/utils/customError";
import { Criterias } from "@prisma/client";

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
      },
    });
  }),
  addRemark: protectedJudgeProcedure
    .input(z.object({ teamId: z.string(), remark: z.string() }))
    .mutation(async ({ ctx, input }) =>
      ctx.db.team.update({
        where: { id: input.teamId },
        data: { remark: input.remark },
      }),
    ),
  getScores: protectedJudgeProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ ctx, input }) =>
      ctx.db.individualScore.findMany({
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
      }),
    ),
  updateScores: protectedJudgeProcedure
    .input(scoreInput)
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.db.team.findUnique({
        where: { id: input.teamId },
        select: { prasangaId: true },
      });
      const character = await ctx.db.character.findFirst({
        where: {
          prasangaId: team?.prasangaId ?? "",
          OR: [{ id: input.characterId }, { character: input.characterId }],
        },
      });
      if (!team?.prasangaId || !character)
        throw new kalasangamaError(
          "Score error",
          "Character does not belong to this team's prasanga.",
        );
      const criteria = await ctx.db.criteria.upsert({
        where: { name: input.criteriaName },
        create: { name: input.criteriaName },
        update: {},
      });
      return ctx.db.individualScore.upsert({
        where: {
          teamID_criteriaId_characterId_judgeId: {
            criteriaId: criteria.id,
            characterId: character.id,
            teamID: input.teamId,
            judgeId: ctx.session.user.id,
          },
        },
        update: { score: input.score },
        create: {
          criteriaId: criteria.id,
          characterId: character.id,
          teamID: input.teamId,
          score: input.score,
          judgeId: ctx.session.user.id,
        },
      });
    }),
  getRemark: protectedJudgeProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ ctx, input }) =>
      ctx.db.team.findUnique({
        where: { id: input.teamId },
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
        select: { prasangaId: true },
      });
      if (!team?.prasangaId)
        throw new kalasangamaError(
          "Score error",
          "Team has no assigned prasanga.",
        );
      const characters = await ctx.db.character.findMany({
        where: { id: { in: input.characters }, prasangaId: team.prasangaId },
      });
      if (characters.length !== input.characters.length)
        throw new kalasangamaError(
          "Score error",
          "Invalid character for this team's prasanga.",
        );
      const criteriaRows = await ctx.db.criteria.findMany({
        where: { name: { in: input.criteria } },
      });
      for (const character of characters)
        for (const criteria of criteriaRows) {
          const score =
            input.scores[character.id]?.[criteria.name] ??
            input.scores[character.character]?.[criteria.name] ??
            0;
          await ctx.db.individualScore.upsert({
            where: {
              teamID_criteriaId_characterId_judgeId: {
                teamID: input.teamId,
                criteriaId: criteria.id,
                characterId: character.id,
                judgeId: ctx.session.user.id,
              },
            },
            update: { score },
            create: {
              teamID: input.teamId,
              criteriaId: criteria.id,
              characterId: character.id,
              judgeId: ctx.session.user.id,
              score,
            },
          });
        }
      return ctx.db.submitted.upsert({
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
    }),
});
