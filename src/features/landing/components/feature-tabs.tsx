"use client";

import { useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconCheck } from "@tabler/icons-react";

import { cn } from "#/lib/utils";
import { FeatureMockup } from "../mockups/mockups";
import { STAGES } from "./feature-stages";

/**
 * « Fonctionnalités clés »: the tools by stage on the left, the chosen one on
 * the right with its screen. One tool at a time, nothing scrolls twice.
 */
export function FeatureTabs() {
  const all = STAGES.flatMap((s) => s.features);
  const [activeId, setActiveId] = useState(all[0].id);
  const active = all.find((f) => f.id === activeId) ?? all[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:gap-8">
      <div role="tablist" aria-label="Fonctionnalités" aria-orientation="vertical" className="space-y-5">
        {STAGES.map((stage) => (
          <div key={stage.step} className="space-y-1">
            <p className="flex items-center gap-2 px-3 pb-1">
              <span className="font-semibold text-muted-foreground text-xs tabular-nums">{stage.number}</span>
              <span className="font-semibold text-xs uppercase tracking-wide">{stage.step}</span>
            </p>
            {stage.features.map((f) => {
              const selected = f.id === active.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  id={`tab-${f.id}`}
                  aria-selected={selected}
                  aria-controls="feature-panel"
                  onClick={() => setActiveId(f.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-colors",
                    selected ? "bg-ink text-white" : "hover:bg-page",
                  )}
                >
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", f.tone)}>
                    <f.icon className="size-4" />
                  </span>
                  <span className="font-medium text-sm">{f.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div
        role="tabpanel"
        id="feature-panel"
        aria-labelledby={`tab-${active.id}`}
        className="grid min-w-0 items-center gap-8 rounded-[2rem] bg-page p-5 sm:p-8 xl:grid-cols-[1fr_1.1fr]"
      >
        <div key={active.id} className="space-y-5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
          <h3 className="font-semibold text-2xl tracking-tight sm:text-3xl">{active.title}</h3>
          <p className="text-muted-foreground">{active.text}</p>
          <ul className="space-y-2.5">
            {active.points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-whatsapp text-white">
                  <IconCheck className="size-3" strokeWidth={3} />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <Link
            href={active.href}
            className="group inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline"
          >
            Voir {active.label} en détail
            <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="min-w-0">
          <FeatureMockup id={active.id} />
        </div>
      </div>
    </div>
  );
}
