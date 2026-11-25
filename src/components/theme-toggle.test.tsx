// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import en from "#/i18n/messages/en/layout.json";
import fr from "#/i18n/messages/fr/layout.json";
import { ThemeButton } from "./theme-toggle";

const theme = vi.hoisted(() => ({ resolvedTheme: "light", setTheme: vi.fn() }));
vi.mock("next-themes", () => ({ useTheme: () => theme }));

let host: HTMLDivElement;

function render(locale: "fr" | "en") {
  const layout = locale === "fr" ? fr : en;
  act(() =>
    createRoot(host).render(
      <NextIntlClientProvider locale={locale} messages={{ layout }}>
        <ThemeButton />
      </NextIntlClientProvider>,
    ),
  );
  return host.querySelector("button") as HTMLButtonElement;
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.append(host);
});

afterEach(() => {
  theme.setTheme.mockClear();
  host.remove();
});

describe("ThemeButton", () => {
  it.each([
    ["light", "dark"],
    ["dark", "light"],
  ])("from %s, chooses %s", (from, to) => {
    theme.resolvedTheme = from;
    const button = render("fr");
    act(() => button.click());
    expect(theme.setTheme).toHaveBeenCalledWith(to);
  });

  it.each([
    ["fr", "Changer de thème"],
    ["en", "Switch theme"],
  ] as const)("says what it does in %s", (locale, label) => {
    expect(render(locale).getAttribute("aria-label")).toBe(label);
  });
});
