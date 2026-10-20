"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";

const Remarks = ({
  teamId,
  isLoading,
}: {
  teamId: string;
  isLoading: boolean;
}) => {
  const [remark, setRemark] = useState("");
  const remarks = api.jury.addRemark.useMutation();
  const getRemark = api.jury.getRemark.useQuery(
    { teamId },
    { enabled: Boolean(teamId) },
  );

  useEffect(() => {
    setRemark(getRemark.data?.remark ?? "");
  }, [getRemark.data]);

  const saveRemark = () => {
    if (!teamId) return;
    remarks.mutate(
      { teamId, remark },
      {
        onError: (error) => alert(error.message),
      },
    );
  };

  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <div
        className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-medium ${
          isLoading
            ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
            : "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
        }`}
        role="status"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {isLoading ? "Saving" : "Saved"}
      </div>
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <Button
            variant="outline"
            disabled={!teamId}
            className="h-10 flex-1 border-white/15 bg-white/[0.06] text-white hover:bg-white/15 sm:flex-none"
          >
            <MessageSquare />
            Remarks
          </Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#211d3d] p-5 text-white shadow-2xl focus:outline-none sm:p-6">
            <Dialog.Title className="text-xl font-semibold">
              Add a remark
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-white/50">
              Add context for the admin team about this performance.
            </Dialog.Description>
            <textarea
              className="mt-5 min-h-32 w-full resize-y rounded-xl border border-white/15 bg-black/20 p-3 text-sm leading-6 text-white outline-none placeholder:text-white/30 focus:border-secondary-100 focus:ring-2 focus:ring-secondary-100/20"
              aria-label="Performance remark"
              placeholder="Write a short remark…"
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
            />
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </Dialog.Close>
              <Dialog.Close asChild>
                <Button
                  onClick={saveRemark}
                  disabled={remarks.isPending}
                  className="bg-secondary-200 text-white hover:bg-secondary-200/90"
                >
                  {remarks.isPending ? "Saving…" : "Save remark"}
                </Button>
              </Dialog.Close>
            </div>
            <Dialog.Close asChild>
              <button
                className="absolute right-4 top-4 rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
                aria-label="Close remarks"
              >
                <Cross2Icon />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default Remarks;
