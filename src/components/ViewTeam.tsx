"use client";

import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button as RegButton } from "~/components/Button";
import RequestEditAccess from "~/components/RequestEditAccess";
import { IoCheckmarkCircle, IoTimeOutline } from "react-icons/io5";

export default function ViewTeam() {
  const teamData = api.team.getTeam.useQuery();
  const team = teamData.data;

  const leaderMember =
    team?.TeamMembers?.find((m) => m.characterId === null) ??
    (team?.Leader
      ? {
          id: "leader",
          name: team.Leader.name,
          contact: "",
          idURL: "",
          isIdVerified: false,
          isAttended: false,
          Character: null,
          characterId: null,
        }
      : null);

  const characterMembers =
    team?.TeamMembers?.filter((m) => m.characterId !== null) ?? [];

  return (
    <Dialog>
      <DialogTrigger>
        <RegButton>View Team</RegButton>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] w-[95vw] max-w-2xl overflow-y-auto rounded-2xl border border-white/20 bg-gradient-to-b from-slate-950 via-slate-900 to-black p-4 sm:p-6 text-white shadow-2xl backdrop-blur-xl sm:w-full">
        {teamData.isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-white/70">
            <span className="text-sm font-medium">Loading team details...</span>
          </div>
        ) : !team ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-white/70">
            <DialogTitle className="text-lg font-bold text-white">
              No Team Found
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400">
              Could not find registered team details for this account.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader className="space-y-1 text-left">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                  {team.name}
                </DialogTitle>
                <span className="rounded-full border border-secondary-100/40 bg-secondary-100/10 px-3 py-1 text-xs font-semibold text-secondary-100">
                  Team #{team.number}
                </span>
              </div>
              <DialogDescription className="text-gray-300">
                {team.College?.name
                  ? `College: ${team.College.name}`
                  : "View your team and character details"}
              </DialogDescription>
            </DialogHeader>

            {/* Team Summary Cards */}
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-white/10 bg-white/5 p-3 sm:grid-cols-2">
              <div>
                <span className="text-xs uppercase tracking-wider text-white/50">
                  Assigned Prasanga
                </span>
                <p className="font-semibold text-white">
                  {team.Prasanga?.name ?? "Not assigned yet"}
                </p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-white/50">
                  Team Status
                </span>
                <p className="font-semibold text-white">
                  {team.isComplete
                    ? "Registration Submitted"
                    : "Registration In Progress"}
                </p>
              </div>
            </div>

            {/* Team Leader Section */}
            <div className="rounded-lg border border-secondary-100/30 bg-secondary-100/5 p-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-secondary-100/40 bg-secondary-100/20 px-2 py-0.5 text-xs font-semibold text-secondary-100">
                    Team Lead
                  </span>
                  <span className="text-xs text-white/50">
                    Character: <span className="font-medium text-white/80">N/A</span>
                  </span>
                </div>
                {leaderMember && (
                  <div>
                    {leaderMember.isIdVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                        <IoCheckmarkCircle className="h-3 w-3 text-green-400" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                        <IoTimeOutline className="h-3 w-3 text-amber-400" />
                        Pending
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <span className="text-xs uppercase tracking-wider text-white/50">
                    Leader Name
                  </span>
                  <p className="font-semibold text-white">
                    {leaderMember?.name ?? team.Leader?.name ?? "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-white/50">
                    Contact Phone
                  </span>
                  <p className="font-semibold text-white">
                    {leaderMember?.contact ?? "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-white/50">
                    ID Card
                  </span>
                  <div className="mt-1">
                    {leaderMember?.idURL ? (
                      <a
                        href={leaderMember.idURL}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-secondary-100 hover:underline"
                        title="Click to view full ID"
                      >
                        <Image
                          src={leaderMember.idURL}
                          alt={`${leaderMember.name ?? "Leader"} ID`}
                          height={40}
                          width={40}
                          className="h-8 w-8 rounded border border-white/20 object-cover"
                        />
                        <span>View ID</span>
                      </a>
                    ) : (
                      <span className="text-xs text-white/40">No ID uploaded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Prasanga Characters & Cast Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold tracking-wide text-white/90">
                  Prasanga Characters & Cast
                </h4>
                {team.Prasanga?.name && (
                  <span className="text-xs text-white/50">
                    Prasanga: {team.Prasanga.name}
                  </span>
                )}
              </div>

              <div className="overflow-hidden rounded-lg border border-white/10">
                <Table>
                  <TableHeader className="bg-slate-950/60">
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="font-semibold text-white/70">
                        Character
                      </TableHead>
                      <TableHead className="font-semibold text-white/70">
                        Participant Name
                      </TableHead>
                      <TableHead className="text-center font-semibold text-white/70">
                        ID Card
                      </TableHead>
                      <TableHead className="font-semibold text-white/70">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.Prasanga?.characters && team.Prasanga.characters.length > 0 ? (
                      team.Prasanga.characters.map((char) => {
                        const member = characterMembers.find(
                          (m) => m.characterId === char.id,
                        );
                        return (
                          <TableRow
                            key={char.id}
                            className="border-white/10 hover:bg-white/5"
                          >
                            <TableCell className="font-medium text-secondary-100">
                              {char.character}
                            </TableCell>
                            <TableCell className="text-sm font-semibold text-white">
                              {member?.name ?? (
                                <span className="text-xs italic text-white/40">
                                  Not filled yet
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {member?.idURL ? (
                                <a
                                  href={member.idURL}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-block transition-transform hover:scale-105"
                                  title="Click to view full ID"
                                >
                                  <Image
                                    src={member.idURL}
                                    alt={`${member.name ?? "Member"} ID`}
                                    height={50}
                                    width={50}
                                    className="h-10 w-10 rounded border border-white/20 object-cover"
                                  />
                                </a>
                              ) : (
                                <span className="text-xs text-white/40">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {member ? (
                                member.isIdVerified ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                                    <IoCheckmarkCircle className="h-3.5 w-3.5 text-green-400" />
                                    Verified
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                                    <IoTimeOutline className="h-3.5 w-3.5 text-amber-400" />
                                    Pending
                                  </span>
                                )
                              ) : (
                                <span className="text-xs text-white/30">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : characterMembers.length > 0 ? (
                      characterMembers.map((member) => (
                        <TableRow
                          key={member.id}
                          className="border-white/10 hover:bg-white/5"
                        >
                          <TableCell className="font-medium text-secondary-100">
                            {member.Character?.character ?? "Character"}
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-white">
                            {member.name || "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            {member.idURL ? (
                              <a
                                href={member.idURL}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block transition-transform hover:scale-105"
                                title="Click to view full ID"
                              >
                                <Image
                                  src={member.idURL}
                                  alt={`${member.name ?? "Member"} ID`}
                                  height={50}
                                  width={50}
                                  className="h-10 w-10 rounded border border-white/20 object-cover"
                                />
                              </a>
                            ) : (
                              <span className="text-xs text-white/40">No ID</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {member.isIdVerified ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                                <IoCheckmarkCircle className="h-3.5 w-3.5 text-green-400" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                                <IoTimeOutline className="h-3.5 w-3.5 text-amber-400" />
                                Pending
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-6 text-center text-sm text-white/50"
                        >
                          {team.Prasanga
                            ? "No character details added yet."
                            : "Prasanga not assigned yet. Please contact the administrator."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Edit Request Action Area */}
            <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/40 p-4 sm:flex-row">
              <div className="text-center sm:text-left">
                <p className="text-sm font-medium text-white">
                  Team Details Management
                </p>
                <p className="text-xs text-white/60">
                  {team.isComplete
                    ? "Submitted team details are locked. Request edit access to make changes."
                    : "Your team registration is currently open for editing."}
                </p>
              </div>
              <div>
                {team.isComplete &&
                  (team.editRequested ? (
                    <span className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300">
                      <IoTimeOutline className="h-4 w-4" />
                      Edit access request pending
                    </span>
                  ) : (
                    <RequestEditAccess />
                  ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
