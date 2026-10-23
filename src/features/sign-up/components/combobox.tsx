"use client";

import { useState } from "react";
import { IconCheck, IconSelector } from "@tabler/icons-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "#/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import { cn } from "#/lib/utils";

export type ComboboxOption = { value: string; label: string; group?: string };

/** Lower case, without accents: « ecole » finds « École ». */
const plain = (text: string) =>
  text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * Plain substring match. cmdk's default is fuzzy, which let « ecole » match
 * « Administration publique / collectivité locale » letter by letter.
 */
const filter = (value: string, search: string) => (plain(value).includes(plain(search.trim())) ? 1 : 0);

/** As rabotka-agent's location picker: pill search field, list scrolling inside. */
const COMMAND_STYLE =
  "bg-transparent [&_[data-slot=command-input-wrapper]]:mb-2 [&_[data-slot=command-input-wrapper]]:h-11 [&_[data-slot=command-input-wrapper]]:rounded-xl [&_[data-slot=command-input-wrapper]]:border-0 [&_[data-slot=command-input-wrapper]]:bg-page [&_[data-slot=command-input-wrapper]]:px-3 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:text-xs";
const ITEM_STYLE =
  "cursor-pointer justify-between gap-3 rounded-lg px-3 py-2.5 text-[15px] data-[selected=true]:bg-page";

/**
 * A select with search: the trigger looks like the form's other fields, the
 * list opens in a popover as wide as the field, grouped when the options say
 * so, and scrolls within a fixed height instead of covering the page.
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Rechercher…",
  emptyText = "Aucun résultat.",
  disabled,
  invalid,
  id,
}: Readonly<{
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
}>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  const groups = new Map<string, ComboboxOption[]>();
  for (const option of options) {
    const key = option.group ?? "";
    groups.set(key, [...(groups.get(key) ?? []), option]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-3 rounded-xl bg-page px-4 text-left text-base outline-none transition-shadow md:text-[15px]",
          "focus-visible:ring-2 focus-visible:ring-whatsapp/40 data-[popup-open]:ring-2 data-[popup-open]:ring-whatsapp/40",
          "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-destructive/30",
        )}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected?.label ?? placeholder}
        </span>
        <IconSelector className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-(--anchor-width) min-w-72 rounded-2xl border-0 bg-card shadow-soft before:hidden"
      >
        <Command className={COMMAND_STYLE} filter={filter}>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-72 overscroll-contain pr-1">
            <CommandEmpty>{emptyText}</CommandEmpty>
            {[...groups.entries()].map(([group, items]) => (
              <CommandGroup key={group || "_"} heading={group || undefined}>
                {items.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    className={ITEM_STYLE}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <span className="min-w-0">{option.label}</span>
                    {option.value === value && <IconCheck className="size-4 shrink-0 text-whatsapp-dark" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
