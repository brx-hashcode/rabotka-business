import { describe, expect, it } from "vitest";

import { pointIconsAt, pointStrayIconsAt } from "./use-organisation-favicon";

function fakeLink(attributes: Record<string, string>) {
  const values = new Map(Object.entries(attributes));
  return {
    getAttribute: (name: string) => values.get(name) ?? null,
    setAttribute: (name: string, value: string) => void values.set(name, value),
    removeAttribute: (name: string) => void values.delete(name),
  } as unknown as HTMLLinkElement;
}

describe("pointIconsAt", () => {
  it("swaps every icon for the logo, without the default's type", () => {
    const links = [fakeLink({ href: "/favicon.ico" }), fakeLink({ href: "/icon.png", type: "image/png" })];

    pointIconsAt(links, "https://cdn/logo.jpg");

    expect(links.map((l) => l.getAttribute("href"))).toEqual(["https://cdn/logo.jpg", "https://cdn/logo.jpg"]);
    expect(links[1].getAttribute("type")).toBeNull();
  });

  it("puts the defaults back", () => {
    const links = [fakeLink({ href: "/favicon.ico" }), fakeLink({ href: "/icon.png", type: "image/png" })];

    pointIconsAt(links, "https://cdn/logo.jpg")();

    expect(links[0].getAttribute("href")).toBe("/favicon.ico");
    expect(links[0].getAttribute("type")).toBeNull();
    expect(links[1].getAttribute("href")).toBe("/icon.png");
    expect(links[1].getAttribute("type")).toBe("image/png");
  });
});

describe("pointStrayIconsAt", () => {
  it("takes back an icon Next wrote again, and leaves the others alone", () => {
    const links = [fakeLink({ href: "/icon.png" }), fakeLink({ href: "https://cdn/logo.jpg" })];
    const writes: string[] = [];
    const write = links[1].setAttribute.bind(links[1]);
    links[1].setAttribute = (name, value) => {
      writes.push(value);
      write(name, value);
    };

    pointStrayIconsAt(links, "https://cdn/logo.jpg");

    expect(links[0].getAttribute("href")).toBe("https://cdn/logo.jpg");
    expect(writes).toEqual([]);
  });
});
