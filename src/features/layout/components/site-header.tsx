"use client";

import Link from "next/link";

import { BrandLogo } from "#/components/brand-logo";
import { appConfig } from "#/config";
import { AccountMenu } from "./account-menu";

/** The header band: the brand, and the signed-in person's menu. */
export function SiteHeader() {
  return (
    <header className="bg-header text-header-foreground">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href={appConfig.homePath} aria-label="Rabotka Business — mon espace" className="flex items-center gap-2">
          <BrandLogo tone="dark" />
          <span className="rounded-full bg-ink px-2 py-0.5 font-medium text-[11px] text-white">
            Business
          </span>
        </Link>

        <AccountMenu />
      </div>
    </header>
  );
}
