# Non-Destructive Judge Scoring Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement this plan task-by-task. No commit is required; keep all changes uncommitted.

**Goal:** Make judging, score persistence, submission, admin results, leaderboards, and judge routing work for the existing teams with 10 playable characters plus a separate team lead, without deleting or resetting production data.

**Architecture:** Reuse the existing `Prasanga`/`Character`, `TeamMembers`, `IndividualScore`, and `Submitted` tables. Normalize existing team-member character names to prasanga character IDs at score time, so teams whose `characterId` is unset remain scoreable. Keep the existing five criteria and calculate team totals out of 1,000 per judge.

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma 6, tRPC 11, Zod, NextAuth.

**Spec:** Approved in conversation on 2026-10-20; existing data preservation is mandatory.

## Global Constraints

- Do not add or run a Prisma migration.
- Do not delete, reset, reassign, or update existing team/member/score/submission records as part of this work.
- Do not change team registration or prasanga configuration behavior except where required to read existing data safely.
- The team lead is not a scored character; score exactly the 10 playable characters already entered for each team.
- Preserve the five existing criteria, each scored from 0 to 20.
- Judge score submission must be atomic and must reject incomplete or cross-prasanga character data.
- Judge sessions must be redirected to the judge panel, including localized routes.

## Review Focus

- Existing team members with `characterId = null` but a valid `characterName` must score successfully.
- A team with exactly 10 playable characters must have a maximum score of 1,000 per judge.
- A malformed/cross-team character ID must be rejected without writing scores.
- Resubmission must not be possible after a submitted record is marked true.
- A judge must not remain on admin/results/team routes after session hydration.

---

### Task 1: Add pure scoring and character-resolution helpers

**Files:**

- Create: `src/utils/scoring.ts`
- Create: `src/utils/scoring.test.mjs`

**Interfaces:**

- `resolvePlayableCharacters(members, prasangaCharacters)` returns the 10 non-lead character records matched by ID or trimmed case-insensitive name.
- `calculateJudgeTotal(scores)` sums score values and supports the 1,000 maximum.

- [ ] Write failing tests for resolving name-only members, excluding a lead member, rejecting duplicates/missing characters, and summing 50 score cells.
- [ ] Run the focused test and observe the expected failure.
- [ ] Implement the helpers without database access.
- [ ] Run the focused test and verify it passes.

### Task 2: Make jury score APIs safe and compatible

**Files:**

- Modify: `src/server/api/routers/jury.router.ts`

**Interfaces:**

- `getTeams()` returns only eligible teams and includes their prasanga characters and member records.
- `getScores({ teamId })` returns existing judge scores and submission state.
- `updateScores()` resolves existing member names to character IDs before upserting.
- `scoresUpdate()` validates exactly the selected team’s 10 playable characters, creates missing criteria rows if necessary, upserts all 50 cells in a transaction, and submits once.

- [ ] Add tests around the pure validation/resolution seam before changing the router.
- [ ] Ensure an already-submitted team cannot be changed by the judge.
- [ ] Ensure incomplete bulk payloads and cross-prasanga IDs fail before writes.
- [ ] Preserve remarks and score range validation.

### Task 3: Restore dynamic judge submission UI

**Files:**

- Modify: `src/app/[locale]/dashboard/jury/page.tsx`
- Modify: `src/components/Jury/submit.tsx`
- Modify: `src/components/Jury/score.tsx` only if its stale fixed-character path is still reachable

**Interfaces:**

- Judge score state is keyed by dynamic character IDs, while display uses the selected team’s character names.
- Submit confirmation invokes the safe bulk mutation and disables editing after success.

- [ ] Replace stale `PlayCharacters` typing and fixed-character assumptions.
- [ ] Re-enable the confirmation/submit flow.
- [ ] Show the selected prasanga and 10 playable characters; do not show the team lead as a score row.
- [ ] Keep debounce autosave, field validation, remarks, and post-submit read-only state.

### Task 4: Fix admin results and leaderboards for dynamic 10-character teams

**Files:**

- Modify: `src/server/api/routers/admin.router.ts`
- Modify: `src/app/[locale]/admin/leaderboard/page.tsx`
- Modify: `src/app/[locale]/dashboard/results/page.tsx` only if reachable and still fixed-character based

**Interfaces:**

- Team leaderboard reports averages out of 1,000 and counts playable characters dynamically.
- Character leaderboard groups by prasanga plus character name and reports averages out of 100.
- Admin detail views show the performer name using either `characterId` or `characterName`.

- [ ] Write/update tests for 3-judge team averaging and dynamic character grouping.
- [ ] Update `/900`, `/9`, fixed character arrays, and stale enum assumptions.
- [ ] Ensure the all-submitted check only counts eligible complete/attended teams and registered judges.
- [ ] Keep admin-only authorization intact.

### Task 5: Verify localized judge routing and the full change

**Files:**

- Modify: `src/components/Layout/secondWrapper.tsx`
- Add tests only where the repository’s existing test style supports them.

- [ ] Normalize locale-prefixed paths without console noise or redirect loops.
- [ ] Ensure a judge visiting admin/results/other dashboard routes is sent to the judge panel.
- [ ] Run focused tests, `npm run typecheck`, `npm run format:check`, and `npm run build`.
- [ ] Inspect `git diff` and confirm no migration or destructive data operation was added.
