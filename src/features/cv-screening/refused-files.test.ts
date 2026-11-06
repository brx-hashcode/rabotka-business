import { describe, expect, it } from "vitest";

import { refusedLines } from "./refused-files";

const over = (name: string) => ({ name, reason: "100 CV au plus pour cette analyse" });

describe("refusedLines", () => {
  it("puts those over the limit in one line", () => {
    const lines = refusedLines([over("a.pdf"), over("b.pdf"), over("c.pdf")]);
    expect(lines).toEqual([{ key: "over", text: "3 fichiers non ajoutés : 100 CV au plus pour cette analyse." }]);
  });

  it("names the others, 8 at most", () => {
    const bad = Array.from({ length: 10 }, (_, i) => ({ name: `f${i}.zip`, reason: "type non pris en charge" }));
    const lines = refusedLines([...bad, over("x.pdf")]);
    expect(lines).toHaveLength(10);
    expect(lines[0]).toEqual({ key: "n:f0.zip", name: "f0.zip", text: " non ajouté : type non pris en charge." });
    expect(lines[8].text).toBe("Et 2 autres fichiers non pris en charge ou trop lourds.");
    expect(lines[9].text).toBe("1 fichier non ajouté : 100 CV au plus pour cette analyse.");
  });
});
