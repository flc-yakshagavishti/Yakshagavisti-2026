import React, { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Button as RegButton } from "~/components/Button";
import {
  DialogContent,
  DialogDescription,
  Dialog,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/use-toast";
import { useRouter } from "next/navigation";
import AccordianForm from "~/components/Forms/AccordionForm";
import z from "zod";
import ViewBeforeSubmit from "~/components/ViewBeforeSubmit";
import { ImSpinner9 } from "react-icons/im";
import { IoCheckmarkCircle } from "react-icons/io5";

type Members = {
  name: string;
  characterId: string;
  idURL: string;
};

const MemberReg = ({
  setFormToShow,
}: {
  setFormToShow: Dispatch<SetStateAction<number>>;
}) => {
  const utils = api.useUtils();
  const characters = api.team.getCharacters.useQuery({});
  const membersList = api.team.getTeamForEdits.useQuery();
  const characterList = characters.data?.characters ?? [];
  const [MembersArray, setMembersArray] = useState<Members[]>(
    (() => {
      const storedMembers = localStorage.getItem("members");
      return storedMembers ? (JSON.parse(storedMembers) as Members[]) : [];
    })(),
  );

  useEffect(() => {
    if (
      MembersArray.length === 0 &&
      membersList.data?.TeamMembers &&
      characterList.length > 0
    ) {
      const arr: Members[] = [];
      characterList.forEach((char, idx) => {
        const found = membersList.data?.TeamMembers?.find(
          (m) => m.characterId === char.id,
        );
        if (found && found.name && found.idURL) {
          arr[idx] = {
            name: found.name,
            characterId: char.id,
            idURL: found.idURL,
          };
        }
      });
      if (arr.some(Boolean)) {
        setMembersArray(arr);
      }
    }
  }, [membersList.data, characterList, MembersArray.length]);

  const { toast } = useToast();
  const router = useRouter();
  const registerMembers = api.team.updateTeam.useMutation({
    onError(error) {
      return toast({
        variant: "destructive",
        title: "Error!",
        description: error.message,
      });
    },
    onSuccess(data) {
      localStorage.removeItem("members");
      toast({
        variant: "default",
        title: "Team registered successfully!",
        description: data.message,
      });
      void utils.team.getCharacters.invalidate();
      void utils.team.getTeam.invalidate();
      void utils.team.getTeamForEdits.invalidate();
      return router.refresh();
    },
  });

  if (membersList.isLoading) return <div>Loading...</div>;

  const validFilledCount = MembersArray.filter(
    (member) => Boolean(member?.name && member?.characterId && member?.idURL),
  ).length;

  return (
    <Dialog>
      <DialogTrigger>
        <RegButton>Edit Team</RegButton>
      </DialogTrigger>
      <DialogContent className="overflow-y-scroll bg-[conic-gradient(at_top_left,_var(--tw-gradient-stops))] from-gray-950/50 via-slate-900 to-black text-white">
        <DialogTitle>Character Details</DialogTitle>
        <DialogDescription>
          Enter details of the Teammates who will play respective Characters
        </DialogDescription>
        <div>
          <Accordion type="single" collapsible>
            {characters.data?.assigned ? (
              characterList.map((role, index) => (
                <AccordionItem key={role.id} value={`item-${index}`}>
                  <AccordionTrigger>{role.character}</AccordionTrigger>
                  <AccordionContent>
                    <AccordianForm
                      MembersArray={MembersArray}
                      setMembersArray={setMembersArray}
                      index={index}
                      characterId={role.id}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))
            ) : (
              <div className="text-2xl">Loading...</div>
            )}
          </Accordion>
        </div>
        <div className="m-auto flex gap-2">
          <Button
            onClick={() => setFormToShow(1)}
            size="sm"
            className="cursor-pointer"
          >
            Back
          </Button>
          <Button
            disabled={MembersArray.length === 0}
            onClick={() => {
              setMembersArray([]);
              localStorage.removeItem("members");
            }}
            className="cursor-pointer"
            size="sm"
          >
            Clear All
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                className="cursor-pointer disabled:cursor-default"
                disabled={
                  !characters.data?.assigned ||
                  characterList.length === 0 ||
                  validFilledCount < characterList.length
                }
                onClick={() => {
                  if (validFilledCount < (characterList.length ?? 0)) {
                    toast({
                      variant: "destructive",
                      title: "Team Incomplete!",
                      description:
                        "Please fill in details of all characters in your team.",
                    });
                  }
                }}
              >
                Submit
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="text-black">
              {registerMembers.isSuccess ? (
                <>
                  <AlertDialogHeader className="flex flex-col items-center justify-center gap-2">
                    <IoCheckmarkCircle className="h-16 w-16 text-green-500" />
                    <AlertDialogTitle className="text-center text-xl text-black">
                      Team Registered Successfully!
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-gray-600">
                      {registerMembers.data?.message ??
                        "Your team details have been registered successfully."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="sm:justify-center">
                    <Button
                      onClick={async () => {
                        localStorage.removeItem("members");
                        await utils.team.getCharacters.invalidate();
                        await utils.team.getTeam.invalidate();
                        await utils.team.getTeamForEdits.invalidate();
                        window.location.reload();
                      }}
                    >
                      OK
                    </Button>
                  </AlertDialogFooter>
                </>
              ) : (
                <>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-black">
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will register your team
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <ViewBeforeSubmit
                      data={MembersArray.filter((m) => Boolean(m?.name && m?.characterId && m?.idURL))}
                      roles={
                        characterList.map((character) => ({
                          label: character.character,
                          value: character.id,
                        })) ?? []
                      }
                    />
                    <AlertDialogCancel className="text-black">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      disabled={registerMembers.isPending}
                      onClick={(e) => {
                        e.preventDefault();
                        const validMembers = MembersArray.filter(
                          (m): m is Members => Boolean(m?.name && m?.characterId && m?.idURL),
                        );
                        registerMembers.mutate({
                          members: z
                            .array(
                              z.object({
                                name: z.string(),
                                characterId: z.string(),
                                idURL: z.string(),
                              }),
                            )
                            .parse(validMembers),
                        });
                      }}
                    >
                      {registerMembers.isPending ? (
                        <ImSpinner9 className="animate-spin" />
                      ) : (
                        "Continue"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </>
              )}
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default MemberReg;
