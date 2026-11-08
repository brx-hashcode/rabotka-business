"use client";

import { useState } from "react";
import { IconCheck, IconSelector } from "@tabler/icons-react";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "#/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import { isCfa } from "#/features/money/money";
import { cn } from "#/lib/utils";

export type PayCountry = { code: string; name: string; flag?: string; dialCode?: string; currency?: string };

/** Lower case, without accents: « benin » finds « Bénin ». */
const plain = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Substring match on the name, the code or the dial code (« 243 », « +243 »). */
const filter = (value: string, search: string) => (plain(value).includes(plain(search.trim().replace(/^\+/, ""))) ? 1 : 0);

const COMMAND_STYLE =
  "bg-transparent [&_[data-slot=command-input-wrapper]]:mb-2 [&_[data-slot=command-input-wrapper]]:h-11 [&_[data-slot=command-input-wrapper]]:rounded-xl [&_[data-slot=command-input-wrapper]]:border-0 [&_[data-slot=command-input-wrapper]]:bg-page [&_[data-slot=command-input-wrapper]]:px-3 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:text-xs";

/** What the country's networks are charged in, as a payer reads it. */
function currencyLabel(currency?: string): string | null {
  if (!currency) return null;
  return isCfa(currency) ? "FCFA" : currency;
}

/**
 * The payer's country: opens under the field (never over the page), with a
 * search, the payer's own country first, the rest by name, and on each row
 * the dial code and the currency its networks charge.
 */
export function CountryPicker({
  id,
  value,
  onChange,
  countries,
  payerCountry,
}: Readonly<{
  id?: string;
  value: string | null;
  onChange: (code: string) => void;
  countries: readonly PayCountry[];
  payerCountry: string | null;
}>) {
  const [open, setOpen] = useState(false);
  const selected = countries.find((c) => c.code === value) ?? null;
  const own = countries.find((c) => c.code === payerCountry) ?? null;
  const others = countries.filter((c) => c !== own).sort((a, b) => a.name.localeCompare(b.name, "fr"));

  const row = (c: PayCountry) => (
    <CommandItem
      key={c.code}
      value={`${c.name} ${c.code} ${c.dialCode ?? ""}`}
      className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-[15px] data-[selected=true]:bg-page"
      onSelect={() => {
        onChange(c.code);
        setOpen(false);
      }}
    >
      <Flag country={c} />
      <span className="min-w-0 flex-1 truncate">{c.name}</span>
      {c.dialCode && <span className="shrink-0 text-muted-foreground text-xs tabular-nums">+{c.dialCode}</span>}
      {currencyLabel(c.currency) && (
        <span className="w-12 shrink-0 rounded-full bg-page px-2 py-0.5 text-center font-medium text-[11px] text-muted-foreground">
          {currencyLabel(c.currency)}
        </span>
      )}
      <IconCheck className={cn("size-4 shrink-0 text-whatsapp-dark", c.code !== value && "invisible")} />
    </CommandItem>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        className={cn(
          "flex h-14 w-full items-center gap-3 rounded-2xl bg-page px-4 text-left text-base outline-none transition-shadow",
          "focus-visible:ring-2 focus-visible:ring-whatsapp/40 data-[popup-open]:ring-2 data-[popup-open]:ring-whatsapp/40",
        )}
      >
        {selected ? (
          <>
            <Flag country={selected} />
            <span className="min-w-0 flex-1 truncate">{selected.name}</span>
            {currencyLabel(selected.currency) && (
              <span className="shrink-0 text-muted-foreground text-sm">Payé en {currencyLabel(selected.currency)}</span>
            )}
          </>
        ) : (
          <span className="flex-1 text-muted-foreground">Choisir un pays</span>
        )}
        <IconSelector className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-(--anchor-width) min-w-72 rounded-2xl border-0 bg-card shadow-soft before:hidden"
      >
        <Command className={COMMAND_STYLE} filter={filter}>
          <CommandInput placeholder="Rechercher un pays ou un indicatif…" />
          <CommandList className="max-h-80 overscroll-contain pr-1">
            <CommandEmpty>Aucun pays ne correspond.</CommandEmpty>
            {own && <CommandGroup heading="Votre pays">{row(own)}</CommandGroup>}
            <CommandGroup heading={own ? "Autres pays" : undefined}>{others.map(row)}</CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function Flag({ country }: Readonly<{ country: PayCountry }>) {
  return country.flag ? (
    // The gateway's flag image: nothing next/image could optimise.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={country.flag} alt="" className="h-4 w-6 shrink-0 rounded-[3px] object-cover" />
  ) : (
    <span className="flex h-4 w-6 shrink-0 items-center justify-center rounded-[3px] bg-foreground/10 font-semibold text-[9px]">
      {country.code.slice(0, 2)}
    </span>
  );
}
