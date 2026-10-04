export type SubmittedTeamMember = {
  characterName: string;
  name: string;
  idURL: string;
};

export function validateSubmittedTeamMembers(members: SubmittedTeamMember[]) {
  if (members.length < 8 || members.length > 10) {
    throw new Error("A team must have between 8 and 10 characters.");
  }

  const names = members.map((member) =>
    member.characterName.trim().toLowerCase(),
  );
  if (
    members.some(
      (member) =>
        !member.characterName.trim() ||
        !member.name.trim() ||
        !member.idURL.trim(),
    )
  ) {
    throw new Error(
      "Each character needs a character name, person name, and ID image.",
    );
  }
  if (new Set(names).size !== names.length) {
    throw new Error("Character names must be unique within a team.");
  }
}
