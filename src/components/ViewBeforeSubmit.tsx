import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

type Members = {
  name: string;
  characterId: string;
  idURL: string;
};

type LeaderInfo = {
  name: string;
  contact?: string | null;
  idURL?: string | null;
};

export default function ViewBeforeSubmit({
  data,
  roles,
  leader,
}: {
  data: Members[];
  roles: { value: string; label: string }[];
  leader?: LeaderInfo | null;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-md border border-white/20 bg-slate-900/90 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:text-white hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          Preview Team
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto rounded-2xl border border-white/20 bg-gradient-to-b from-slate-950 via-slate-900 to-black p-4 sm:p-6 text-white shadow-2xl backdrop-blur-xl sm:max-w-md sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-white">
            Team Summary Preview
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-gray-300">
            Review your team and character details before submitting.
          </DialogDescription>
        </DialogHeader>

        {/* Team Leader Section */}
        {leader && (
          <div className="rounded-lg border border-secondary-100/30 bg-secondary-100/5 p-3 text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="rounded border border-secondary-100/40 bg-secondary-100/20 px-2 py-0.5 text-xs font-semibold text-secondary-100">
                Team Leader
              </span>
              <span className="text-xs text-white/50">Character: N/A</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold text-white">{leader.name}</p>
                {leader.contact && (
                  <p className="text-xs text-white/60">Phone: {leader.contact}</p>
                )}
              </div>
              {leader.idURL && (
                <a href={leader.idURL} target="_blank" rel="noreferrer">
                  <Image
                    src={leader.idURL}
                    alt="Leader ID"
                    height={36}
                    width={36}
                    className="h-9 w-9 rounded border border-white/20 object-cover"
                  />
                </a>
              )}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
            Character Details
          </p>
          <div className="overflow-hidden rounded-lg border border-white/10">
            <Table>
              <TableHeader className="bg-slate-950/60">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="w-[100px] text-xs font-semibold text-white/70">Character</TableHead>
                  <TableHead className="text-xs font-semibold text-white/70">Participant</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-white/70">ID Card</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((member, key) => (
                  <TableRow key={key} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-sm font-semibold text-secondary-100">
                      {roles.find((role) => role.value === member.characterId)
                        ?.label ?? "Unknown"}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-white">
                      {member.name}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.idURL ? (
                        <a href={member.idURL} target="_blank" rel="noreferrer">
                          <Image
                            src={member.idURL}
                            alt="id_image"
                            height={40}
                            width={40}
                            className="ml-auto h-8 w-8 rounded border border-white/20 object-cover"
                          />
                        </a>
                      ) : (
                        <span className="text-xs text-white/40">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
