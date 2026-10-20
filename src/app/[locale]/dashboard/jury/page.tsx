"use client";

import { api } from "~/trpc/react";
import {
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableHeader,
} from "~/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ArrowDown, Check, LogOut, Users } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { type NextPage } from "next";
import Remarks from "~/components/Jury/remarks";
import Submit from "~/components/Jury/submit";
import { Role, type Criterias } from "@prisma/client";
import toast from "react-hot-toast";
import { signOut, useSession } from "next-auth/react";
import NotFound from "~/app/[locale]/not-found";
import { Button } from "~/components/ui/button";

type ScoresState = Record<string, Record<Criterias, number>>;

const criteriaList: Criterias[] = [
  "CRITERIA_1",
  "CRITERIA_2",
  "CRITERIA_3",
  "CRITERIA_4",
  "CRITERIA_5",
];

const makeInitialScores = (characterIds: string[]): ScoresState => {
  const nextScores: ScoresState = {};
  characterIds.forEach((character) => {
    nextScores[character] = {} as Record<Criterias, number>;
    criteriaList.forEach((criteria) => {
      nextScores[character]![criteria] = 999;
    });
  });
  return nextScores;
};

const Jury: NextPage = () => {
  const criteriaDisplayList: string[] = [
    "ಆಂಗೀಕಾಭಿನಯ (20)",
    "ವಾಚಿಕಾಭಿನಯ (20)",
    "ಜೊತೆವೇಷದೊಂದಿಗಿನ ಹೊಂದಾಣಿಕೆ (20)",
    "ರಂಗನಡೆ ಮತ್ತು ಸೃಜನಶೀಲತೆ (20)",
    "ಒಟ್ಟು ಪ್ರಸ್ತುತಿ (20)",
  ];

  const [teamName, setTeamName] = useState<string>("Select a college");
  const [teamId, setTeamId] = useState<string>("");
  const [scored, setScored] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  const { data: sessionData } = useSession();
  const isJudge = !sessionData?.user || sessionData?.user?.role !== Role.JUDGE;

  const scoreUpdate = api.jury.updateScores.useMutation();
  const { data, isLoading } = api.jury.getTeams.useQuery(undefined, {
    enabled: !isJudge,
  });

  const selectedTeam = data?.find((team) => team.id === teamId);
  const teamCharacters =
    selectedTeam?.TeamMembers.filter(
      (member) => member.characterId ?? member.characterName?.trim(),
    ).map((member) => ({
      id: member.id,
      scoreCharacterId: member.characterId ?? member.Character?.id,
      character:
        member.characterName?.trim() ?? member.Character?.character ?? "",
    })) ?? [];
  const characters = teamCharacters.map((character) => character.id);
  const charactersDisplay = teamCharacters.map(
    (character) => character.character,
  );

  const initialScores = makeInitialScores(characters);

  const [scores, setScores] = useState<ScoresState>(initialScores);
  const [ready, setReady] = useState<boolean>(false);
  const [refetch, setRefetch] = useState<boolean>(false);
  const [, setError] = useState<boolean>(false);

  // Store debounce timers for each character-criteria combination
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Track which field is currently being typed in (red state)
  const [typingField, setTypingField] = useState<string | null>(null);

  // Track which field is currently updating to DB (yellow state)
  const [updatingField, setUpdatingField] = useState<string | null>(null);

  const handleScoreChange = (
    character: string,
    criteria: Criterias,
    value: number,
  ) => {
    const fieldKey = `${character}-${criteria}`;

    // Mark field as being typed (red state)
    setTypingField(fieldKey);
    // Don't allow values above 20
    if (value > 20) {
      setError(true);
      toast.error("Score should be within 0-20", {
        position: "bottom-center",
        duration: 2000,
      });
      return;
    }

    setError(false);

    // Update the scores state with the new value immediately
    setScores((prevScores) => {
      const characterScores =
        prevScores[character] ?? makeInitialScores([character])[character]!;
      return {
        ...prevScores,
        [character]: {
          ...characterScores,
          [criteria]: value,
        },
      };
    });

    // Clear any existing timeout for this specific character-criteria combination
    if (debounceTimers.current[fieldKey]) {
      clearTimeout(debounceTimers.current[fieldKey]);
    }

    // Set new timeout to update database after 5 seconds of inactivity
    debounceTimers.current[fieldKey] = setTimeout(() => {
      // Clear typing state and set updating state (yellow)
      setTypingField(null);
      setUpdatingField(fieldKey);

      scoreUpdate.mutate(
        {
          teamId: teamId,
          criteriaName: criteria,
          characterId: character,
          score: value,
        },
        {
          onSuccess: () => {
            // Clear updating state after successful update (green state)
            setUpdatingField(null);
          },
          onError: () => {
            // Clear updating state on error
            setUpdatingField(null);
          },
        },
      );

      delete debounceTimers.current[fieldKey];
    }, 5000);
  };

  const totalScore = (character: string) => {
    const characterScores = scores[character];
    if (characterScores) {
      const keys = Object.keys(characterScores);
      let sum = 0;
      keys.forEach((key) => {
        const value = characterScores[key as Criterias];
        if (value !== undefined && value !== 999) sum += value;
      });
      return sum;
    }
    return 0;
  };

  const res = api.jury.getScores.useQuery(
    { teamId: teamId },
    {
      enabled: false,
      staleTime: Infinity,
    },
  );

  useEffect(() => {
    if (res.error) {
      console.error(res.error);
      alert("Error fetching score");
    }
  }, [res.error]);

  const setTeam = (newTeamId: string, teamName: string) => {
    if (newTeamId === teamId) return;

    // Clear all pending debounce timers when switching teams
    Object.values(debounceTimers.current).forEach((timer) =>
      clearTimeout(timer),
    );
    debounceTimers.current = {};

    // Clear all field states
    setTypingField(null);
    setUpdatingField(null);

    setScored(false);
    const selectedCharacters =
      data
        ?.find((team) => team.id === newTeamId)
        ?.TeamMembers.filter(
          (member) => member.characterId ?? member.characterName?.trim(),
        )
        .map((member) => member.id) ?? [];
    setScores(makeInitialScores(selectedCharacters));
    setRefetch(true);
    setReady(false);
    setTeamId(newTeamId);
    setTeamName(teamName);
  };

  useEffect(() => {
    if (refetch) res.refetch().catch((err) => console.log(err));
    setRefetch(false);
  }, [teamId, refetch, res]);

  useEffect(() => {
    if (res.data?.length ?? 0 > 0) {
      if (res.data?.[0]?.judge.Submitted[0]?.submitted) setScored(true);
      console.log("updating");
      setUpdating(true);
      res.data?.forEach((item) => {
        const effectTeamCharacters =
          data
            ?.find((team) => team.id === teamId)
            ?.TeamMembers.filter(
              (member) => member.characterId ?? member.characterName?.trim(),
            )
            .map((member) => ({
              id: member.id,
              scoreCharacterId: member.characterId ?? member.Character?.id,
              character:
                member.characterName?.trim() ??
                member.Character?.character ??
                "",
            })) ?? [];
        const selectedCharacter = effectTeamCharacters.find(
          (character) =>
            character.scoreCharacterId === item.characterPlayed.id ||
            character.character.toLowerCase() ===
              item.characterPlayed.character.toLowerCase(),
        );
        const character = selectedCharacter?.id ?? item.characterPlayed.id;
        const criteria = item.criteria.name;
        // Update the scores state with the new value
        setScores((prevScores) => ({
          ...prevScores,
          [character]: {
            ...(prevScores[character] ??
              makeInitialScores([character])[character]!),
            [criteria]: item.score,
          },
        }));
      });
      setReady(true);
      setUpdating(false);
    }
    if (res.data?.length === 0 && teamId !== "") setReady(true);
  }, [data, res.data, teamId]);

  // Cleanup effect: clear all pending timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach((timer) =>
        clearTimeout(timer),
      );
    };
  }, []);

  const selectedTeamData = data?.find((team) => team.id === teamId);
  const enteredScoreCount = characters.reduce(
    (count, character) =>
      count +
      criteriaList.filter((criteria) => scores[character]?.[criteria] !== 999)
        .length,
    0,
  );
  const totalScoreValue = characters.reduce(
    (sum, character) => sum + totalScore(character),
    0,
  );
  const scoreCellCount = characters.length * criteriaList.length;
  const scoreProgress = scoreCellCount
    ? Math.round((enteredScoreCount / scoreCellCount) * 100)
    : 0;

  if (isJudge) return <NotFound />;

  return sessionData?.user &&
    !isLoading &&
    data !== undefined &&
    data.length > 0 &&
    !updating ? (
    <main className="min-h-screen px-4 pb-12 pt-5 text-white sm:px-6 md:pt-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="font-rhomdon text-sm text-secondary-100 sm:text-base">
              YAKSHAGAVISHTI 2026
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Judge scoring desk
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right text-sm text-white/60 sm:block">
              {sessionData.user.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="border border-white/15 text-white hover:bg-white/10"
              aria-label="Sign out"
            >
              <LogOut />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/10 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                  Current performance
                </p>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">
                  {teamId ? teamName : "Choose a team"}
                </h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-white/60">
                  <Users className="h-4 w-4 text-secondary-100" />
                  {selectedTeamData?.Prasanga?.name ??
                    "Select a team to begin scoring"}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-secondary-100/60 bg-secondary-100 px-4 text-left font-semibold text-black shadow-lg shadow-secondary-100/10 transition hover:bg-secondary-100/90 sm:w-60">
                  <span className="truncate">
                    {teamId ? "Switch team" : "Select a team"}
                  </span>
                  <ArrowDown className="h-5 w-5 shrink-0" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-60">
                  {!isLoading && data?.length ? (
                    data.map((team) => (
                      <DropdownMenuItem
                        className="cursor-pointer text-base"
                        key={team.id}
                        onSelect={() => setTeam(team.id, team.name)}
                      >
                        {team.name}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>
                      No teams available
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-secondary-100/20 bg-secondary-100/10 p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/45">
                Score so far
              </p>
              <p className="mt-2 text-3xl font-semibold text-secondary-100 sm:text-4xl">
                {totalScoreValue}
                <span className="ml-1 text-base font-normal text-white/45">
                  / 1000
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/45">
                  Progress
                </p>
                <span className="text-sm font-semibold text-white">
                  {enteredScoreCount}/{scoreCellCount || 50}
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
                <div
                  className="h-full rounded-full bg-secondary-100 transition-[width] duration-300"
                  style={{ width: `${scoreProgress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-white/45">
                {scoreProgress === 100
                  ? "Ready to submit"
                  : "Scores save automatically"}
              </p>
            </div>
          </div>
        </section>

        {teamId && !scored && ready && !isLoading ? (
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#17142d]/80 shadow-2xl shadow-black/20">
            <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="text-lg font-semibold sm:text-xl">
                  Score the performance
                </h2>
                <p className="mt-1 text-sm text-white/50">
                  Enter a mark from 0 to 20 for each criterion.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/55">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {scoreUpdate.isPending || updatingField
                  ? "Saving latest score…"
                  : "All changes saved"}
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="sticky left-0 z-10 min-w-48 bg-[#17142d] px-6 py-5 text-left text-sm font-semibold text-white">
                      Character
                    </TableHead>
                    {criteriaDisplayList.map((criteria) => (
                      <TableHead
                        key={criteria}
                        className="min-w-32 px-3 py-5 text-center text-xs font-medium leading-tight text-white/60"
                      >
                        {criteria}
                      </TableHead>
                    ))}
                    <TableHead className="min-w-24 px-4 py-5 text-center text-sm font-semibold text-secondary-100">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {characters.map((character, i) => (
                    <TableRow
                      key={character}
                      className="border-white/10 hover:bg-white/[0.04]"
                    >
                      <TableCell className="sticky left-0 z-10 bg-[#17142d] px-6 py-4 font-medium text-white">
                        {charactersDisplay[i]}
                      </TableCell>
                      {criteriaList.map((criteria) => {
                        const fieldKey = `${character}-${criteria}`;
                        const isTyping = typingField === fieldKey;
                        const isUpdating = updatingField === fieldKey;
                        return (
                          <TableCell
                            key={criteria}
                            className="px-3 py-4 text-center"
                          >
                            <input
                              aria-label={`${charactersDisplay[i]} ${criteriaDisplayList[criteriaList.indexOf(criteria)]}`}
                              type="number"
                              inputMode="decimal"
                              step="0.1"
                              min="0"
                              max="20"
                              value={
                                scores[character]?.[criteria] === 999
                                  ? ""
                                  : scores[character]?.[criteria]
                              }
                              onChange={(e) =>
                                handleScoreChange(
                                  character,
                                  criteria,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className={`h-12 w-24 rounded-xl border bg-black/20 text-center text-lg font-semibold text-white outline-none transition focus:border-secondary-100 focus:ring-2 focus:ring-secondary-100/20 ${
                                isTyping
                                  ? "border-red-400"
                                  : isUpdating
                                    ? "border-amber-400"
                                    : "border-white/15"
                              }`}
                            />
                          </TableCell>
                        );
                      })}
                      <TableCell className="px-4 text-center text-lg font-semibold text-secondary-100">
                        {totalScore(character)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t border-secondary-100/30 bg-secondary-100/[0.08] hover:bg-secondary-100/[0.08]">
                    <TableCell className="sticky left-0 z-10 bg-[#211934] px-6 py-5 font-semibold text-white">
                      Team total
                    </TableCell>
                    {criteriaList.map((criteria) => (
                      <TableCell
                        key={criteria}
                        className="px-3 py-5 text-center font-semibold text-white/75"
                      >
                        {characters.reduce((sum, character) => {
                          const score = scores[character]?.[criteria] ?? 0;
                          return score !== 999 ? sum + score : sum;
                        }, 0)}
                      </TableCell>
                    ))}
                    <TableCell className="px-4 py-5 text-center text-xl font-bold text-secondary-100">
                      {totalScoreValue}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="space-y-4 p-4 md:hidden">
              {characters.map((character, i) => (
                <article
                  key={character}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-white">
                      {charactersDisplay[i]}
                    </h3>
                    <span className="rounded-full bg-secondary-100/15 px-3 py-1 text-sm font-semibold text-secondary-100">
                      {totalScore(character)} / 100
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {criteriaList.map((criteria, index) => {
                      const fieldKey = `${character}-${criteria}`;
                      const isTyping = typingField === fieldKey;
                      const isUpdating = updatingField === fieldKey;
                      return (
                        <label
                          key={criteria}
                          className="grid grid-cols-[1fr_92px] items-center gap-3 text-sm text-white/60"
                        >
                          <span>{criteriaDisplayList[index]}</span>
                          <input
                            aria-label={`${charactersDisplay[i]} ${criteriaDisplayList[index]}`}
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            min="0"
                            max="20"
                            value={
                              scores[character]?.[criteria] === 999
                                ? ""
                                : scores[character]?.[criteria]
                            }
                            onChange={(e) =>
                              handleScoreChange(
                                character,
                                criteria,
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className={`h-12 w-full rounded-xl border bg-black/20 text-center text-lg font-semibold text-white outline-none transition focus:border-secondary-100 focus:ring-2 focus:ring-secondary-100/20 ${
                              isTyping
                                ? "border-red-400"
                                : isUpdating
                                  ? "border-amber-400"
                                  : "border-white/15"
                            }`}
                          />
                        </label>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>

            <div className="sticky bottom-0 z-20 flex flex-col gap-3 border-t border-white/10 bg-[#121025]/95 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-2 text-sm text-white/55">
                <Check className="h-4 w-4 text-emerald-400" />
                {enteredScoreCount} of {scoreCellCount || 50} fields complete
              </div>
              <div className="flex w-full gap-3 sm:w-auto">
                <Remarks teamId={teamId} isLoading={scoreUpdate.isPending} />
                <Submit
                  scores={scores}
                  teamId={teamId}
                  teamName={teamName}
                  criteriaDisplayList={criteriaDisplayList}
                  criteriaList={criteriaList}
                  characters={characters}
                  setScored={setScored}
                  charactersDisplay={charactersDisplay}
                />
              </div>
            </div>
          </section>
        ) : scored && teamId ? (
          <section className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.08] p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-300">
                  Submission complete
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Scores submitted for {teamName}
                </h2>
                <p className="mt-2 text-sm text-white/55">
                  Select another team above when you are ready.
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                  Final total
                </p>
                <p className="mt-1 text-4xl font-semibold text-secondary-100">
                  {totalScoreValue}
                  <span className="ml-1 text-base text-white/45">/ 1000</span>
                </p>
              </div>
            </div>
          </section>
        ) : !teamId ? (
          <section className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 text-center">
            <Users className="h-8 w-8 text-secondary-100" />
            <h2 className="mt-4 text-xl font-semibold">
              Choose a team to begin
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/50">
              Select a team above. Your scores save automatically while you
              work.
            </p>
          </section>
        ) : (
          <section className="flex min-h-72 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/55">
            Loading scoring sheet…
          </section>
        )}
      </div>
    </main>
  ) : (
    <main className="flex min-h-screen items-center justify-center px-6 text-white">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.18em] text-secondary-100">
          Judge scoring desk
        </p>
        <h1 className="mt-3 text-2xl font-semibold">
          {isLoading ? "Loading teams…" : "No teams ready to judge"}
        </h1>
        <p className="mt-2 text-sm text-white/50">
          Completed and attended teams will appear here.
        </p>
      </div>
    </main>
  );
};

export default Jury;
