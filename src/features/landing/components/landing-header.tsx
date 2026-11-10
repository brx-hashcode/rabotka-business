"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { IconArrowRight, IconChevronDown, IconClock, IconLayoutKanban, IconMenu2 } from "@tabler/icons-react";

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
  DEMO_HREF,
  FEATURES_HREF,
  RESOURCE_LINKS,
  SIGN_IN_HREF,
  SIGN_UP_HREF,
  SOLUTION_LINKS,
  type NavLink,
} from "../content";
import { GUIDES } from "../site-content";
import { STAGES } from "./feature-stages";
import { SmartLink } from "./smart-link";
import { IconTile } from "./icon-tile";

const MENUS: { label: string; links: NavLink[]; wide?: boolean }[] = [
  { label: "Fonctionnalités", links: SOLUTION_LINKS, wide: true },
  { label: "Ressources", links: RESOURCE_LINKS },
];

/** Pages reached in one click, after the menus. */
const PAGES: NavLink[] = [
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

/**
 * The public site's header: brand, the Fonctionnalités and Ressources menus,
 * two pages, then the ways in, « Demander une démo » first. Sticky on the
 * lime band; on phones the menus fold into a sheet.
 */
export function LandingHeader() {
  return (
    <header data-site-header className="sticky top-[env(safe-area-inset-top)] z-40 bg-header/95 text-header-foreground backdrop-blur">
      <div className="mx-auto flex h-18 w-full max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="Rabotka Business — accueil" className="shrink-0">
          <BusinessLockup compact />
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
          {MENUS.map((menu) => (
            <DesktopMenu key={menu.label} {...menu} />
          ))}
          {PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="rounded-full px-3 py-2 font-medium text-sm transition-colors hover:bg-black/5"
            >
              {page.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            render={<Link href={SIGN_IN_HREF} />}
            className="hidden h-12 rounded-full px-5 py-3 text-[15px] hover:bg-black/5 xl:inline-flex xl:h-12 xl:text-[15px]"
          >
            Se connecter
          </Button>
          <Button
            variant="ghost"
            render={<Link href={SIGN_UP_HREF} />}
            className="hidden h-12 rounded-full bg-card/70 px-5 py-3 text-[15px] hover:bg-card md:inline-flex md:h-12 md:text-[15px]"
          >
            Ouvrir un compte
          </Button>
          <Button
            variant="ghost"
            render={<Link href={DEMO_HREF} />}
            className="h-10 rounded-full bg-ink px-4 py-2 text-sm text-white hover:bg-ink/90 sm:h-12 sm:px-6 sm:py-3 sm:text-[15px]"
          >
            <span className="sm:hidden">Démo</span>
            <span className="hidden sm:inline">Demander une démo</span>
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
      {wide ? <SolutionsPanel /> : <ResourcesPanel links={links} />}
    </DropdownMenu>
  );
}

const GROUPS = STAGES;

/**
 * The Fonctionnalités mega-menu, read as the pipeline: four stages of a hire,
 * two tools each; a bar to the overview; and a featured card for the demo.
 */
function SolutionsPanel() {
  return (
    <DropdownMenuContent
      align="start"
      sideOffset={10}
      onCloseAutoFocus={(e) => e.preventDefault()}
      className="grid w-[60rem] max-w-[calc(100vw-2rem)] grid-cols-[1fr_16rem] gap-3 rounded-[1.75rem] border-0 bg-card p-3 shadow-soft"
    >
      <div className="flex min-w-0 flex-col gap-3">
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 p-2">
          {GROUPS.map((group) => (
            <div key={group.step} className="space-y-1.5">
              <p className="flex items-center gap-2 px-2.5 pb-1">
                <span className="flex h-5 min-w-7 items-center justify-center rounded-full bg-header px-1.5 font-semibold text-[10px] text-header-foreground tabular-nums">
                  {group.number}
                </span>
                <span className="font-semibold text-xs uppercase tracking-wide">{group.step}</span>
                <span className="truncate text-muted-foreground text-xs">· {group.text}</span>
              </p>
              {group.features.map((f) => (
                <DropdownMenuItem
                  key={f.id}
                  asChild
                  className="group cursor-pointer items-center gap-3.5 rounded-2xl p-2.5 focus:bg-page"
                >
                  <Link href={f.href}>
                    <IconTile icon={f.icon} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 font-medium text-sm">
                        {f.label}
                        <IconArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 group-focus:translate-x-0 group-focus:opacity-100" />
                      </span>
                      <span className="block text-muted-foreground text-xs leading-snug">{f.description}</span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
          ))}
        </div>

        <DropdownMenuItem
          asChild
          className="group mt-auto cursor-pointer items-center justify-between gap-4 rounded-2xl bg-page px-4 py-3 focus:bg-page/70"
        >
          <Link href={FEATURES_HREF}>
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card">
                <IconLayoutKanban className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-sm">Un ATS complet, six étapes</span>
                <span className="block truncate text-muted-foreground text-xs">
                  De la diffusion de l&apos;offre au contrat, dans un seul pipeline
                </span>
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 font-medium text-sm">
              Toutes les fonctionnalités
              <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </DropdownMenuItem>
      </div>

      <DropdownMenuItem
        asChild
        className="group relative cursor-pointer flex-col items-stretch justify-between overflow-hidden rounded-2xl bg-ink p-4 text-white focus:bg-ink focus:text-white"
      >
        <Link href={DEMO_HREF}>
          <Image
            src="/media/boardroom.jpg"
            alt=""
            fill
            sizes="256px"
            className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-linear-to-t from-black/90 via-black/45 to-black/10" />
          <span className="relative w-fit rounded-full bg-header px-2.5 py-1 font-semibold text-[11px] text-header-foreground">
            ATS nouvelle génération
          </span>
          <span className="relative space-y-3">
            <span className="block font-semibold text-lg leading-snug">
              Voyez Rabotka sur vos propres postes
            </span>
            <span className="block text-white/75 text-xs leading-snug">
              30 minutes avec notre équipe, réponse sous 24 h ouvrées.
            </span>
            <span className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white font-medium text-ink text-sm">
              Demander une démo
              <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </span>
        </Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

/**
 * The Ressources menu: each link with its tile, and the first guide featured
 * beside them, so the menu itself offers something to read.
 */
function ResourcesPanel({ links }: Readonly<{ links: NavLink[] }>) {
  const guide = GUIDES[0];
  return (
    <DropdownMenuContent
      align="start"
      sideOffset={10}
      onCloseAutoFocus={(e) => e.preventDefault()}
      className="grid w-[40rem] max-w-[calc(100vw-2rem)] grid-cols-[1fr_14rem] gap-3 rounded-[1.75rem] border-0 bg-card p-3 shadow-soft"
    >
      <div className="space-y-0.5 p-1">
        {links.map((link) => (
          <DropdownMenuItem
            key={link.label}
            asChild
            className="group cursor-pointer items-center gap-3.5 rounded-2xl p-2.5 focus:bg-page"
          >
            <SmartLink href={link.href}>
              {link.icon && <IconTile icon={link.icon} />}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 font-medium text-sm">
                  {link.label}
                  <IconArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 group-focus:translate-x-0 group-focus:opacity-100" />
                </span>
                {link.description && (
                  <span className="block text-muted-foreground text-xs leading-snug">{link.description}</span>
                )}
              </span>
            </SmartLink>
          </DropdownMenuItem>
        ))}
      </div>

      <DropdownMenuItem
        asChild
        className="group cursor-pointer flex-col items-stretch justify-between gap-6 rounded-2xl bg-header p-4 text-header-foreground focus:bg-header focus:text-header-foreground"
      >
        <Link href={`/ressources/${guide.slug}`}>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-card/70 px-2.5 py-1 font-medium text-[11px]">
            <IconClock className="size-3.5" />
            Guide · {guide.minutes} min
          </span>
          <span className="space-y-3">
            <span className="block font-semibold text-lg leading-snug">{guide.title}</span>
            <span className="block text-header-muted text-xs leading-snug">{guide.description}</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-sm">
              Lire le guide
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
          <div className="space-y-3">
            <p className="px-3 font-medium text-muted-foreground text-xs">Fonctionnalités</p>
            {GROUPS.map((group) => (
              <div key={group.step} className="space-y-0.5">
                <p className="flex items-center gap-2 px-3 pb-0.5">
                  <span className="flex h-5 min-w-7 items-center justify-center rounded-full bg-header px-1.5 font-semibold text-[10px] text-header-foreground tabular-nums">
                    {group.number}
                  </span>
                  <span className="font-semibold text-[11px] uppercase tracking-wide">{group.step}</span>
                </p>
                {group.features.map((f) => (
                  <Link
                    key={f.id}
                    href={f.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2 font-medium text-[15px] hover:bg-page"
                  >
                    <IconTile icon={f.icon} size="sm" />
                    {f.label}
                  </Link>
                ))}
              </div>
            ))}
            <Link
              href={FEATURES_HREF}
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 rounded-2xl px-3 py-2 font-medium text-sm hover:bg-page"
            >
              Toutes les fonctionnalités
              <IconArrowRight className="size-4" />
            </Link>
          </div>
          {MENUS.filter((menu) => !menu.wide).map((menu) => (
            <div key={menu.label} className="space-y-1">
              <p className="px-3 font-medium text-muted-foreground text-xs">{menu.label}</p>
              {menu.links.map((link) => (
                <SmartLink
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-3 py-2.5 font-medium text-[15px] hover:bg-page"
                >
                  {link.label}
                </SmartLink>
              ))}
            </div>
          ))}
          <div className="space-y-1">
            <p className="px-3 font-medium text-muted-foreground text-xs">Rabotka Business</p>
            {PAGES.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-3 py-2.5 font-medium text-[15px] hover:bg-page"
              >
                {page.label}
              </Link>
            ))}
          </div>
          <div className="space-y-2">
            <Button
              variant="ghost"
              render={<Link href={DEMO_HREF} onClick={() => setOpen(false)} />}
              className="h-11 w-full rounded-full bg-ink text-base text-white hover:bg-ink/90"
            >
              Demander une démo
            </Button>
            <Button
              variant="ghost"
              render={<Link href={SIGN_UP_HREF} onClick={() => setOpen(false)} />}
              className="h-11 w-full rounded-full bg-page text-base"
            >
              Ouvrir un compte
            </Button>
            <Button
              variant="ghost"
              render={<Link href={SIGN_IN_HREF} onClick={() => setOpen(false)} />}
              className="h-11 w-full rounded-full text-base"
            >
              Se connecter
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
