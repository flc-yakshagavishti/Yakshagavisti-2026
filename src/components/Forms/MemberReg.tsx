import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import {
  CheckCircle2,
  Clock,
  Crown,
  Phone,
  ExternalLink,
  Users,
  RotateCcw,
  ArrowLeft,
  Send,
} from "lucide-react";

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
  const characterList = useMemo(
    () => characters.data?.characters ?? [],
    [characters.data?.characters],
  );
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

  const leaderMember = membersList.data?.TeamMembers?.find(
    (m) => m.characterId === null,
  );

  const validFilledCount = MembersArray.filter(
    (member) => Boolean(member?.name && member?.characterId && member?.idURL),
  ).length;

  const totalCharacters = characterList.length;
  const progressPercent =
    totalCharacters > 0
      ? Math.round((validFilledCount / totalCharacters) * 100)
      : 0;
  const isAllFilled =
    totalCharacters > 0 && validFilledCount >= totalCharacters;

  return (
    <Dialog>
      <DialogTrigger>
        <RegButton>Edit Team</RegButton>
      </DialogTrigger>
      <DialogContent className="flex max-h-[92vh] w-[95vw] max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-b from-slate-950 via-slate-900 to-black p-0 text-white shadow-2xl backdrop-blur-xl sm:w-full">
        {/* Modal Header */}
        <div className="border-b border-white/10 p-4 sm:p-6 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-secondary-100/30 bg-secondary-100/10 text-secondary-100">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Character Details
                </DialogTitle>
                <DialogDescription className="text-xs text-white/60 sm:text-sm">
                  Assign teammates to each character in your prasanga
                </DialogDescription>
              </div>
            </div>

            {characters.data?.prasanga?.name && (
              <span className="rounded-full border border-secondary-100/40 bg-secondary-100/10 px-3 py-1 text-xs font-semibold text-secondary-100">
                Prasanga: {characters.data.prasanga.name}
              </span>
            )}
          </div>

          {/* Progress Tracker */}
          {totalCharacters > 0 && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-white/70">
                  Team Completion Progress
                </span>
                <span
                  className={
                    isAllFilled ? "font-bold text-green-400" : "text-secondary-100"
                  }
                >
                  {validFilledCount} / {totalCharacters} completed ({progressPercent}%)
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-950/80">
                <div
                  className={`h-full transition-all duration-300 ${
                    isAllFilled
                      ? "bg-gradient-to-r from-emerald-500 to-green-400"
                      : "bg-gradient-to-r from-secondary-200 to-secondary-100"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
          {/* Team Leader Banner */}
          {leaderMember && (
            <div className="rounded-xl border border-secondary-100/30 bg-gradient-to-r from-secondary-100/10 via-slate-900/60 to-slate-950/80 p-3.5 sm:p-4 shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-secondary-100/40 bg-secondary-100/20 px-2.5 py-0.5 text-xs font-semibold text-secondary-100">
                    <Crown className="h-3.5 w-3.5" /> Team Leader
                  </span>
                  <span className="text-xs text-white/50">
                    Character: <span className="font-semibold text-white/90">N/A</span>
                  </span>
                </div>
                {leaderMember.idURL && (
                  <a
                    href={leaderMember.idURL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-secondary-100/30 bg-secondary-100/10 px-2.5 py-1 text-xs font-medium text-secondary-100 hover:bg-secondary-100/20"
                  >
                    <ExternalLink className="h-3 w-3" /> View ID Card
                  </a>
                )}
              </div>
              <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-xs text-white/50">Leader Name:</span>
                  <p className="font-semibold text-white">
                    {leaderMember.name}
                  </p>
                </div>
                {leaderMember.contact && (
                  <div>
                    <span className="text-xs text-white/50">Contact Phone:</span>
                    <p className="flex items-center gap-1.5 font-semibold text-white">
                      <Phone className="h-3 w-3 text-secondary-100" />
                      {leaderMember.contact}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Character Accordion List */}
          <div className="space-y-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Assigned Characters ({characterList.length})
            </h4>

            <Accordion type="single" collapsible className="space-y-2.5">
              {characters.data?.assigned ? (
                characterList.map((role, index) => {
                  const memberData = MembersArray[index];
                  const isFilled = Boolean(
                    memberData?.name && memberData?.idURL,
                  );

                  return (
                    <AccordionItem
                      key={role.id}
                      value={`item-${index}`}
                      className={`overflow-hidden rounded-xl border transition-all ${
                        isFilled
                          ? "border-emerald-500/30 bg-slate-900/60"
                          : "border-white/10 bg-slate-900/40 hover:bg-slate-900/70"
                      }`}
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]>div>svg]:rotate-180">
                        <div className="flex flex-1 flex-wrap items-center justify-between gap-2 text-left pr-2">
                          <div>
                            <span className="text-sm font-bold text-white sm:text-base">
                              {role.character}
                            </span>
                            {isFilled ? (
                              <p className="text-xs font-medium text-white/80">
                                Teammate:{" "}
                                <span className="text-secondary-100 font-semibold">
                                  {memberData?.name}
                                </span>
                              </p>
                            ) : (
                              <p className="text-xs text-white/40">
                                Details pending
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {isFilled ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                Filled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400">
                                <Clock className="h-3 w-3 text-amber-400" />
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="border-t border-white/10 px-3 pt-3 pb-3 sm:px-4 sm:pb-4">
                        <AccordianForm
                          MembersArray={MembersArray}
                          setMembersArray={setMembersArray}
                          index={index}
                          characterId={role.id}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  );
                })
              ) : (
                <div className="py-8 text-center text-sm text-white/50">
                  Loading prasanga characters...
                </div>
              )}
            </Accordion>
          </div>
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-950/90 p-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setFormToShow(1)}
              size="sm"
              variant="outline"
              className="inline-flex items-center gap-1.5 rounded-lg border-white/20 bg-transparent text-xs font-medium text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
            <Button
              disabled={MembersArray.length === 0}
              onClick={() => {
                setMembersArray([]);
                localStorage.removeItem("members");
              }}
              variant="ghost"
              size="sm"
              className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-red-400 hover:bg-red-500/10"
            >
              <RotateCcw className="h-3 w-3" /> Clear All
            </Button>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-bold transition-all ${
                  isAllFilled
                    ? "bg-gradient-to-r from-secondary-200 to-secondary-100 text-black shadow-lg shadow-secondary-100/20 hover:scale-102 hover:opacity-95"
                    : "cursor-not-allowed border border-white/10 bg-white/10 text-white/50"
                }`}
                disabled={!isAllFilled}
                onClick={() => {
                  if (!isAllFilled) {
                    toast({
                      variant: "destructive",
                      title: "Team Incomplete!",
                      description: `Please fill details for all ${totalCharacters} characters before submitting.`,
                    });
                  }
                }}
              >
                <Send className="h-3.5 w-3.5" />
                Submit Team ({validFilledCount}/{totalCharacters})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border border-white/20 bg-slate-950 text-white sm:max-w-md">
              {registerMembers.isSuccess ? (
                <>
                  <AlertDialogHeader className="flex flex-col items-center justify-center gap-3 pt-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-400">
                      <CheckCircle2 className="h-10 w-10 text-green-400" />
                    </div>
                    <AlertDialogTitle className="text-center text-xl font-bold text-white">
                      Team Registered Successfully!
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-sm text-gray-300">
                      {registerMembers.data?.message ??
                        "Your team and character details have been registered successfully."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="sm:justify-center pt-2">
                    <Button
                      className="bg-secondary-100 font-semibold text-black hover:bg-secondary-200"
                      onClick={async () => {
                        localStorage.removeItem("members");
                        await utils.team.getCharacters.invalidate();
                        await utils.team.getTeam.invalidate();
                        await utils.team.getTeamForEdits.invalidate();
                        window.location.reload();
                      }}
                    >
                      Done
                    </Button>
                  </AlertDialogFooter>
                </>
              ) : (
                <>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg font-bold text-white">
                      Confirm Team Submission
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs text-gray-300">
                      Once submitted, your team character details will be locked. Changes will require admin edit access.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end pt-3">
                    <div className="w-full sm:w-auto">
                      <ViewBeforeSubmit
                        data={MembersArray.filter((m) =>
                          Boolean(m?.name && m?.characterId && m?.idURL),
                        )}
                        leader={leaderMember}
                        roles={
                          characterList.map((character) => ({
                            label: character.character,
                            value: character.id,
                          })) ?? []
                        }
                      />
                    </div>
                    <AlertDialogCancel className="w-full sm:w-auto border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      disabled={registerMembers.isPending}
                      className="w-full sm:w-auto bg-secondary-100 font-bold text-black hover:bg-secondary-200"
                      onClick={(e) => {
                        e.preventDefault();
                        const validMembers = MembersArray.filter(
                          (m): m is Members =>
                            Boolean(m?.name && m?.characterId && m?.idURL),
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
                        "Confirm & Submit"
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
