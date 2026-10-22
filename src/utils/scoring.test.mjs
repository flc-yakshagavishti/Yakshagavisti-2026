import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateJudgeTotal,
  resolveJudgeCharacters,
  resolvePlayableCharacters,
} from "./scoring.ts";

const characters = Array.from({ length: 10 }, (_, index) => ({
  id: `character-${index + 1}`,
  character: `Character ${index + 1}`,
}));

test("resolves ten playable members while excluding a lead without a character", () => {
  const members = [
    { id: "lead", characterId: null, characterName: null },
    ...characters.map((character) => ({
      id: `member-${character.id}`,
      characterId: null,
      characterName: character.character,
    })),
  ];

  assert.deepEqual(resolvePlayableCharacters(members, characters), characters);
});

test("rejects missing, duplicate, or foreign playable characters", () => {
  assert.throws(() =>
    resolvePlayableCharacters(
      characters.slice(0, 9).map((character) => ({
        characterId: character.id,
        characterName: character.character,
      })),
      characters,
    ),
  );

  assert.throws(() =>
    resolvePlayableCharacters(
      [
        ...characters.map((character) => ({
          characterId: character.id,
          characterName: character.character,
        })),
        { characterId: "foreign", characterName: "Foreign" },
      ],
      characters,
    ),
  );
});

test("calculates a judge total across all fifty score cells", () => {
  const scores = Object.fromEntries(
    characters.map((character) => [
      character.id,
      Object.fromEntries(
        [
          "CRITERIA_1",
          "CRITERIA_2",
          "CRITERIA_3",
          "CRITERIA_4",
          "CRITERIA_5",
        ].map((criteria) => [criteria, 20]),
      ),
    ]),
  );

  assert.equal(calculateJudgeTotal(scores), 1000);
});

test("uses ten entered team members even when the prasanga catalog is incomplete", () => {
  const members = [
    { id: "lead", characterId: null, characterName: null },
    ...Array.from({ length: 10 }, (_, index) => ({
      id: `member-${index + 1}`,
      characterId: null,
      characterName: `Entered Character ${index + 1}`,
    })),
  ];

  assert.deepEqual(
    resolveJudgeCharacters(members, [
      { id: "configured-1", character: "Entered Character 1" },
    ]),
    Array.from({ length: 10 }, (_, index) => ({
      memberId: `member-${index + 1}`,
      characterId: index === 0 ? "configured-1" : undefined,
      character: `Entered Character ${index + 1}`,
    })),
  );
});
