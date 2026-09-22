import assert from "node:assert/strict";
import { validateSubmittedTeamMembers } from "./teamMembers.ts";

const member = (characterName) => ({
  characterName,
  name: "Participant",
  idURL: "https://example.com/id.jpg",
});

assert.throws(() => validateSubmittedTeamMembers(Array.from({ length: 7 }, (_, i) => member(`C${i}`))));
assert.doesNotThrow(() => validateSubmittedTeamMembers(Array.from({ length: 8 }, (_, i) => member(`C${i}`))));
assert.throws(() => validateSubmittedTeamMembers([...Array.from({ length: 7 }, (_, i) => member(`C${i}`)), member("C0")]));
