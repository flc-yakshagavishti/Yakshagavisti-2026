# Prasanga-Based Team Flow Design

**Date:** 2026-09-04  
**Status:** Draft for user review

## Problem

The application currently stores one global list of nine enum-backed characters. Team registration, team edits, judging, and results all assume that every team performs the same prasanga with the same characters. The 2026 flow requires administrators to configure multiple prasangas, assign one prasanga to each team, and have team character details and judging follow that assignment.

## Goals

- Allow administrators to create, rename, and remove prasangas.
- Allow administrators to add, rename, and remove character names within each prasanga.
- Allow administrators to assign one prasanga to each registered team.
- Reset a team's character details, completion state, and scores when its assignment changes.
- Make team registration and edit forms load only the assigned prasanga's characters.
- Preserve ID verification, attendance, team completion, and edit-request behavior.
- Make judge dashboards, score persistence, results, and leaderboards use the assigned prasanga's dynamic characters.
- Preserve existing data during migration by placing current enum characters in a default prasanga.

## Non-goals

- Team users will not manage prasangas or assignments.
- This change will not add new character-detail fields beyond participant name and ID-card image URL.
- Criteria remain the existing five `Criterias` records.
- No automatic reassignment or partial preservation of team member details is required; every reassignment is a full reset.

## Domain model

Replace the global enum character entity with configurable records:

- `Prasanga`: `id`, `name`, `createdAt`, and `updatedAt`; owns prasanga characters and assigned teams. Names are unique.
- `PrasangaCharacter`: `id`, `name`, `prasangaId`, `createdAt`, and `updatedAt`; belongs to exactly one prasanga. Character names are unique within a prasanga.
- `Team.prasangaId`: nullable during rollout so existing teams can wait for admin assignment; related to `Prasanga`.
- `TeamMembers.characterId`: references `PrasangaCharacter`.
- `IndividualScore.characterId`: references `PrasangaCharacter`.

The old `PlayCharacters` enum and its `Character` model will be removed from application use. A Prisma migration will create a default prasanga and copy each existing `Character` row into `PrasangaCharacter`, preserving references from existing team members and scores before removing the old table/enum. The migration must be reviewed against the deployed database before applying it; seed data will create the default prasanga and current characters for fresh databases.

A character cannot be deleted while referenced by team members or scores. The API will return a clear conflict error. Administrators can rename a character, which preserves references and scores.

## Server API and invariants

Add admin-only procedures in `admin.router`:

- `getPrasangas`: list prasangas, characters, and assignment counts.
- `createPrasanga`, `updatePrasanga`, `deletePrasanga`.
- `createPrasangaCharacter`, `updatePrasangaCharacter`, `deletePrasangaCharacter`.
- `assignPrasanga`: validate the team and prasanga, then in one transaction delete the team's `TeamMembers` and `IndividualScore` records, clear submitted judge records for the team, set `prasangaId`, set `isComplete` false, reset `attended` false, and clear the edit-request flag.
- `getRegisteredTeams` will include the team's prasanga and dynamic character names.

Deleting a prasanga is rejected when teams are assigned to it or when it has characters; administrators must reassign teams and remove characters first. An empty prasanga is valid, but teams assigned to it cannot complete registration until it has characters.

Update team procedures so that:

- `getCharacters` reads the leader's assigned prasanga and returns its characters; it returns an explicit unassigned state when no prasanga exists.
- `updateTeam` verifies every submitted character belongs to the leader's assigned prasanga and rejects duplicate or incomplete submissions.
- `getTeam` and `getTeamForEdits` include assignment and dynamic character details.
- Existing leader-only checks and edit-request checks remain in force.

Update jury procedures so that:

- `getTeams` returns assigned, complete, attended teams with their prasanga and characters.
- `getScores` returns dynamic character records.
- `updateScores` accepts a character record ID, validates that it belongs to the selected team's assigned prasanga, and upserts the score without creating global characters.
- `scoresUpdate` accepts dynamic character IDs/names as appropriate for the client, validates them against the selected team, and persists the same existing score shape.

## Client flows

### Admin

Add a Prasangas tab to the existing admin dashboard. It will provide a list/detail management view with create, edit, and delete actions for prasangas and their character names. The Teams tab will show the current assignment and a prasanga selector for every team. Changing the selector requires confirmation because it resets details, verification, attendance, and scores.

Existing ID-card preview, ID verification, attendance, edit-access switch, team-name editing, and PDF export remain available. The export will include the assigned prasanga and dynamic character names.

### Team

The existing character-detail components will consume the assigned character list. An unassigned team sees a waiting message instead of a form. An assigned team sees one form section per configured character and must provide the existing participant name and ID-card image before submission. The edit-request flow continues to gate later changes through the current `isComplete` and `editRequested` state.

The initial leader registration remains compatible with the current staged flow; it will select and persist a character from the assigned prasanga rather than the old enum list. The team cannot submit character details before assignment.

### Jury and results

The judge team selector will expose each team's assigned prasanga. The score table will be generated from that team's character records, displaying their configured names. Results and leaderboards will query and display dynamic character names and prasanga names without changing score calculations or criteria behavior. Hardcoded character arrays and enum-specific score schemas will be removed.

## Reset and deletion behavior

Assignment changes always use a database transaction. The reset removes all team member detail records, all team scores, and judge submissions for that team; then marks the team incomplete and not attended. Existing team identity, college, leader, and edit-request infrastructure remain intact. The admin UI will state this behavior before confirmation.

Character deletion is intentionally conservative: referenced characters cannot be removed. This prevents scores and verification history from becoming invalid. Unreferenced characters can be removed.

## Migration and compatibility

The migration must be ordered so foreign-key references are not lost:

1. Create `Prasanga` and `PrasangaCharacter`.
2. Create a default prasanga and copy existing enum character values.
3. Add nullable `Team.prasangaId`.
4. Copy `TeamMembers` and `IndividualScore` character references to the new records.
5. Switch application relations and indexes to `PrasangaCharacter`.
6. Remove the obsolete `Character` model and `PlayCharacters` enum after references are migrated.

Existing teams remain unassigned until an administrator assigns them. Existing character details remain linked to their migrated default prasanga characters; assigning a new prasanga then resets them according to the defined behavior.

## Error handling

Use `TRPCError` with `BAD_REQUEST` or `CONFLICT` for invalid names, duplicate names, missing assignments, invalid character/team combinations, deletion conflicts, and reassignment confirmation failures. Client mutations display the existing toast/alert style and refetch affected lists after success. A missing assignment is a normal configuration state, not a server error.

## Verification strategy

Server seams to test:

- Admin prasanga and character CRUD.
- Assignment transaction reset behavior.
- Team character loading and submission validation.
- Rejection of unassigned and cross-prasanga character submissions.
- Dynamic judge character loading and score validation.
- Preservation of verification, attendance, and edit-request behavior.

Run `npm run typecheck`, formatting checks, and a production build. Run the application and exercise the admin, team, and judge flows end to end in a browser, including reassignment/reset and unassigned states. Check desktop and mobile viewport sizes for the changed admin and judge interfaces.

## Open implementation notes

- The exact Prisma migration SQL must be generated from the final schema and checked for data-preserving ordering because the repository currently has no committed migration directory.
- Existing route paths and locale handling will be preserved; no new page route is required unless the admin tab becomes too large for the current dashboard component.
