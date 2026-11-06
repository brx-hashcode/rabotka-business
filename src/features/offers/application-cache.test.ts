import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { showApplicationStatus, showExternalStatus, withApplicationStatus } from "./application-cache";

const a = (applicationId: string, status = "PENDING") => ({ applicationId, status });

describe("withApplicationStatus", () => {
  it("changes that application in a list, keeping the others", () => {
    const list = [a("a1"), a("a2")];
    const next = withApplicationStatus(list, "a2", "ACCEPTED");
    expect(next).toEqual([a("a1"), a("a2", "ACCEPTED")]);
    expect(next[0]).toBe(list[0]);
  });

  it("finds it in the inbox and in pages", () => {
    expect(withApplicationStatus({ items: [a("a1")], total: 1 }, "a1", "REJECTED")).toEqual({ items: [a("a1", "REJECTED")], total: 1 });
    expect(withApplicationStatus({ pages: [{ items: [a("a1")] }] }, "a1", "REJECTED")).toEqual({ pages: [{ items: [a("a1", "REJECTED")] }] });
  });

  it("leaves untouched what does not hold it (same reference)", () => {
    const list = [a("a1")];
    const offer = { id: "o1", title: "Serveur" };
    expect(withApplicationStatus(list, "zz", "REJECTED")).toBe(list);
    expect(withApplicationStatus(offer, "a1", "REJECTED")).toBe(offer);
    expect(withApplicationStatus(undefined, "a1", "REJECTED")).toBeUndefined();
  });
});

describe("showApplicationStatus", () => {
  it("patches every offers query, and the undo puts them back", () => {
    const qc = new QueryClient();
    qc.setQueryData(["offers", "o1", "applicants"], [a("a1")]);
    qc.setQueryData(["offers", "received"], { items: [a("a1")], total: 1 });
    const undo = showApplicationStatus(qc, "a1", "ACCEPTED");
    expect(qc.getQueryData(["offers", "o1", "applicants"])).toEqual([a("a1", "ACCEPTED")]);
    expect(qc.getQueryData(["offers", "received"])).toEqual({ items: [a("a1", "ACCEPTED")], total: 1 });
    undo();
    expect(qc.getQueryData(["offers", "o1", "applicants"])).toEqual([a("a1")]);
  });

  it("a careers candidate goes by its own id", () => {
    const qc = new QueryClient();
    qc.setQueryData(["external-applications", "o1"], [{ id: "e1", status: "PENDING" }]);
    showExternalStatus(qc, "e1", "RETAINED");
    expect(qc.getQueryData(["external-applications", "o1"])).toEqual([{ id: "e1", status: "RETAINED" }]);
  });
});
