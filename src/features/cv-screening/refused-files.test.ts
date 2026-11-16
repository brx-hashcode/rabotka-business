import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import { MESSAGES } from "#/i18n/messages";
import { refusedLines as lines, type RefusedFile } from "./refused-files";

const fr = createTranslator({ locale: "fr", messages: MESSAGES.fr, namespace: "cv.refused" });
const refusedLines = (refused: RefusedFile[]) => lines(refused, fr);
const over = (name: string): RefusedFile => ({ name, reason: { kind: "over", limit: 100 } });

describe("refusedLines", () => {
  it("puts those over the limit in one line", () => {
    const result = refusedLines([over("a.pdf"), over("b.pdf"), over("c.pdf")]);
    expect(result).toEqual([{ key: "over", text: "3 fichiers non ajoutés : 100 CV au plus pour cette analyse." }]);
  });

  it("names the others, 8 at most", () => {
    const bad: RefusedFile[] = Array.from({ length: 10 }, (_, i) => ({ name: `f${i}.zip`, reason: { kind: "type" } }));
    const result = refusedLines([...bad, over("x.pdf")]);
    expect(result).toHaveLength(10);
    expect(result[0]).toEqual({ key: "n:f0.zip", name: "f0.zip", text: " non ajouté : type non pris en charge." });
    expect(result[8].text).toBe("Et 2 autres fichiers non pris en charge ou trop lourds.");
    expect(result[9].text).toBe("1 fichier non ajouté : 100 CV au plus pour cette analyse.");
  });
});
