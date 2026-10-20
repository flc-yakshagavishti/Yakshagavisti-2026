"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableHeader,
} from "~/components/ui/table";
import { api } from "~/trpc/react";
import { type Dispatch, type SetStateAction, useState } from "react";
import type { Criterias } from "@prisma/client";
import { toast } from "react-hot-toast";

type ScoresState = Record<string, Record<Criterias, number>>;

const Submit = ({
  scores,
  teamId,
  teamName,
  criteriaDisplayList,
  criteriaList,
  characters,
  setScored,
  charactersDisplay,
}: {
  scores: ScoresState;
  teamId: string;
  teamName: string;
  criteriaDisplayList: string[];
  criteriaList: Criterias[];
  characters: string[];
  setScored: Dispatch<SetStateAction<boolean>>;
  charactersDisplay: string[];
}) => {
  const scoresUpdate = api.jury.scoresUpdate.useMutation();
  const [open, setOpen] = useState<boolean>(false);
  const ctx = api.useContext();

  const saveScores = () => {
    scoresUpdate.mutate(
      {
        scores,
        characters,
        criteria: criteriaList,
        teamId,
      },
      {
        onSuccess: () => {
          void ctx.jury.getScores.invalidate({ teamId });
          setScored(true);
          setOpen(false);
          toast.success("Scores submitted successfully");
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const totalScore = (character: string) => {
    if (scores[character] != null) {
      const keys = criteriaList;
      let sum = 0;
      keys.forEach((key) => {
        sum += scores[character]?.[key] ?? 0;
      });
      return sum;
    }
    return 0;
  };

  const checkIfAllFieldsIsScored = () => {
    let flag = 0;
    characters.forEach((character) => {
      criteriaList.forEach((criteria) => {
        if (
          scores[character]?.[criteria] === undefined ||
          scores[character]?.[criteria] === 999
        )
          flag = 1;
      });
    });
    if (flag === 1) {
      toast.error("Please enter scores in all the fields", {
        position: "bottom-center",
      });
    } else {
      void ctx.jury.getScores.invalidate();
      setOpen(true);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Button
        onClick={checkIfAllFieldsIsScored}
        disabled={scoresUpdate.isPending}
        className="h-11 w-full bg-secondary-200 font-semibold text-white hover:bg-secondary-200/90 sm:w-auto sm:min-w-36"
      >
        Review & submit
      </Button>
      {open ? (
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-white/10 bg-[#211d3d] p-4 text-white shadow-2xl focus:outline-none sm:p-6">
            <Dialog.Title className="border-b border-white/10 pb-4 text-xl font-semibold sm:text-2xl">
              Scores of {teamName}
            </Dialog.Title>
            <div className="mt-4">
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[700px] text-white">
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead>ಪಾತ್ರ</TableHead>
                      {criteriaDisplayList.map((criteria, i) => (
                        <TableHead key={i} className="text-center">
                          {criteria}
                        </TableHead>
                      ))}
                      <TableHead className="text-center">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {characters.map((character, i) => (
                      <TableRow key={i} className="border-white/10">
                        <TableCell className="font-medium">
                          {charactersDisplay[i]}
                        </TableCell>
                        {criteriaList.map((criteria, j) => (
                          <TableCell
                            key={j}
                            className="text-center text-white/75"
                          >
                            {scores[character]?.[criteria] ?? 0}/20
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-semibold text-secondary-100">
                          {totalScore(character)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
                  <Dialog.Close asChild>
                    <Button
                      onClick={saveScores}
                      disabled={scoresUpdate.isPending}
                      className="bg-secondary-200 text-white hover:bg-secondary-200/90"
                    >
                      {scoresUpdate.isPending
                        ? "Submitting…"
                        : "Confirm submission"}
                    </Button>
                  </Dialog.Close>
                  <p className="text-sm leading-6 text-white/50 sm:max-w-xs">
                    Once submitted, these scores cannot be changed without admin
                    authorization.
                  </p>
                </div>
                <Dialog.Close asChild>
                  <button
                    className="absolute right-3 top-3 rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
                    aria-label="Close"
                  >
                    <Cross2Icon />
                  </button>
                </Dialog.Close>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      ) : (
        <></>
      )}
    </Dialog.Root>
  );
};

export default Submit;
