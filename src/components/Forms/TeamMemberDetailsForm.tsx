"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { uploadFile } from "~/utils/file";
import Dropzone from "~/components/Dropzone";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useToast } from "~/components/ui/use-toast";
import Image from "next/image";

type Member = {
  id?: string;
  characterName: string;
  name: string;
  idURL: string;
};
const blankMembers = () =>
  Array.from({ length: 8 }, () => ({ characterName: "", name: "", idURL: "" }));

export default function TeamMemberDetailsForm({
  edit = false,
}: {
  edit?: boolean;
}) {
  const { toast } = useToast();
  const team = api.team.getTeamForEdits.useQuery();
  const characters = api.team.getCharacters.useQuery({ edit });
  const utils = api.useUtils();
  const [members, setMembers] = useState<Member[]>([]);
  const [files, setFiles] = useState<(File & { preview: string })[][]>([]);
  const [uploading, setUploading] = useState<number | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (members.length || !team.data) return;
    const existing = team.data.TeamMembers.filter((member) =>
      Boolean(member.characterName ?? member.characterId !== null),
    ).map((member) => ({
      id: member.id,
      characterName: member.characterName ?? member.Character?.character ?? "",
      name: member.name,
      idURL: member.idURL,
    }));
    setMembers(existing.length ? existing : blankMembers());
  }, [members.length, team.data]);

  const save = api.team.updateTeam.useMutation({
    onSuccess: async () => {
      toast({ title: edit ? "Team updated" : "Team submitted" });
      await utils.team.getTeam.invalidate();
      await utils.team.getTeamForEdits.invalidate();
      window.location.reload();
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Could not save team",
        description: error.message,
      }),
  });
  const update = (index: number, field: keyof Member, value: string) =>
    setMembers((current) =>
      current.map((member, i) =>
        i === index ? { ...member, [field]: value } : member,
      ),
    );
  const add = () =>
    members.length < 10 &&
    setMembers([...members, { characterName: "", name: "", idURL: "" }]);
  const missingFields = (member: Member) =>
    [
      !member.characterName.trim() && "character name",
      !member.name.trim() && "person name",
      !member.idURL && "ID image",
    ].filter((field): field is string => Boolean(field));
  const submit = () => {
    setShowErrors(true);
    const incomplete = members
      .map((member, index) => ({ index, missing: missingFields(member) }))
      .filter(({ missing }) => missing.length > 0);
    if (incomplete.length > 0)
      return toast({
        variant: "destructive",
        title: "Incomplete character details",
        description: incomplete
          .slice(0, 3)
          .map(
            ({ index, missing }) =>
              "Character " + (index + 1) + ": add " + missing.join(", ") + ".",
          )
          .join(" "),
      });
    const complete = members.filter(
      (member) =>
        member.characterName.trim() && member.name.trim() && member.idURL,
    );
    if (complete.length < 8 || complete.length > 10)
      return toast({
        variant: "destructive",
        title: "Team must have 8–10 characters",
        description:
          "Complete between 8 and 10 character entries before submitting.",
      });
    if (
      new Set(
        complete.map((member) => member.characterName.trim().toLowerCase()),
      ).size !== complete.length
    )
      return toast({
        variant: "destructive",
        title: "Duplicate character name",
        description: "Each character name must be unique.",
      });
    save.mutate({
      members: complete.map(({ id, characterName, name, idURL }) => ({
        id,
        characterName: characterName.trim(),
        name: name.trim(),
        idURL,
      })),
      edit,
    });
  };

  if (team.isLoading || characters.isLoading)
    return <div className="p-6 text-white/70">Loading...</div>;
  if (!characters.data?.assigned)
    return (
      <div className="rounded-xl border border-white/10 p-6 text-white/70">
        An administrator must assign a Prasanga before you can add team
        characters.
      </div>
    );
  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-white sm:p-6">
      <div>
        <h2 className="text-xl font-bold">
          {edit ? "Edit team characters" : "Add team characters"}
        </h2>
        <p className="text-sm text-white/60">
          Prasanga: {characters.data.prasanga?.name}. Add 8 to 10 characters,
          the person playing each one, and their ID image.
        </p>
      </div>
      {members.map((member, index) => (
        <div
          key={member.id ?? index}
          className="space-y-3 rounded-xl border border-white/10 p-4"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold">Character {index + 1}</span>
            {members.length > 8 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setMembers(members.filter((_, i) => i !== index))
                }
              >
                Remove
              </Button>
            )}
          </div>
          {showErrors && missingFields(member).length > 0 && (
            <p className="text-xs text-red-300">
              Missing: {missingFields(member).join(", ")}.
            </p>
          )}
          <Input
            value={member.characterName}
            onChange={(event) =>
              update(index, "characterName", event.target.value)
            }
            placeholder="Character name"
            className="bg-slate-900 text-white"
          />
          <Input
            value={member.name}
            onChange={(event) => update(index, "name", event.target.value)}
            placeholder="Person playing the character"
            className="bg-slate-900 text-white"
          />
          {member.idURL ? (
            <div className="flex items-center gap-3">
              <Image
                src={member.idURL}
                alt="ID card"
                width={64}
                height={64}
                unoptimized
                className="h-16 w-16 rounded object-cover"
              />
              <button
                className="text-sm text-secondary-100"
                onClick={() => update(index, "idURL", "")}
              >
                Replace ID
              </button>
            </div>
          ) : (
            <Dropzone
              files={files[index] ?? []}
              setFiles={(next) => {
                const value =
                  typeof next === "function" ? next(files[index] ?? []) : next;
                setFiles((current) => {
                  const copy = [...current];
                  copy[index] = value;
                  return copy;
                });
                const file = value[0];
                if (!file) return;
                setUploading(index);
                void uploadFile(file)
                  .then((url) => update(index, "idURL", url))
                  .finally(() => setUploading(null));
              }}
            />
          )}
          {uploading === index && (
            <span className="text-xs text-white/60">Uploading...</span>
          )}
        </div>
      ))}
      <div className="flex flex-wrap justify-between gap-2">
        <Button
          variant="outline"
          onClick={add}
          disabled={members.length >= 10}
          className="border-white bg-white text-slate-950 hover:bg-white/90 hover:text-slate-950 disabled:border-white/10 disabled:bg-white/10 disabled:text-white/40"
        >
          Add character
        </Button>
        <Button onClick={submit} disabled={save.isPending}>
          {save.isPending ? "Saving..." : "Submit team"}
        </Button>
      </div>
    </div>
  );
}
