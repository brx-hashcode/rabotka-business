import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import type { CareersCompany, CareersOffer } from "#/lib/api/careers-controller";
import { offerCardFacts, offerCardTitleSize } from "#/features/careers/offer-card";

export const alt = "Offre d'emploi : postulez en ligne";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0F2414";
const LIME = "#CBFFA5";
const CHIP = "#EEF6E8";

/** Tabler icons (MIT), drawn inline: the card has no other images to load. */
const ICONS = {
  place: ["M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0", "M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0"],
  type: ["M3 9a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2l0 -9", "M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2", "M12 12l0 .01", "M3 13a20 20 0 0 0 18 0"],
  pay: ["M7 15h-3a1 1 0 0 1 -1 -1v-8a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v3", "M7 10a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v8a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1l0 -8", "M12 14a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"],
  arrow: ["M5 12l14 0", "M13 18l6 -6", "M13 6l6 6"],
} as const;

function Icon({ name, size: s, color }: { name: keyof typeof ICONS; size: number; color: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

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

/**
 * A shared offer's preview, as LinkedIn, Facebook and WhatsApp show it: light
 * type on a white page, who hires, the job in large type, where / what / how much, and
 * a « Postuler » button. Everything is centred, so WhatsApp's square
 * crop of the middle still shows the logo, the title and the button. The
 * site's card when the offer is gone.
 */
export default async function OfferImage({ params }: { params: Promise<{ slug: string; reference: string }> }) {
  const { slug, reference } = await params;
  const asset = (path: string) => readFile(join(process.cwd(), "public", path));
  const [bold, light, page] = await Promise.all([asset("fonts/Gilroy-ExtraBold.otf"), asset("fonts/Gilroy-Light.otf"), offerOf(slug, reference)]);
  const title = page?.offer.title ?? "Offres d'emploi";
  const facts = page ? offerCardFacts(page.offer) : { chips: [] };

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#FFFFFF",
        color: INK,
        fontFamily: "Gilroy",
        padding: "56px 64px 52px",
        position: "relative",
      }}
    >
      {/* The brand's lime, as two soft shapes in the corners: the page stays white. */}
      <div style={{ position: "absolute", top: -170, right: -150, width: 420, height: 420, borderRadius: 999, background: LIME }} />
      <div style={{ position: "absolute", bottom: -210, left: -170, width: 420, height: 420, borderRadius: 999, background: CHIP }} />

      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {page?.company.logoUrl && (
          <img src={page.company.logoUrl} width={72} height={72} alt="" style={{ borderRadius: 18, objectFit: "cover" }} />
        )}
        <span style={{ fontSize: 34, fontWeight: 300 }}>{page?.company.name ?? "Rabotka"}</span>
        {page && (
          <span style={{ display: "flex", fontSize: 24, fontWeight: 300, padding: "8px 18px", borderRadius: 999, background: LIME }}>Recrute</span>
        )}
      </div>

      <span
        style={{
          display: "flex",
          textAlign: "center",
          justifyContent: "center",
          maxWidth: 1040,
          fontSize: offerCardTitleSize(title),
          fontWeight: 300,
          lineHeight: 1.05,
          letterSpacing: -1.5,
        }}
      >
        {title.length > 90 ? `${title.slice(0, 88).trimEnd()}…` : title}
      </span>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        {facts.chips.length > 0 && (
          <div style={{ display: "flex", gap: 14 }}>
            {facts.chips.map((c) => (
              <span
                key={c.text}
                style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 28, fontWeight: 300, padding: "12px 24px", borderRadius: 999, background: CHIP }}
              >
                <Icon name={c.icon} size={30} color={INK} />
                {c.text}
              </span>
            ))}
          </div>
        )}
        <span
          style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 30, fontWeight: 300, padding: "18px 40px", borderRadius: 999, background: INK, color: "#FFFFFF" }}
        >
          Postuler
          <Icon name="arrow" size={30} color={LIME} />
        </span>
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
