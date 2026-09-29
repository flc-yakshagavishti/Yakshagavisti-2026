"use client";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/use-toast";

export default function RequestEditAccess() {
  const utils = api.useUtils();
  const requestEditAccess = api.team.requestEditAccess.useMutation({
    onSuccess: async () => {
      toast({
        title: "Edit access requested",
        description: "An administrator will review your request.",
      });
      await utils.team.getCharacters.invalidate();
      await utils.team.getTeam.invalidate();
      await utils.team.getTeamForEdits.invalidate();
    },
    onError: (error) => {
      toast({ variant: "destructive", description: error.message });
    },
  });

  return (
    <Button
      disabled={requestEditAccess.isPending}
      className="bg-secondary-100 font-semibold text-black hover:bg-secondary-200"
      onClick={() => requestEditAccess.mutate()}
    >
      {requestEditAccess.isPending ? "Requesting..." : "Request Edit Access"}
    </Button>
  );
}
