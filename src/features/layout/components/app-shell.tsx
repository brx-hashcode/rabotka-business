"use client";

import { useState, type ReactNode } from "react";

import { Sheet, SheetContent, SheetTitle } from "#/components/ui/sheet";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";

/**
 * The business space: the dark green sidebar (a sheet below `lg`), the top
 * bar, and the page on the light grey ground.
 */
export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-svh bg-page lg:flex">
      <aside className="sticky top-0 hidden h-svh w-72 shrink-0 p-3 lg:block">
        <AppSidebar />
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-80 max-w-[85vw] border-0 bg-transparent p-3 shadow-none">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <AppSidebar onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <AppHeader onOpenMenu={() => setMenuOpen(true)} />
        <main className="px-4 pb-10 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
