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
import { ArrowDown } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { type NextPage } from "next";
import Remarks from "~/components/Jury/remarks";
import { Role, type Criterias, type PlayCharacters } from "@prisma/client";
import toast from "react-hot-toast";
import { signOut, useSession } from "next-auth/react";
import NotFound from "~/app/[locale]/not-found";
import { Button } from "~/components/ui/button";

const Jury: NextPage = () => {
  const criteriaList: Criterias[] = [
    "CRITERIA_1",
    "CRITERIA_2",
    "CRITERIA_3",
    "CRITERIA_4",
    "CRITERIA_5",
  ];
  const criteriaDisplayList: string[] = [
    "ಆಂಗೀಕಾಭಿನಯ (20)",
    "ವಾಚಿಕಾಭಿನಯ (20)",
    "ಜೊತೆವೇಷದೊಂದಿಗಿನ ಹೊಂದಾಣಿಕೆ (20)",
    "ರಂಗನಡೆ ಮತ್ತು ಸೃಜನಶೀಲತೆ (20)",
    "ಒಟ್ಟು ಪ್ರಸ್ತುತಿ (20)",
  ];

  type ScoresState = Record<PlayCharacters, Record<Criterias, number>>;

  const [teamName, setTeamName] = useState<string>("Select a college");
  const [teamId, setTeamId] = useState<string>("");
  const [scored, setScored] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  const characters: PlayCharacters[] = [
    "MITRASAHA",
    "MADAYANTHI",
    "VANAPAALAKA",
    "DHEERGHAAKSHA",
    "DHOOMRAAKSHA",
    "VASISHTA",
    "MEGHAVARNA",
    "DEVENDRA",
    "NARADA",
  ];
  const charactersDisplay: string[] = [
    "ಮಿತ್ರಸಹ",
    "ಮದಯಂತಿ",
    "ವನಪಾಲಕ",
    "ಧೀರ್ಘಾಕ್ಷ",
    "ಧೂಮ್ರಾಕ್ಷ",
    "ವಸಿಷ್ಠ",
    "ಮೇಘವರ್ಣ",
    "ದೇವೇಂದ್ರ",
    "ನಾರದ",
  ];

  const { data: sessionData } = useSession();
  const isJudge = !sessionData?.user || sessionData?.user?.role !== Role.JUDGE;

  const scoreUpdate = api.jury.updateScores.useMutation();
  const { data, isLoading } = api.jury.getTeams.useQuery(undefined, {
    enabled: !isJudge,
  });

  // Initialize scores with all values set to 0
  const initialScores: ScoresState = {} as ScoresState;

  characters.forEach((character) => {
    initialScores[character] = {} as ScoresState[PlayCharacters];

    criteriaList.forEach((criteria) => {
      initialScores[character][criteria] = 999;
    });
  });

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
    character: PlayCharacters,
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
    setScores((prevScores) => ({
      ...prevScores,
      [character]: {
        ...prevScores[character],
        [criteria]: value,
      },
    }));

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
    if (scores[character as PlayCharacters] != null) {
      const keys = Object.keys(scores[character as PlayCharacters]);
      let sum = 0;
      keys.forEach((key) => {
        if (scores[character as PlayCharacters][key as Criterias] !== 999)
          sum += scores[character as PlayCharacters][key as Criterias];
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
    setScores(initialScores);
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
        const character = item.characterPlayed.character;
        const criteria = item.criteria.name;
        // Update the scores state with the new value
        setScores((prevScores) => ({
          ...prevScores,
          [character]: {
            ...prevScores[character],
            [criteria]: item.score,
          },
        }));
      });
      setReady(true);
      setUpdating(false);
    }
    if (res.data?.length === 0 && teamId !== "") setReady(true);
  }, [res.data, teamId]);

  // Cleanup effect: clear all pending timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach((timer) =>
        clearTimeout(timer),
      );
    };
  }, []);

  if (isJudge) return <NotFound />;

  return sessionData?.user &&
    !isLoading &&
    data !== undefined &&
    data.length > 0 &&
    !updating ? (
    <div className="container mb-10 mt-[4.75rem] flex w-full flex-col sm:mt-[5.75rem] md:mt-24 lg:mt-[6.25rem]">
      <div className="flex flex-row items-center justify-center gap-4">
        <h1 className="text-center text-5xl">ಸ್ವಾಗತ {sessionData.user.name}</h1>
        <Button variant="destructive" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
      <div className="mt-10 flex flex-row items-center justify-evenly pb-2">
        <h1 className="text-extrabold flex basis-1/2 justify-start text-4xl">
          Judge Dashboard - <span className="text-5xl">{teamName}</span>
        </h1>
        <h1 className="flex basis-1/2 justify-end text-3xl">
          {sessionData?.user.name}
        </h1>
      </div>
      <div className="m-2 flex w-full flex-col text-center md:flex-row">
        <div className="flex basis-1/2 justify-start">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex flex-row items-center gap-3 rounded-lg bg-white p-2 text-center text-black">
              <div className="text-2xl md:text-xl">Select a team</div>
              <ArrowDown />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {!isLoading ? (
                data?.map((team) => (
                  <DropdownMenuItem
                    className="text-xl"
                    key={team.id}
                    onSelect={() => setTeam(team.id, team.name)}
                  >
                    {team.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem className="text-xl">
                  No teams
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Remarks teamId={teamId} isLoading={scoreUpdate.isPending} />
      </div>
      {teamName !== "Select a college" && !scored && ready && !isLoading ? (
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="w-full rounded-lg border">
            <Table>
              <TableHeader className="invisible align-middle md:visible">
                <TableRow className="text-center text-xl">
                  <TableHead className="text-center">ಪಾತ್ರಗಳು</TableHead>
                  {criteriaDisplayList.map((criteria, i) => (
                    <TableHead key={i} className="text-center">
                      {criteria}
                    </TableHead>
                  ))}
                  <TableHead>ಒಟ್ಟು</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xl">
                {characters.map((character, i) => (
                  <TableRow key={i} className="text-center">
                    <TableCell className="md:m-0">
                      {charactersDisplay[i]}
                    </TableCell>
                    {criteriaList.map((criteria, j) => {
                      const fieldKey = `${character}-${criteria}`;
                      const isTyping = typingField === fieldKey;
                      const isUpdating = updatingField === fieldKey;

                      return (
                        <TableCell key={j}>
                          <input
                            type="number"
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
                            className={`w-24 rounded-lg border-2 bg-transparent text-center outline-none transition-colors ${
                              isTyping
                                ? `border-red-500 ring-2 ring-red-500/30`
                                : isUpdating
                                  ? `border-yellow-500 ring-2 ring-yellow-500/30`
                                  : `border-green-600`
                            }`}
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell>{totalScore(character)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="text-center font-extrabold text-xl">
                  <TableCell>ಒಟ್ಟು ಸ್ಕೋರ್</TableCell>
                  {criteriaList.map((criteria, i) => {
                  const total = characters.reduce((sum, character) => {
                    const score = scores[character]?.[criteria];
                    return score !== 999 ? sum + score : sum;
                  }, 0);
                  return (
                    <TableCell key={i}>{total}</TableCell>
                  );
                  })}
                  <TableCell>
                  {characters.reduce((sum, character) => sum + totalScore(character), 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            {/* <div className="mt-6 flex justify-center">
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
            </div> */}
          </div>
        </div>
      ) : scored ? (
        <div className="container h-full">
          <div className="h-full w-full">
            <div className="my-10 flex justify-center text-center text-2xl">
              ತೀರ್ಪಿಗಾಗಿ ಧನ್ಯವಾದಗಳು. ಇನ್ನೊಂದು ತಂಡವನ್ನು ನೀವು ಈಗ ಆಯ್ಕೆ
              ಮಾಡಿಕೊಳ್ಳಬಹುದು!
            </div>
          </div>
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="w-full">
              <Table>
                <TableHeader className="invisible align-middle md:visible">
                  <TableRow className="text-center text-xl">
                    <TableHead className="text-center">ಪಾತ್ರಗಳು</TableHead>
                    {criteriaDisplayList.map((criteria, i) => (
                      <TableHead key={i} className="text-center">
                        {criteriaDisplayList[i]}
                      </TableHead>
                    ))}
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xl">
                  {characters.map((character, i) => (
                    <TableRow key={i} className="text-center">
                      <TableCell className="md:m-0">{character}</TableCell>
                      {criteriaList.map((criteria, j) => (
                        <TableCell key={j}>
                          {scores[character]?.[criteria]}
                        </TableCell>
                      ))}
                      <TableCell>{totalScore(character)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      ) : !ready && teamName === "Select a college" && !scored && !updating ? (
        <>
          <div className="m-4 mb-96 flex h-full justify-center p-4 text-center text-2xl">
            Please select a team....
          </div>
        </>
      ) : (
        <>
          <div className="m-4 mb-[100vw] flex justify-center p-4 text-center text-2xl">
            Loading Scores....
          </div>
        </>
      )}
    </div>
  ) : (
    <div className="container py-40">
      <div className="h-full w-full space-y-36">
        <div className="flex flex-row items-center justify-center gap-4">
          <h1 className="text-center text-5xl">
            ಸ್ವಾಗತ {sessionData.user.name}
          </h1>
          <Button variant="destructive" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>

        <div className="mb-[100vh] flex justify-center text-center text-2xl">
          {isLoading ? "Loading..." : "No teams to judge at the moment...."}
        </div>
      </div>
    </div>
  );
};

export default Jury;
