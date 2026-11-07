import { IconBellFilled, IconBrandLinkedin, IconBrandLinkedinFilled } from "@tabler/icons-react";
import { describe, expect, it } from "vitest";

import { notificationLook } from "./notification-look";

describe("notificationLook", () => {
  it("shows a LinkedIn post in LinkedIn's blue, a failed one as a warning", () => {
    expect(notificationLook("LINKEDIN_POST", "Offre publiée sur LinkedIn")).toEqual({
      icon: IconBrandLinkedinFilled,
      tone: "bg-[#0a66c2] text-white",
    });
    const failed = notificationLook("LINKEDIN_POST", "Publication LinkedIn non aboutie");
    expect(failed.icon).toBe(IconBrandLinkedin);
    expect(failed.tone).toContain("chip-amber");
  });

  it("gives interviews their own colour", () => {
    expect(notificationLook("INTERVIEW_INVITED").tone).toContain("chip-sky");
  });

  it("falls back to a bell", () => {
    expect(notificationLook("SOMETHING_NEW").icon).toBe(IconBellFilled);
  });
});
