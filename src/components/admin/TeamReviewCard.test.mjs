import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TeamReviewCard } from "./TeamReviewCard.tsx";

const member = (id, name, characterName) => ({
  id,
  name,
  characterName,
  characterId: null,
  Character: null,
  contact: "",
  idURL: "",
  isIdVerified: false,
  isAttended: false,
});
const leader = member("leader", "Team lead", null);
const cast = member("cast", "Cast member", "Sudhanva");
const team = {
  id: "team",
  name: "Test team",
  College: { name: "Test college" },
  Leader: { name: "Team lead" },
  Prasanga: null,
  attended: false,
  isComplete: true,
  editRequested: true,
  TeamMembers: [leader, cast],
};
const noop = () => {};
const props = {
  team,
  prasangas: [{ id: "prasanga", name: "Test prasanga" }],
  assignmentDisabled: false,
  editAccessPending: false,
  verificationPending: false,
  attendancePending: false,
  verifyingId: "",
  markingAttendance: "",
  onEditName: noop,
  onAssignPrasanga: noop,
  onEditAccess: noop,
  onVerify: noop,
  onAttend: noop,
  onViewId: noop,
  onEditCharacter: noop,
};
const render = (overrides = {}) =>
  renderToStaticMarkup(
    createElement(TeamReviewCard, { ...props, ...overrides }),
  );

function button(html, label) {
  const result = html.match(
    new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`),
  );
  assert.ok(result, `Missing action: ${label}`);
  return result[0];
}

test("leader and cast retain separate labelled review actions", () => {
  const html = render();
  assert.match(html, /aria-label="Participants in Test team"/);
  assert.equal((html.match(/class="admin-member"/g) ?? []).length, 2);
  for (const name of ["Team lead", "Cast member"]) {
    assert.match(button(html, `Verify ID for ${name}`), /type="button"/);
    assert.match(button(html, `Mark ${name} present`), /type="button"/);
  }
  button(html, "Edit character for Cast member");
  assert.doesNotMatch(html, /aria-label="Edit character for Team lead"/);
  assert.match(html, /No ID uploaded/);
});

test("pending mutations disable review and assignment controls", () => {
  const html = render({
    verificationPending: true,
    attendancePending: true,
    assignmentDisabled: true,
    verifyingId: "cast",
    markingAttendance: "leader",
  });
  for (const name of ["Team lead", "Cast member"]) {
    assert.match(button(html, `Verify ID for ${name}`), /disabled=""/);
    assert.match(button(html, `Mark ${name} present`), /disabled=""/);
  }
  assert.match(button(html, "Assign prasanga to Test team"), /role="combobox"/);
  assert.match(button(html, "Assign prasanga to Test team"), /disabled=""/);
  assert.match(html, /Verifying…/);
  assert.match(html, /Saving…/);
});

test("custom assignment trigger shows its selected label and disables an empty catalog", () => {
  const assigned = render({
    team: { ...team, Prasanga: props.prasangas[0] },
  });
  assert.match(
    button(assigned, "Assign prasanga to Test team"),
    /role="combobox"/,
  );
  assert.match(assigned, />Test prasanga<\/span>/);
  assert.doesNotMatch(
    button(assigned, "Assign prasanga to Test team"),
    /disabled=""/,
  );
  assert.match(
    button(render({ prasangas: [] }), "Assign prasanga to Test team"),
    /disabled=""/,
  );
});

test("completed review actions become readable statuses and accurate counts", () => {
  const html = render({
    team: {
      ...team,
      attended: true,
      TeamMembers: team.TeamMembers.map((entry) => ({
        ...entry,
        isIdVerified: true,
        isAttended: true,
      })),
    },
  });
  assert.match(html, /All present/);
  assert.match(html, /<strong>2\/2<\/strong> IDs verified/);
  assert.match(html, /<strong>2\/2<\/strong> present/);
  assert.doesNotMatch(
    html,
    /aria-label="Verify ID for|aria-label="Mark .* present"/,
  );
});

test("a team without cast shows guidance without hiding its leader", () => {
  const html = render({ team: { ...team, TeamMembers: [leader] } });
  assert.match(html, /No cast registered yet/);
  button(html, "Verify ID for Team lead");
  assert.equal((html.match(/class="admin-member"/g) ?? []).length, 1);
});
