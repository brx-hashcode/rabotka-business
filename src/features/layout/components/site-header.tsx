"use client";

import Link from "next/link";

import { BusinessLockup } from "#/components/business-lockup";
import { appConfig } from "#/config";
import { AccountMenu } from "./account-menu";

/** The header band: the brand, and the signed-in person's menu. */
export function SiteHeader() {
  return (
    <header className="bg-header text-header-foreground">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href={appConfig.homePath} aria-label="Rabotka Business — mon espace" className="shrink-0">
          <BusinessLockup />
        </Link>

        <AccountMenu />
      </div>
    </header>
  );
}
