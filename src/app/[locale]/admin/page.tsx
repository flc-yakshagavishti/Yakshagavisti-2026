"use client";

import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Role } from "@prisma/client";
import NotFound from "~/app/[locale]/not-found";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

import { ImSpinner9 } from "react-icons/im";
import {
  Users,
  Building2,
  ShieldCheck,
  Award,
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserPlus,
  ShieldAlert,
  X,
  ExternalLink,
} from "lucide-react";

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export default function Admin() {
  const { data: sessionData } = useSession();
  const isAdmin = !sessionData?.user || sessionData?.user?.role !== Role.ADMIN;

  // --- Queries ---
  const { data: teams, refetch: refetchTeams } =
    api.admin.getRegisteredTeams.useQuery(undefined, { enabled: !isAdmin });

  const { data: colleges, refetch: refetchColleges } =
    api.admin.getColleges.useQuery(undefined, { enabled: !isAdmin });

  const { data: admins, refetch: refetchAdmins } = api.admin.getAdmins.useQuery(
    undefined,
    { enabled: !isAdmin },
  );

  const { data: judges, refetch: refetchJudges } = api.admin.getJudges.useQuery(
    undefined,
    { enabled: !isAdmin },
  );

  // --- Mutations ---
  const verifyIdMutation = api.admin.verifyId.useMutation();
  const editTeamAccessMutation = api.admin.EditAccess.useMutation();
  const markAttendanceMutation = api.admin.markAttendance.useMutation();
  const updateTeamNameMutation = api.admin.updateTeamName.useMutation();

  const addCollegeMutation = api.admin.addCollege.useMutation();
  const updateCollegeMutation = api.admin.updateCollege.useMutation();
  const deleteCollegeMutation = api.admin.deleteCollege.useMutation();

  const addAdminMutation = api.admin.addAdmin.useMutation();
  const removeAdminMutation = api.admin.removeAdmin.useMutation();

  const addJudgeMutation = api.admin.addJudge.useMutation();
  const removeJudgeMutation = api.admin.removeJudge.useMutation();

  // --- UI States ---
  const [verifyingId, setVerifyingId] = useState<string>("");
  const [markingAttendance, setMarkingAttendance] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Filters & Search
  const [teamSearch, setTeamSearch] = useState("");
  const [collegeSearch, setCollegeSearch] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [judgeSearch, setJudgeSearch] = useState("");

  // Edit Team Modal
  const [editingTeam, setEditingTeam] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newTeamName, setNewTeamName] = useState("");

  // College Dialog State
  const [collegeModalOpen, setCollegeModalOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState<{
    id?: string;
    name: string;
    details?: string;
    password?: string;
  } | null>(null);

  // Admin Dialog State
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");

  // Judge Dialog State
  const [judgeModalOpen, setJudgeModalOpen] = useState(false);
  const [judgeEmail, setJudgeEmail] = useState("");
  const [judgeName, setJudgeName] = useState("");

  if (isAdmin) return <NotFound />;

  // --- Handlers ---
  function verifyId(userId: string) {
    setVerifyingId(userId);
    verifyIdMutation.mutate(
      { userId },
      {
        onSuccess: () => {
          setVerifyingId("");
          refetchTeams().catch(console.error);
        },
        onError: (error) => {
          setVerifyingId("");
          alert(error.message || "Error verifying ID");
        },
      },
    );
  }

  function setEditAccess(teamId: string) {
    editTeamAccessMutation.mutate(
      { team: teamId },
      {
        onSuccess: () => {
          refetchTeams().catch(console.error);
        },
        onError: (error) => {
          alert(error.message);
        },
      },
    );
  }

  function markAttendance(memberId: string, teamId: string) {
    setMarkingAttendance(memberId);
    markAttendanceMutation.mutate(
      { memberId, teamId },
      {
        onSuccess: () => {
          setMarkingAttendance("");
          refetchTeams().catch(console.error);
        },
        onError: (error) => {
          setMarkingAttendance("");
          alert(error.message || "Error marking attendance");
        },
      },
    );
  }

  function handleUpdateTeamName() {
    if (!editingTeam || !newTeamName.trim()) return;
    updateTeamNameMutation.mutate(
      { teamId: editingTeam.id, name: newTeamName.trim() },
      {
        onSuccess: () => {
          setEditingTeam(null);
          setNewTeamName("");
          refetchTeams().catch(console.error);
        },
        onError: (error) => {
          alert(error.message);
        },
      },
    );
  }

  function handleSaveCollege() {
    if (!editingCollege?.name.trim()) return;

    if (editingCollege.id) {
      updateCollegeMutation.mutate(
        {
          id: editingCollege.id,
          name: editingCollege.name.trim(),
          details: editingCollege.details,
          password: editingCollege.password,
        },
        {
          onSuccess: () => {
            setCollegeModalOpen(false);
            setEditingCollege(null);
            refetchColleges().catch(console.error);
          },
          onError: (error) => alert(error.message),
        },
      );
    } else {
      addCollegeMutation.mutate(
        {
          name: editingCollege.name.trim(),
          details: editingCollege.details,
          password: editingCollege.password,
        },
        {
          onSuccess: () => {
            setCollegeModalOpen(false);
            setEditingCollege(null);
            refetchColleges().catch(console.error);
          },
          onError: (error) => alert(error.message),
        },
      );
    }
  }

  function handleDeleteCollege(collegeId: string) {
    if (!confirm("Are you sure you want to delete this college?")) return;
    deleteCollegeMutation.mutate(
      { id: collegeId },
      {
        onSuccess: () => {
          void refetchColleges();
        },
        onError: (error) => alert(error.message),
      },
    );
  }

  function handleAddAdmin() {
    if (!adminEmail.trim()) return;
    addAdminMutation.mutate(
      { email: adminEmail.trim(), name: adminName.trim() ? adminName.trim() : undefined },
      {
        onSuccess: () => {
          setAdminModalOpen(false);
          setAdminEmail("");
          setAdminName("");
          void refetchAdmins();
        },
        onError: (error) => alert(error.message),
      },
    );
  }

  function handleRemoveAdmin(userId: string, name: string) {
    if (
      !confirm(`Are you sure you want to remove admin privileges for ${name}?`)
    )
      return;
    removeAdminMutation.mutate(
      { userId },
      {
        onSuccess: () => {
          void refetchAdmins();
        },
        onError: (error) => alert(error.message),
      },
    );
  }

  function handleAddJudge() {
    if (!judgeEmail.trim()) return;
    addJudgeMutation.mutate(
      { email: judgeEmail.trim(), name: judgeName.trim() ? judgeName.trim() : undefined },
      {
        onSuccess: () => {
          setJudgeModalOpen(false);
          setJudgeEmail("");
          setJudgeName("");
          void refetchJudges();
        },
        onError: (error) => alert(error.message),
      },
    );
  }

  function handleRemoveJudge(userId: string, name: string) {
    if (!confirm(`Are you sure you want to remove judge status for ${name}?`))
      return;
    removeJudgeMutation.mutate(
      { userId },
      {
        onSuccess: () => {
          void refetchJudges();
        },
        onError: (error) => alert(error.message),
      },
    );
  }

  // --- Export PDF ---
  const sanitizeText = (text: string): string => {
    return text
      .replace(/[^\x00-\x7F]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const downloadPDF = () => {
    if (!teams) {
      alert("No data available to export");
      return;
    }

    const doc = new jsPDF();
    let yPosition = 20;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Yakshagavishti 2026 - Registered Teams Details", 105, yPosition, {
      align: "center",
    });
    yPosition += 10;

    teams.forEach((team, teamIndex) => {
      if (!team.isComplete) return;

      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const teamName = sanitizeText(team.name);
      doc.text(
        `Team ${teamIndex + 1}: ${teamName ? teamName : "Team " + (teamIndex + 1)}`,
        14,
        yPosition,
      );
      yPosition += 6;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const collegeName = sanitizeText(team.College?.name ?? "N/A");
      doc.text(`College: ${collegeName ? collegeName : "N/A"}`, 14, yPosition);
      yPosition += 5;
      const leaderName = sanitizeText(team.Leader?.name ?? "N/A");
      doc.text(`Leader: ${leaderName ? leaderName : "N/A"}`, 14, yPosition);
      yPosition += 5;
      const leaderContact = team.TeamMembers.find((m) => m.contact)?.contact;
      if (leaderContact) {
        doc.text(`Contact: ${leaderContact}`, 14, yPosition);
        yPosition += 5;
      }
      doc.text(`Attended: ${team.attended ? "Yes" : "No"}`, 14, yPosition);
      yPosition += 7;

      const memberData = team.TeamMembers.map((member, idx) => [
        (idx + 1).toString(),
        sanitizeText(member.name) ? sanitizeText(member.name) : "Member " + (idx + 1),
        sanitizeText(member.Character?.character ?? "N/A") ? sanitizeText(member.Character?.character ?? "N/A") : "N/A",
        member.contact ?? "N/A",
        member.isIdVerified ? "Yes" : "No",
        member.isAttended ? "Yes" : "No",
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [
          ["#", "Name", "Character", "Contact", "ID Verified", "Attended"],
        ],
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
          5: { cellWidth: 25 },
        },
        margin: { left: 14 },
      });

      yPosition = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
    });

    const timestamp = new Date().toISOString().split("T")[0];
    doc.save(`Registered_Teams_${timestamp}.pdf`);
  };

  // --- Filtered Data ---
  const filteredTeams = teams?.filter(
    (t) =>
      t.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
      (t.College?.name
        ? t.College.name.toLowerCase().includes(teamSearch.toLowerCase())
        : false) ||
      (t.Leader?.name
        ? t.Leader.name.toLowerCase().includes(teamSearch.toLowerCase())
        : false),
  );

  const filteredColleges = colleges?.filter(
    (c) =>
      c.name.toLowerCase().includes(collegeSearch.toLowerCase()) ||
      (c.details
        ? c.details.toLowerCase().includes(collegeSearch.toLowerCase())
        : false),
  );

  const filteredAdmins = admins?.filter(
    (a) =>
      a.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
      a.email.toLowerCase().includes(adminSearch.toLowerCase()),
  );

  const filteredJudges = judges?.filter(
    (j) =>
      j.User.name.toLowerCase().includes(judgeSearch.toLowerCase()) ||
      j.User.email.toLowerCase().includes(judgeSearch.toLowerCase()),
  );

  // Counters
  const totalTeams = teams?.length ?? 0;
  const attendedTeams = teams?.filter((t) => t.attended).length ?? 0;
  const totalColleges = colleges?.length ?? 0;
  const totalAdminsCount = admins?.length ?? 0;
  const totalJudgesCount = judges?.length ?? 0;

  return (
    <div className="min-h-screen px-4 pb-20 pt-28 text-white sm:px-8 md:px-12 lg:px-16">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Section */}
        <div className="flex flex-col justify-between gap-6 rounded-2xl border border-[rgba(41,47,82,0.6)] bg-[rgba(41,47,82,0.35)] p-6 shadow-xl backdrop-blur-md md:flex-row md:items-center md:p-8">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="rounded-full border border-secondary-200/30 bg-secondary-200/10 px-3 py-1 text-xs font-semibold text-secondary-100">
                Yakshagavishti 2026
              </span>
              <span className="rounded-full border border-purple-500/20 bg-[rgba(48,21,75,0.6)] px-3 py-1 text-xs font-semibold text-purple-300">
                Admin Control Center
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-white/50 sm:text-base">
              Manage teams, verify participant IDs, update colleges, and
              provision OAuth access.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/leaderboard">
              <Button className="flex items-center gap-2 rounded-xl border border-[rgba(41,47,82,0.8)] bg-[rgba(41,47,82,0.7)] px-4 py-2 font-medium text-white transition-all hover:bg-[rgba(41,47,82,1)]">
                <Award className="h-4 w-4 text-secondary-100" />
                Leaderboard
              </Button>
            </Link>

            <Button
              onClick={downloadPDF}
              className="flex items-center gap-2 rounded-xl bg-secondary-200 px-4 py-2 font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600"
            >
              <Download className="h-4 w-4" />
              Download Teams PDF
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-5">
          <div className="rounded-xl border border-[rgba(41,47,82,0.5)] bg-[rgba(41,47,82,0.3)] p-5">
            <div className="mb-2 flex items-center justify-between text-white/50">
              <span className="text-xs font-medium uppercase tracking-wider">
                Registered Teams
              </span>
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white sm:text-3xl">
              {totalTeams}
            </div>
            <div className="mt-1 text-xs text-white/40">
              {attendedTeams} Present on field
            </div>
          </div>

          <div className="rounded-xl border border-[rgba(41,47,82,0.5)] bg-[rgba(41,47,82,0.3)] p-5">
            <div className="mb-2 flex items-center justify-between text-white/50">
              <span className="text-xs font-medium uppercase tracking-wider">
                Attended Teams
              </span>
              <UserCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 sm:text-3xl">
              {attendedTeams}
            </div>
            <div className="mt-1 text-xs text-white/40">
              Verified attendance
            </div>
          </div>

          <div className="rounded-xl border border-[rgba(41,47,82,0.5)] bg-[rgba(41,47,82,0.3)] p-5">
            <div className="mb-2 flex items-center justify-between text-white/50">
              <span className="text-xs font-medium uppercase tracking-wider">
                Colleges
              </span>
              <Building2 className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white sm:text-3xl">
              {totalColleges}
            </div>
            <div className="mt-1 text-xs text-white/40">Institutions</div>
          </div>

          <div className="rounded-xl border border-[rgba(41,47,82,0.5)] bg-[rgba(41,47,82,0.3)] p-5">
            <div className="mb-2 flex items-center justify-between text-white/50">
              <span className="text-xs font-medium uppercase tracking-wider">
                Admin Accounts
              </span>
              <ShieldCheck className="h-4 w-4 text-secondary-100" />
            </div>
            <div className="text-2xl font-bold text-white sm:text-3xl">
              {totalAdminsCount}
            </div>
            <div className="mt-1 text-xs text-white/40">
              Google OAuth authed
            </div>
          </div>

          <div className="col-span-2 rounded-xl border border-[rgba(41,47,82,0.5)] bg-[rgba(41,47,82,0.3)] p-5 lg:col-span-1">
            <div className="mb-2 flex items-center justify-between text-white/50">
              <span className="text-xs font-medium uppercase tracking-wider">
                Judges
              </span>
              <Award className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white sm:text-3xl">
              {totalJudgesCount}
            </div>
            <div className="mt-1 text-xs text-white/40">
              Scoring jury members
            </div>
          </div>
        </div>

        {/* Tabbed Admin Interface */}
        <Tabs defaultValue="teams" className="w-full space-y-6">
          {/* Custom tab buttons - avoids layout issues with Radix TabsList inline-flex base */}
          <TabsList className="flex h-auto w-full flex-wrap gap-1.5 rounded-xl border border-[rgba(41,47,82,0.7)] bg-[rgba(41,47,82,0.4)] p-1.5">
            <TabsTrigger
              value="teams"
              className="flex min-w-[140px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-all hover:text-white data-[state=active]:bg-secondary-200 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-orange-500/20"
            >
              <Users className="h-4 w-4 shrink-0" />
              <span>Teams & Attendance</span>
            </TabsTrigger>
            <TabsTrigger
              value="colleges"
              className="flex min-w-[120px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-all hover:text-white data-[state=active]:bg-secondary-200 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-orange-500/20"
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span>Colleges ({totalColleges})</span>
            </TabsTrigger>
            <TabsTrigger
              value="admins"
              className="flex min-w-[140px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-all hover:text-white data-[state=active]:bg-secondary-200 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-orange-500/20"
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Admin Accounts</span>
            </TabsTrigger>
            <TabsTrigger
              value="judges"
              className="flex min-w-[120px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-all hover:text-white data-[state=active]:bg-secondary-200 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-orange-500/20"
            >
              <Award className="h-4 w-4 shrink-0" />
              <span>Judges ({totalJudgesCount})</span>
            </TabsTrigger>
          </TabsList>

          {/* ==================== TAB 1: TEAMS ==================== */}
          <TabsContent value="teams" className="space-y-6">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  type="text"
                  placeholder="Search teams or colleges..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="rounded-xl border-[rgba(41,47,82,0.7)] bg-[rgba(41,47,82,0.4)] pl-9 text-white placeholder:text-white/30 focus:border-secondary-200 focus:ring-secondary-200"
                />
              </div>
              <span className="text-xs text-white/40">
                Showing {filteredTeams?.length ?? 0} of {totalTeams} teams
              </span>
            </div>

            <div className="space-y-6">
              {filteredTeams?.map((element) => (
                <div
                  key={element.id}
                  className="space-y-4 rounded-2xl border border-[rgba(41,47,82,0.55)] bg-[rgba(41,47,82,0.25)] p-5 shadow-lg transition-colors hover:border-secondary-200/30 sm:p-6"
                >
                  {/* Team Top Card Header */}
                  <div className="flex flex-col justify-between gap-4 border-b border-[rgba(41,47,82,0.7)] pb-4 md:flex-row md:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl">
                          Team: {element.name}
                          <button
                            onClick={() => {
                              setEditingTeam({
                                id: element.id,
                                name: element.name,
                              });
                              setNewTeamName(element.name);
                            }}
                            className="rounded p-1 text-white/40 transition-colors hover:text-secondary-100"
                            title="Edit Team Name"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </h2>

                        {element.attended ? (
                          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> All Present
                          </span>
                        ) : (
                          <span className="rounded-full border border-[rgba(41,47,82,0.7)] bg-[rgba(41,47,82,0.5)] px-3 py-1 text-xs font-medium text-white/50">
                            Pending Attendance
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-4 text-sm text-white/50">
                        <span>
                          <strong className="text-white/70">College:</strong>{" "}
                          {element.College?.name ?? "Unassigned"}
                        </span>
                        {element.Leader?.name && (
                          <span>
                            <strong className="text-white/70">Leader:</strong>{" "}
                            {element.Leader.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {element.editRequested && (
                      <div className="flex items-center gap-3 rounded-xl border border-[rgba(41,47,82,0.8)] bg-[rgba(41,47,82,0.5)] px-4 py-2">
                        <Label
                          htmlFor={`edit-access-${element.id}`}
                          className="cursor-pointer text-sm font-medium text-white/80"
                        >
                          Allow Edit Access
                        </Label>
                        <Switch
                          checked={element.editRequested && !element.isComplete}
                          onCheckedChange={() => setEditAccess(element.id)}
                          id={`edit-access-${element.id}`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Team Members Table */}
                  <div className="overflow-x-auto">
                    <Table className="w-full">
                      <TableHeader className="bg-[rgba(8,11,30,0.5)]">
                        <TableRow className="border-[rgba(41,47,82,0.5)] hover:bg-transparent">
                          <TableHead className="font-semibold text-white/50">
                            Participant Name
                          </TableHead>
                          <TableHead className="font-semibold text-white/50">
                            Character
                          </TableHead>
                          <TableHead className="text-center font-semibold text-white/50">
                            ID Card Proof
                          </TableHead>
                          <TableHead className="text-right font-semibold text-white/50">
                            Verification
                          </TableHead>
                          <TableHead className="text-right font-semibold text-white/50">
                            Attendance
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {element.TeamMembers.map((member) => (
                          <TableRow
                            key={member.id}
                            className="border-[rgba(41,47,82,0.4)] hover:bg-[rgba(41,47,82,0.2)]"
                          >
                            <TableCell className="font-medium text-white/90">
                              {member.name}
                              {member.contact && (
                                <span className="mt-0.5 block text-xs text-white/40">
                                  {member.contact}
                                </span>
                              )}
                            </TableCell>

                            <TableCell className="text-sm font-medium text-secondary-100">
                              {member.Character?.character ?? "N/A"}
                            </TableCell>

                            <TableCell className="text-center">
                              {member.idURL ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedImage(member.idURL)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-200/20 bg-secondary-200/10 px-3 py-1.5 text-xs text-secondary-100 transition-all hover:text-secondary-200"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" /> View
                                  ID Card
                                </button>
                              ) : (
                                <span className="text-xs text-white/30">
                                  No Image
                                </span>
                              )}
                            </TableCell>

                            <TableCell className="text-right">
                              {!member.isIdVerified ? (
                                <Button
                                  size="sm"
                                  onClick={() => verifyId(member.id)}
                                  disabled={
                                    verifyingId === member.id &&
                                    verifyIdMutation.isPending
                                  }
                                  className="border border-[rgba(41,47,82,0.8)] bg-[rgba(41,47,82,0.7)] text-xs text-white hover:bg-[rgba(41,47,82,1)]"
                                >
                                  {verifyingId === member.id &&
                                  verifyIdMutation.isPending ? (
                                    <ImSpinner9 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "Verify ID"
                                  )}
                                </Button>
                              ) : (
                                <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                                  Verified ✓
                                </span>
                              )}
                            </TableCell>

                            <TableCell className="text-right">
                              {!member.isAttended ? (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    markAttendance(member.id, element.id)
                                  }
                                  disabled={
                                    markingAttendance === member.id &&
                                    markAttendanceMutation.isPending
                                  }
                                  className="bg-blue-600 text-xs text-white hover:bg-blue-500"
                                >
                                  {markingAttendance === member.id &&
                                  markAttendanceMutation.isPending ? (
                                    <ImSpinner9 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "Mark Present"
                                  )}
                                </Button>
                              ) : (
                                <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                                  Present ✓
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}

              {filteredTeams?.length === 0 && (
                <div className="rounded-xl border border-[rgba(41,47,82,0.4)] bg-[rgba(41,47,82,0.15)] py-12 text-center text-white/40">
                  No teams matched your search.
                </div>
              )}
            </div>
          </TabsContent>

          {/* ==================== TAB 2: COLLEGES ==================== */}
          <TabsContent value="colleges" className="space-y-6">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  type="text"
                  placeholder="Search colleges..."
                  value={collegeSearch}
                  onChange={(e) => setCollegeSearch(e.target.value)}
                  className="rounded-xl border-[rgba(41,47,82,0.7)] bg-[rgba(41,47,82,0.4)] pl-9 text-white placeholder:text-white/30 focus:border-secondary-200 focus:ring-secondary-200"
                />
              </div>

              <Button
                onClick={() => {
                  setEditingCollege({
                    name: "",
                    details: "",
                    password: "hello",
                  });
                  setCollegeModalOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-xl border border-purple-500/30 bg-[rgba(48,21,75,0.8)] px-4 py-2 font-medium text-white hover:bg-[rgba(48,21,75,1)] sm:w-auto"
              >
                <Plus className="h-4 w-4" /> Add New College
              </Button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[rgba(41,47,82,0.5)] bg-[rgba(41,47,82,0.2)] shadow-lg">
              <Table>
                <TableHeader className="bg-[rgba(8,11,30,0.5)]">
                  <TableRow className="border-[rgba(41,47,82,0.5)]">
                    <TableHead className="font-semibold text-white/50">
                      College Name
                    </TableHead>
                    <TableHead className="font-semibold text-white/50">
                      Details / Code
                    </TableHead>
                    <TableHead className="font-semibold text-white/50">
                      Password
                    </TableHead>
                    <TableHead className="font-semibold text-white/50">
                      Assigned Team
                    </TableHead>
                    <TableHead className="text-right font-semibold text-white/50">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredColleges?.map((college) => (
                    <TableRow
                      key={college.id}
                      className="border-[rgba(41,47,82,0.4)] hover:bg-[rgba(41,47,82,0.2)]"
                    >
                      <TableCell className="font-semibold text-white">
                        {college.name}
                      </TableCell>
                      <TableCell className="text-sm text-white/50">
                        {college.details ?? "N/A"}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-white/70">
                        {college.password ?? "—"}
                      </TableCell>
                      <TableCell>
                        {college.Team ? (
                          <span className="rounded-md border border-secondary-200/20 bg-secondary-200/10 px-2.5 py-1 text-xs font-semibold text-secondary-100">
                            {college.Team.name}
                          </span>
                        ) : (
                          <span className="text-xs text-white/30">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingCollege({
                              id: college.id,
                              name: college.name,
                              details: college.details ?? "",
                              password: college.password ?? "",
                            });
                            setCollegeModalOpen(true);
                          }}
                          className="text-white/60 hover:bg-[rgba(41,47,82,0.5)] hover:text-secondary-100"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCollege(college.id)}
                          className="text-white/40 hover:bg-[rgba(41,47,82,0.5)] hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredColleges?.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-white/40"
                      >
                        No colleges found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ==================== TAB 3: ADMIN ACCOUNTS ==================== */}
          <TabsContent value="admins" className="space-y-6">
            <div className="flex items-start gap-3 rounded-xl border border-secondary-200/20 bg-secondary-200/10 p-4">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-secondary-100" />
              <div className="text-sm text-white/70">
                <strong className="block font-semibold text-secondary-100">
                  Google OAuth Authentication Provisioning
                </strong>
                Enter the email address of the person you want to authorize as
                an Admin. If they haven&apos;t logged in yet, a pre-registered
                account will be created. When they sign in with Google using
                that email, they will automatically be granted full Admin
                permissions.
              </div>
            </div>

            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  type="text"
                  placeholder="Search admin accounts..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="rounded-xl border-[rgba(41,47,82,0.7)] bg-[rgba(41,47,82,0.4)] pl-9 text-white placeholder:text-white/30 focus:border-secondary-200 focus:ring-secondary-200"
                />
              </div>

              <Button
                onClick={() => setAdminModalOpen(true)}
                className="flex w-full items-center gap-2 rounded-xl bg-secondary-200 px-4 py-2 font-semibold text-white hover:bg-orange-600 sm:w-auto"
              >
                <UserPlus className="h-4 w-4" /> Add Admin Account
              </Button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[rgba(41,47,82,0.5)] bg-[rgba(41,47,82,0.2)] shadow-lg">
              <Table>
                <TableHeader className="bg-[rgba(8,11,30,0.5)]">
                  <TableRow className="border-[rgba(41,47,82,0.5)]">
                    <TableHead className="font-semibold text-white/50">
                      Admin User
                    </TableHead>
                    <TableHead className="font-semibold text-white/50">
                      Email Address
                    </TableHead>
                    <TableHead className="font-semibold text-white/50">
                      Role
                    </TableHead>
                    <TableHead className="text-right font-semibold text-white/50">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins?.map((admin) => (
                    <TableRow
                      key={admin.id}
                      className="border-[rgba(41,47,82,0.4)] hover:bg-[rgba(41,47,82,0.2)]"
                    >
                      <TableCell className="flex items-center gap-3 font-semibold text-white">
                        {admin.image ? (
                          <Image
                            src={admin.image}
                            alt={admin.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(41,47,82,0.8)] text-xs font-bold text-secondary-100">
                            {admin.name[0]?.toUpperCase()}
                          </div>
                        )}
                        {admin.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-white/70">
                        {admin.email}
                      </TableCell>
                      <TableCell>
                        <span className="rounded-md border border-secondary-200/20 bg-secondary-200/10 px-2.5 py-1 text-xs font-semibold text-secondary-100">
                          ADMIN
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleRemoveAdmin(admin.id, admin.name)
                          }
                          disabled={admin.id === sessionData?.user?.id}
                          className="text-white/40 hover:bg-[rgba(41,47,82,0.5)] hover:text-red-400 disabled:opacity-30"
                          title={
                            admin.id === sessionData?.user?.id
                              ? "Cannot remove your own admin role"
                              : "Remove Admin privileges"
                          }
                        >
                          <XCircle className="mr-1 h-4 w-4" /> Demote
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredAdmins?.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-white/40"
                      >
                        No admin accounts found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ==================== TAB 4: JUDGES ==================== */}
          <TabsContent value="judges" className="space-y-6">
            <div className="flex items-start gap-3 rounded-xl border border-purple-500/20 bg-[rgba(48,21,75,0.4)] p-4">
              <Award className="mt-0.5 h-5 w-5 shrink-0 text-purple-300" />
              <div className="text-sm text-white/70">
                <strong className="block font-semibold text-purple-300">
                  Jury Access Management
                </strong>
                Enter the email address of a judge. When they log in via Google
                OAuth, they will automatically receive the JUDGE role and access
                the scoring panel.
              </div>
            </div>

            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  type="text"
                  placeholder="Search judges..."
                  value={judgeSearch}
                  onChange={(e) => setJudgeSearch(e.target.value)}
                  className="rounded-xl border-[rgba(41,47,82,0.7)] bg-[rgba(41,47,82,0.4)] pl-9 text-white placeholder:text-white/30 focus:border-secondary-200 focus:ring-secondary-200"
                />
              </div>

              <Button
                onClick={() => setJudgeModalOpen(true)}
                className="flex w-full items-center gap-2 rounded-xl border border-purple-500/30 bg-[rgba(48,21,75,0.8)] px-4 py-2 font-medium text-white hover:bg-[rgba(48,21,75,1)] sm:w-auto"
              >
                <UserPlus className="h-4 w-4" /> Add Judge Account
              </Button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[rgba(41,47,82,0.5)] bg-[rgba(41,47,82,0.2)] shadow-lg">
              <Table>
                <TableHeader className="bg-[rgba(8,11,30,0.5)]">
                  <TableRow className="border-[rgba(41,47,82,0.5)]">
                    <TableHead className="font-semibold text-white/50">
                      Judge Name
                    </TableHead>
                    <TableHead className="font-semibold text-white/50">
                      Email Address
                    </TableHead>
                    <TableHead className="font-semibold text-white/50">
                      Role
                    </TableHead>
                    <TableHead className="text-right font-semibold text-white/50">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJudges?.map((judge) => (
                    <TableRow
                      key={judge.userId}
                      className="border-[rgba(41,47,82,0.4)] hover:bg-[rgba(41,47,82,0.2)]"
                    >
                      <TableCell className="flex items-center gap-3 font-semibold text-white">
                        {judge.User.image ? (
                          <Image
                            src={judge.User.image}
                            alt={judge.User.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(48,21,75,0.8)] text-xs font-bold text-purple-300">
                            {judge.User.name[0]?.toUpperCase()}
                          </div>
                        )}
                        {judge.User.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-white/70">
                        {judge.User.email}
                      </TableCell>
                      <TableCell>
                        <span className="rounded-md border border-purple-500/20 bg-[rgba(48,21,75,0.5)] px-2.5 py-1 text-xs font-semibold text-purple-300">
                          JUDGE
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleRemoveJudge(judge.userId, judge.User.name)
                          }
                          className="text-white/40 hover:bg-[rgba(41,47,82,0.5)] hover:text-red-400"
                        >
                          <XCircle className="mr-1 h-4 w-4" /> Remove Judge
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredJudges?.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-white/40"
                      >
                        No judge accounts found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* 1. Edit Team Name Dialog */}
      <Dialog
        open={!!editingTeam}
        onOpenChange={(open) => !open && setEditingTeam(null)}
      >
        <DialogContent className="border-[rgba(41,47,82,0.7)] bg-[#0d1128] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team Name</DialogTitle>
            <DialogDescription className="text-white/50">
              Change the team name for {editingTeam?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="team-name">New Team Name</Label>
              <Input
                id="team-name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Enter new team name"
                className="border-[rgba(41,47,82,0.8)] bg-[rgba(41,47,82,0.5)] text-white placeholder:text-white/30"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditingTeam(null)}
              className="text-white/60 hover:bg-[rgba(41,47,82,0.5)] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTeamName}
              disabled={updateTeamNameMutation.isPending || !newTeamName.trim()}
              className="bg-secondary-200 font-semibold text-white hover:bg-orange-600"
            >
              {updateTeamNameMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. College Add / Edit Dialog */}
      <Dialog open={collegeModalOpen} onOpenChange={setCollegeModalOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCollege?.id ? "Edit College" : "Add New College"}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Provide the college details and login password.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="college-name">College Name</Label>
              <Input
                id="college-name"
                value={editingCollege?.name ?? ""}
                onChange={(e) =>
                  setEditingCollege((prev) =>
                    prev ? { ...prev, name: e.target.value } : null,
                  )
                }
                placeholder="e.g. St Aloysius College, Mangalore"
                className="border-[rgba(41,47,82,0.8)] bg-[rgba(41,47,82,0.5)] text-white placeholder:text-white/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="college-details">Details / Code (Optional)</Label>
              <Input
                id="college-details"
                value={editingCollege?.details ?? ""}
                onChange={(e) =>
                  setEditingCollege((prev) =>
                    prev ? { ...prev, details: e.target.value } : null,
                  )
                }
                placeholder="Optional details"
                className="border-[rgba(41,47,82,0.8)] bg-[rgba(41,47,82,0.5)] text-white placeholder:text-white/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="college-password">College Password</Label>
              <Input
                id="college-password"
                type="text"
                value={editingCollege?.password ?? ""}
                onChange={(e) =>
                  setEditingCollege((prev) =>
                    prev ? { ...prev, password: e.target.value } : null,
                  )
                }
                placeholder="Login password"
                className="font-mono border-[rgba(41,47,82,0.8)] bg-[rgba(41,47,82,0.5)] text-white placeholder:text-white/30"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCollegeModalOpen(false)}
              className="text-white/60 hover:bg-[rgba(41,47,82,0.5)] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCollege}
              disabled={
                addCollegeMutation.isPending ||
                updateCollegeMutation.isPending ||
                !editingCollege?.name.trim()
              }
              className="border border-purple-500/30 bg-[rgba(48,21,75,0.9)] font-medium text-white hover:bg-[rgba(48,21,75,1)]"
            >
              {addCollegeMutation.isPending || updateCollegeMutation.isPending
                ? "Saving..."
                : "Save College"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Add Admin Dialog */}
      <Dialog open={adminModalOpen} onOpenChange={setAdminModalOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Admin Account (Google OAuth)</DialogTitle>
            <DialogDescription className="text-white/50">
              Grant Admin privileges to an email address.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Google Email Address</Label>
              <Input
                id="admin-email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@example.com"
                className="border-[rgba(41,47,82,0.8)] bg-[rgba(41,47,82,0.5)] text-white placeholder:text-white/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-name">Display Name (Optional)</Label>
              <Input
                id="admin-name"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. John Doe"
                className="border-[rgba(41,47,82,0.8)] bg-[rgba(41,47,82,0.5)] text-white placeholder:text-white/30"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setAdminModalOpen(false)}
              className="text-white/60 hover:bg-[rgba(41,47,82,0.5)] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddAdmin}
              disabled={addAdminMutation.isPending || !adminEmail.trim()}
              className="bg-secondary-200 font-semibold text-white hover:bg-orange-600"
            >
              {addAdminMutation.isPending ? "Adding..." : "Add Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Add Judge Dialog */}
      <Dialog open={judgeModalOpen} onOpenChange={setJudgeModalOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Judge Account</DialogTitle>
            <DialogDescription className="text-white/50">
              Grant Judge permissions to a jury member&apos;s email address.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="judge-email">Google Email Address</Label>
              <Input
                id="judge-email"
                type="email"
                value={judgeEmail}
                onChange={(e) => setJudgeEmail(e.target.value)}
                placeholder="judge@example.com"
                className="border-[rgba(41,47,82,0.8)] bg-[rgba(41,47,82,0.5)] text-white placeholder:text-white/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="judge-name">Judge Name (Optional)</Label>
              <Input
                id="judge-name"
                value={judgeName}
                onChange={(e) => setJudgeName(e.target.value)}
                placeholder="e.g. Dr. Sharma"
                className="border-[rgba(41,47,82,0.8)] bg-[rgba(41,47,82,0.5)] text-white placeholder:text-white/30"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setJudgeModalOpen(false)}
              className="text-white/60 hover:bg-[rgba(41,47,82,0.5)] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddJudge}
              disabled={addJudgeMutation.isPending || !judgeEmail.trim()}
              className="border border-purple-500/30 bg-[rgba(48,21,75,0.9)] font-medium text-white hover:bg-[rgba(48,21,75,1)]"
            >
              {addJudgeMutation.isPending ? "Adding..." : "Add Judge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. Full Screen Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full border border-[rgba(41,47,82,0.7)] bg-[rgba(8,11,30,0.8)] p-2 text-white/70 transition-colors hover:text-white"
            onClick={() => setSelectedImage(null)}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative flex h-full max-h-[85vh] w-full max-w-5xl items-center justify-center">
            <Image
              src={selectedImage}
              alt="Full size participant ID card"
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
