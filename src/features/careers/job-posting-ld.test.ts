import { describe, expect, it } from "vitest";

import type { CareersCompany, CareersOffer } from "#/lib/api/careers-controller";
import { jobPostingLd, ldScript } from "./job-posting-ld";

const company: CareersCompany = {
  slug: "kamoa",
  name: "KAMOA",
  logoUrl: "https://cdn/logo.png",
  categoryLabel: "Entreprise",
  city: "Brazzaville",
  website: null,
  description: null,
  indexable: true,
};
const offer: CareersOffer = {
  reference: "RBT-1",
  title: "Comptable",
  employmentType: "CDI",
  closesAt: null,
  publishedAt: "2026-11-01T08:00:00.000Z",
  isRemote: false,
  city: "Brazzaville",
  countryName: "Congo",
  quantity: 2,
  description: "Tenir la comptabilité.\n\nAu moins <3> ans.",
  amount: 450000,
  paymentFlow: "MONTHLY",
  categoryName: "Finance",
  questions: [],
};

describe("jobPostingLd", () => {
  it("describes the offer the way Google for Jobs reads it", () => {
    const ld = jobPostingLd(company, offer, "https://business.rabotka.work/carrieres/kamoa/RBT-1");
    expect(ld).toMatchObject({
      "@type": "JobPosting",
      title: "Comptable",
      datePosted: offer.publishedAt,
      employmentType: ["FULL_TIME"],
      hiringOrganization: { name: "KAMOA", logo: company.logoUrl },
      jobLocation: { address: { addressLocality: "Brazzaville", addressCountry: "Congo" } },
      baseSalary: { currency: "XAF", value: { value: 450000, unitText: "MONTH" } },
      directApply: true,
    });
    expect(ld).not.toHaveProperty("validThrough");
    expect(ld.description).toBe("<p>Tenir la comptabilité.</p><p>Au moins &lt;3&gt; ans.</p>");
  });

  it("dates a mission, and leaves out pay per task", () => {
    const ld = jobPostingLd(company, { ...offer, employmentType: "MISSION", closesAt: "2026-12-01T08:00:00.000Z", paymentFlow: "TASK" }, "u");
    expect(ld).toMatchObject({ employmentType: ["TEMPORARY"], validThrough: "2026-12-01T08:00:00.000Z" });
    expect(ld).not.toHaveProperty("baseSalary");
  });

  it("marks remote work", () => {
    const ld = jobPostingLd(company, { ...offer, isRemote: true }, "u");
    expect(ld).toMatchObject({ jobLocationType: "TELECOMMUTE" });
    expect(ld).not.toHaveProperty("jobLocation");
  });

  it("cannot close its script tag", () => {
    expect(ldScript({ t: "</script>" })).not.toContain("</script>");
  });
});
