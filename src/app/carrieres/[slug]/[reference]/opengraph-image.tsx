import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import type { CareersCompany, CareersOffer } from "#/lib/api/careers-controller";

export const alt = "Offre d'emploi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LIME = "#CBFFA5";
const INK = "#0F2414";
const MUTED = "#3F5F3A";

const TYPE: Record<CareersOffer["employmentType"], string> = { MISSION: "Mission", CDD: "CDD", CDI: "CDI", STAGE: "Stage" };

async function offerOf(slug: string, reference: string) {
  const backend = process.env.BACKEND_URL;
  if (!backend) return null;
  try {
    const res = await fetch(
      new URL(`/api/v1/public/careers/${encodeURIComponent(slug)}/offers/${encodeURIComponent(reference)}`, backend),
      { cache: "no-store" },
    );
    return res.ok ? ((await res.json()) as { company: CareersCompany; offer: CareersOffer }) : null;
  } catch {
    return null;
  }
}

/** A shared offer's preview: who hires, the job, where. The site's card when the offer is gone. */
export default async function OfferImage({ params }: { params: Promise<{ slug: string; reference: string }> }) {
  const { slug, reference } = await params;
  const asset = (path: string) => readFile(join(process.cwd(), "public", path));
  const [bold, light, page] = await Promise.all([asset("fonts/Gilroy-ExtraBold.otf"), asset("fonts/Gilroy-Light.otf"), offerOf(slug, reference)]);
  const title = page?.offer.title ?? "Offres d'emploi";
  const facts = page
    ? [TYPE[page.offer.employmentType], page.offer.isRemote ? "Télétravail" : page.offer.city].filter((x): x is string => !!x)
    : [];

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: LIME, color: INK, fontFamily: "Gilroy", padding: "64px 72px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {page?.company.logoUrl && <img src={page.company.logoUrl} width={88} height={88} alt="" style={{ borderRadius: 22, objectFit: "cover" }} />}
        <span style={{ fontSize: 36, fontWeight: 300, color: MUTED }}>{page ? `${page.company.name} recrute` : "Rabotka"}</span>
      </div>
      <span style={{ fontSize: title.length > 40 ? 64 : 80, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2 }}>{title}</span>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12 }}>
          {facts.map((f) => (
            <span key={f} style={{ display: "flex", fontSize: 28, fontWeight: 800, padding: "12px 24px", borderRadius: 999, background: "rgba(15, 36, 20, 0.08)" }}>
              {f}
            </span>
          ))}
        </div>
        <span style={{ fontSize: 30, fontWeight: 800 }}>Postulez en ligne</span>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Gilroy", data: bold, weight: 800, style: "normal" },
        { name: "Gilroy", data: light, weight: 300, style: "normal" },
      ],
    },
  );
}
