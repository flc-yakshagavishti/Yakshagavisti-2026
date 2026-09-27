"use client";

import { useState } from "react";
import { ArrowUpRight, BookOpen, Loader2, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

type PrasangaSummary = {
  id: string;
  name: string;
  _count: { teams: number };
};

// Character details belong to team registration, not the prasanga catalog.
export function PrasangaSection({
  prasangas,
  onViewTeams,
}: {
  prasangas: PrasangaSummary[] | undefined;
  onViewTeams: (prasangaId: string) => void;
}) {
  const utils = api.useUtils();
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const createPrasanga = api.admin.createPrasanga.useMutation({
    onSuccess: () => {
      setName("");
      setSearch("");
      toast.success(
        "Prasanga created. Assign it to a team in Teams & attendance.",
      );
      void utils.admin.getPrasangas.invalidate();
    },
  });
  const filtered = prasangas?.filter((prasanga) =>
    prasanga.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="admin-prasangas">
      <div className="admin-prasanga-create">
        <h3>New prasanga</h3>
        <p className="admin-muted">
          Add a name to the catalog. Assign it to a team when you’re ready.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim() || createPrasanga.isPending) return;
            createPrasanga.mutate({ name: name.trim() });
          }}
        >
          <Label htmlFor="new-prasanga-name">
            Prasanga name <span className="admin-muted">(required)</span>
          </Label>
          <Input
            id="new-prasanga-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (createPrasanga.isError) createPrasanga.reset();
            }}
            required
            disabled={createPrasanga.isPending}
            aria-invalid={createPrasanga.isError}
            aria-describedby={
              createPrasanga.isError ? "prasanga-error" : "prasanga-help"
            }
            placeholder="Prasanga title"
          />
          <div className="admin-form-feedback">
            {createPrasanga.isError ? (
              <p id="prasanga-error" role="alert" className="admin-error">
                {createPrasanga.error.message}
              </p>
            ) : (
              <p id="prasanga-help" className="admin-muted">
                Only the name is needed here.
              </p>
            )}
          </div>
          <Button
            type="submit"
            disabled={!name.trim() || createPrasanga.isPending}
            className="admin-button admin-button--primary"
          >
            {createPrasanga.isPending ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Plus size={16} aria-hidden="true" />
            )}
            {createPrasanga.isPending ? "Creating…" : "Create prasanga"}
          </Button>
        </form>
        <div className="admin-prasanga-note">
          <BookOpen size={18} aria-hidden="true" />
          <p>
            Characters stay with the team. Team leads enter them during
            formation; admins can edit them in{" "}
            <strong>Teams & attendance</strong>.
          </p>
        </div>
      </div>
      <div className="admin-prasanga-catalog">
        <div className="admin-catalog-toolbar">
          <div className="admin-search">
            <Label htmlFor="prasanga-search" className="sr-only">
              Search prasangas
            </Label>
            <Search size={16} aria-hidden="true" />
            <Input
              id="prasanga-search"
              type="search"
              placeholder="Search prasangas…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <p className="admin-muted" role="status">
            {prasangas
              ? `${filtered?.length ?? 0} of ${prasangas.length}`
              : "Loading…"}
          </p>
        </div>
        <div className="admin-catalog-list">
          {filtered?.map((prasanga) => (
            <article key={prasanga.id} className="admin-prasanga-row">
              <div className="min-w-0">
                <h3>{prasanga.name}</h3>
                <p className="admin-muted">
                  {prasanga._count.teams === 0
                    ? "No teams assigned"
                    : `${prasanga._count.teams} assigned ${prasanga._count.teams === 1 ? "team" : "teams"}`}
                </p>
              </div>
              {prasanga._count.teams > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onViewTeams(prasanga.id)}
                  aria-label={`View teams assigned to ${prasanga.name}`}
                  className="admin-button admin-button--quiet"
                >
                  View teams <ArrowUpRight size={16} aria-hidden="true" />
                </Button>
              ) : (
                <span className="admin-state admin-state--pending">
                  Unassigned
                </span>
              )}
            </article>
          ))}
        </div>
        {filtered?.length === 0 && (
          <div className="admin-empty">
            <BookOpen size={28} aria-hidden="true" />
            <h3>
              {prasangas?.length
                ? "No matching prasangas"
                : "Your catalog starts here"}
            </h3>
            <p>
              {prasangas?.length
                ? "Try a different name or clear your search."
                : "Create a prasanga using the name field to get started."}
            </p>
            {search && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSearch("")}
                className="admin-button"
              >
                Clear search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
