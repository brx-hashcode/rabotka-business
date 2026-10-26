"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { IconCommand, IconSearch, IconStarFilled } from "@tabler/icons-react";
import { Loader } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "#/components/ui/command";
import { searchCandidates } from "#/lib/api/candidate-controller";
import { friendlyError, httpStatusOf } from "#/lib/api/friendly-error";
import { getInitials } from "#/lib/utils";
import { NAV_ITEMS } from "./nav-items";

/** Accents and case aside: « ecole » finds « École ». */
const plain = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * The header's search (⌘K / Ctrl K): candidates first — the client app's
 * full-text worker search — then the space's pages. An employer does not
 * know a worker's name: it describes the job (trade, skill, description),
 * so each result shows the description it matched on. A candidate opens in
 * a dialog (/espace/candidats/[id], intercepted). Never an address.
 */
export function CommandSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const searching = debounced.length >= 2;
  const results = useQuery({
    queryKey: ["candidate-search", debounced],
    queryFn: () => searchCandidates(debounced, 8),
    enabled: open && searching,
    retry: false,
    staleTime: 60_000,
  });
  const forbidden = httpStatusOf(results.error) === 403;
  const pages = NAV_ITEMS.filter((i) => !i.soon && (!query.trim() || plain(i.label).includes(plain(query.trim()))));

  function close() {
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full max-w-md items-center gap-3 rounded-2xl bg-card pr-1.5 pl-4 text-left text-muted-foreground transition-colors hover:text-foreground"
      >
        <IconSearch className="size-5 shrink-0" />
        <span className="flex-1 truncate text-[15px]">Rechercher un profil : métier, compétence…</span>
        <span className="hidden items-center gap-1 rounded-xl bg-brand-lime px-3 py-1.5 font-medium text-[#0f2414] text-sm sm:flex">
          <IconCommand className="size-4" />K
        </span>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={(o) => (o ? setOpen(true) : close())}
        title="Rechercher"
        description="Rechercher un candidat ou une page"
        shouldFilter={false}
        className="sm:max-w-2xl"
      >
        <CommandInput value={query} onValueChange={setQuery} placeholder="Métier, compétence, description…" />
        <CommandList className="max-h-[60vh]">
          {searching && (
            <CommandGroup heading="Candidats">
              {results.isFetching && !results.data ? (
                <div className="flex items-center gap-2 px-2 py-4 text-muted-foreground text-sm">
                  <Loader className="size-4 animate-spin" />
                  Recherche…
                </div>
              ) : forbidden ? (
                <div className="space-y-2 px-2 py-4 text-sm">
                  <p className="text-muted-foreground">La recherche de profils est incluse dans certaines formules : voir « Abonnement ».</p>
                  <Link href="/espace/abonnement" onClick={close} className="font-medium text-whatsapp-dark hover:underline">
                    Voir les formules
                  </Link>
                </div>
              ) : results.isError ? (
                <p className="px-2 py-4 text-muted-foreground text-sm">
                  {friendlyError(results.error, "La recherche est indisponible pour le moment.")}
                </p>
              ) : results.data?.items.length === 0 ? (
                <p className="px-2 py-4 text-muted-foreground text-sm">Aucun candidat pour « {debounced} ».</p>
              ) : (
                results.data?.items.map((c) => {
                  const name = `${c.firstName} ${c.lastName}`.trim();
                  return (
                    <CommandItem
                      key={c.id}
                      value={`candidate-${c.id}`}
                      onSelect={() => {
                        close();
                        router.push(`/espace/candidats/${c.id}`);
                      }}
                      className="gap-3"
                    >
                      <Avatar className="size-10 rounded-xl">
                        {c.avatarUrl && <AvatarImage src={c.avatarUrl} alt="" className="object-cover" />}
                        <AvatarFallback className="rounded-xl bg-page font-medium">{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{name}</span>
                        <span className="block truncate text-muted-foreground text-xs">
                          {c.categoryNames.slice(0, 3).join(" · ") || "—"}
                        </span>
                        {c.description && (
                          <span className="mt-0.5 line-clamp-1 text-muted-foreground text-xs">{c.description}</span>
                        )}
                      </span>
                      <span className="flex shrink-0 items-center gap-3 text-muted-foreground text-xs">
                        {c.reliabilityScore !== null && <span>Fiabilité {c.reliabilityScore}</span>}
                        {c.ratingAvg !== null && (
                          <span className="inline-flex items-center gap-0.5">
                            {c.ratingAvg.toFixed(1)}
                            <IconStarFilled className="size-3 text-amber-400" />
                          </span>
                        )}
                      </span>
                    </CommandItem>
                  );
                })
              )}
            </CommandGroup>
          )}
          {!searching && (
            <p className="px-4 pt-4 pb-1 text-muted-foreground text-sm">
              Décrivez le profil recherché : un métier, une compétence, un savoir-faire (au moins 2 lettres).
            </p>
          )}
          {pages.length > 0 && (
            <CommandGroup heading="Pages">
              {pages.map(({ label, href, icon: Icon }) => (
                <CommandItem
                  key={href}
                  value={`page-${href}`}
                  onSelect={() => {
                    close();
                    router.push(href);
                  }}
                >
                  <Icon />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>

    </>
  );
}
