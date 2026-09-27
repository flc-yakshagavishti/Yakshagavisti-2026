"use client";

import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import Image from "next/image";
import { Link } from "~/i18n/navigation";
import toast from "react-hot-toast";
import { PrasangaSection } from "~/components/admin/PrasangaSection";
import { TeamReviewCard } from "~/components/admin/TeamReviewCard";
import { AdminSelect } from "~/components/admin/AdminSelect";
import "~/components/admin/admin.css";
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
  XCircle,
  UserPlus,
  ShieldAlert,
  BookOpen,
  RefreshCw,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export default function Admin() {
  const { data: sessionData, status: sessionStatus } = useSession();
  const utils = api.useUtils();
  const isAdmin = sessionData?.user?.role === Role.ADMIN;

  // Keep query states visible: an unavailable list is not an empty list.
  const teamsQuery = api.admin.getRegisteredTeams.useQuery(undefined, {
    enabled: isAdmin,
  });
  const collegesQuery = api.admin.getColleges.useQuery(undefined, {
    enabled: isAdmin,
  });
  const adminsQuery = api.admin.getAdmins.useQuery(undefined, {
    enabled: isAdmin,
  });
  const judgesQuery = api.admin.getJudges.useQuery(undefined, {
    enabled: isAdmin,
  });
  const prasangasQuery = api.admin.getPrasangas.useQuery(undefined, {
    enabled: isAdmin,
  });
  const settingsQuery = api.admin.getCompetitionSettings.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: teams, refetch: refetchTeams } = teamsQuery;
  const { data: colleges, refetch: refetchColleges } = collegesQuery;
  const { data: admins, refetch: refetchAdmins } = adminsQuery;
  const { data: judges, refetch: refetchJudges } = judgesQuery;
  const { data: prasangas, refetch: refetchPrasangas } = prasangasQuery;
  const { data: competitionSettings } = settingsQuery;

  // --- Mutations ---
  const verifyIdMutation = api.admin.verifyId.useMutation();
  const updateTeamMemberCharacterMutation =
    api.admin.updateTeamMemberCharacter.useMutation();
  const editTeamAccessMutation = api.admin.EditAccess.useMutation();
  const markAttendanceMutation = api.admin.markAttendance.useMutation();
  const updateTeamNameMutation = api.admin.updateTeamName.useMutation();
  const assignPrasangaMutation = api.admin.assignPrasanga.useMutation();

  const setTeamFormationMutation = api.admin.setTeamFormation.useMutation({
    onSuccess: async () => {
      await utils.admin.getCompetitionSettings.invalidate();
      toast.success("Team formation setting updated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

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
  const [activeTab, setActiveTab] = useState("teams");
  const [teamSearch, setTeamSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [prasangaFilter, setPrasangaFilter] = useState("");
  const [editingCharacter, setEditingCharacter] = useState<{
    id: string;
    name: string;
    characterName: string;
  } | null>(null);
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

  if (sessionStatus === "loading") {
    return (
      <div
        role="status"
        className="flex min-h-screen items-center justify-center gap-3 text-white/70"
      >
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Loading
        admin dashboard…
      </div>
    );
  }
  if (!isAdmin) return <NotFound />;

  const activeQuery =
    {
      teams: teamsQuery,
      colleges: collegesQuery,
      admins: adminsQuery,
      judges: judgesQuery,
      prasangas: prasangasQuery,
    }[activeTab as "teams" | "colleges" | "admins" | "judges" | "prasangas"] ??
    teamsQuery;

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
    if (!editingTeam || !newTeamName.trim() || updateTeamNameMutation.isPending)
      return;
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
    if (
      !editingCollege?.name.trim() ||
      addCollegeMutation.isPending ||
      updateCollegeMutation.isPending
    )
      return;

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
    if (!adminEmail.trim() || addAdminMutation.isPending) return;
    addAdminMutation.mutate(
      {
        email: adminEmail.trim(),
        name: adminName.trim() ? adminName.trim() : undefined,
      },
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
    if (!judgeEmail.trim() || addJudgeMutation.isPending) return;
    addJudgeMutation.mutate(
      {
        email: judgeEmail.trim(),
        name: judgeName.trim() ? judgeName.trim() : undefined,
      },
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
        sanitizeText(member.name)
          ? sanitizeText(member.name)
          : "Member " + (idx + 1),
        sanitizeText(
          member.characterName ?? member.Character?.character ?? "N/A",
        )
          ? sanitizeText(
              member.characterName ?? member.Character?.character ?? "N/A",
            )
          : "N/A",
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
  const filteredTeams = teams?.filter((team) => {
    const query = teamSearch.trim().toLowerCase();
    const matchesSearch = [
      team.name,
      team.College?.name,
      team.Leader?.name,
      team.Prasanga?.name,
    ].some((value) => value?.toLowerCase().includes(query));
    const matchesStatus =
      teamFilter === "all" ||
      (teamFilter === "attendance" && !team.attended) ||
      (teamFilter === "verification" &&
        team.TeamMembers.some((member) => !member.isIdVerified)) ||
      (teamFilter === "unassigned" && !team.Prasanga);
    return (
      matchesSearch &&
      matchesStatus &&
      (!prasangaFilter || team.Prasanga?.id === prasangaFilter)
    );
  });

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

  // Counts always reflect query data; unavailable data is never shown as zero.
  const totalTeams = teams?.length ?? "—";
  const pendingVerification =
    teams?.filter((team) =>
      team.TeamMembers.some((member) => !member.isIdVerified),
    ).length ?? "—";
  const pendingAttendance =
    teams?.filter((team) => !team.attended).length ?? "—";
  const unassignedTeams = teams?.filter((team) => !team.Prasanga).length ?? "—";
  const sections = [
    {
      id: "teams",
      label: "Teams",
      icon: Users,
      count: totalTeams,
      description:
        "Review participant IDs, mark attendance, and manage team details.",
    },
    {
      id: "prasangas",
      label: "Prasangas",
      icon: BookOpen,
      count: prasangas?.length ?? "—",
      description:
        "Manage the prasanga catalog and see where each one is assigned.",
    },
    {
      id: "colleges",
      label: "Colleges",
      icon: Building2,
      count: colleges?.length ?? "—",
      description: "Manage participating institutions and their team access.",
    },
    {
      id: "admins",
      label: "Admins",
      icon: ShieldCheck,
      count: admins?.length ?? "—",
      description: "Manage who can access this administration workspace.",
    },
    {
      id: "judges",
      label: "Judges",
      icon: Award,
      count: judges?.length ?? "—",
      description: "Manage jury accounts and access to the scoring panel.",
    },
  ];
  const currentSection = sections.find((section) => section.id === activeTab)!;
  const attendedTeams = teams?.filter((t) => t.attended).length ?? "—";

  return (
    <div className="admin-workspace">
      <a className="admin-skip-link" href="#admin-content">
        Skip to workspace
      </a>
      <header className="admin-topbar">
        <Link href="/" className="admin-brand">
          Yakshagavishti <span>2026</span>
        </Link>
        <div className="admin-topbar__context">
          <ShieldCheck size={16} aria-hidden="true" />
          <h1>Administration</h1>
        </div>
        <span
          className="admin-signed-in"
          title={sessionData?.user?.email ?? undefined}
        >
          {sessionData?.user?.name ?? "Administrator"}
        </span>
      </header>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        orientation="vertical"
        className="admin-shell"
      >
        <aside className="admin-rail" aria-label="Administration navigation">
          <div className="admin-mobile-nav">
            <Label htmlFor="admin-section">Workspace</Label>
            <AdminSelect
              id="admin-section"
              label="Workspace"
              value={activeTab}
              onValueChange={setActiveTab}
              options={sections.map((section) => ({
                value: section.id,
                label: `${section.label} (${section.count})`,
              }))}
            />
          </div>
          <TabsList className="admin-nav" aria-label="Admin sections">
            {sections.map((section) => (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="admin-nav__item"
              >
                <section.icon size={18} aria-hidden="true" />
                <span>{section.label}</span>
                <span className="admin-count">{section.count}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="admin-rail__links">
            <Link href="/admin/leaderboard">
              <Award size={16} aria-hidden="true" /> Leaderboard{" "}
              <ExternalLink size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="admin-formation">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="team-formation">Team formation</Label>
              <Switch
                id="team-formation"
                aria-describedby="team-formation-help"
                checked={competitionSettings?.allowTeamFormation ?? false}
                disabled={
                  setTeamFormationMutation.isPending ||
                  !competitionSettings ||
                  settingsQuery.isError
                }
                onCheckedChange={(allowTeamFormation) =>
                  setTeamFormationMutation.mutate({ allowTeamFormation })
                }
              />
            </div>
            <p className="admin-formation__status" role="status">
              {setTeamFormationMutation.isPending
                ? "Saving…"
                : settingsQuery.isError
                  ? "Unavailable"
                  : !competitionSettings
                    ? "Loading…"
                    : competitionSettings.allowTeamFormation
                      ? "Open for team leads"
                      : "Closed for team leads"}
            </p>
            <p id="team-formation-help" className="admin-muted">
              Controls whether team leads can enter character details.
            </p>
            {settingsQuery.isError && (
              <Button
                className="admin-button mt-3"
                size="sm"
                onClick={() => void settingsQuery.refetch()}
              >
                Retry setting
              </Button>
            )}
          </div>
          <p className="admin-rail__note">
            Event administration
            <br />
            Yakshagavishti 2026
          </p>
        </aside>
        <main id="admin-content" className="admin-main" tabIndex={-1}>
          <div className="admin-page-heading">
            <div>
              <h2>
                {activeTab === "teams"
                  ? "Teams & attendance"
                  : currentSection.label === "Admins"
                    ? "Admin accounts"
                    : currentSection.label}
              </h2>
              <p>{currentSection.description}</p>
            </div>
            {activeTab === "teams" && (
              <Button
                onClick={downloadPDF}
                disabled={!teams?.some((team) => team.isComplete)}
                title="Export completed team registrations"
                className="admin-button"
              >
                <Download size={16} /> Export teams
              </Button>
            )}
          </div>
          {activeTab === "teams" && (
            <div
              className="admin-review-strip"
              aria-label="Team review shortcuts"
            >
              {[
                { id: "all", label: "Registered", count: totalTeams },
                {
                  id: "verification",
                  label: "IDs pending",
                  count: pendingVerification,
                },
                {
                  id: "attendance",
                  label: "Check-in pending",
                  count: pendingAttendance,
                },
                {
                  id: "unassigned",
                  label: "Unassigned",
                  count: unassignedTeams,
                },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={teamFilter === item.id && !prasangaFilter}
                  onClick={() => {
                    setTeamFilter(item.id);
                    setTeamSearch("");
                    setPrasangaFilter("");
                  }}
                  className="admin-review-stat"
                >
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </button>
              ))}
            </div>
          )}

          {activeQuery.isPending && (
            <div role="status" className="admin-notice mb-6 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{" "}
              Loading {activeTab}…
            </div>
          )}
          {activeQuery.isError && (
            <div
              role="alert"
              className="admin-notice admin-error mb-6 flex-wrap justify-between"
            >
              <span>
                Could not load {activeTab}. {activeQuery.error.message}
              </span>
              <Button
                variant="ghost"
                className="admin-button"
                disabled={activeQuery.isFetching}
                onClick={() => void activeQuery.refetch()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {activeQuery.isFetching ? "Retrying…" : "Try again"}
              </Button>
            </div>
          )}

          {/* ==================== TAB 1: TEAMS ==================== */}
          <TabsContent value="teams" className="space-y-6">
            <div className="admin-toolbar">
              <div className="admin-search">
                <Search size={16} aria-hidden="true" />
                <Input
                  type="text"
                  aria-label="Search teams, colleges, leaders or prasangas"
                  placeholder="Search teams, colleges, leaders…"
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="rounded-xl border-[rgba(41,47,82,0.7)] bg-[rgba(41,47,82,0.4)] pl-9 text-white placeholder:text-white/30 focus:border-secondary-200 focus:ring-secondary-200"
                />
              </div>
              <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                <AdminSelect
                  label="Filter teams by status"
                  value={teamFilter}
                  onValueChange={setTeamFilter}
                  className="admin-status-select"
                  options={[
                    { value: "all", label: "All teams" },
                    { value: "attendance", label: "Pending attendance" },
                    { value: "verification", label: "Pending ID verification" },
                    { value: "unassigned", label: "No prasanga assigned" },
                  ]}
                />
                <span className="admin-muted" role="status">
                  {teams
                    ? `Showing ${filteredTeams?.length ?? 0} of ${totalTeams} teams`
                    : "Loading teams…"}
                </span>
              </div>
            </div>

            {(teamSearch || teamFilter !== "all" || prasangaFilter) && (
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                {prasangaFilter && (
                  <span>
                    Prasanga:{" "}
                    {prasangas?.find(
                      (prasanga) => prasanga.id === prasangaFilter,
                    )?.name ?? "Selected prasanga"}
                  </span>
                )}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setTeamSearch("");
                    setTeamFilter("all");
                    setPrasangaFilter("");
                  }}
                  className="admin-button admin-button--quiet"
                >
                  Clear filters
                </Button>
              </div>
            )}

            <div className="space-y-6">
              {filteredTeams?.map((team) => (
                <TeamReviewCard
                  key={team.id}
                  team={team}
                  prasangas={prasangas}
                  assignmentDisabled={
                    assignPrasangaMutation.isPending ||
                    !prasangas ||
                    prasangasQuery.isError
                  }
                  editAccessPending={editTeamAccessMutation.isPending}
                  verificationPending={verifyIdMutation.isPending}
                  attendancePending={markAttendanceMutation.isPending}
                  verifyingId={verifyingId}
                  markingAttendance={markingAttendance}
                  onEditName={() => {
                    setEditingTeam({ id: team.id, name: team.name });
                    setNewTeamName(team.name);
                  }}
                  onAssignPrasanga={(prasangaId) => {
                    if (
                      !prasangaId ||
                      prasangaId === team.Prasanga?.id ||
                      !confirm(
                        "Changing the prasanga will reset this team's character details, verification, attendance, and scores. Continue?",
                      )
                    )
                      return;
                    assignPrasangaMutation.mutate(
                      { teamId: team.id, prasangaId },
                      {
                        onSuccess: () => {
                          void refetchTeams();
                          void refetchPrasangas();
                        },
                        onError: (error) => alert(error.message),
                      },
                    );
                  }}
                  onEditAccess={() => setEditAccess(team.id)}
                  onVerify={verifyId}
                  onAttend={(memberId) => markAttendance(memberId, team.id)}
                  onViewId={setSelectedImage}
                  onEditCharacter={(member) =>
                    setEditingCharacter({
                      id: member.id,
                      name: member.name,
                      characterName:
                        member.characterName ??
                        member.Character?.character ??
                        "",
                    })
                  }
                />
              ))}

              {filteredTeams?.length === 0 && (
                <div className="admin-empty">
                  {teams?.length
                    ? "No teams match these filters. Clear the filters or try another search."
                    : "No teams registered yet. Registered teams will appear here."}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ==================== TAB: PRASANGAS ==================== */}
          <TabsContent value="prasangas" className="space-y-6">
            <PrasangaSection
              prasangas={prasangas}
              onViewTeams={(prasangaId) => {
                setPrasangaFilter(prasangaId);
                setTeamSearch("");
                setTeamFilter("all");
                setActiveTab("teams");
              }}
            />
          </TabsContent>

          {/* ==================== TAB 2: COLLEGES ==================== */}
          <TabsContent value="colleges" className="space-y-6">
            <div className="admin-toolbar">
              <div className="admin-search">
                <Search size={16} aria-hidden="true" />
                <Input
                  type="text"
                  aria-label="Search colleges"
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
                className="admin-button admin-button--primary"
              >
                <Plus size={16} /> Add college
              </Button>
            </div>

            <p className="admin-directory-hint">
              Scroll the table sideways to see all details and actions.
            </p>
            <div className="admin-directory">
              <Table aria-label="Participating colleges">
                <TableHeader>
                  <TableRow>
                    <TableHead>College name</TableHead>
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
                          aria-label={`Edit ${college.name}`}
                          className="text-white/60 hover:bg-[rgba(41,47,82,0.5)] hover:text-secondary-100"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Delete ${college.name}`}
                          disabled={deleteCollegeMutation.isPending}
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
            <div className="admin-notice">
              <ShieldAlert size={18} aria-hidden="true" />
              <div>
                <strong>Admin access grants full control</strong>Add their
                Google email address. They’ll receive admin access when they
                sign in with that account, even if they haven’t registered yet.
              </div>
            </div>

            <div className="admin-toolbar">
              <div className="admin-search">
                <Search size={16} aria-hidden="true" />
                <Input
                  type="text"
                  aria-label="Search admin accounts"
                  placeholder="Search admin accounts..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="rounded-xl border-[rgba(41,47,82,0.7)] bg-[rgba(41,47,82,0.4)] pl-9 text-white placeholder:text-white/30 focus:border-secondary-200 focus:ring-secondary-200"
                />
              </div>

              <Button
                onClick={() => setAdminModalOpen(true)}
                className="admin-button admin-button--primary"
              >
                <UserPlus size={16} /> Add admin
              </Button>
            </div>

            <p className="admin-directory-hint">
              Scroll the table sideways to see all details and actions.
            </p>
            <div className="admin-directory">
              <Table aria-label="Admin accounts">
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
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
                          disabled={
                            admin.id === sessionData?.user?.id ||
                            removeAdminMutation.isPending
                          }
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
            <div className="admin-notice">
              <Award size={18} aria-hidden="true" />
              <div>
                <strong>Give judges access to scoring</strong>Add their Google
                email address. They’ll receive jury access when they sign in
                with that account.
              </div>
            </div>

            <div className="admin-toolbar">
              <div className="admin-search">
                <Search size={16} aria-hidden="true" />
                <Input
                  type="text"
                  aria-label="Search judges"
                  placeholder="Search judges..."
                  value={judgeSearch}
                  onChange={(e) => setJudgeSearch(e.target.value)}
                  className="rounded-xl border-[rgba(41,47,82,0.7)] bg-[rgba(41,47,82,0.4)] pl-9 text-white placeholder:text-white/30 focus:border-secondary-200 focus:ring-secondary-200"
                />
              </div>

              <Button
                onClick={() => setJudgeModalOpen(true)}
                className="admin-button admin-button--primary"
              >
                <UserPlus size={16} /> Add judge
              </Button>
            </div>

            <p className="admin-directory-hint">
              Scroll the table sideways to see all details and actions.
            </p>
            <div className="admin-directory">
              <Table aria-label="Jury accounts">
                <TableHeader>
                  <TableRow>
                    <TableHead>Judge</TableHead>
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
                          disabled={removeJudgeMutation.isPending}
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
          <footer className="admin-footer">
            <span>Yakshagavishti 2026</span>
            <span>
              {activeTab === "teams"
                ? `${attendedTeams} of ${totalTeams} teams present`
                : "Administration workspace"}
            </span>
          </footer>
        </main>
      </Tabs>

      {/* ==================== MODALS ==================== */}

      {/* 1. Edit Team Name Dialog */}
      <Dialog
        open={!!editingTeam}
        onOpenChange={(open) =>
          !open && !updateTeamNameMutation.isPending && setEditingTeam(null)
        }
      >
        <DialogContent className="admin-dialog sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team Name</DialogTitle>
            <DialogDescription className="text-white/50">
              Change the team name for {editingTeam?.name}.
            </DialogDescription>
          </DialogHeader>

          <form
            id="edit-team-form"
            onSubmit={(event) => {
              event.preventDefault();
              handleUpdateTeamName();
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label htmlFor="team-name">New Team Name</Label>
              <Input
                id="team-name"
                required
                disabled={updateTeamNameMutation.isPending}
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Enter new team name"
                className="border-[rgba(41,47,82,0.8)] bg-[rgba(41,47,82,0.5)] text-white placeholder:text-white/30"
              />
            </div>
          </form>

          <DialogFooter>
            <Button
              variant="ghost"
              disabled={updateTeamNameMutation.isPending}
              onClick={() => setEditingTeam(null)}
              className="text-white/60 hover:bg-[rgba(41,47,82,0.5)] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-team-form"
              disabled={updateTeamNameMutation.isPending || !newTeamName.trim()}
              className="bg-secondary-200 font-semibold text-white hover:bg-orange-600"
            >
              {updateTeamNameMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. College Add / Edit Dialog */}
      <Dialog
        open={collegeModalOpen}
        onOpenChange={(open) => {
          if (!addCollegeMutation.isPending && !updateCollegeMutation.isPending)
            setCollegeModalOpen(open);
        }}
      >
        <DialogContent className="admin-dialog sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCollege?.id ? "Edit college" : "Add college"}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Provide the college details and login password.
            </DialogDescription>
          </DialogHeader>

          <form
            id="college-form"
            onSubmit={(event) => {
              event.preventDefault();
              handleSaveCollege();
            }}
          >
            <fieldset
              disabled={
                addCollegeMutation.isPending || updateCollegeMutation.isPending
              }
              className="space-y-4 py-2"
            >
              <div className="space-y-2">
                <Label htmlFor="college-name">College Name</Label>
                <Input
                  id="college-name"
                  required
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
                <Label htmlFor="college-details">
                  Details / Code (Optional)
                </Label>
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
            </fieldset>
          </form>

          <DialogFooter>
            <Button
              variant="ghost"
              disabled={
                addCollegeMutation.isPending || updateCollegeMutation.isPending
              }
              onClick={() => setCollegeModalOpen(false)}
              className="text-white/60 hover:bg-[rgba(41,47,82,0.5)] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="college-form"
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
      <Dialog
        open={adminModalOpen}
        onOpenChange={(open) => {
          if (!addAdminMutation.isPending) setAdminModalOpen(open);
        }}
      >
        <DialogContent className="admin-dialog sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add admin account</DialogTitle>
            <DialogDescription className="text-white/50">
              Grant Admin privileges to an email address.
            </DialogDescription>
          </DialogHeader>

          <form
            id="admin-form"
            onSubmit={(event) => {
              event.preventDefault();
              handleAddAdmin();
            }}
          >
            <fieldset
              disabled={addAdminMutation.isPending}
              className="space-y-4 py-2"
            >
              <div className="space-y-2">
                <Label htmlFor="admin-email">Google Email Address</Label>
                <Input
                  id="admin-email"
                  required
                  autoComplete="email"
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
                  placeholder="Display name"
                  className="border-[rgba(41,47,82,0.8)] bg-[rgba(41,47,82,0.5)] text-white placeholder:text-white/30"
                />
              </div>
            </fieldset>
          </form>

          <DialogFooter>
            <Button
              variant="ghost"
              disabled={addAdminMutation.isPending}
              onClick={() => setAdminModalOpen(false)}
              className="text-white/60 hover:bg-[rgba(41,47,82,0.5)] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="admin-form"
              disabled={addAdminMutation.isPending || !adminEmail.trim()}
              className="bg-secondary-200 font-semibold text-white hover:bg-orange-600"
            >
              {addAdminMutation.isPending ? "Adding..." : "Add Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Add Judge Dialog */}
      <Dialog
        open={judgeModalOpen}
        onOpenChange={(open) => {
          if (!addJudgeMutation.isPending) setJudgeModalOpen(open);
        }}
      >
        <DialogContent className="admin-dialog sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add judge account</DialogTitle>
            <DialogDescription className="text-white/50">
              Grant Judge permissions to a jury member&apos;s email address.
            </DialogDescription>
          </DialogHeader>

          <form
            id="judge-form"
            onSubmit={(event) => {
              event.preventDefault();
              handleAddJudge();
            }}
          >
            <fieldset
              disabled={addJudgeMutation.isPending}
              className="space-y-4 py-2"
            >
              <div className="space-y-2">
                <Label htmlFor="judge-email">Google Email Address</Label>
                <Input
                  id="judge-email"
                  required
                  autoComplete="email"
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
            </fieldset>
          </form>

          <DialogFooter>
            <Button
              variant="ghost"
              disabled={addJudgeMutation.isPending}
              onClick={() => setJudgeModalOpen(false)}
              className="text-white/60 hover:bg-[rgba(41,47,82,0.5)] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="judge-form"
              disabled={addJudgeMutation.isPending || !judgeEmail.trim()}
              className="border border-purple-500/30 bg-[rgba(48,21,75,0.9)] font-medium text-white hover:bg-[rgba(48,21,75,1)]"
            >
              {addJudgeMutation.isPending ? "Adding..." : "Add Judge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingCharacter}
        onOpenChange={(open) => {
          if (!open && !updateTeamMemberCharacterMutation.isPending)
            setEditingCharacter(null);
        }}
      >
        <DialogContent className="admin-dialog sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit character</DialogTitle>
            <DialogDescription className="text-white/60">
              Update the character played by {editingCharacter?.name}.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (
                !editingCharacter?.characterName.trim() ||
                updateTeamMemberCharacterMutation.isPending
              )
                return;
              updateTeamMemberCharacterMutation.mutate(
                {
                  id: editingCharacter.id,
                  characterName: editingCharacter.characterName.trim(),
                },
                {
                  onSuccess: () => {
                    setEditingCharacter(null);
                    toast.success("Character updated");
                    void refetchTeams();
                  },
                  onError: (error) => toast.error(error.message),
                },
              );
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="edit-character-name">Character name</Label>
              <Input
                id="edit-character-name"
                required
                disabled={updateTeamMemberCharacterMutation.isPending}
                value={editingCharacter?.characterName ?? ""}
                onChange={(event) =>
                  setEditingCharacter((current) =>
                    current
                      ? { ...current, characterName: event.target.value }
                      : null,
                  )
                }
                className="border-primary-50 bg-primary-50/40 text-white"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                disabled={updateTeamMemberCharacterMutation.isPending}
                onClick={() => setEditingCharacter(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !editingCharacter?.characterName.trim() ||
                  updateTeamMemberCharacterMutation.isPending
                }
                className="bg-secondary-200 text-white hover:bg-secondary-200/80"
              >
                {updateTeamMemberCharacterMutation.isPending
                  ? "Saving…"
                  : "Save character"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedImage}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      >
        <DialogContent className="admin-dialog max-w-5xl">
          <DialogHeader>
            <DialogTitle>Participant ID card</DialogTitle>
            <DialogDescription className="text-white/60">
              Review the participant’s proof of identity. Press Escape to close.
            </DialogDescription>
          </DialogHeader>
          <div className="relative h-[70vh] w-full">
            {selectedImage && (
              <Image
                src={selectedImage}
                alt="Full size participant ID card"
                fill
                unoptimized
                className="object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
