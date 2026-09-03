import { PlayCharacters, Role } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedAdminProcedure } from "~/server/api/trpc";
import kalasangamaError from "~/utils/customError";

export const adminRouter = createTRPCRouter({
	getRegisteredTeams: protectedAdminProcedure
		.query(async ({ ctx }) => {
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
									isIdVerified: true,
									isAttended: true,
									Character: {
										select: {
											character: true,
										},
									},
								},
							},
							editRequested: true
						},
					});
					return teams;
				} else {
					throw new kalasangamaError(
						"Permission error",
						"You do not have permissions to view this resource"
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
			})
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
						"You do not have permissions to view this resource"
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
	EditAccess: protectedAdminProcedure
		.input(
			z.object({ team: z.string() })
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const user = await ctx.db.user.findUnique({
					where: { id: ctx.session.user.id },
				});
				if (user?.role === "ADMIN") {
					const team = await ctx.db.team.findUnique({
						where: { id: input.team, },
						select: { isComplete: true, },
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
						"You do not have permissions to view this resource"
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
			})
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

					const allAttended = teamMembers.every(member => member.isAttended);

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
						"You do not have permissions to view this resource"
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
		.input((z.object({
			teamId:z.string(),
			judgeId:z.string()
		})))
		.query(async({ctx,input})=>{
			const scores = await ctx.db.individualScore.findMany({
				where: {
					teamID: input.teamId,
					judgeId: input.judgeId
				},
				include: {
					criteria: true,
					characterPlayed: true,
					judge: {
						include: {
							Submitted: {
								where: {
									teamID: input.teamId,
									judgeId: input.judgeId
								}
							}
						}
					},
					team: {
						include: {
							College: true
						}
					}
				}
			})
			return scores;
		}),
	getJudges:protectedAdminProcedure
		.query(async ({ ctx })=>{
			return await ctx.db.judge.findMany({
				include: {
					User: true
				}
			});
		}),
	getResults:protectedAdminProcedure
		.query(async({ctx})=>{
			const individualScores = await ctx.db.individualScore.findMany({
				include: {
					characterPlayed: true,
					criteria: true,
					team: {
						include:{
							TeamMembers: true
						}
					}
				},
				orderBy: [
					{
						characterId: "asc"
					},
					{
						teamID: "asc"
					},
					{
						criteriaId: "asc"
					}
				]
			})
			return individualScores;
		}),
	getName:protectedAdminProcedure
		.input(z.object({
			teamId: z.string(),
			character: z.nativeEnum(PlayCharacters)
		}))
		.query(async ({ctx,input})=>{
			return await ctx.db.teamMembers.findUnique({
				where:{
					teamId_characterId:{
						characterId:input.character,
						teamId: input.teamId
					}
				}
			})
		}),
	getTeams: protectedAdminProcedure
		.query(async({ctx})=>{
			const teams = await ctx.db.team.findMany();
			return teams;
		}),
	checkIfAllSubmitted: protectedAdminProcedure
		.query(async({ctx})=>{
			const Submitted = await ctx.db.submitted.findMany({
				where: {
					submitted: true
				},
			});
			const teams = await ctx.db.team.findMany();
			const judges = await ctx.db.judge.findMany();
			if(Submitted.length !== (teams.length * judges.length)){
				return "Not submitted"
			}
			return "done";
		}),
	
	getTeamLeaderboard: protectedAdminProcedure
		.query(async ({ ctx }) => {
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

				// Calculate team average score (out of 900)
				const leaderboard = teams.map((team) => {
					// Group scores by judge - each judge scores the team out of 900
					const judgeScores = new Map<string, number>();
					
					team.IndividualScore.forEach((score) => {
						const judgeId = score.judgeId;
						const currentTotal = judgeScores.get(judgeId) ?? 0;
						judgeScores.set(judgeId, currentTotal + score.score);
					});

					// Average across all judges (each judge's total is out of 900)
					const totalScore = Array.from(judgeScores.values()).reduce((sum, score) => sum + score, 0);
					const judgeCount = judgeScores.size;
					const averageScore = judgeCount > 0 ? totalScore / judgeCount : 0;

					// Count unique characters
					const uniqueCharacters = new Set(team.IndividualScore.map(s => s.characterId)).size;

					return {
						teamId: team.id,
						teamName: team.name,
						collegeName: team.College?.name ?? "Unknown",
						teamTotalScore: Math.round(averageScore * 100) / 100, // Average score out of 900
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

	getCharacterLeaderboard: protectedAdminProcedure
		.query(async ({ ctx }) => {
			try {
				// Get all individual scores with criteria breakdown
				const scores = await ctx.db.individualScore.findMany({
					select: {
						score: true,
						characterPlayed: {
							select: {
								character: true,
							},
						},
						team: {
							select: {
								id: true,
								name: true,
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

// Group by team and character with judge and criteria breakdown
			const characterMap = new Map<string, {
				teamId: string;
				teamName: string;
				collegeName: string;
				character: PlayCharacters;
				judgeScores: Map<string, Map<string, number>>;
				judgeNames: Map<string, string>;
			}>();

			scores.forEach((score) => {
				const key = `${score.team.id}-${score.characterPlayed.character}`;
				if (!characterMap.has(key)) {
					characterMap.set(key, {
						teamId: score.team.id,
						teamName: score.team.name,
						collegeName: score.team.College?.name ?? "Unknown",
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
						criteriaAverages[criteriaName] = Math.round((currentAverage / judgeCount) * 100) / 100;
					}
				});

				// Average score out of 100 (5 criteria × 20 each)
				const averageScore = Math.round((totalScore / judgeCount) * 100) / 100;
				
				return {
					teamId: entry.teamId,
					teamName: entry.teamName,
					collegeName: entry.collegeName,
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

	// --- College Management ---
	getColleges: protectedAdminProcedure
		.query(async ({ ctx }) => {
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
			})
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
			})
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
					message: "Cannot delete college associated with a team. Unlink or delete the team first.",
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
			})
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
	getAdmins: protectedAdminProcedure
		.query(async ({ ctx }) => {
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
			})
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
						name: input.name?.trim() ? input.name.trim() : (cleanEmail.split("@")[0] ?? "Admin"),
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
			})
		)
		.mutation(async ({ ctx, input }) => {
			const cleanEmail = input.email.trim().toLowerCase();
			let user = await ctx.db.user.findUnique({
				where: { email: cleanEmail },
			});

			if (user) {
				user = await ctx.db.user.update({
					where: { id: user.id },
					data: { role: Role.JUDGE },
				});
			} else {
				user = await ctx.db.user.create({
					data: {
						email: cleanEmail,
						name: input.name?.trim() ? input.name.trim() : (cleanEmail.split("@")[0] ?? "Judge"),
						role: Role.JUDGE,
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

	removeJudge: protectedAdminProcedure
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.judge.deleteMany({
				where: { userId: input.userId },
			});

			return await ctx.db.user.update({
				where: { id: input.userId },
				data: { role: Role.PARTICIPANT },
			});
		}),
});

