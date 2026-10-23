"use client";

import { useState } from "react";
import Link from "next/link";
import { IconChevronDown, IconMenu2 } from "@tabler/icons-react";

import { BrandLogo } from "#/components/brand-logo";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "#/components/ui/sheet";
import {
  AUDIENCE_LINKS,
  HELP_LINKS,
  SIGN_IN_HREF,
  SIGN_UP_HREF,
  SOLUTION_LINKS,
  type NavLink,
} from "../content";

const MENUS: { label: string; links: NavLink[]; wide?: boolean }[] = [
  { label: "Solutions", links: SOLUTION_LINKS, wide: true },
  { label: "Secteurs", links: AUDIENCE_LINKS },
  { label: "Aide", links: HELP_LINKS },
];

/**
 * The landing's own header: brand, three menus of anchors on the page, and the
 * two ways in. Sticky on the lime band; on phones the menus fold into a sheet.
 */
export function LandingHeader() {
  return (
    <header className="sticky top-[env(safe-area-inset-top)] z-40 bg-header/95 text-header-foreground backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="Rabotka Business — accueil" className="flex shrink-0 items-center gap-2">
          <BrandLogo tone="dark" />
          {/* Below sm the header has no room for it beside « Créer un compte ». */}
          <span className="hidden rounded-full bg-ink px-2 py-0.5 font-medium text-[11px] text-white sm:inline">
            Business
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
          {MENUS.map((menu) => (
            <DesktopMenu key={menu.label} {...menu} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            render={<Link href={SIGN_IN_HREF} />}
            className="hidden rounded-full px-4 hover:bg-black/5 sm:inline-flex"
          >
            Se connecter
          </Button>
          <Button
            variant="ghost"
            render={<Link href={SIGN_UP_HREF} />}
            className="rounded-full bg-ink px-5 text-white hover:bg-ink/90"
          >
            Ouvrir un compte
          </Button>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

function DesktopMenu({ label, links, wide }: Readonly<{ label: string; links: NavLink[]; wide?: boolean }>) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="group inline-flex items-center gap-1 rounded-full px-3 py-2 font-medium text-sm outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-ink/40 data-[state=open]:bg-black/5">
        {label}
        <IconChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className={
          wide
            ? "grid w-[34rem] grid-cols-2 gap-1 rounded-3xl border-0 bg-card p-3 shadow-soft"
            : "w-72 rounded-3xl border-0 bg-card p-2 shadow-soft"
        }
      >
        {links.map((link) => (
          <DropdownMenuItem
            key={link.label}
            asChild
            className="cursor-pointer flex-col items-start gap-0.5 rounded-2xl px-3 py-2.5 focus:bg-page"
          >
            <a href={link.href}>
              <span className="font-medium text-sm">{link.label}</span>
              {link.description && (
                <span className="text-muted-foreground text-xs leading-snug">{link.description}</span>
              )}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Menu"
        className="inline-flex size-10 items-center justify-center rounded-full hover:bg-black/5 lg:hidden"
      >
        <IconMenu2 className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto border-0 bg-card p-6 sm:max-w-sm">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="mt-8 flex flex-col gap-6">
          {MENUS.map((menu) => (
            <div key={menu.label} className="space-y-1">
              <p className="px-3 font-medium text-muted-foreground text-xs">{menu.label}</p>
              {menu.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-3 py-2.5 font-medium text-[15px] hover:bg-page"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ))}
          <Button
            variant="ghost"
            render={<Link href={SIGN_IN_HREF} />}
            className="h-11 rounded-full bg-page text-base"
          >
            Se connecter
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
