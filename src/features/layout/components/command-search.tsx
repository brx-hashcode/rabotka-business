"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconCommand, IconSearch } from "@tabler/icons-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "#/components/ui/command";
import { NAV_ITEMS } from "./nav-items";

/**
 * The header's search: a quick way to the space's pages (⌘K / Ctrl K).
 * Pages only — nothing it cannot actually open.
 */
export function CommandSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full max-w-md items-center gap-3 rounded-2xl bg-card pr-1.5 pl-4 text-left text-muted-foreground transition-colors hover:text-foreground"
      >
        <IconSearch className="size-5 shrink-0" />
        <span className="flex-1 truncate text-[15px]">Rechercher…</span>
        <span className="hidden items-center gap-1 rounded-xl bg-brand-lime px-3 py-1.5 font-medium text-[#0f2414] text-sm sm:flex">
          <IconCommand className="size-4" />K
        </span>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Rechercher" description="Aller à une page de votre espace">
        <CommandInput placeholder="Aller à…" />
        <CommandList>
          <CommandEmpty>Aucun résultat.</CommandEmpty>
          <CommandGroup heading="Pages">
            {NAV_ITEMS.filter((i) => !i.soon).map(({ label, href, icon: Icon }) => (
              <CommandItem
                key={href}
                value={label}
                onSelect={() => {
                  setOpen(false);
                  router.push(href);
                }}
              >
                <Icon />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
