import React, { useEffect, useMemo, useState } from "react";
import { api } from "~/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";

function Score() {
  type TotalScores = Record<string, Record<string, number>>;

  type Name = Record<string, Record<string, string>>;

  type Team = Record<string, string>;

  const results = api.admin.getResults.useQuery();
  const characters = useMemo(
    () =>
      Array.from(
        new Map(
          results.data?.map((result) => [
            result.characterPlayed.id,
            result.characterPlayed.character,
          ]),
        ).entries(),
      ).map(([id, name]) => ({ id, name })),
    [results.data],
  );

  const initialScores: TotalScores = useMemo(() => {
    const scores = {} as TotalScores;
    characters.forEach(({ id }) => {
      scores[id] = {};
    });
    return scores;
  }, [characters]);
  const initialName: Name = {} as Name;

  const [totalScores, setTotalScores] = useState<TotalScores>(initialScores);
  const [names] = useState<Name>(initialName);
  const [, setTeams] = useState<Team>({});

  useEffect(() => {
    // Initialize an object to store the total scores for each character from each team
    const newTotalScores: TotalScores = {};

    // Initialize an array to store unique team names
    const uniqueTeams: Record<string, string> = {};
    // Loop through each result
    results.data?.forEach((result) => {
      const team: string = result.team.name;
      const characterId = result.characterPlayed.id;
      const character = result.characterPlayed.character;
      const score: number = result.score;
      const members = result.team.TeamMembers;

      // Find the member with the matching character and get their name
      const matchingMember = members.find(
        (mem) =>
          mem.characterId === characterId ||
          mem.characterName?.trim().toLowerCase() ===
            character.trim().toLowerCase(),
      );

      names[characterId] ??= {};
      // Use the matching member's name as needed
      if (matchingMember) {
        const matchingMemberName: string = matchingMember.name ?? "";
        names[characterId][team] = matchingMemberName;
      } else {
        const matchingMemberName: string = character;
        names[characterId][team] = matchingMemberName;
      }

      // If the characterID is not already in the team's scores, initialize it
      newTotalScores[characterId] ??= {};

      // If the teamID is not already in the totalScores object, initialize it
      if (!newTotalScores[characterId][team]) {
        newTotalScores[characterId][team] = 0;
        uniqueTeams[team] ??= result.teamID;
      }

      // Add the score to the total for the character
      newTotalScores[characterId][team] += score;
    });

    // Sort the inner teams in descending order for each character
    for (const [characterId, teams] of Object.entries(newTotalScores)) {
      // Sort teams for each character
      const sortedTeams = Object.fromEntries(
        Object.entries(teams).sort(([, a], [, b]) => b - a),
      );
      newTotalScores[characterId] = sortedTeams;
    }
    // Update the state with the new total scores
    setTotalScores(newTotalScores);
    setTeams(uniqueTeams);
  }, [results.data, names]);

  // const getName = (teamId: string, character: Characters) => {
  //   if(teamId !== '')
  //     name.useQuery({
  //       character: character,
  //       teamId:teamId
  //     })
  //   return "Aaron";
  // }
  const downloadCSV = () => {
    const array: string[] = [
      "Character Name",
      "Ranking",
      "Team Name",
      "Played By",
      "Score",
    ];
    const col = array.join(",") + "\n";
    const row = characters.map(({ id, name }) => {
      const row = Object.keys(totalScores[id] ?? {}).map((team, i) => {
        const row = [name, i + 1, team, name, totalScores[id]?.[team] ?? 0];
        return row.join(",");
      });
      return row.join("\n");
    });
    const csvfile = col + row.join("\n");
    const blob = new Blob([csvfile], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `character_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const check = api.admin.checkIfAllSubmitted.useQuery();

  if (results.isLoading)
    return (
      <div className="mb-[100vh] p-4 text-center text-2xl">Loading....</div>
    );

  return results.isLoading ? (
    <div>All judges have not submitted the score...</div>
  ) : (
    <div>
      <div className="flex flex-row gap-[56vw]">
        <Button
          className="my-3 flex basis-1/2 justify-start"
          onClick={downloadCSV}
        >
          Download CSV
        </Button>
        <div
          className={`my-3 flex basis-1/2 items-center justify-center rounded-3xl px-3 py-1 text-center text-2xl ${
            check.data === "Not submitted" ? "bg-red-800" : "bg-green-800"
          }`}
        >{`${
          check.data === "Not submitted" ? "Not Submitted" : "Submitted"
        }`}</div>
      </div>
      {characters.map(({ id, name }) => (
        <div key={id}>
          <div>{name}</div>
          <Table className="text-2xl">
            <TableHeader>
              <TableRow>
                <TableHead>Ranking</TableHead>
                <TableHead>Team Name</TableHead>
                <TableHead>Played By</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.keys(totalScores[id] ?? {}).map((team: string, i) => (
                <TableRow key={i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{team}</TableCell>
                  <TableCell>{names[id]?.[team] ?? ""}</TableCell>
                  <TableCell>{totalScores[id]?.[team] ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}

export default Score;
