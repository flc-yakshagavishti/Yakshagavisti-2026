"use client";

import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import Image from "next/image";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    TableHeader,
} from "~/components/ui/table";
import { Switch } from "~/components/ui/switch";
import { Button } from "~/components/ui/button";
import { ImSpinner9 } from "react-icons/im";
import { useState } from "react";
import { Role } from "@prisma/client";
import NotFound from "~/app/[locale]/not-found";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: {
        finalY: number;
    };
}

export default function Admin() {
    const [verifyingId, setVerifyingId] = useState<string>("");
    const [markingAttendance, setMarkingAttendance] = useState<string>("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const { data: sessionData } = useSession();
    const isAdmin = !sessionData?.user || sessionData?.user?.role !== Role.ADMIN;
    const { data, refetch } = api.admin.getRegisteredTeams.useQuery(undefined, { enabled: !isAdmin });
    const verifyIdMutation = api.admin.verifyId.useMutation();
    const editTeamAccessMutation = api.admin.EditAccess.useMutation();
    const markAttendanceMutation = api.admin.markAttendance.useMutation();

    function verifyId(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        const userId = (e.target as HTMLElement)?.dataset?.userid;
        if (userId) {
            setVerifyingId(userId);
            verifyIdMutation.mutate(
                { userId: userId },
                {
                    onSuccess: () => {
                        setVerifyingId("");
                        refetch().catch((err) => console.log(err));
                    },
                    onError: (error) => {
                        setVerifyingId("");
                        console.error(error);
                        alert("Error reducing score");
                    },
                }
            );
        } else console.error("User ID is null or undefined");
    }
    function setEditAccess(team: string) {
        editTeamAccessMutation.mutate(
            { team },
            {
                onSuccess: () => {
                    refetch().catch((err) => console.log(err));
                },
                onError: (error) => {
                    console.error(error);
                    alert(error.message);
                },
            }
        );
    }

    function markAttendance(memberId: string, teamId: string) {
        setMarkingAttendance(memberId);
        markAttendanceMutation.mutate(
            { memberId, teamId },
            {
                onSuccess: () => {
                    setMarkingAttendance("");
                    refetch().catch((err) => console.log(err));
                },
                onError: (error) => {
                    setMarkingAttendance("");
                    console.error(error);
                    alert("Error marking attendance");
                },
            }
        );
    }

    if (isAdmin) return <NotFound />;

    if (sessionData?.user) {
        
        const sanitizeText = (text: string): string => {
            // Remove non-ASCII characters and normalize whitespace
            return text
                .replace(/[^\x00-\x7F]/g, "") // Remove non-ASCII
                .replace(/\s+/g, " ") // Normalize whitespace
                .trim();
        };

        const downloadPDF = () => {
            if (!data) {
                alert("No data available to export");
                return;
            }

            const doc = new jsPDF();
            let yPosition = 20;

            // Title
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("Registered Teams - Complete Details", 105, yPosition, { align: "center" });
            yPosition += 10;

            // Process each team
            data.forEach((team, teamIndex) => {
                if (!team.isComplete) return;

                // Check if we need a new page
                if (yPosition > 260) {
                    doc.addPage();
                    yPosition = 20;
                }

                // Team Header
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                const teamName = sanitizeText(team.name);
                doc.text(`Team ${teamIndex + 1}: ${teamName || "Team " + (teamIndex + 1)}`, 14, yPosition);
                yPosition += 6;

                // College Info
                doc.setFontSize(11);
                doc.setFont("helvetica", "normal");
                const collegeName = sanitizeText(team.College?.name ?? "N/A");
                doc.text(`College: ${collegeName || "N/A"}`, 14, yPosition);
                yPosition += 5;
                const leaderName = sanitizeText(team.Leader?.name ?? "N/A");
                doc.text(`Leader: ${leaderName || "N/A"}`, 14, yPosition);
                yPosition += 5;
                const leaderContact = team.TeamMembers.find(m => m.contact)?.contact;
                if (leaderContact) {
                    doc.text(`Contact: ${leaderContact}`, 14, yPosition);
                    yPosition += 5;
                }
                doc.text(`Attended: ${team.attended ? "Yes" : "No"}`, 14, yPosition);
                yPosition += 7;

                // Team Members Table
                const memberData = team.TeamMembers.map((member, idx) => [
                    (idx + 1).toString(),
                    sanitizeText(member.name) || "Member " + (idx + 1),
                    sanitizeText(member.Character?.character ?? "N/A") || "N/A",
                    member.contact ?? "N/A",
                    member.isIdVerified ? "Yes" : "No",
                    member.isAttended ? "Yes" : "No"
                ]);

                autoTable(doc, {
                    startY: yPosition,
                    head: [["#", "Name", "Character", "Contact", "ID Verified", "Attended"]],
                    body: memberData,
                    theme: "grid",
                    styles: { fontSize: 9, cellPadding: 2 },
                    headStyles: { fillColor: [41, 128, 185], fontStyle: "bold" },
                    columnStyles: {
                        0: { cellWidth: 10 },
                        1: { cellWidth: 40 },
                        2: { cellWidth: 40 },
                        3: { cellWidth: 30 },
                        4: { cellWidth: 25 },
                        5: { cellWidth: 25 }
                    },
                    margin: { left: 14 }
                });

                yPosition = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
            });

            // Save PDF
            const timestamp = new Date().toISOString().split("T")[0];
            doc.save(`Registered_Teams_${timestamp}.pdf`);
        }

        return (
            <>
                <div className="container px-4 sm:px-8 md:px-12 lg:px-20 pt-20">
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mt-20">
                        <Link href="/admin/leaderboard">
                            <Button className="bg-white text-black hover:bg-slate-300 cursor-pointer w-full sm:w-auto">
                                View Leaderboard
                            </Button>
                        </Link>
                        
                        <Button onClick={downloadPDF} className="bg-yellow-500 text-black hover:bg-yellow-600 cursor-pointer flex items-center gap-2 justify-center w-full sm:w-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Download PDF
                        </Button>
                    </div>

                    <h1 className="text-extrabold mt-10 text-2xl sm:text-3xl">
                        Registered Teams
                    </h1>
                    {data?.map((element, key) => (
                        <div key={key} className="my-10 px-0 sm:px-4 md:px-8 lg:px-20">
                            <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center gap-4 mb-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                                    <h1 className="text-xl sm:text-2xl break-words">Team: {element.name}</h1>
                                    {element.attended && (
                                        <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                            ✓ All Present
                                        </span>
                                    )}
                                </div>
                                {element.editRequested && <div className="flex items-center gap-2">
                                    <label htmlFor={`edit-access-${element.id}`} className="text-base sm:text-xl">
                                        Edit Access
                                    </label>
                                    <Switch
                                        checked={element.editRequested && !element.isComplete} // you'll need this boolean value from backend
                                        onCheckedChange={() => setEditAccess(element.id)}
                                        id={`edit-access-${element.id}`}
                                        className="data-[state=checked]:bg-blue-900 bg-gray-200 peer h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors"
                                    />
                                </div>}
                            </div>
                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                                <Table className="my-5 border min-w-full">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[120px]">Name</TableHead>
                                            <TableHead className="min-w-[120px]">Character</TableHead>
                                            <TableHead className="text-center min-w-[150px]">ID</TableHead>
                                            <TableHead className="text-right min-w-[100px]">
                                                Verified
                                            </TableHead>
                                            <TableHead className="text-right min-w-[120px]">
                                                Attendance
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                <TableBody>
                                    {element.TeamMembers.map((member, index) => {
                                        return (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium text-sm sm:text-base">
                                                    {member.name}
                                                </TableCell>
                                                <TableCell className="font-medium text-sm sm:text-base">
                                                    {member?.Character?.character}
                                                </TableCell>
                                                <TableCell>
                                                    {member.idURL && (
                                                        <div 
                                                            className="w-32 sm:w-48 md:w-60 self-center flex justify-self-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                                                            onClick={() => setSelectedImage(member.idURL)}
                                                            title="Click to view full size"
                                                        >
                                                            <Image
                                                                src={member.idURL}
                                                                alt="ID"
                                                                height={1000}
                                                                width={500}
                                                            />
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {!member.isIdVerified ? (
                                                        <button
                                                            className="rounded border bg-black p-2 sm:p-3 text-white text-xs sm:text-base whitespace-nowrap"
                                                            data-userid={
                                                                member.id
                                                            }
                                                            onClick={(e) =>
                                                                verifyId(e)
                                                            }
                                                        >
                                                            {(verifyingId === member.id && verifyIdMutation.isPending) ? <ImSpinner9 className="animate-spin" /> : "Verify ID"}
                                                        </button>
                                                    ) : (
                                                        <span className="text-sm sm:text-base">Verified</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {!member.isAttended ? (
                                                        <button
                                                            className="rounded border bg-blue-600 p-2 sm:p-3 text-white hover:bg-blue-700 text-xs sm:text-base whitespace-nowrap"
                                                            onClick={() =>
                                                                markAttendance(member.id, element.id)
                                                            }
                                                            disabled={markingAttendance === member.id}
                                                        >
                                                            {(markingAttendance === member.id && markAttendanceMutation.isPending) ? <ImSpinner9 className="animate-spin" /> : "Mark Present"}
                                                        </button>
                                                    ) : (
                                                        <span className="text-green-500 font-semibold text-sm sm:text-base">Present</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Full Screen Image Modal */}
                {selectedImage && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button
                            className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300 transition-colors"
                            onClick={() => setSelectedImage(null)}
                            aria-label="Close"
                        >
                            ×
                        </button>
                        <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
                            <Image
                                src={selectedImage}
                                alt="Full size ID"
                                fill
                                className="object-contain"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                )}
            </>
        );
    }
    }
