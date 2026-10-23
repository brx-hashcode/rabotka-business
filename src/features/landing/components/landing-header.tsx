"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { IconArrowRight, IconChevronDown, IconMenu2 } from "@tabler/icons-react";

import { BusinessLockup } from "#/components/business-lockup";
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
      <div className="mx-auto flex h-18 w-full max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="Rabotka Business — accueil" className="shrink-0">
          <BusinessLockup compact />
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
            className="hidden h-12 rounded-full px-6 py-3 text-[15px] hover:bg-black/5 sm:inline-flex sm:h-12 sm:text-[15px]"
          >
            Se connecter
          </Button>
          <Button
            variant="ghost"
            render={<Link href={SIGN_UP_HREF} />}
            className="h-12 rounded-full bg-ink px-7 py-3 text-[15px] text-white hover:bg-ink/90 sm:h-12 sm:text-[15px]"
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
      {wide ? (
        <SolutionsPanel links={links} />
      ) : (
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="w-72 rounded-3xl border-0 bg-card p-2 shadow-soft"
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
      )}
    </DropdownMenu>
  );
}

/**
 * The Solutions menu as a small mega-menu: each solution with its photo from
 * the page, and a featured panel to open an account.
 */
function SolutionsPanel({ links }: Readonly<{ links: NavLink[] }>) {
  return (
    <DropdownMenuContent
      align="start"
      sideOffset={8}
      onCloseAutoFocus={(e) => e.preventDefault()}
      className="grid w-[46rem] grid-cols-[1fr_15rem] gap-3 rounded-3xl border-0 bg-card p-3 shadow-soft"
    >
      <div className="grid grid-cols-1 gap-1">
        {links.map((link) => (
          <DropdownMenuItem
            key={link.label}
            asChild
            className="group cursor-pointer items-center gap-4 rounded-2xl p-2.5 focus:bg-page"
          >
            <a href={link.href}>
              {link.photo && (
                <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-page">
                  <Image
                    src={link.photo}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105 group-focus:scale-105"
                  />
                </span>
              )}
              <span className="min-w-0">
                <span className="block font-medium text-sm">{link.label}</span>
                {link.description && (
                  <span className="block text-muted-foreground text-xs leading-snug">{link.description}</span>
                )}
              </span>
            </a>
          </DropdownMenuItem>
        ))}
      </div>

      <DropdownMenuItem
        asChild
        className="group relative cursor-pointer flex-col items-stretch justify-end overflow-hidden rounded-2xl bg-ink p-4 text-white focus:bg-ink focus:text-white"
      >
        <Link href={SIGN_UP_HREF}>
          <Image
            src="/media/boardroom.jpg"
            alt=""
            fill
            sizes="240px"
            className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-transparent" />
          <span className="relative space-y-2">
            <span className="block font-semibold text-base leading-snug">
              Toutes vos solutions de recrutement, en un seul espace
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-sm text-white">
              Ouvrir un compte entreprise
              <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </span>
        </Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
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
