import React, { type Dispatch, type SetStateAction, useState } from "react";
import { Button } from "~/components/ui/button";
import { Form, FormField, FormLabel } from "~/components/ui/form";
import Dropzone from "../Dropzone";
import * as z from "zod";
import { useToast } from "../ui/use-toast";
import { useForm } from "react-hook-form";
import { Input } from "../ui/input";
import Image from "next/image";
import { uploadFile } from "~/utils/file";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { ImSpinner9 } from "react-icons/im";
import { FiUser, FiCreditCard } from "react-icons/fi";

type Members = {
  name: string;
  characterId: string;
  idURL: string;
};

export default function AccordianForm({
  MembersArray,
  setMembersArray,
  index,
  characterId,
}: {
  MembersArray: Members[];
  setMembersArray: Dispatch<SetStateAction<Members[]>>;
  index: number;
  characterId: string;
}) {
  const [teammateName, setTeammateName] = useState(
    MembersArray[index]?.name ?? "",
  );
  const [uploadStatus, setUploadStatus] = useState("");
  const [files, setFiles] = useState<(File & { preview: string })[]>([]);
  const { toast } = useToast();
  const form2 = useForm();

  const handleUpload = async (index: number) => {
    setUploadStatus("Uploading....");
    try {
      if (MembersArray[index]?.idURL) {
        setUploadStatus("Upload Successful");
        return MembersArray[index]?.idURL;
      }
      if (files[0] instanceof File) {
        const result = await uploadFile(files[0]);
        setUploadStatus("Upload Successful");
        return result;
      }
    } catch (error) {
      console.log(error);
      setUploadStatus("Upload Failed...");
    }
  };

  const FieldValidation = () => {
    if (!teammateName.trim()) {
      toast({
        variant: "destructive",
        title: "Name required!",
        description: "Please enter the name of the team member.",
      });
      return false;
    }

    if (teammateName.trim().length < 3) {
      toast({
        variant: "destructive",
        title: "Invalid Name!",
        description: "Name must be at least 3 characters.",
      });
      return false;
    }

    if (!MembersArray[index]?.idURL) {
      if (files.length === 0) {
        toast({
          variant: "destructive",
          title: "No ID uploaded!",
          description: "Please upload the teammate's ID card.",
        });
        return false;
      }
    }

    if (files.length > 1) {
      toast({
        variant: "destructive",
        title: "Only one ID allowed!",
        description: "Please upload only one ID card image.",
      });
      return false;
    }
    return true;
  };

  const setTeamMember = async (
    characterId: string,
    character_index: number,
  ) => {
    const idURL = await handleUpload(character_index);
    const data: Members = {
      name: teammateName.trim(),
      characterId: characterId,
      idURL: z.string().parse(idURL ?? MembersArray[index]?.idURL ?? ""),
    };

    const array = [...MembersArray];
    array[character_index] = data;
    localStorage.setItem("members", JSON.stringify(array));
    setMembersArray(array);
    setUploadStatus("");
    toast({
      variant: "default",
      title: "Teammate Saved",
      description: `Details saved for this character.`,
    });
    setFiles([]);
  };

  const isAlreadyFilled = Boolean(
    MembersArray[index]?.name && MembersArray[index]?.idURL,
  );

  return (
    <Form {...form2}>
      <form className="space-y-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 sm:p-5">
        <FormField
          control={form2.control}
          name="Role"
          render={() => (
            <div className="flex flex-col space-y-4">
              {/* Teammate Name */}
              <div className="space-y-1.5">
                <FormLabel className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/80">
                  <FiUser className="text-secondary-100" />
                  Teammate Full Name
                </FormLabel>
                <Input
                  id="Teammate_Name"
                  placeholder="e.g. Ramesh Kumar"
                  className="h-10 rounded-lg border-white/20 bg-slate-900/80 text-sm text-white placeholder:text-white/30 focus:border-secondary-100 focus:ring-1 focus:ring-secondary-100"
                  type="text"
                  defaultValue={MembersArray[index]?.name}
                  onChange={(e) => {
                    setTeammateName(e.target.value);
                  }}
                />
              </div>

              {/* ID Card Upload */}
              <div className="space-y-1.5">
                <FormLabel className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/80">
                  <FiCreditCard className="text-secondary-100" />
                  ID Card Proof
                </FormLabel>

                <div>
                  {!MembersArray[index]?.idURL && (
                    <Dropzone files={files} setFiles={setFiles} />
                  )}

                  {MembersArray[index]?.idURL && (
                    <div className="flex items-center gap-4 rounded-xl border border-white/15 bg-slate-900/70 p-2.5">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/20 bg-black">
                        <Image
                          src={MembersArray[index]?.idURL ?? ""}
                          alt="Teammate ID"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-xs font-medium text-white/90">
                          ID Card Uploaded
                        </span>
                        <a
                          href={MembersArray[index]?.idURL}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-secondary-100 hover:underline"
                        >
                          Click to preview full image
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const members = [...MembersArray];
                          if (members[index]) {
                            members[index].idURL = "";
                          }
                          setFiles([]);
                          setMembersArray(members);
                          localStorage.setItem(
                            "members",
                            JSON.stringify(members),
                          );
                        }}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/20"
                      >
                        Replace
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        />

        <div className="flex justify-end pt-1">
          {uploadStatus === "Uploading...." ? (
            <Button
              size="sm"
              disabled
              className="inline-flex items-center gap-2 rounded-lg bg-secondary-100 px-4 py-2 text-xs font-medium text-black"
            >
              <ImSpinner9 className="animate-spin" /> Saving...
            </Button>
          ) : (
            <Button
              size="sm"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-secondary-100/40 bg-secondary-100/20 px-4 py-2 text-xs font-semibold text-secondary-100 transition-all hover:bg-secondary-100 hover:text-black"
              onClick={(e) => {
                e.preventDefault();
                if (FieldValidation()) {
                  void setTeamMember(characterId, index);
                }
              }}
            >
              <IoCheckmarkCircleOutline className="text-base" />
              {isAlreadyFilled ? "Update Teammate" : "Save Teammate"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
