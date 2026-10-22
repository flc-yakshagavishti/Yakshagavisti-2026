type CharacterRecord = {
  id: string;
  character: string;
};

type TeamMemberRecord = {
  id?: string;
  characterId?: string | null;
  characterName?: string | null;
};

export type JudgeCharacter = {
  memberId: string;
  characterId: string | undefined;
  character: string;
};

export function resolveJudgeCharacters(
  members: TeamMemberRecord[],
  prasangaCharacters: CharacterRecord[],
): JudgeCharacter[] {
  const byId = new Map(
    prasangaCharacters.map((character) => [character.id, character]),
  );
  const byName = new Map(
    prasangaCharacters.map((character) => [
      character.character.trim().toLowerCase(),
      character,
    ]),
  );
  const playableMembers = members.filter(
    (member) => member.characterId ?? member.characterName?.trim(),
  );

  if (
    playableMembers.length !== 10 ||
    playableMembers.some((member) => !member.id)
  ) {
    throw new Error("Team must have exactly 10 playable characters.");
  }

  const resolved = playableMembers.map((member) => {
    const configuredCharacter =
      (member.characterId ? byId.get(member.characterId) : undefined) ??
      (member.characterName
        ? byName.get(member.characterName.trim().toLowerCase())
        : undefined);
    return {
      memberId: member.id!,
      characterId: configuredCharacter?.id,
      character:
        member.characterName?.trim() ?? configuredCharacter?.character ?? "",
    };
  });

  if (
    resolved.some((character) => !character.character) ||
    new Set(resolved.map((character) => character.character.toLowerCase()))
      .size !== resolved.length
  ) {
    throw new Error("Playable character names must be unique and non-empty.");
  }

  return resolved;
}

export function resolvePlayableCharacters(
  members: TeamMemberRecord[],
  prasangaCharacters: CharacterRecord[],
): CharacterRecord[] {
  const byId = new Map(
    prasangaCharacters.map((character) => [character.id, character]),
  );
  const byName = new Map(
    prasangaCharacters.map((character) => [
      character.character.trim().toLowerCase(),
      character,
    ]),
  );
  const resolved: CharacterRecord[] = [];

  for (const member of members) {
    const character =
      (member.characterId ? byId.get(member.characterId) : undefined) ??
      (member.characterName
        ? byName.get(member.characterName.trim().toLowerCase())
        : undefined);

    if (character) {
      resolved.push(character);
    } else if (member.characterId || member.characterName?.trim()) {
      throw new Error("Team contains a character outside its prasanga.");
    }
  }

  const uniqueIds = new Set(resolved.map((character) => character.id));
  if (resolved.length !== 10 || uniqueIds.size !== 10) {
    throw new Error("Team must have exactly 10 unique playable characters.");
  }

  return resolved;
}

export function calculateJudgeTotal(
  scores: Record<string, Record<string, number>>,
): number {
  return Object.values(scores).reduce(
    (total, characterScores) =>
      total +
      Object.values(characterScores).reduce((sum, score) => sum + score, 0),
    0,
  );
}
