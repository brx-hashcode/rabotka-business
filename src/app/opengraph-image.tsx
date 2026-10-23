import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Rabotka — Recrutez avec Rabotka";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LIME = "#CBFFA5";
const INK = "#0F2414";
const MUTED = "#3F5F3A";

/** The hero's 14-point starburst photo frame (rabotka-agent feed-hero.tsx), as a polygon. */
const STARBURST = (() => {
  const spikes = 14;
  const points: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? 50 : 41;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    points.push(`${(50 + r * Math.cos(a)).toFixed(2)}% ${(50 + r * Math.sin(a)).toFixed(2)}%`);
  }
  return `polygon(${points.join(", ")})`;
})();

const asset = (path: string) => readFile(join(process.cwd(), "public", path));
const dataUrl = (bytes: Buffer, type: string) => `data:${type};base64,${bytes.toString("base64")}`;

/** The link preview for WhatsApp, Facebook, X, LinkedIn…: the home hero, as one card. */
export default async function OpengraphImage() {
  const [bold, light, logo, photo] = await Promise.all([
    asset("fonts/Gilroy-ExtraBold.otf"),
    asset("fonts/Gilroy-Light.otf"),
    asset("rabotka-logo.png"),
    asset("photos/executive.jpg"),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: LIME,
        color: INK,
        fontFamily: "Gilroy",
        padding: "64px 72px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src={dataUrl(logo, "image/png")} width={72} height={72} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>Rabotka</span>
            <span style={{ fontSize: 20, fontWeight: 300, color: MUTED, marginTop: 6 }}>Job Matching</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
          <span style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>
            Recrutez avec Rabotka
          </span>
          <span style={{ fontSize: 30, fontWeight: 300, lineHeight: 1.3, color: MUTED, marginTop: 24 }}>
            Diffusez vos offres, accédez à des candidats vérifiés, pilotez vos recrutements.
          </span>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {["Brazzaville", "Pointe-Noire", "Douala", "Yaoundé"].map((city) => (
            <span
              key={city}
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 800,
                padding: "10px 20px",
                borderRadius: 999,
                background: "rgba(15, 36, 20, 0.08)",
              }}
            >
              {city}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 400 }}>
        <img
          src={dataUrl(photo, "image/jpeg")}
          width={400}
          height={400}
          alt=""
          style={{ objectFit: "cover", clipPath: STARBURST }}
        />
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
