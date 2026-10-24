import { Role } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedAdminProcedure } from "~/server/api/trpc";
import kalasangamaError from "~/utils/customError";
import { hashPassword } from "~/server/auth/password";

export const adminRouter = createTRPCRouter({
  getCompetitionSettings: protectedAdminProcedure.query(({ ctx }) =>
    ctx.db.competitionSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default", allowTeamFormation: false },
    }),
  ),
  setTeamFormation: protectedAdminProcedure
    .input(z.object({ allowTeamFormation: z.boolean() }))
    .mutation(({ ctx, input }) =>
      ctx.db.competitionSettings.upsert({
        where: { id: "default" },
        update: { allowTeamFormation: input.allowTeamFormation },
        create: { id: "default", allowTeamFormation: input.allowTeamFormation },
      }),
    ),
  getRegisteredTeams: protectedAdminProcedure.query(async ({ ctx }) => {
    try {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });
      if (user?.role === Role.ADMIN) {
        const teams = await ctx.db.team.findMany({
          select: {
            id: true,
            name: true,
            attended: true,
            College: {
              select: {
                name: true,
              },
            },
            isComplete: true,
            Prasanga: { select: { id: true, name: true } },
            Leader: {
              select: {
                name: true,
              },
            },
            TeamMembers: {
              select: {
                id: true,
                name: true,
                idURL: true,
                contact: true,
                characterId: true,
                characterName: true,
                isIdVerified: true,
                isAttended: true,
                Character: {
                  select: {
                    character: true,
                  },
                },
              },
            },
            editRequested: true,
          },
        });
        return teams;
      } else {
        throw new kalasangamaError(
          "Permission error",
          "You do not have permissions to view this resource",
        );
      }
    } catch (error) {
      if (error instanceof kalasangamaError) {
        throw new TRPCError({
          message: error.message,
          code: "BAD_REQUEST",
        });
      } else {
        console.log(error);
        throw new Error("An error occurred!");
      }
    }
  }),
  verifyId: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
        });
        if (user?.role === "ADMIN") {
          await ctx.db.teamMembers.update({
            where: {
              id: input.userId,
            },
            data: {
              isIdVerified: true,
            },
          });
          return { message: "success" };
        } else {
          throw new kalasangamaError(
            "Permission error",
            "You do not have permissions to view this resource",
          );
        }
      } catch (error) {
        if (error instanceof kalasangamaError) {
          throw new TRPCError({
            message: error.message,
            code: "BAD_REQUEST",
          });
        } else {
          console.log(error);
          throw new Error("An error occurred!");
        }
      }
    }),
  updateTeamMemberCharacter: protectedAdminProcedure
    .input(
      z.object({ id: z.string(), characterName: z.string().trim().min(1) }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.teamMembers.update({
        where: { id: input.id },
        data: { characterName: input.characterName },
      }),
    ),
  EditAccess: protectedAdminProcedure
    .input(z.object({ team: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
        });
        if (user?.role === "ADMIN") {
          const team = await ctx.db.team.findUnique({
            where: { id: input.team },
            select: { isComplete: true },
          });

          await ctx.db.team.update({
            where: {
              id: input.team,
            },
            data: {
              isComplete: !team?.isComplete,
            },
          });

          return { message: "success" };
        } else {
          throw new kalasangamaError(
            "Permission error",
            "You do not have permissions to view this resource",
          );
        }
      } catch (error) {
        if (error instanceof kalasangamaError) {
          throw new TRPCError({
            message: error.message,
            code: "BAD_REQUEST",
          });
        } else {
          console.log(error);
          throw new Error("An error occurred!");
        }
      }
    }),
  markAttendance: protectedAdminProcedure
    .input(
      z.object({
        memberId: z.string(),
        teamId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
        });
        if (user?.role === "ADMIN") {
          // Mark the member as attended
          await ctx.db.teamMembers.update({
            where: {
              id: input.memberId,
            },
            data: {
              isAttended: true,
            },
          });

          // Check if all team members are attended
          const teamMembers = await ctx.db.teamMembers.findMany({
            where: {
              teamId: input.teamId,
            },
            select: {
              isAttended: true,
            },
          });

          const allAttended = teamMembers.every((member) => member.isAttended);

          // If all members attended, mark team as attended
          if (allAttended) {
            await ctx.db.team.update({
              where: {
                id: input.teamId,
              },
              data: {
                attended: true,
              },
            });
          }

          return { message: "success", allAttended };
        } else {
          throw new kalasangamaError(
            "Permission error",
            "You do not have permissions to view this resource",
          );
        }
      } catch (error) {
        if (error instanceof kalasangamaError) {
          throw new TRPCError({
            message: error.message,
            code: "BAD_REQUEST",
          });
        } else {
          console.log(error);
          throw new Error("An error occurred!");
        }
      }
    }),
  getScores: protectedAdminProcedure
    .input(
      z.object({
        teamId: z.string(),
        judgeId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const scores = await ctx.db.individualScore.findMany({
        where: {
          teamID: input.teamId,
          judgeId: input.judgeId,
        },
        include: {
          criteria: true,
          characterPlayed: true,
          judge: {
            include: {
              Submitted: {
                where: {
                  teamID: input.teamId,
                  judgeId: input.judgeId,
                },
              },
            },
          },
          team: {
            include: {
              College: true,
            },
          },
        },
      });
      return scores;
    }),
  getJudges: protectedAdminProcedure.query(async ({ ctx }) => {
    return await ctx.db.judge.findMany({
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            username: true,
            role: true,
          },
        },
      },
    });
  }),
  getResults: protectedAdminProcedure.query(async ({ ctx }) => {
    const individualScores = await ctx.db.individualScore.findMany({
      include: {
        characterPlayed: true,
        criteria: true,
        team: {
          include: {
            TeamMembers: true,
          },
        },
      },
      orderBy: [
        {
          characterId: "asc",
        },
        {
          teamID: "asc",
        },
        {
          criteriaId: "asc",
        },
      ],
    });
    return individualScores;
  }),
  getName: protectedAdminProcedure
    .input(
      z.object({
        teamId: z.string(),
        character: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.teamMembers.findUnique({
        where: {
          teamId_characterId: {
            characterId: input.character,
            teamId: input.teamId,
          },
        },
      });
    }),
  getTeams: protectedAdminProcedure.query(async ({ ctx }) => {
    return ctx.db.team.findMany({
      include: {
        TeamMembers: { include: { Character: true } },
        Prasanga: { include: { characters: true } },
      },
    });
  }),
  checkIfAllSubmitted: protectedAdminProcedure.query(async ({ ctx }) => {
    const submitted = await ctx.db.submitted.findMany({
      where: {
        submitted: true,
        Team: { attended: true, isComplete: true, prasangaId: { not: null } },
      },
      select: { judgeId: true, teamID: true },
    });
    const teams = await ctx.db.team.count({
      where: { attended: true, isComplete: true, prasangaId: { not: null } },
    });
    const judges = await ctx.db.judge.findMany();
    if (submitted.length !== teams * judges.length) {
      return "Not submitted";
    }
    return "done";
  }),

  getTeamLeaderboard: protectedAdminProcedure.query(async ({ ctx }) => {
    try {
      // Get all teams with their individual scores
      const teams = await ctx.db.team.findMany({
        where: {
          attended: true,
        },
        select: {
          id: true,
          name: true,
          College: {
            select: {
              name: true,
            },
          },
          IndividualScore: {
            select: {
              score: true,
              characterId: true,
              judgeId: true,
              characterPlayed: {
                select: {
                  character: true,
                },
              },
            },
          },
        },
      });

      // Each team has ten playable characters, each with five criteria worth 20.
      // The team lead is stored separately and is not included in these scores.
      // Every entered mark counts, submitted or not.
      const leaderboard = teams.map((team) => {
        // Group scores by judge - each judge scores the team out of 1000.
        const judgeScores = new Map<string, number>();

        team.IndividualScore.forEach((score) => {
          const judgeId = score.judgeId;
          const currentTotal = judgeScores.get(judgeId) ?? 0;
          judgeScores.set(judgeId, currentTotal + score.score);
        });

        // Average across all judges (each judge's total is out of 1000)
        const totalScore = Array.from(judgeScores.values()).reduce(
          (sum, score) => sum + score,
          0,
        );
        const judgeCount = judgeScores.size;
        const averageScore = judgeCount > 0 ? totalScore / judgeCount : 0;

        // Count unique characters
        const uniqueCharacters = new Set(
          team.IndividualScore.map((s) => s.characterId),
        ).size;

        return {
          teamId: team.id,
          teamName: team.name,
          collegeName: team.College?.name ?? "Unknown",
          teamTotalScore: Math.round(averageScore * 100) / 100,
          characterCount: uniqueCharacters,
          judgeCount, // For debugging
        };
      });

      // Sort by team total score descending
      return leaderboard.sort((a, b) => b.teamTotalScore - a.teamTotalScore);
    } catch (error) {
      console.log(error);
      throw new TRPCError({
        message: "Failed to fetch team leaderboard",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }),

  getParticipantLeaderboard: protectedAdminProcedure.query(async ({ ctx }) => {
    // Averages every mark judges have entered, submitted or not
    const [scores, teams] = await Promise.all([
      ctx.db.individualScore.findMany({
        select: {
          judgeId: true,
          teamID: true,
          characterId: true,
          score: true,
          characterPlayed: { select: { character: true } },
        },
      }),
      ctx.db.team.findMany({
        select: {
          id: true,
          name: true,
          number: true,
          College: { select: { name: true } },
          TeamMembers: {
            select: {
              id: true,
              name: true,
              characterId: true,
              characterName: true,
              Character: { select: { character: true } },
            },
          },
        },
        orderBy: { number: "asc" },
      }),
    ]);

    // teamId:characterId -> judgeId -> total of that judge's criteria (out of 100)
    const groups = new Map<
      string,
      { teamId: string; characterId: string; character: string; judgeTotals: Map<string, number> }
    >();
    for (const score of scores) {
      const key = `${score.teamID}:${score.characterId}`;
      let group = groups.get(key);
      if (!group) {
        group = {
          teamId: score.teamID,
          characterId: score.characterId,
          character: score.characterPlayed.character,
          judgeTotals: new Map(),
        };
        groups.set(key, group);
      }
      group.judgeTotals.set(
        score.judgeId,
        (group.judgeTotals.get(score.judgeId) ?? 0) + score.score,
      );
    }

    // Every member of every team, with their average if judges have submitted marks
    return teams.map((team) => {
      const teamGroups = Array.from(groups.values()).filter(
        (group) => group.teamId === team.id,
      );
      const participants = team.TeamMembers.map((member) => {
        const characterLabel =
          member.characterName?.trim() ?? member.Character?.character ?? "";
        const group = teamGroups.find((g) => {
          if (member.characterId !== null && g.characterId === member.characterId)
            return true;
          return (
            characterLabel !== "" &&
            g.character.trim().toLowerCase() === characterLabel.toLowerCase()
          );
        });
        const totals = group ? Array.from(group.judgeTotals.values()) : [];
        const average = totals.length
          ? totals.reduce((sum, total) => sum + total, 0) / totals.length
          : null;
        return {
          id: member.id,
          name: member.name,
          character: characterLabel === "" ? null : characterLabel,
          averageScore: average === null ? null : Math.round(average * 100) / 100, // Out of 100
          judgeCount: totals.length,
        };
      }).sort((a, b) => {
        // Scored first (highest average first), then unscored members
        if (a.averageScore === null && b.averageScore === null) return 0;
        if (a.averageScore === null) return 1;
        if (b.averageScore === null) return -1;
        return b.averageScore - a.averageScore;
      });

      return {
        teamId: team.id,
        teamName: team.name,
        collegeName: team.College?.name ?? "Unknown",
        participants,
      };
    });
  }),

  getCharacterLeaderboard: protectedAdminProcedure.query(async ({ ctx }) => {
    try {
      // Get all individual scores with criteria breakdown
      const scores = await ctx.db.individualScore.findMany({
        select: {
          score: true,
          characterPlayed: {
            select: {
              id: true,
              character: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              Prasanga: { select: { id: true, name: true } },
              College: {
                select: {
                  name: true,
                },
              },
            },
          },
          criteria: {
            select: {
              name: true,
            },
          },
          judgeId: true,
          judge: {
            select: {
              User: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // Group by team and character with judge and criteria breakdown (all entered marks)
      const characterMap = new Map<
        string,
        {
          teamId: string;
          teamName: string;
          collegeName: string;
          prasangaId: string;
          prasangaName: string;
          character: string;
          judgeScores: Map<string, Map<string, number>>;
          judgeNames: Map<string, string>;
        }
      >();

      scores.forEach((score) => {
        const key = `${score.team.id}-${score.characterPlayed.id}`;
        if (!characterMap.has(key)) {
          characterMap.set(key, {
            teamId: score.team.id,
            teamName: score.team.name,
            collegeName: score.team.College?.name ?? "Unknown",
            prasangaId: score.team.Prasanga?.id ?? "unknown",
            prasangaName: score.team.Prasanga?.name ?? "Unknown Prasanga",
            character: score.characterPlayed.character,
            judgeScores: new Map(),
            judgeNames: new Map(),
          });
        }
        const charData = characterMap.get(key)!;
        const judgeId = score.judgeId;
        const criteriaName = score.criteria.name;

        // Store judge name
        if (!charData.judgeNames.has(judgeId)) {
          charData.judgeNames.set(judgeId, score.judge.User.name);
        }

        if (!charData.judgeScores.has(judgeId)) {
          charData.judgeScores.set(judgeId, new Map());
        }
        charData.judgeScores.get(judgeId)!.set(criteriaName, score.score);
      });

      // Calculate averages and create leaderboard
      const leaderboard = Array.from(characterMap.values()).map((entry) => {
        // Calculate average per criteria across all judges
        const criteriaAverages: Record<string, number> = {};
        const allCriteria = new Set<string>();
        let totalScore = 0;

        // Collect all criteria and calculate per-judge totals
        const judgeBreakdown: Array<{
          judgeId: string;
          judgeName: string;
          criteriaScores: Record<string, number>;
          total: number;
        }> = [];

        entry.judgeScores.forEach((criteria, judgeId) => {
          const judgeData: Record<string, number> = {};
          let judgeTotal = 0;

          criteria.forEach((score, criteriaName) => {
            allCriteria.add(criteriaName);
            judgeData[criteriaName] = score;
            judgeTotal += score;

            // Add to criteria averages
            criteriaAverages[criteriaName] ??= 0;
            criteriaAverages[criteriaName] += score;
          });

          judgeBreakdown.push({
            judgeId,
            judgeName: entry.judgeNames.get(judgeId) ?? "Unknown Judge",
            criteriaScores: judgeData,
            total: Math.round(judgeTotal * 100) / 100,
          });

          totalScore += judgeTotal;
        });

        // Calculate averages
        const judgeCount = entry.judgeScores.size;
        allCriteria.forEach((criteriaName) => {
          const currentAverage = criteriaAverages[criteriaName];
          if (currentAverage !== undefined) {
            criteriaAverages[criteriaName] =
              Math.round((currentAverage / judgeCount) * 100) / 100;
          }
        });

        // Average score out of 100 (5 criteria × 20 each)
        const averageScore = Math.round((totalScore / judgeCount) * 100) / 100;

        return {
          teamId: entry.teamId,
          teamName: entry.teamName,
          collegeName: entry.collegeName,
          prasangaId: entry.prasangaId,
          prasangaName: entry.prasangaName,
          character: entry.character,
          averageScore, // Out of 100
          judgeCount,
          criteriaScores: criteriaAverages,
          judgeBreakdown, // Individual judge scores
        };
      });

      // Sort by character first, then by score descending
      return leaderboard.sort((a, b) => {
        if (a.character === b.character) {
          return b.averageScore - a.averageScore;
        }
        return a.character.localeCompare(b.character);
      });
    } catch (error) {
      console.log(error);
      throw new TRPCError({
        message: "Failed to fetch character leaderboard",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }),

  // --- Prasanga Management ---
  getPrasangas: protectedAdminProcedure.query(async ({ ctx }) =>
    ctx.db.prasanga.findMany({
      include: {
        characters: { orderBy: { character: "asc" } },
        _count: { select: { teams: true } },
      },
      orderBy: { name: "asc" },
    }),
  ),
  createPrasanga: protectedAdminProcedure
    .input(z.object({ name: z.string().trim().min(1) }))
    .mutation(({ ctx, input }) =>
      ctx.db.prasanga.create({ data: { name: input.name } }),
    ),
  updatePrasanga: protectedAdminProcedure
    .input(z.object({ id: z.string(), name: z.string().trim().min(1) }))
    .mutation(({ ctx, input }) =>
      ctx.db.prasanga.update({
        where: { id: input.id },
        data: { name: input.name },
      }),
    ),
  deletePrasanga: protectedAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prasanga = await ctx.db.prasanga.findUnique({
        where: { id: input.id },
        include: { characters: true, teams: { select: { id: true } } },
      });
      if (!prasanga)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prasanga not found",
        });
      if (prasanga.characters.length || prasanga.teams.length)
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Remove characters and reassign teams before deleting this prasanga.",
        });
      return ctx.db.prasanga.delete({ where: { id: input.id } });
    }),
  createPrasangaCharacter: protectedAdminProcedure
    .input(
      z.object({ prasangaId: z.string(), character: z.string().trim().min(1) }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.character.create({
        data: { prasangaId: input.prasangaId, character: input.character },
      }),
    ),
  updatePrasangaCharacter: protectedAdminProcedure
    .input(z.object({ id: z.string(), character: z.string().trim().min(1) }))
    .mutation(({ ctx, input }) =>
      ctx.db.character.update({
        where: { id: input.id },
        data: { character: input.character },
      }),
    ),
  deletePrasangaCharacter: protectedAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [members, scores] = await Promise.all([
        ctx.db.teamMembers.count({ where: { characterId: input.id } }),
        ctx.db.individualScore.count({ where: { characterId: input.id } }),
      ]);
      if (members || scores)
        throw new TRPCError({
          code: "CONFLICT",
          message: "This character is already used by a team or score.",
        });
      return ctx.db.character.delete({ where: { id: input.id } });
    }),
  assignPrasanga: protectedAdminProcedure
    .input(z.object({ teamId: z.string(), prasangaId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prasanga = await ctx.db.prasanga.findUnique({
        where: { id: input.prasangaId },
      });
      if (!prasanga)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prasanga not found",
        });

      // Only changes which prasanga the team has. Players, characters,
      // verification, attendance, marks and submissions are left untouched.
      return ctx.db.team.update({
        where: { id: input.teamId },
        data: { prasangaId: input.prasangaId },
      });
    }),

  // --- College Management ---
  getColleges: protectedAdminProcedure.query(async ({ ctx }) => {
    return await ctx.db.college.findMany({
      include: {
        Team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }),

  addCollege: protectedAdminProcedure
    .input(
      z.object({
        name: z.string().min(1, "College name is required"),
        details: z.string().optional(),
        password: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.college.create({
        data: {
          name: input.name,
          details: input.details,
          password: input.password ?? "hello",
        },
      });
    }),

  updateCollege: protectedAdminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "College name is required"),
        details: z.string().optional(),
        password: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.college.update({
        where: { id: input.id },
        data: {
          name: input.name,
          details: input.details,
          password: input.password,
        },
      });
    }),

  deleteCollege: protectedAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const college = await ctx.db.college.findUnique({
        where: { id: input.id },
        include: { Team: true },
      });
      if (college?.Team) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot delete college associated with a team. Unlink or delete the team first.",
        });
      }
      return await ctx.db.college.delete({
        where: { id: input.id },
      });
    }),

  // --- Team Editing ---
  updateTeamName: protectedAdminProcedure
    .input(
      z.object({
        teamId: z.string(),
        name: z.string().min(1, "Team name cannot be empty"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.team.findFirst({
        where: {
          name: input.name,
          NOT: { id: input.teamId },
        },
      });
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A team with this name already exists",
        });
      }

      return await ctx.db.team.update({
        where: { id: input.teamId },
        data: { name: input.name },
      });
    }),

  // --- Admin Accounts Management ---
  getAdmins: protectedAdminProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findMany({
      where: { role: Role.ADMIN },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
      orderBy: { email: "asc" },
    });
  }),

  addAdmin: protectedAdminProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const cleanEmail = input.email.trim().toLowerCase();
      const existingUser = await ctx.db.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existingUser) {
        return await ctx.db.user.update({
          where: { id: existingUser.id },
          data: { role: Role.ADMIN },
        });
      } else {
        return await ctx.db.user.create({
          data: {
            email: cleanEmail,
            name: input.name?.trim()
              ? input.name.trim()
              : (cleanEmail.split("@")[0] ?? "Admin"),
            role: Role.ADMIN,
          },
        });
      }
    }),

  removeAdmin: protectedAdminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot remove your own admin privileges",
        });
      }

      return await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: Role.PARTICIPANT },
      });
    }),

  // --- Judge Accounts Management ---
  addJudge: protectedAdminProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        name: z.string().optional(),
        username: z
          .string()
          .trim()
          .min(3, "Username must be at least 3 characters")
          .optional(),
        password: z
          .string()
          .min(6, "Password must be at least 6 characters")
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const cleanEmail = input.email.trim().toLowerCase();
      const cleanUsername = input.username?.trim().toLowerCase() ?? undefined;

      if (!cleanUsername !== !input.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Enter both a username and a password, or neither",
        });
      }

      if (cleanUsername) {
        const taken = await ctx.db.user.findFirst({
          where: { username: cleanUsername, NOT: { email: cleanEmail } },
        });
        if (taken) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "That username is already taken",
          });
        }
      }

      const hashed = input.password
        ? await hashPassword(input.password)
        : undefined;

      let user = await ctx.db.user.findUnique({
        where: { email: cleanEmail },
      });

      // Roles are exclusive: never turn an admin into a judge
      if (user?.role === Role.ADMIN)
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "That account is an admin. Remove its admin access first if it should be a judge.",
        });

      if (user) {
        user = await ctx.db.user.update({
          where: { id: user.id },
          data: {
            role: Role.JUDGE,
            ...(cleanUsername ? { username: cleanUsername, password: hashed } : {}),
          },
        });
      } else {
        user = await ctx.db.user.create({
          data: {
            email: cleanEmail,
            name: input.name?.trim()
              ? input.name.trim()
              : (cleanEmail.split("@")[0] ?? "Judge"),
            role: Role.JUDGE,
            ...(cleanUsername ? { username: cleanUsername, password: hashed } : {}),
          },
        });
      }

      await ctx.db.judge.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      });

      return user;
    }),

  updateJudge: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().trim().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        // Empty string clears the username
        username: z.string().trim().max(50).optional(),
        // Empty or missing keeps the current password
        password: z
          .string()
          .min(6, "Password must be at least 6 characters")
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const cleanEmail = input.email.trim().toLowerCase();
      const cleanUsername = input.username ? input.username.toLowerCase() : null;

      const current = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { password: true, role: true },
      });
      if (current?.role !== Role.JUDGE) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Judge not found" });
      }

      if (cleanUsername) {
        const taken = await ctx.db.user.findFirst({
          where: { username: cleanUsername, NOT: { id: input.userId } },
        });
        if (taken) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "That username is already taken",
          });
        }
      }

      const newPassword = input.password ?? undefined;
      if (cleanUsername && !current.password && !newPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Set a password to go with this username",
        });
      }

      const emailTaken = await ctx.db.user.findFirst({
        where: { email: cleanEmail, NOT: { id: input.userId } },
      });
      if (emailTaken) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "That email belongs to another account",
        });
      }

      return await ctx.db.user.update({
        where: { id: input.userId },
        data: {
          name: input.name,
          email: cleanEmail,
          username: cleanUsername,
          ...(newPassword ? { password: await hashPassword(newPassword) } : {}),
        },
        select: { id: true, name: true, email: true, username: true },
      });
    }),

  removeJudge: protectedAdminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { role: true },
      });
      if (!user)
        throw new TRPCError({ code: "NOT_FOUND", message: "Judge not found" });

      // Deleting a judge cascades to all of their marks and submissions
      const [marks, submissions, remarks] = await Promise.all([
        ctx.db.individualScore.count({ where: { judgeId: input.userId } }),
        ctx.db.submitted.count({ where: { judgeId: input.userId } }),
        ctx.db.judgeRemark.count({ where: { judgeId: input.userId } }),
      ]);
      if (marks > 0 || submissions > 0 || remarks > 0)
        throw new TRPCError({
          code: "CONFLICT",
          message: `This judge has ${marks} mark(s), ${submissions} submission(s) and ${remarks} remark(s). Removing the judge would delete them, so it is blocked.`,
        });

      await ctx.db.judge.deleteMany({
        where: { userId: input.userId },
      });

      // Only demote real judges; never touch an admin's role
      if (user.role !== Role.JUDGE) return { id: input.userId };
      return await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: Role.PARTICIPANT },
      });
    }),
});
