import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";

const memberSchema = z.object({
  name: z.string().min(1),
  characterId: z.string().min(1),
  idURL: z.string().min(1),
});

export const TeamRouter = createTRPCRouter({
  getColleges: protectedProcedure.query(async ({ ctx }) =>
    ctx.db.college.findMany({ select: { id: true, name: true } }),
  ),
  getCharacters: protectedProcedure
    .input(z.object({ edit: z.boolean().optional() }))
    .query(async ({ ctx }) => {
      const settings = await ctx.db.competitionSettings.findUnique({
        where: { id: "default" },
      });
      const team = await ctx.db.team.findFirst({
        where: {
          OR: [
            { leaderId: ctx.session.user.id },
            ...(ctx.session.user.LeaderOf?.id
              ? [{ id: ctx.session.user.LeaderOf.id }]
              : []),
          ],
        },
        select: { prasangaId: true, isComplete: true, editRequested: true },
      });
      if (!team) {
        return {
          isLeader: false,
          allowTeamFormation: settings?.allowTeamFormation ?? false,
          teamComplete: false,
          editRequested: false,
          assigned: false as const,
          prasanga: null,
          characters: [],
        };
      }
      if (!team.prasangaId)
        return {
          isLeader: true,
          allowTeamFormation: settings?.allowTeamFormation ?? false,
          teamComplete: team.isComplete,
          editRequested: team.editRequested,
          assigned: false as const,
          prasanga: null,
          characters: [],
        };
      const prasanga = await ctx.db.prasanga.findUnique({
        where: { id: team.prasangaId },
        include: { characters: { orderBy: { character: "asc" } } },
      });
      return {
        isLeader: true,
        allowTeamFormation: settings?.allowTeamFormation ?? false,
        teamComplete: team.isComplete,
        editRequested: team.editRequested,
        assigned: true as const,
        prasanga: prasanga ? { id: prasanga.id, name: prasanga.name } : null,
        characters: prasanga?.characters ?? [],
      };
    }),
  checkPassword: protectedProcedure
    .input(z.object({ password: z.string(), college_id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const college = await ctx.db.college.findUnique({
        where: { id: input.college_id },
      });
      if (college?.password === input.password)
        return { message: "Let's Proceed" };
      throw new TRPCError({
        code: "CONFLICT",
        message: "Team password is incorrect.",
      });
    }),
  register: protectedProcedure
    .input(
      z.object({
        college_id: z.string().nullish(),
        leader_idUrl: z.string().nullish(),
        leader_contact: z.string().nullish(),
        leader_name: z.string().nullish(),
        leader_character: z.string().nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.db.team.findUnique({
        where: { college_id: input.college_id ?? undefined },
        include: { Prasanga: { include: { characters: true } } },
      });
      if (!team)
        throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
      if (team.leaderId)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Team already has a leader registered.",
        });
      if (team.isComplete)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Team is already complete",
        });
      if (
        input.leader_character &&
        team.Prasanga &&
        !team.Prasanga.characters.some((c) => c.id === input.leader_character)
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid character for this prasanga",
        });
      await ctx.db.team.update({
        where: { id: team.id },
        data: {
          Leader: { connect: { id: ctx.session.user.id } },
          isComplete: false,
        },
      });
      await ctx.db.teamMembers.create({
        data: {
          teamId: team.id,
          characterId: input.leader_character ?? null,
          idURL: input.leader_idUrl ?? "",
          name: input.leader_name ?? "",
          contact: input.leader_contact ?? "",
        },
      });
      return { message: "Team created successfully" };
    }),
  updateTeam: protectedProcedure
    .input(
      z.object({
        edit: z.boolean().optional(),
        members: z.array(memberSchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const settings = await ctx.db.competitionSettings.findUnique({
        where: { id: "default" },
      });
      if (!settings?.allowTeamFormation)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Team formation is currently disabled by the administrator.",
        });
      const team = await ctx.db.team.findFirst({
        where: {
          OR: [
            { leaderId: ctx.session.user.id },
            ...(ctx.session.user.LeaderOf?.id
              ? [{ id: ctx.session.user.LeaderOf.id }]
              : []),
          ],
        },
        include: { Prasanga: { include: { characters: true } } },
      });
      if (!team)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Only leaders can add members",
        });
      const teamId = team.id;
      if (!team.Prasanga)
        throw new TRPCError({
          code: "CONFLICT",
          message: "An admin must assign a prasanga first.",
        });
      const expected = new Set(team.Prasanga.characters.map((c) => c.id));
      const submitted = input.members.map((m) => m.characterId);
      if (
        new Set(submitted).size !== submitted.length ||
        submitted.length !== expected.size ||
        submitted.some((id) => !expected.has(id))
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Provide details for every character in your assigned prasanga.",
        });
      await ctx.db.$transaction(async (tx) => {
        for (const member of input.members)
          await tx.teamMembers.upsert({
            where: {
              teamId_characterId: { teamId, characterId: member.characterId },
            },
            update: {
              name: member.name,
              idURL: member.idURL,
              isIdVerified: false,
            },
            create: {
              teamId,
              characterId: member.characterId,
              name: member.name,
              idURL: member.idURL,
            },
          });
        await tx.team.update({
          where: { id: teamId },
          data: { isComplete: true, editRequested: false },
        });
      });
      return { message: "success" };
    }),
  getTeam: protectedProcedure.query(async ({ ctx }) => {
    const team = await ctx.db.team.findFirst({
      where: {
        OR: [
          { leaderId: ctx.session.user.id },
          ...(ctx.session.user.LeaderOf?.id
            ? [{ id: ctx.session.user.LeaderOf.id }]
            : []),
        ],
      },
      include: {
        TeamMembers: {
          include: { Character: true },
        },
        Leader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Prasanga: {
          include: {
            characters: {
              orderBy: { character: "asc" },
            },
          },
        },
        College: true,
      },
    });
    return team;
  }),
  getTeamForEdits: protectedProcedure.query(async ({ ctx }) => {
    const team = await ctx.db.team.findFirst({
      where: {
        OR: [
          { leaderId: ctx.session.user.id },
          ...(ctx.session.user.LeaderOf?.id
            ? [{ id: ctx.session.user.LeaderOf.id }]
            : []),
        ],
      },
      include: {
        TeamMembers: { include: { Character: true } },
        Leader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Prasanga: {
          include: {
            characters: {
              orderBy: { character: "asc" },
            },
          },
        },
      },
    });
    return team;
  }),
  requestEditAccess: protectedProcedure.mutation(async ({ ctx }) => {
    const team = await ctx.db.team.findFirst({
      where: {
        OR: [
          { leaderId: ctx.session.user.id },
          ...(ctx.session.user.LeaderOf?.id
            ? [{ id: ctx.session.user.LeaderOf.id }]
            : []),
        ],
      },
    });
    if (!team)
      throw new TRPCError({
        code: "CONFLICT",
        message: "You are not the leader of any team",
      });
    return ctx.db.team.update({
      where: { id: team.id },
      data: { editRequested: true },
    });
  }),
});
export default TeamRouter;
