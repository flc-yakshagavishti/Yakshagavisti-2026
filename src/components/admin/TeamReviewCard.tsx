"use client";

import * as React from "react";
import {
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  Edit2,
  ExternalLink,
  Loader2,
  UserRound,
} from "lucide-react";
import { type RouterOutputs } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { AdminSelect } from "~/components/admin/AdminSelect";

type Team = RouterOutputs["admin"]["getRegisteredTeams"][number];
type Member = Team["TeamMembers"][number];

type TeamReviewCardProps = {
  team: Team;
  prasangas: { id: string; name: string }[] | undefined;
  assignmentDisabled: boolean;
  editAccessPending: boolean;
  verificationPending: boolean;
  attendancePending: boolean;
  verifyingId: string;
  markingAttendance: string;
  onEditName: () => void;
  onAssignPrasanga: (prasangaId: string) => void;
  onEditAccess: () => void;
  onVerify: (id: string) => void;
  onAttend: (id: string) => void;
  onViewId: (url: string) => void;
  onEditCharacter: (member: Member) => void;
};

export function TeamReviewCard({
  team,
  prasangas,
  assignmentDisabled,
  editAccessPending,
  verificationPending,
  attendancePending,
  verifyingId,
  markingAttendance,
  onEditName,
  onAssignPrasanga,
  onEditAccess,
  onVerify,
  onAttend,
  onViewId,
  onEditCharacter,
}: TeamReviewCardProps) {
  const leader = team.TeamMembers.find(
    (member) => member.characterId === null && !member.characterName,
  );
  const cast = team.TeamMembers.filter((member) =>
    Boolean(member.characterName ?? member.characterId !== null),
  );
  const verified = team.TeamMembers.filter(
    (member) => member.isIdVerified,
  ).length;
  const present = team.TeamMembers.filter((member) => member.isAttended).length;

  function renderMember(member: Member, isLeader = false): React.ReactElement {
    return (
      <li key={member.id} className="admin-member">
        <div className="admin-member__identity">
          <span className="admin-member__avatar" aria-hidden="true">
            {isLeader ? (
              <UserRound size={16} />
            ) : (
              member.name.slice(0, 1).toUpperCase()
            )}
          </span>
          <div className="min-w-0">
            <p className="admin-member__name">{member.name}</p>
            <p className="admin-muted">
              {isLeader
                ? "Team lead"
                : member.contact?.trim()
                  ? member.contact
                  : "Participant"}
              {isLeader && member.contact ? ` · ${member.contact}` : ""}
            </p>
          </div>
        </div>
        <div className="admin-member__character">
          <span className="admin-mobile-label">Character</span>
          {isLeader ? (
            <span className="admin-muted">Not applicable</span>
          ) : (
            <div className="flex min-w-0 items-center gap-2">
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {member.characterName ??
                  member.Character?.character ??
                  "Not entered"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="admin-icon-button"
                aria-label={`Edit character for ${member.name}`}
                onClick={() => onEditCharacter(member)}
              >
                <Edit2 size={14} />
              </Button>
            </div>
          )}
        </div>
        <div className="admin-member__proof">
          {member.idURL ? (
            <Button
              variant="ghost"
              className="admin-button admin-button--quiet"
              onClick={() => onViewId(member.idURL)}
              aria-label={`View ID card for ${member.name}`}
            >
              <ExternalLink size={14} /> View ID
            </Button>
          ) : (
            <span className="admin-muted">No ID uploaded</span>
          )}
        </div>
        <div className="admin-member__verification">
          {member.isIdVerified ? (
            <span className="admin-state admin-state--success">
              <Check size={14} /> ID verified
            </span>
          ) : (
            <Button
              className="admin-button"
              disabled={verificationPending}
              onClick={() => onVerify(member.id)}
              aria-label={`Verify ID for ${member.name}`}
            >
              {verifyingId === member.id && verificationPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Verifying…
                </>
              ) : (
                "Verify ID"
              )}
            </Button>
          )}
        </div>
        <div className="admin-member__attendance">
          {member.isAttended ? (
            <span className="admin-state admin-state--success">
              <Check size={14} /> Present
            </span>
          ) : (
            <Button
              className="admin-button admin-button--attendance"
              disabled={attendancePending}
              onClick={() => onAttend(member.id)}
              aria-label={`Mark ${member.name} present`}
            >
              {markingAttendance === member.id && attendancePending ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving…
                </>
              ) : (
                "Mark present"
              )}
            </Button>
          )}
        </div>
      </li>
    );
  }

  return (
    <article className="admin-team">
      <header className="admin-team__header">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3>{team.name}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="admin-icon-button"
              onClick={onEditName}
              aria-label={`Edit team name for ${team.name}`}
            >
              <Edit2 size={14} />
            </Button>
            <span
              className={`admin-state ${team.attended ? "admin-state--success" : "admin-state--pending"}`}
            >
              {team.attended ? (
                <>
                  <Check size={14} /> All present
                </>
              ) : (
                "Attendance pending"
              )}
            </span>
          </div>
          <div className="admin-team__meta">
            <span>
              <Building2 size={14} aria-hidden="true" />{" "}
              {team.College?.name ?? "College unassigned"}
            </span>
            {team.Leader?.name && (
              <span>
                <UserRound size={14} aria-hidden="true" /> {team.Leader.name}
              </span>
            )}
          </div>
        </div>
        <div className="admin-team__progress" aria-label="Participant progress">
          <span>
            <strong>
              {verified}/{team.TeamMembers.length}
            </strong>{" "}
            IDs verified
          </span>
          <span>
            <strong>
              {present}/{team.TeamMembers.length}
            </strong>{" "}
            present
          </span>
        </div>
      </header>

      <div className="admin-team__assignment">
        <div className="admin-assignment-field">
          <Label htmlFor={`prasanga-${team.id}`}>
            <BookOpen size={14} aria-hidden="true" /> Prasanga
          </Label>
          <AdminSelect
            id={`prasanga-${team.id}`}
            label={`Assign prasanga to ${team.name}`}
            disabled={assignmentDisabled || !prasangas?.length}
            value={team.Prasanga?.id ?? ""}
            onValueChange={onAssignPrasanga}
            placeholder="Assign prasanga"
            options={
              prasangas?.map((prasanga) => ({
                value: prasanga.id,
                label: prasanga.name,
              })) ?? []
            }
          />
        </div>
        {team.editRequested && (
          <div className="flex items-center gap-3">
            <Label htmlFor={`edit-access-${team.id}`}>Allow team edits</Label>
            <Switch
              id={`edit-access-${team.id}`}
              disabled={editAccessPending}
              checked={team.editRequested && !team.isComplete}
              onCheckedChange={onEditAccess}
            />
          </div>
        )}
      </div>

      <details className="admin-team__roster" open>
        <summary>
          <span>
            Participants{" "}
            <span className="admin-count">{team.TeamMembers.length}</span>
          </span>
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <div className="admin-roster-head" aria-hidden="true">
          <span>Participant</span>
          <span>Character</span>
          <span>ID proof</span>
          <span>Verification</span>
          <span>Attendance</span>
        </div>
        <ul aria-label={`Participants in ${team.name}`}>
          {leader && renderMember(leader, true)}
          {cast.map((member) => renderMember(member))}
        </ul>
        {cast.length === 0 && (
          <p className="admin-roster-empty">
            No cast registered yet. The team lead can enter character details
            when team formation is open.
          </p>
        )}
      </details>
    </article>
  );
}
