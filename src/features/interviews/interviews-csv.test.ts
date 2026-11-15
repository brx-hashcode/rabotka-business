import { describe, expect, it } from "vitest";

import type { Interview } from "#/lib/api/types";
import { toEntries } from "./calendar-grid";
import { csvCell, interviewsCsv } from "./interviews-csv";

const interview = (over: Partial<Interview> = {}): Interview => ({
  id: "i1",
  cvResumeId: null,
  applicationId: "a1",
  offerId: null,
  jobTitle: "Caissier",
  candidateName: "Grâce",
  candidateEmail: null,
  startsAt: new Date(2026, 10, 16, 10, 0).toISOString(),
  durationMinutes: 30,
  mode: "VIDEO",
  location: "https://business.rabotka.work/visio/Rabotka-secret",
  message: null,
  status: "CONFIRMED",
  responseNote: null,
  respondedAt: null,
  createdAt: new Date(2026, 10, 1).toISOString(),
  ...over,
});

describe("the interviews export", () => {
  it("quotes what Excel would split, and never lets a cell be a formula", () => {
    expect(csvCell("Grâce")).toBe("Grâce");
    expect(csvCell("Dupont; Marie")).toBe('"Dupont; Marie"');
    expect(csvCell('Dit "oui"')).toBe('"Dit ""oui"""');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("-2+3")).toBe("'-2+3");
  });

  it("writes one line per interview, offered times marked, the visio link left out", () => {
    const csv = interviewsCsv(
      toEntries([
        interview(),
        interview({
          id: "i2",
          mode: "IN_PERSON",
          location: "Avenue de la Paix",
          status: "PENDING",
          options: [{ id: "s1", startsAt: new Date(2026, 10, 18, 14, 0).toISOString() }],
        }),
      ]),
    );
    expect(csv.startsWith("﻿Date;Heure;")).toBe(true);
    const lines = csv.trim().split("\r\n");
    expect(lines[1]).toBe("16/11/2026;10:00;30;Grâce;Caissier;Visio;Confirmé;");
    expect(lines[2]).toBe("18/11/2026;14:00;30;Grâce;Caissier;Avenue de la Paix;Créneau proposé, au choix du candidat;");
    expect(csv).not.toContain("Rabotka-secret");
  });
});
