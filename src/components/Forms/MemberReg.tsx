"use client";

import type { Dispatch, SetStateAction } from "react";
import TeamMemberDetailsForm from "./TeamMemberDetailsForm";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "~/components/Button";

export default function MemberReg({
  setFormToShow,
}: {
  setFormToShow: Dispatch<SetStateAction<number>>;
}) {
  void setFormToShow;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add team characters</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] w-[95vw] max-w-2xl overflow-y-auto border-white/20 bg-slate-950 p-0 sm:w-full">
        <VisuallyHidden>
          <DialogTitle>Add team characters</DialogTitle>
        </VisuallyHidden>
        <TeamMemberDetailsForm />
      </DialogContent>
    </Dialog>
  );
}
