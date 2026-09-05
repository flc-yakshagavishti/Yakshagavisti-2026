# Prasanga-Based Team Flow Implementation Plan

> **For agentic workers:** Implement task-by-task with verification checkpoints. No commits are to be created for this work because the user explicitly requested that changes remain uncommitted.

**Goal:** Replace the fixed global character list with configurable prasangas and prasanga-scoped characters across admin management, team registration/editing, judging, and results.

**Architecture:** Add `Prasanga` and `PrasangaCharacter` Prisma models, migrate the existing `Character` records into a default prasanga, and make `TeamMembers`/`IndividualScore` reference dynamic character records. Extend the existing tRPC routers and dashboard components rather than adding unrelated routes; assignment changes run transactionally and reset team details, scores, submissions, completion, and attendance.

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma 6, PostgreSQL, tRPC 11, Zod, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-09-04-prasanga-based-team-flow-design.md`

## Global Constraints

- Existing verification, attendance, completion, and edit-request behavior remains available.
- Team reassignment is destructive: remove member details and scores, clear judge submissions, set incomplete/not attended, and clear edit requests.
- Dynamic character names are scoped to a prasanga and must be validated server-side.
- Existing enum character data must be preserved through migration into a default prasanga.
- No commits are created during implementation.
- Changed web flows must be exercised in a browser when browser tooling is available; otherwise use the closest available server/build verification.

---

### Task 1: Replace the character data model

**Files:**

- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`
- Create: `prisma/migrations/<generated-migration>/migration.sql` through Prisma tooling when the final schema is ready

**Interfaces:**

- Produces `Prasanga`, `PrasangaCharacter`, `Team.prasangaId`, and dynamic relations consumed by routers.

- [ ] Add `Prasanga` and `PrasangaCharacter` models with unique prasanga names and compound unique character names per prasanga.
- [ ] Change `TeamMembers.characterId` and `IndividualScore.characterId` relations to `PrasangaCharacter`.
- [ ] Add nullable `Team.prasangaId` and relation.
- [ ] Remove application dependence on `PlayCharacters` and the old `Character` model after migration.
- [ ] Update seed data to create a default prasanga and its existing nine characters.
- [ ] Generate and inspect the Prisma migration; preserve old rows by creating a default prasanga and copying old character records before replacing foreign keys.
- [ ] Run `npx prisma validate` and `npx prisma generate`.

### Task 2: Add admin prasanga and assignment procedures

**Files:**

- Modify: `src/server/api/routers/admin.router.ts`

**Interfaces:**

- `getPrasangas()` returns prasangas with characters and assigned-team counts.
- CRUD procedures accept IDs/names as Zod-validated strings.
- `assignPrasanga({ teamId, prasangaId })` performs the complete reset in one transaction.
- `getRegisteredTeams()` returns each team’s prasanga and dynamic member character names.

- [ ] Add admin-only prasanga/character list and CRUD procedures.
- [ ] Reject duplicate names and invalid empty names.
- [ ] Reject deleting a prasanga with assigned teams or characters.
- [ ] Reject deleting a character referenced by members or scores.
- [ ] Implement assignment reset transaction and return the updated team.
- [ ] Include prasanga fields in registered team data and PDF-facing query data.
- [ ] Run type generation/typecheck after router changes.

### Task 3: Make team character loading and submission dynamic

**Files:**

- Modify: `src/server/api/routers/teams.router.ts`
- Modify: `src/components/Forms/MainForm.tsx` if leader registration needs assignment-aware character selection
- Modify: `src/components/Forms/MemberReg.tsx`
- Modify: `src/components/Forms/EditTeam.tsx`
- Modify: `src/components/Forms/AccordionForm.tsx` only where dynamic labels/types require it

**Interfaces:**

- `getCharacters({ edit? })` returns the leader’s assigned prasanga and its characters, or an explicit unassigned state.
- `updateTeam({ members, edit? })` accepts dynamic character IDs and rejects characters outside the assigned prasanga or incomplete submissions.
- Team forms render the returned character names and IDs without enum assumptions.

- [ ] Resolve the leader’s team and assigned prasanga before loading characters.
- [ ] Validate duplicate IDs, exact assigned-character coverage, and assignment presence in `updateTeam`.
- [ ] Preserve edit-request and leader-only checks.
- [ ] Remove enum/string replacement assumptions in form indexing and local storage handling.
- [ ] Show a waiting-for-assignment state when no prasanga is assigned.
- [ ] Verify clear/resubmit and existing edit access behavior locally.

### Task 4: Make judging dynamic

**Files:**

- Modify: `src/server/api/routers/jury.router.ts`
- Modify: `src/app/[locale]/dashboard/jury/page.tsx`
- Modify: `src/components/Jury/score.tsx` and/or `src/components/Jury/submit.tsx` if their props are enum-specific

**Interfaces:**

- `jury.getTeams()` includes assigned prasanga and its characters.
- `jury.getScores({ teamId })` returns dynamic character records.
- `jury.updateScores({ teamId, criteriaName, characterId, score })` accepts a dynamic character record ID and validates team ownership.
- Bulk score updates use dynamic character IDs/names and preserve existing criteria calculations.

- [ ] Remove the hardcoded character score schema and enum imports.
- [ ] Validate selected teams are complete, attended, and assigned.
- [ ] Generate score state and table rows from the selected team’s characters.
- [ ] Validate character IDs belong to the selected team’s prasanga before upserting.
- [ ] Keep score limits, debounce behavior, submitted state, and remarks intact.
- [ ] Update result/leaderboard queries and UI labels to use dynamic character and prasanga names.

### Task 5: Add admin UI for prasangas and assignments

**Files:**

- Modify: `src/app/[locale]/admin/page.tsx`

**Interfaces:**

- New admin tab manages prasanga and character records using the procedures from Task 2.
- Teams tab assigns a prasanga with destructive-reset confirmation.
- Existing team verification, attendance, edit access, team editing, and export remain usable.

- [ ] Add queries/mutations and local dialog state for prasanga CRUD.
- [ ] Render prasanga list with inline character management and clear empty states.
- [ ] Add assignment selector to each team card and confirmation dialog describing the reset.
- [ ] Show assigned prasanga in team cards and include it in exported PDF data.
- [ ] Refetch relevant queries after every successful mutation and preserve authorization fallback.
- [ ] Check the UI at desktop and mobile widths.

### Task 6: Validate all flows

**Files:**

- Modify or create tests only if the repository’s test runner is available and configured.

- [ ] Run `npx prisma validate` and `npx prisma generate`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run format:check` and fix only feature-related formatting failures.
- [ ] Run `npm run build`.
- [ ] Start the app and exercise admin prasanga CRUD, team assignment, reassignment reset, team unassigned state, dynamic team form, judge selection/scoring, and existing verification/edit request paths.
- [ ] Inspect `git diff` and `git status`; ensure no commit was created and no unrelated files changed.
