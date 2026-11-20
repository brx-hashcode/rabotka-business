import { describe, expect, it } from "vitest";

import { breadcrumbLd, faqLd, softwareLd } from "./marketing";

describe("structured data", () => {
  it("describes the product without a price", () => {
    const ld = softwareLd("https://business.rabotka.work", "ATS", ["Congo", "Kenya"]);
    expect(ld["@type"]).toBe("SoftwareApplication");
    expect(ld.areaServed).toEqual([
      { "@type": "Country", name: "Congo" },
      { "@type": "Country", name: "Kenya" },
    ]);
    expect(JSON.stringify(ld)).not.toMatch(/offers|price/i);
  });

  it("lists the page's questions with their answers", () => {
    expect(faqLd([{ q: "Q ?", a: "R." }]).mainEntity).toEqual([
      { "@type": "Question", name: "Q ?", acceptedAnswer: { "@type": "Answer", text: "R." } },
    ]);
  });

  it("gives each step of the trail its absolute URL in the page's language", () => {
    const trail = breadcrumbLd("https://b.example", "en", [
      { name: "Rabotka Business", path: "/" },
      { name: "ATS for Africa", path: "/logiciel-de-recrutement/afrique" },
    ]).itemListElement;
    expect(trail.map((s) => s.item)).toEqual(["https://b.example/en", "https://b.example/en/logiciel-de-recrutement/afrique"]);
    expect(breadcrumbLd("https://b.example", "fr", [{ name: "Accueil", path: "/" }]).itemListElement[0].item).toBe("https://b.example");
  });
});
