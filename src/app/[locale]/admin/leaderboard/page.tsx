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
    
    const { data: teamLeaderboard, isLoading: teamLoading } = api.admin.getTeamLeaderboard.useQuery(undefined, { 
        enabled: !isAdmin 
    });
    
    const { data: characterLeaderboard, isLoading: characterLoading } = api.admin.getCharacterLeaderboard.useQuery(undefined, { 
        enabled: !isAdmin 
    });

    const [activeTab, setActiveTab] = useState<"team" | "character">("team");
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [selectedCharacter, setSelectedCharacter] = useState<string>("MITRASAHA");

    const toggleRow = (key: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedRows(newExpanded);
    };

    const exportToPDF = () => {
        if (!teamLeaderboard || !characterLeaderboard) {
            alert("No data available to export");
            return;
        }

        const doc = new jsPDF();
        let yPosition = 20;

        // Title
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("Yakshagavishti Leaderboard Report", 105, yPosition, { align: "center" });
        yPosition += 15;

        // Team Leaderboard Section
        doc.setFontSize(16);
        doc.text("Team Leaderboard", 14, yPosition);
        yPosition += 5;

        const teamTableData = teamLeaderboard.map((team, index) => [
            (index + 1).toString(),
            team.teamName,
            team.collegeName,
            team.teamTotalScore.toFixed(2) + "/900",
            `${team.characterCount}/9 (${team.judgeCount} judges)`,
        ]);

        autoTable(doc, {
            startY: yPosition,
            head: [["Rank", "Team Name", "College", "Avg Score", "Characters"]],
            body: teamTableData,
            theme: "striped",
            headStyles: { fillColor: [41, 128, 185], fontStyle: "bold" },
            styles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        yPosition = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 15;

        // Character Leaderboard Section
        doc.setFontSize(16);
        if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
        }
        doc.text("Character Leaderboard - Detailed Breakdown", 14, yPosition);
        yPosition += 5;

        // Process each character
        Object.entries(characterDisplayNames).forEach(([characterKey, characterName]) => {
            const characterEntries = characterLeaderboard.filter(
                (entry) => entry.character === characterKey
            );

            if (characterEntries.length === 0) return;

            // Check if we need a new page
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }

            // Character title
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text(`${characterName} (${characterKey})`, 14, yPosition);
            yPosition += 5;

            characterEntries.forEach((entry, index) => {
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;
                }

                // Team header for this character
                doc.setFontSize(11);
                doc.setFont("helvetica", "bold");
                doc.text(
                    `${index + 1}. ${entry.teamName} - ${entry.collegeName}`,
                    18,
                    yPosition
                );
                yPosition += 5;

                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text(
                    `Average Score: ${entry.averageScore.toFixed(2)}/100 (${entry.judgeCount} judges)`,
                    18,
                    yPosition
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
                    const judgeData = entry.judgeBreakdown.map((judge: JudgeBreakdown) => {
                        const criteriaScores = Object.entries(judge.criteriaScores)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([criteria, score]) => `${criteria.replace("CRITERIA_", "C")}:${score}`)
                            .join(", ");
                        return [judge.judgeName, criteriaScores, judge.total.toFixed(2) + "/100"];
                    });

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
        });

        // Save the PDF
        const timestamp = new Date().toISOString().split("T")[0];
        doc.save(`Yakshagavishti_Leaderboard_${timestamp}.pdf`);
    };

    if (isAdmin) return <NotFound />;

    const characterDisplayNames: Record<string, string> = {
        MITRASAHA: "ಮಿತ್ರಸಹ",
        MADAYANTHI: "ಮದಯಂತಿ",
        VANAPAALAKA: "ವನಪಾಲಕ",
        DHEERGHAAKSHA: "ಧೀರ್ಘಾಕ್ಷ",
        DHOOMRAAKSHA: "ಧೂಮ್ರಾಕ್ಷ",
        VASISHTA: "ವಸಿಷ್ಠ",
        MEGHAVARNA: "ಮೇಘವರ್ಣ",
        DEVENDRA: "ದೇವೇಂದ್ರ",
        NARADA: "ನಾರದ"
    };

    return (
        <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-20 mt-20">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Leaderboard</h1>
                    <p className="text-gray-400">View team and character rankings</p>
                </div>
                <button
                    onClick={exportToPDF}
                    disabled={teamLoading || characterLoading}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Export to PDF
                </button>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "team" | "character")} className="w-full">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 ">
                    <TabsTrigger value="team" className="text-lg">Team Leaderboard</TabsTrigger>
                    <TabsTrigger value="character" className="text-lg">Character Leaderboard</TabsTrigger>
                </TabsList>

                <TabsContent value="team">
                    <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800 overflow-hidden">
                        {teamLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <ImSpinner9 className="animate-spin text-white text-4xl" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-gray-800 hover:bg-gray-800/50">
                                            <TableHead className="text-white font-bold">Rank</TableHead>
                                            <TableHead className="text-white font-bold">Team Name</TableHead>
                                            <TableHead className="text-white font-bold">College</TableHead>
                                            <TableHead className="text-white font-bold text-right">Average Score (out of 900)</TableHead>
                                            <TableHead className="text-white font-bold text-right">Characters</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {teamLeaderboard && teamLeaderboard.length > 0 ? (
                                            teamLeaderboard.map((team, index) => (
                                                <TableRow 
                                                    key={team.teamId} 
                                                    className={`border-gray-800 hover:bg-gray-800/50 transition-colors ${
                                                        index === 0 ? "bg-yellow-500/10" :
                                                        index === 1 ? "bg-gray-400/10" :
                                                        index === 2 ? "bg-orange-600/10" : ""
                                                    }`}
                                                >
                                                    <TableCell className="font-bold">
                                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                                                            index === 0 ? "bg-yellow-500 text-black" :
                                                            index === 1 ? "bg-gray-400 text-black" :
                                                            index === 2 ? "bg-orange-600 text-white" :
                                                            "bg-gray-700 text-white"
                                                        }`}>
                                                            {index + 1}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-white font-semibold">{team.teamName}</TableCell>
                                                    <TableCell className="text-gray-300">{team.collegeName}</TableCell>
                                                    <TableCell className="text-white font-bold text-right">
                                                        <div className="text-2xl">{team.teamTotalScore.toFixed(2)}</div>
                                                        <div className="text-xs text-gray-400">/900</div>
                                                    </TableCell>
                                                    <TableCell className="text-gray-300 text-right">
                                                        {team.characterCount}/9 ({team.judgeCount} judges)
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
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
                    <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800 overflow-hidden">
                        {characterLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <ImSpinner9 className="animate-spin text-white text-4xl" />
                            </div>
                        ) : (
                            <>
                                {/* Character Selector Dropdown */}
                                <div className="p-6 border-b border-gray-800">
                                    <label htmlFor="character-select" className="block text-white font-semibold mb-3">
                                        Select Character:
                                    </label>
                                    <select
                                        id="character-select"
                                        value={selectedCharacter}
                                        onChange={(e) => {
                                            setSelectedCharacter(e.target.value);
                                            setExpandedRows(new Set()); // Clear expanded rows when changing character
                                        }}
                                        className="w-full md:w-96 px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-lg"
                                    >
                                        {Object.entries(characterDisplayNames).map(([key, name]) => (
                                            <option key={key} value={key}>
                                                {name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Filtered Character Rankings */}
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-gray-800 hover:bg-gray-800/50">
                                                <TableHead className="text-white font-bold">Rank</TableHead>
                                                <TableHead className="text-white font-bold">Team Name</TableHead>
                                                <TableHead className="text-white font-bold">College</TableHead>
                                                <TableHead className="text-white font-bold text-right">Average Score (out of 100)</TableHead>
                                                <TableHead className="text-white font-bold text-right">Judges</TableHead>
                                                <TableHead className="text-white font-bold text-center">Details</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {characterLeaderboard && characterLeaderboard.length > 0 ? (
                                                (() => {
                                                    // Filter entries for selected character
                                                    const filteredEntries = characterLeaderboard.filter(
                                                        entry => entry.character === selectedCharacter
                                                    );

                                                    if (filteredEntries.length === 0) {
                                                        return (
                                                            <TableRow>
                                                                <TableCell colSpan={6} className="text-center text-gray-400 py-8">
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
                                                                    className={`border-gray-800 hover:bg-gray-800/50 transition-colors ${
                                                                        characterRank === 1 ? "bg-yellow-500/10" :
                                                                        characterRank === 2 ? "bg-gray-400/10" :
                                                                        characterRank === 3 ? "bg-orange-600/10" : ""
                                                                    }`}
                                                                >
                                                                    <TableCell className="font-bold">
                                                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                                                                            characterRank === 1 ? "bg-yellow-500 text-black" :
                                                                            characterRank === 2 ? "bg-gray-400 text-black" :
                                                                            characterRank === 3 ? "bg-orange-600 text-white" :
                                                                            "bg-gray-700 text-white"
                                                                        }`}>
                                                                            {characterRank}
                                                                        </span>
                                                                    </TableCell>
                                                                    <TableCell className="text-white font-semibold">{entry.teamName}</TableCell>
                                                                    <TableCell className="text-gray-300">{entry.collegeName}</TableCell>
                                                                    <TableCell className="text-white font-bold text-right">
                                                                        <div className="text-2xl">{entry.averageScore.toFixed(2)}</div>
                                                                        <div className="text-xs text-gray-400">/100</div>
                                                                    </TableCell>
                                                                    <TableCell className="text-gray-300 text-right">{entry.judgeCount}</TableCell>
                                                                    <TableCell className="text-center">
                                                                        <button
                                                                            onClick={() => toggleRow(rowKey)}
                                                                            className="text-white hover:text-yellow-500 transition-colors"
                                                                        >
                                                                            {isExpanded ? "▼" : "▶"}
                                                                        </button>
                                                                    </TableCell>
                                                                </TableRow>
                                                                {isExpanded && (
                                                                    <>
                                                                        <TableRow className="border-gray-800 bg-gray-800/50">
                                                                            <TableCell colSpan={6} className="py-2 px-4">
                                                                                <div className="text-white font-semibold text-sm">Average Criteria Breakdown:</div>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                        <TableRow className="border-gray-800 bg-gray-800/30">
                                                                            <TableCell colSpan={6} className="py-4">
                                                                                <div className="grid grid-cols-5 gap-4 px-4">
                                                                                    {Object.entries(entry.criteriaScores)
                                                                                        .sort(([a], [b]) => a.localeCompare(b))
                                                                                        .map(([criteria, score]) => (
                                                                                        <div key={criteria} className="bg-gray-700/50 rounded-lg p-3 text-center">
                                                                                            <div className="text-gray-400 text-sm mb-2">{criteria.replace('CRITERIA_', 'C')}</div>
                                                                                            <div className="text-white font-bold text-2xl">
                                                                                                {typeof score === 'number' ? score.toFixed(1) : '0.0'}
                                                                                            </div>
                                                                                            <div className="text-gray-400 text-xs mt-1">/20</div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                        <TableRow className="border-gray-800 bg-gray-800/50">
                                                                            <TableCell colSpan={6} className="py-2 px-4">
                                                                                <div className="text-white font-semibold text-sm">Individual Judge Scores:</div>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                        {(entry.judgeBreakdown as JudgeBreakdown[] | undefined)?.map((judge) => (
                                                                            <TableRow key={`${rowKey}-judge-${judge.judgeId}`} className="border-gray-800 bg-gray-700/20">
                                                                                <TableCell className="text-gray-400 text-sm pl-8">{judge.judgeName}</TableCell>
                                                                                <TableCell colSpan={2}>
                                                                                    <div className="flex gap-3">
                                                                                        {Object.entries(judge.criteriaScores)
                                                                                            .sort(([a], [b]) => a.localeCompare(b))
                                                                                            .map(([criteria, score]) => (
                                                                                            <div key={criteria} className="text-sm">
                                                                                                <span className="text-gray-400">{criteria.replace('CRITERIA_', 'C')}: </span>
                                                                                                <span className="text-white font-bold text-base">{score}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="text-white font-bold text-lg text-right">
                                                                                    {judge.total.toFixed(2)}
                                                                                    <span className="text-gray-400 text-sm">/100</span>
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
                                                    <TableCell colSpan={6} className="text-center text-gray-400 py-8">
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
            </Tabs>
        </div>
    );
}
