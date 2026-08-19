import { createTRPCRouter, protectedJudgeProcedure } from "../trpc";
import { z } from "zod";
import kalasangamaError from "~/utils/customError";
import { PlayCharacters, Criterias } from "@prisma/client";

const schema = z.object({
    "MITRASAHA": z.object({
      CRITERIA_1: z.number(),
      CRITERIA_2: z.number(),
      CRITERIA_3: z.number(),
      CRITERIA_4: z.number(),
      CRITERIA_5: z.number(),
    }),
    "MADAYANTHI": z.object({
      CRITERIA_1: z.number(),
      CRITERIA_2: z.number(),
      CRITERIA_3: z.number(),
      CRITERIA_4: z.number(),
      CRITERIA_5: z.number(),
    }),
    "VANAPAALAKA": z.object({
        CRITERIA_1: z.number(),
        CRITERIA_2: z.number(),
        CRITERIA_3: z.number(),
        CRITERIA_4: z.number(),
        CRITERIA_5: z.number(),
    }),
    "NARADA": z.object({
      CRITERIA_1: z.number(),
      CRITERIA_2: z.number(),
      CRITERIA_3: z.number(),
      CRITERIA_4: z.number(),
      CRITERIA_5: z.number(),
    }),
    "DHEERGHAAKSHA": z.object({
      CRITERIA_1: z.number(),
      CRITERIA_2: z.number(),
      CRITERIA_3: z.number(),
      CRITERIA_4: z.number(),
      CRITERIA_5: z.number(),
    }),
    "DHOOMRAAKSHA": z.object({
      CRITERIA_1: z.number(),
      CRITERIA_2: z.number(),
      CRITERIA_3: z.number(),
      CRITERIA_4: z.number(),
      CRITERIA_5: z.number(),
    }),
    "VASISHTA": z.object({
      CRITERIA_1: z.number(),
      CRITERIA_2: z.number(),
      CRITERIA_3: z.number(),
      CRITERIA_4: z.number(),
      CRITERIA_5: z.number(),
    }),
    "MEGHAVARNA": z.object({
      CRITERIA_1: z.number(),
      CRITERIA_2: z.number(),
      CRITERIA_3: z.number(),
      CRITERIA_4: z.number(),
      CRITERIA_5: z.number(),
    }),
    "DEVENDRA": z.object({
      CRITERIA_1: z.number(),
      CRITERIA_2: z.number(),
      CRITERIA_3: z.number(),
      CRITERIA_4: z.number(),
      CRITERIA_5: z.number(),
    }),
  });

export const JuryRouter= createTRPCRouter({
        getTeams: protectedJudgeProcedure
            .query(async({ctx})=>{
                const userId = ctx.session.user.id;
                //check if judge exiists if not add to judge table
                await ctx.db.judge.upsert({
                    where:{
                        userId: userId
                    },
                    update: {
                        //nothing to update here
                    },
                    create:{
                        User: {
                            connect:{
                                id: userId
                            }
                        }
                    }
                })
                const teams = await ctx.db.team.findMany({
                    where: {
                        attended: true,
                        isComplete: true,
                    }
                });
                return teams;
            }),
        addRemark: protectedJudgeProcedure
            .input((z.object({
                teamId:z.string(),
                remark:z.string(),
            })))
            .mutation(async({ctx,input})=>{
                const team = await ctx.db.team.findUnique({
                    where:{
                        id: input.teamId
                    }
                });
                if(!team){
                    throw new kalasangamaError("error","no team");
                }
                const teams = await ctx.db.team.update({
                    where:{
                        id: input.teamId
                    },
                    data:{
                        remark: input.remark,
                    }
                })
                return teams;
            }),
        getScores: protectedJudgeProcedure
            .input((z.object({
                teamId:z.string(),
            })))
            .query(async({ctx,input})=>{
                const userId = ctx.session.user.id;
                //check if judge exiists if not add to judge table
                await ctx.db.judge.upsert({
                    where:{
                        userId: userId
                    },
                    update: {
                        //nothing to update here
                    },
                    create:{
                        User: {
                            connect:{
                                id: userId
                            }
                        }
                    }
                })
                const scores = await ctx.db.individualScore.findMany({
                    where: {
                        teamID: input.teamId,
                        judgeId: ctx.session.user.id
                    },
                    include: {
                        criteria: true,
                        characterPlayed: true,
                        judge: {
                            include: {
                                Submitted: {
                                    where: {
                                        teamID: input.teamId,
                                        judgeId: ctx.session.user.id
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
        updateScores: protectedJudgeProcedure
            .input((z.object({
                teamId: z.string(),
                criteriaName: z.nativeEnum(Criterias),
                characterId: z.nativeEnum(PlayCharacters),
                score : z.number().max(20),
            })))
            .mutation(async({ctx,input})=>{
                const userId = ctx.session.user.id;
                //check if criteria exists if not add it
                const criteria = await ctx.db.criteria.upsert({
                    where: {
                        name: input.criteriaName 
                    },
                    create: {
                        name: input.criteriaName 
                    },
                    update: {
                        //nothing to update
                    }
                });
                //check if chacter exists if not add it
                const character = await ctx.db.character.upsert({
                    where: {
                        character: input.characterId
                    },
                    create: {
                        character: input.characterId
                    },
                    update: {
                        //nothing to update
                    }
                });
                return await ctx.db.individualScore.upsert({
                    where: {
                        teamID_criteriaId_characterId_judgeId: {
                            criteriaId : criteria.id,
                            characterId : character.id,
                            teamID: input.teamId,
                            judgeId: userId
                        }
                    },
                    update: {
                        score: input.score
                    },
                    create: {
                        criteriaId : criteria.id,
                        characterId : character.id,
                        teamID: input.teamId,
                        score: input.score,
                        judgeId: userId
                    }
                });
            }),
        getRemark: protectedJudgeProcedure
            .input((z.object({
                teamId: z.string(),
            })))
            .query(async({ctx,input})=>{
                const userId = ctx.session.user.id;
                //check if judge exiists if not add to judge table
                await ctx.db.judge.upsert({
                    where:{
                        userId: userId
                    },
                    update: {
                        //nothing to update here
                    },
                    create:{
                        User: {
                            connect:{
                                id: userId
                            }
                        }
                    }
                })
                return await ctx.db.team.findUnique({
                    where: {
                        id: input.teamId
                    },
                    select: {
                        remark: true
                    }
                })
            }),
        scoresUpdate:protectedJudgeProcedure
            .input(z.object({
                scores: schema,
                characters: z.array(z.nativeEnum(PlayCharacters)), 
                criteria: z.array(z.nativeEnum(Criterias)),
                teamId: z.string() 
            }))
            .mutation(async ({ctx,input}) => {
                const userId = ctx.session.user.id;
                
                // Fetch all characters and criteria upfront to reduce queries
                const allCharacters = await ctx.db.character.findMany({
                    where: {
                        character: { in: input.characters }
                    }
                });
                const allCriteria = await ctx.db.criteria.findMany({
                    where: {
                        name: { in: input.criteria }
                    }
                });
                
                // Create lookup maps
                const characterMap = new Map(allCharacters.map(c => [c.character, c.id]));
                const criteriaMap = new Map(allCriteria.map(c => [c.name, c.id]));
                
                // Batch all upsert operations
                const upsertPromises = input.characters.flatMap(character =>
                    input.criteria.map(criteria => {
                        const characterId = characterMap.get(character);
                        const criteriaId = criteriaMap.get(criteria);
                        
                        if (!characterId || !criteriaId) {
                            console.error(`Missing ID for ${character} or ${criteria}`);
                            return Promise.resolve();
                        }
                        
                        // Type assertion for nested enum object access
                        const scores = input.scores as Record<string, Record<string, number>>;
                        const score = scores[character]?.[criteria] ?? 0;
                        
                        return ctx.db.individualScore.upsert({
                            where: {
                                teamID_criteriaId_characterId_judgeId: {
                                    teamID: input.teamId,
                                    characterId,
                                    judgeId: userId,
                                    criteriaId
                                }
                            },
                            update: {
                                score
                            },
                            create: {
                                teamID: input.teamId,
                                characterId,
                                criteriaId,
                                judgeId: userId,
                                score
                            }
                        });
                    })
                );
                
                // Execute all upserts in parallel
                await Promise.all(upsertPromises);
                
                // Mark as submitted after all scores are updated
                await ctx.db.submitted.upsert({
                    where: {
                        judgeId_teamID: {
                            teamID: input.teamId,
                            judgeId: userId
                        }
                    },
                    create: {
                        teamID: input.teamId,
                        judgeId: userId,
                        submitted: true
                    },
                    update: {
                        submitted: true
                    }
                });
            })
        })


        

