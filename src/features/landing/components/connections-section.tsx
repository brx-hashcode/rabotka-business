import Image from "next/image";
import type { ReactNode } from "react";
import { IconBrandWhatsapp, IconCalendarEvent, IconFileTypePdf, IconMail, IconQrcode, IconVideo } from "@tabler/icons-react";

import { GoogleLogo, LinkedInLogo } from "#/components/brand-logos";
import { GmailLogo } from "#/components/mail-provider-logos";
import { cn } from "#/lib/utils";

/*
 * Only what Rabotka really does: where candidates come from, where the work
 * goes. No logo here promises an integration that does not exist.
 */

type Node = { label: string; icon: ReactNode };

const SOURCES: Node[] = [
  { label: "LinkedIn", icon: <LinkedInLogo className="size-5" /> },
  { label: "Google", icon: <GoogleLogo className="size-5" /> },
  { label: "WhatsApp", icon: <IconBrandWhatsapp className="size-5 text-[#25D366]" /> },
  { label: "Gmail", icon: <GmailLogo className="size-5" /> },
  { label: "QR code", icon: <IconQrcode className="size-5 text-foreground" /> },
];

const OUTPUTS: Node[] = [
  { label: "Votre agenda", icon: <IconCalendarEvent className="size-5 text-[#4285F4]" /> },
  { label: "Visio", icon: <IconVideo className="size-5 text-whatsapp-dark" /> },
  { label: "PDF et Excel", icon: <IconFileTypePdf className="size-5 text-[#E5484D]" /> },
  { label: "Votre équipe", icon: <IconMail className="size-5 text-foreground" /> },
];

type Point = { x: number; y: number };
type Layout = { w: number; h: number; center: Point; sources: Point[]; outputs: Point[] };

/** Wide: sources on the left, outputs on the right. */
const WIDE: Layout = {
  w: 1000,
  h: 440,
  center: { x: 500, y: 220 },
  sources: [50, 135, 220, 305, 390].map((y) => ({ x: 110, y })),
  outputs: [80, 175, 265, 360].map((y) => ({ x: 890, y })),
};

/** Narrow: sources above, outputs below. */
const TALL: Layout = {
  w: 400,
  h: 600,
  center: { x: 200, y: 300 },
  sources: [40, 120, 200, 280, 360].map((x) => ({ x, y: 55 })),
  outputs: [65, 155, 245, 335].map((x) => ({ x, y: 545 })),
};

/** A soft curve between two points, bending along the layout's main axis. */
function curve(a: Point, b: Point, vertical: boolean): string {
  if (vertical) {
    const my = (a.y + b.y) / 2;
    return `M${a.x} ${a.y} C${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`;
  }
  const mx = (a.x + b.x) / 2;
  return `M${a.x} ${a.y} C${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`;
}

/** Beams from every source into Rabotka, and from Rabotka out to every output. */
function Beams({ layout, vertical, className }: Readonly<{ layout: Layout; vertical: boolean; className?: string }>) {
  const { w, h, center } = layout;
  const lines = [
    ...layout.sources.map((p) => curve(p, center, vertical)),
    ...layout.outputs.map((p) => curve(center, p, vertical)),
  ];
  const at = (p: Point) => ({ left: `${(p.x / w) * 100}%`, top: `${(p.y / h) * 100}%` });
  return (
    <div className={cn("relative w-full", className)} style={{ aspectRatio: `${w} / ${h}` }}>
      <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <linearGradient id={`beam-${vertical ? "v" : "h"}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={vertical ? 0 : w} y2={vertical ? h : 0}>
            <stop offset="0" stopColor="#4ade80" />
            <stop offset="1" stopColor="#16a34a" />
          </linearGradient>
        </defs>
        {lines.map((d, i) => (
          <g key={d}>
            <path d={d} fill="none" className="stroke-foreground/10" strokeWidth={2} />
            {/* The light running along it; still for those who reduce motion. */}
            <path
              d={d}
              fill="none"
              stroke={`url(#beam-${vertical ? "v" : "h"})`}
              strokeWidth={2.5}
              strokeLinecap="round"
              pathLength={1000}
              strokeDasharray="90 910"
              className="motion-reduce:hidden"
            >
              <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="3.2s" begin={`${(i % 5) * 0.55}s`} repeatCount="indefinite" />
            </path>
          </g>
        ))}
      </svg>
      {[...layout.sources.map((p, i) => ({ p, n: SOURCES[i] })), ...layout.outputs.map((p, i) => ({ p, n: OUTPUTS[i] }))].map(
        ({ p, n }) =>
          n && (
            <div key={n.label} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5" style={at(p)}>
              <span className="flex size-11 items-center justify-center rounded-full bg-white shadow-[0_0_20px_-10px_rgba(0,0,0,0.45)] ring-1 ring-black/5 sm:size-12">
                {n.icon}
              </span>
              <span className="whitespace-nowrap font-medium text-[11px] text-muted-foreground sm:text-xs">{n.label}</span>
            </div>
          ),
      )}
      <div className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center" style={at(center)}>
        {/* The round bubble logo on its own, glowing: no square tile in a circle. */}
        <Image
          src="/rabotka-logo.png"
          alt="Rabotka"
          width={112}
          height={112}
          className="size-20 object-contain drop-shadow-[0_8px_24px_rgba(22,163,74,0.45)] sm:size-24"
        />
      </div>
    </div>
  );
}

/** Where candidates come from, and where the work goes: Rabotka in the middle. */
export function ConnectionsSection() {
  return (
    <div className="space-y-8 rounded-[2rem] bg-page px-4 py-10 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-2 text-center">
        <h3 className="font-semibold text-2xl tracking-tight sm:text-3xl">Rabotka au centre de votre recrutement</h3>
        <p className="text-muted-foreground">
          Vos candidats arrivent de LinkedIn, de Google, de WhatsApp ou de votre messagerie ; vos entretiens partent dans votre
          agenda, vos comptes rendus vers votre équipe. Tout se décide dans Rabotka.
        </p>
      </div>
      <Beams layout={WIDE} vertical={false} className="mx-auto hidden max-w-4xl md:block" />
      <Beams layout={TALL} vertical className="mx-auto max-w-sm md:hidden" />
    </div>
  );
}
