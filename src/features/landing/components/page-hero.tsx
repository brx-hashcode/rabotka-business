import type { ReactNode } from "react";

import { DemoButton, SignUpButton } from "./demo-button";

/** The lime opening of an inner page: title, lead, the two ways in, and a picture. */
export function PageHero({
  title,
  text,
  aside,
  actions = true,
}: Readonly<{ title: string; text: string; aside?: ReactNode; actions?: boolean }>) {
  return (
    <section className="overflow-hidden bg-header text-header-foreground">
      <div
        className={
          aside
            ? "mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pt-10 pb-16 sm:px-6 md:pt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pb-20"
            : "mx-auto w-full max-w-4xl px-4 pt-12 pb-16 text-center sm:px-6 md:pt-20 lg:pb-20"
        }
      >
        <div className={aside ? "space-y-6" : "mx-auto max-w-3xl space-y-6"}>
          <h1 className="font-semibold text-4xl leading-[1.08] tracking-tight sm:text-5xl">{title}</h1>
          <p className="text-header-muted text-lg">{text}</p>
          {actions && (
            <div className={aside ? "flex flex-wrap gap-3" : "flex flex-wrap justify-center gap-3"}>
              <DemoButton />
              <SignUpButton />
            </div>
          )}
        </div>
        {aside && <div className="min-w-0 text-foreground">{aside}</div>}
      </div>
    </section>
  );
}
