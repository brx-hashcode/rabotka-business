import { describe, expect, it } from "vitest";

import { filenameFrom } from "./download";

describe("filenameFrom", () => {
  it("prefers the exact UTF-8 name", () => {
    expect(
      filenameFrom(`attachment; filename="contrat_Facturee.pdf"; filename*=UTF-8''contrat_Factur%C3%A9e.pdf`, "x.pdf"),
    ).toBe("contrat_Facturée.pdf");
  });

  it("falls back to the plain name, then to the default", () => {
    expect(filenameFrom('attachment; filename="rapport.pdf"', "x.pdf")).toBe("rapport.pdf");
    expect(filenameFrom(null, "x.pdf")).toBe("x.pdf");
    expect(filenameFrom(`attachment; filename="a.pdf"; filename*=UTF-8''%E0%A4%A`, "x.pdf")).toBe("a.pdf");
  });
});
