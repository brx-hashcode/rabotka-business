import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Rabotka Business — l'ATS des organisations africaines : recevez, triez et rencontrez les bons candidats";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LIME = "#CBFFA5";
const INK = "#0F2414";
const MUTED = "#3F5F3A";
const GREEN = "#1EB857";
const PAGE = "#F1F4F8";
const GREY = "#6B7570";

/** The hero's ranked CVs (mockups.tsx), the product as it looks. */
const RANKED = [
  { name: "Grâce Loubaki", job: "Caissière · 4 ans", score: 88 },
  { name: "Jean-Baptiste Kiminou", job: "Vendeur · 3 ans", score: 74 },
  { name: "Awa Mbemba", job: "Hôtesse d'accueil · 2 ans", score: 61 },
  { name: "Prince Nganga", job: "Magasinier · 1 an", score: 38 },
];

/** cv-bits.tsx's bands: the words a score reads as. */
function band(score: number) {
  if (score >= 80) return { label: "Très adapté", bg: "#E6F7EC", fg: "#13723A", ring: GREEN };
  if (score >= 60) return { label: "Adapté", bg: LIME, fg: INK, ring: GREEN };
  if (score >= 40) return { label: "Partiel", bg: "#FDF1E3", fg: "#9A5B12", ring: "#C77A1E" };
  return { label: "Peu adapté", bg: "#EEF0EE", fg: GREY, ring: "#A3ABA6" };
}

const asset = (path: string) => readFile(join(process.cwd(), "public", path));
const dataUrl = (bytes: Buffer, type: string) => `data:${type};base64,${bytes.toString("base64")}`;

/** A score in its ring, as the CV analysis shows it. */
function Ring({ score, color }: Readonly<{ score: number; color: string }>) {
  const r = 21;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", position: "relative", width: 52, height: 52 }}>
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="#E7EAE8" strokeWidth="5" />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${(c * score) / 100} ${c}`}
          transform="rotate(-90 26 26)"
        />
      </svg>
      <span
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 52,
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 800,
        }}
      >
        {score}
      </span>
    </div>
  );
}

/**
 * The link preview for WhatsApp, LinkedIn, Facebook, X…: the home hero as one
 * card. The promise on the lime band on the left, the product on the right: a
 * CV analysis ranking four candidates, an interview confirmed on top of it.
 */
export default async function OpengraphImage() {
  const [gilroy, regular, bold, heavy, logo] = await Promise.all([
    asset("fonts/Gilroy-ExtraBold.otf"),
    asset("fonts/Manrope-500.ttf"),
    asset("fonts/Manrope-700.ttf"),
    asset("fonts/Manrope-800.ttf"),
    asset("rabotka-logo.png"),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: LIME,
        color: INK,
        fontFamily: "Manrope",
        overflow: "hidden",
      }}
    >
      {/* A soft white light behind the card. */}
      <div
        style={{
          position: "absolute",
          right: -160,
          top: -120,
          width: 820,
          height: 820,
          borderRadius: 9999,
          background: "radial-gradient(circle, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 65%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 640,
          padding: "60px 0 60px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src={dataUrl(logo, "image/png")} width={58} height={58} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "Gilroy", fontSize: 32, fontWeight: 800, lineHeight: 1 }}>Rabotka</span>
            <span style={{ fontSize: 15, fontWeight: 500, color: MUTED, marginTop: 4 }}>Job Matching</span>
          </div>
          <div style={{ display: "flex", width: 2, height: 38, background: "rgba(15,36,20,0.25)", margin: "0 6px" }} />
          <span style={{ fontSize: 30, fontWeight: 500 }}>Business</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2.2 }}>
            Recevez, triez et rencontrez les bons candidats
          </span>
          <span style={{ fontSize: 25, fontWeight: 500, lineHeight: 1.35, color: MUTED, marginTop: 22 }}>
            Un ATS complet pour les entreprises et organisations africaines.
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 22,
              fontWeight: 700,
              padding: "14px 26px",
              borderRadius: 999,
              background: INK,
              color: "white",
            }}
          >
            Demander une démo
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span style={{ fontSize: 22, fontWeight: 700, color: MUTED }}>business.rabotka.work</span>
        </div>
      </div>

      {/* The product: a CV analysis, slightly turned, an interview on top. */}
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 470,
            padding: 26,
            borderRadius: 32,
            background: "white",
            boxShadow: "0 40px 80px -30px rgba(15,36,20,0.35)",
            transform: "rotate(-2deg)",
            marginTop: 30,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: GREY }}>Analyse de CV</span>
              <span style={{ fontSize: 21, fontWeight: 800, marginTop: 2 }}>Caissier · Brazzaville</span>
            </div>
            <span
              style={{
                display: "flex",
                fontSize: 15,
                fontWeight: 700,
                padding: "7px 14px",
                borderRadius: 999,
                background: "#E6F7EC",
                color: "#13723A",
              }}
            >
              4 CV classés
            </span>
          </div>
          {RANKED.map((p, i) => {
            const b = band(p.score);
            return (
              <div
                key={p.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "11px 14px",
                  borderRadius: 20,
                  background: PAGE,
                  marginTop: i === 0 ? 0 : 9,
                }}
              >
                <span style={{ display: "flex", width: 14, fontSize: 16, fontWeight: 700, color: GREY }}>{i + 1}</span>
                <Ring score={p.score} color={b.ring} />
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{p.name}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: GREY, marginTop: 1 }}>{p.job}</span>
                </div>
                <span
                  style={{
                    display: "flex",
                    fontSize: 14,
                    fontWeight: 700,
                    padding: "6px 12px",
                    borderRadius: 999,
                    background: b.bg,
                    color: b.fg,
                  }}
                >
                  {b.label}
                </span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            top: 58,
            left: 6,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 18px 12px 12px",
            borderRadius: 22,
            background: "white",
            boxShadow: "0 24px 50px -20px rgba(15,36,20,0.35)",
            transform: "rotate(2deg)",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              borderRadius: 999,
              background: "#E6F7EC",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>Entretien confirmé</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: GREY }}>Grâce · jeudi 10 h</span>
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Gilroy", data: gilroy, weight: 800, style: "normal" },
        { name: "Manrope", data: regular, weight: 500, style: "normal" },
        { name: "Manrope", data: bold, weight: 700, style: "normal" },
        { name: "Manrope", data: heavy, weight: 800, style: "normal" },
      ],
    },
  );
}
