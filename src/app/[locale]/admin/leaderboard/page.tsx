"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import {
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableHeader,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Role } from "@prisma/client";
import NotFound from "~/app/[locale]/not-found";
import { ImSpinner9 } from "react-icons/im";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { setupKannadaFonts, cleanPdfText } from "~/utils/pdfFonts";

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

type JudgeBreakdown = {
  judgeId: string;
  judgeName: string;
  criteriaScores: Record<string, number>;
  total: number;
};

export default function Leaderboard() {
  const { data: sessionData } = useSession();
  const isAdmin = !sessionData?.user || sessionData?.user?.role !== Role.ADMIN;

  const { data: teamLeaderboard, isLoading: teamLoading } =
    api.admin.getTeamLeaderboard.useQuery(undefined, {
      enabled: !isAdmin,
    });

  const { data: characterLeaderboard, isLoading: characterLoading } =
    api.admin.getCharacterLeaderboard.useQuery(undefined, {
      enabled: !isAdmin,
    });

  const { data: participantLeaderboard, isLoading: participantLoading } =
    api.admin.getParticipantLeaderboard.useQuery(undefined, {
      enabled: !isAdmin,
    });

  const [activeTab, setActiveTab] = useState<
    "team" | "character" | "participant"
  >("team");
  const [participantTeam, setParticipantTeam] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedCharacter, setSelectedCharacter] = useState<string>();

  const toggleRow = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  const exportToPDF = async () => {
    if (!teamLeaderboard || !characterLeaderboard) {
      alert("No data available to export");
      return;
    }

    const doc = new jsPDF();
    const hasKannada = await setupKannadaFonts(doc);
    const font = hasKannada ? "NotoSansKannada" : "helvetica";
    let yPosition = 20;

    // Title
    doc.setFont(font, "bold");
    doc.setFontSize(20);
    doc.text("Yakshagavishti Leaderboard Report", 105, yPosition, {
      align: "center",
    });
    yPosition += 15;

    // Team Leaderboard Section
    doc.setFont(font, "bold");
    doc.setFontSize(16);
    doc.text("Team Leaderboard", 14, yPosition);
    yPosition += 5;

    const teamTableData = teamLeaderboard.map((team, index) => [
      (index + 1).toString(),
      cleanPdfText(team.teamName),
      cleanPdfText(team.collegeName),
      team.teamTotalScore.toFixed(2) + "/1000",
      `${team.characterCount}/10 (${team.judgeCount} judges)`,
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Rank", "Team Name", "College", "Avg Score", "Characters"]],
      body: teamTableData,
      theme: "striped",
      headStyles: { font, fontStyle: "bold", fillColor: [41, 128, 185] },
      styles: { font, fontStyle: "normal", fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    yPosition = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 15;

    // Character Leaderboard Section
    doc.setFont(font, "bold");
    doc.setFontSize(16);
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text("Character Leaderboard - Detailed Breakdown", 14, yPosition);
    yPosition += 5;

    // Process each character
    characterOptions.forEach(
      ({ key: characterKey, name: characterName, prasangaName }) => {
        const characterEntries = characterLeaderboard.filter(
          (entry) => `${entry.prasangaId}:${entry.character}` === characterKey,
        );

        if (characterEntries.length === 0) return;

        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        // Character title
        doc.setFont(font, "bold");
        doc.setFontSize(14);
        doc.text(`${prasangaName} - ${characterName}`, 14, yPosition);
        yPosition += 5;

        characterEntries.forEach((entry, index) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }

          // Team header for this character
          doc.setFont(font, "bold");
          doc.setFontSize(11);
          doc.text(
            `${index + 1}. ${cleanPdfText(entry.teamName)} - ${cleanPdfText(entry.collegeName)}`,
            18,
            yPosition,
          );
          yPosition += 5;

          doc.setFont(font, "normal");
          doc.setFontSize(10);
          doc.text(
            `Average Score: ${entry.averageScore.toFixed(2)}/100 (${entry.judgeCount} judges)`,
            18,
            yPosition,
          );
          yPosition += 7;

          // Criteria breakdown
          const criteriaData = Object.entries(entry.criteriaScores)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([criteria, score]) => [
              criteria.replace("CRITERIA_", "C"),
              typeof score === "number" ? score.toFixed(1) + "/20" : "0.0/20",
            ]);

          autoTable(doc, {
            startY: yPosition,
            head: [["Criteria", "Avg Score"]],
            body: criteriaData,
            theme: "grid",
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [52, 152, 219], fontSize: 9 },
            margin: { left: 22 },
            tableWidth: 80,
          });

          yPosition = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 5;

          // Judge breakdown
          if (entry.judgeBreakdown && Array.isArray(entry.judgeBreakdown)) {
            const judgeData = entry.judgeBreakdown.map(
              (judge: JudgeBreakdown) => {
                const criteriaScores = Object.entries(judge.criteriaScores)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(
                    ([criteria, score]) =>
                      `${criteria.replace("CRITERIA_", "C")}:${score}`,
                  )
                  .join(", ");
                return [
                  judge.judgeName,
                  criteriaScores,
                  judge.total.toFixed(2) + "/100",
                ];
              },
            );

            if (yPosition > 230) {
              doc.addPage();
              yPosition = 20;
            }

            autoTable(doc, {
              startY: yPosition,
              head: [["Judge", "Criteria Scores", "Total"]],
              body: judgeData,
              theme: "grid",
              styles: { fontSize: 7, cellPadding: 2 },
              headStyles: { fillColor: [46, 204, 113], fontSize: 8 },
              margin: { left: 22 },
              columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 100 },
                2: { cellWidth: 25 },
              },
            });

            yPosition = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 8;
          }
        });

        yPosition += 5;
      },
    );

    // Save the PDF
    const timestamp = new Date().toISOString().split("T")[0];
    doc.save(`Yakshagavishti_Leaderboard_${timestamp}.pdf`);
  };

  if (isAdmin) return <NotFound />;

  const characterOptions = Array.from(
    new Map(
      (characterLeaderboard ?? []).map((entry) => [
        `${entry.prasangaId}:${entry.character}`,
        {
          key: `${entry.prasangaId}:${entry.character}`,
          name: entry.character,
          prasangaName: entry.prasangaName,
        },
      ]),
    ).values(),
  );
  const selectedCharacterKey =
    selectedCharacter ?? characterOptions[0]?.key ?? "";

  return (
    <div className="container mx-auto mt-20 px-4 py-20 sm:px-6 lg:px-20">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-white">Leaderboard</h1>
          <p className="text-gray-400">View team and character rankings</p>
        </div>
        <button
          onClick={exportToPDF}
          disabled={teamLoading || characterLoading}
          className="flex items-center gap-2 rounded-lg bg-yellow-500 px-6 py-3 font-semibold text-black transition-colors hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Export to PDF
        </button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "team" | "character" | "participant")
        }
        className="w-full"
      >
        <TabsList className="mx-auto mb-8 grid h-auto w-full max-w-2xl grid-cols-1 gap-1 sm:grid-cols-3">
          <TabsTrigger value="team" className="text-lg">
            Team Leaderboard
          </TabsTrigger>
          <TabsTrigger value="character" className="text-lg">
            Character Leaderboard
          </TabsTrigger>
          <TabsTrigger value="participant" className="text-lg">
            Participants
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team">
          <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-sm">
            {teamLoading ? (
              <div className="flex h-64 items-center justify-center">
                <ImSpinner9 className="animate-spin text-4xl text-white" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-gray-800/50">
                      <TableHead className="font-bold text-white">
                        Rank
                      </TableHead>
                      <TableHead className="font-bold text-white">
                        Team Name
                      </TableHead>
                      <TableHead className="font-bold text-white">
                        College
                      </TableHead>
                      <TableHead className="text-right font-bold text-white">
                        Average Score (out of 1000)
                      </TableHead>
                      <TableHead className="text-right font-bold text-white">
                        Characters
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamLeaderboard && teamLeaderboard.length > 0 ? (
                      teamLeaderboard.map((team, index) => (
                        <TableRow
                          key={team.teamId}
                          className={`border-gray-800 transition-colors hover:bg-gray-800/50 ${
                            index === 0
                              ? "bg-yellow-500/10"
                              : index === 1
                                ? "bg-gray-400/10"
                                : index === 2
                                  ? "bg-orange-600/10"
                                  : ""
                          }`}
                        >
                          <TableCell className="font-bold">
                            <span
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                                index === 0
                                  ? "bg-yellow-500 text-black"
                                  : index === 1
                                    ? "bg-gray-400 text-black"
                                    : index === 2
                                      ? "bg-orange-600 text-white"
                                      : "bg-gray-700 text-white"
                              }`}
                            >
                              {index + 1}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold text-white">
                            {team.teamName}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {team.collegeName}
                          </TableCell>
                          <TableCell className="text-right font-bold text-white">
                            <div className="text-2xl">
                              {team.teamTotalScore.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-400">/1000</div>
                          </TableCell>
                          <TableCell className="text-right text-gray-300">
                            {team.characterCount}/10 ({team.judgeCount} judges)
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-8 text-center text-gray-400"
                        >
                          No data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="character">
          <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-sm">
            {characterLoading ? (
              <div className="flex h-64 items-center justify-center">
                <ImSpinner9 className="animate-spin text-4xl text-white" />
              </div>
            ) : (
              <>
                {/* Character Selector Dropdown */}
                <div className="border-b border-gray-800 p-6">
                  <label
                    htmlFor="character-select"
                    className="mb-3 block font-semibold text-white"
                  >
                    Select Character:
                  </label>
                  <select
                    id="character-select"
                    value={selectedCharacterKey}
                    onChange={(e) => {
                      setSelectedCharacter(e.target.value);
                      setExpandedRows(new Set()); // Clear expanded rows when changing character
                    }}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 md:w-96"
                  >
                    {characterOptions.map(({ key, name, prasangaName }) => (
                      <option key={key} value={key}>
                        {prasangaName} — {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtered Character Rankings */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableHead className="font-bold text-white">
                          Rank
                        </TableHead>
                        <TableHead className="font-bold text-white">
                          Team Name
                        </TableHead>
                        <TableHead className="font-bold text-white">
                          College
                        </TableHead>
                        <TableHead className="text-right font-bold text-white">
                          Average Score (out of 100)
                        </TableHead>
                        <TableHead className="text-right font-bold text-white">
                          Judges
                        </TableHead>
                        <TableHead className="text-center font-bold text-white">
                          Details
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {characterLeaderboard &&
                      characterLeaderboard.length > 0 ? (
                        (() => {
                          // Filter entries for selected character
                          const filteredEntries = characterLeaderboard.filter(
                            (entry) =>
                              `${entry.prasangaId}:${entry.character}` ===
                              selectedCharacterKey,
                          );

                          if (filteredEntries.length === 0) {
                            return (
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  className="py-8 text-center text-gray-400"
                                >
                                  No data available for this character
                                </TableCell>
                              </TableRow>
                            );
                          }

                          return filteredEntries.map((entry, index) => {
                            const characterRank = index + 1;
                            const rowKey = `${entry.teamId}-${entry.character}`;
                            const isExpanded = expandedRows.has(rowKey);

                            return (
                              <React.Fragment key={rowKey}>
                                <TableRow
                                  className={`border-gray-800 transition-colors hover:bg-gray-800/50 ${
                                    characterRank === 1
                                      ? "bg-yellow-500/10"
                                      : characterRank === 2
                                        ? "bg-gray-400/10"
                                        : characterRank === 3
                                          ? "bg-orange-600/10"
                                          : ""
                                  }`}
                                >
                                  <TableCell className="font-bold">
                                    <span
                                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                                        characterRank === 1
                                          ? "bg-yellow-500 text-black"
                                          : characterRank === 2
                                            ? "bg-gray-400 text-black"
                                            : characterRank === 3
                                              ? "bg-orange-600 text-white"
                                              : "bg-gray-700 text-white"
                                      }`}
                                    >
                                      {characterRank}
                                    </span>
                                  </TableCell>
                                  <TableCell className="font-semibold text-white">
                                    {entry.teamName}
                                  </TableCell>
                                  <TableCell className="text-gray-300">
                                    {entry.collegeName}
                                  </TableCell>
                                  <TableCell className="text-right font-bold text-white">
                                    <div className="text-2xl">
                                      {entry.averageScore.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      /100
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right text-gray-300">
                                    {entry.judgeCount}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <button
                                      onClick={() => toggleRow(rowKey)}
                                      className="text-white transition-colors hover:text-yellow-500"
                                    >
                                      {isExpanded ? "▼" : "▶"}
                                    </button>
                                  </TableCell>
                                </TableRow>
                                {isExpanded && (
                                  <>
                                    <TableRow className="border-gray-800 bg-gray-800/50">
                                      <TableCell
                                        colSpan={6}
                                        className="px-4 py-2"
                                      >
                                        <div className="text-sm font-semibold text-white">
                                          Average Criteria Breakdown:
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                    <TableRow className="border-gray-800 bg-gray-800/30">
                                      <TableCell colSpan={6} className="py-4">
                                        <div className="grid grid-cols-5 gap-4 px-4">
                                          {Object.entries(entry.criteriaScores)
                                            .sort(([a], [b]) =>
                                              a.localeCompare(b),
                                            )
                                            .map(([criteria, score]) => (
                                              <div
                                                key={criteria}
                                                className="rounded-lg bg-gray-700/50 p-3 text-center"
                                              >
                                                <div className="mb-2 text-sm text-gray-400">
                                                  {criteria.replace(
                                                    "CRITERIA_",
                                                    "C",
                                                  )}
                                                </div>
                                                <div className="text-2xl font-bold text-white">
                                                  {typeof score === "number"
                                                    ? score.toFixed(1)
                                                    : "0.0"}
                                                </div>
                                                <div className="mt-1 text-xs text-gray-400">
                                                  /20
                                                </div>
                                              </div>
                                            ))}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                    <TableRow className="border-gray-800 bg-gray-800/50">
                                      <TableCell
                                        colSpan={6}
                                        className="px-4 py-2"
                                      >
                                        <div className="text-sm font-semibold text-white">
                                          Individual Judge Scores:
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                    {(
                                      entry.judgeBreakdown as
                                        | JudgeBreakdown[]
                                        | undefined
                                    )?.map((judge) => (
                                      <TableRow
                                        key={`${rowKey}-judge-${judge.judgeId}`}
                                        className="border-gray-800 bg-gray-700/20"
                                      >
                                        <TableCell className="pl-8 text-sm text-gray-400">
                                          {judge.judgeName}
                                        </TableCell>
                                        <TableCell colSpan={2}>
                                          <div className="flex gap-3">
                                            {Object.entries(
                                              judge.criteriaScores,
                                            )
                                              .sort(([a], [b]) =>
                                                a.localeCompare(b),
                                              )
                                              .map(([criteria, score]) => (
                                                <div
                                                  key={criteria}
                                                  className="text-sm"
                                                >
                                                  <span className="text-gray-400">
                                                    {criteria.replace(
                                                      "CRITERIA_",
                                                      "C",
                                                    )}
                                                    :{" "}
                                                  </span>
                                                  <span className="text-base font-bold text-white">
                                                    {score}
                                                  </span>
                                                </div>
                                              ))}
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-right text-lg font-bold text-white">
                                          {judge.total.toFixed(2)}
                                          <span className="text-sm text-gray-400">
                                            /100
                                          </span>
                                        </TableCell>
                                        <TableCell colSpan={2} />
                                      </TableRow>
                                    ))}
                                  </>
                                )}
                              </React.Fragment>
                            );
                          });
                        })()
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-8 text-center text-gray-400"
                          >
                            No data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="participant">
          {participantLoading ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-gray-800 bg-gray-900/50">
              <ImSpinner9 className="animate-spin text-4xl text-white" />
            </div>
          ) : !participantLeaderboard?.length ? (
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-10 text-center text-gray-400">
              No teams yet.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quick team picker */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label
                  htmlFor="participant-team"
                  className="text-sm font-semibold text-gray-300"
                >
                  Team
                </label>
                <select
                  id="participant-team"
                  value={participantTeam}
                  onChange={(e) => setParticipantTeam(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 sm:w-80"
                >
                  <option value="all">All teams</option>
                  {participantLeaderboard.map((team) => (
                    <option key={team.teamId} value={team.teamId}>
                      {team.teamName.trim()} ({team.collegeName})
                    </option>
                  ))}
                </select>
              </div>

              {participantLeaderboard
                .filter(
                  (team) =>
                    participantTeam === "all" || team.teamId === participantTeam,
                )
                .map((team) => (
                  <div
                    key={team.teamId}
                    className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-sm"
                  >
                    <div className="flex flex-col gap-1 border-b border-gray-800 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between">
                      <h3 className="text-xl font-bold text-yellow-500">
                        {team.teamName.trim()}
                      </h3>
                      <span className="text-sm text-gray-400">
                        {team.collegeName} · {team.participants.length} participant(s)
                      </span>
                    </div>
                    {team.participants.length === 0 ? (
                      <div className="p-6 text-center text-gray-400">
                        No participants registered.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-gray-800 hover:bg-gray-800/50">
                              <TableHead className="font-bold text-white">#</TableHead>
                              <TableHead className="font-bold text-white">
                                Participant
                              </TableHead>
                              <TableHead className="font-bold text-white">
                                Character
                              </TableHead>
                              <TableHead className="text-right font-bold text-white">
                                Average (/100)
                              </TableHead>
                              <TableHead className="text-right font-bold text-white">
                                Judges
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {team.participants.map((p, index) => (
                              <TableRow
                                key={p.id}
                                className="border-gray-800 hover:bg-gray-800/50"
                              >
                                <TableCell className="font-bold text-white">
                                  {index + 1}
                                </TableCell>
                                <TableCell className="font-semibold text-white">
                                  {p.name}
                                </TableCell>
                                <TableCell className="text-gray-300">
                                  {p.character ?? "Leader"}
                                </TableCell>
                                <TableCell className="text-right text-lg font-bold text-yellow-500">
                                  {p.averageScore ?? "—"}
                                </TableCell>
                                <TableCell className="text-right text-gray-400">
                                  {p.judgeCount}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
