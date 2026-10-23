import { describe, expect, it } from "vitest";

import {
  NETWORK_ERROR,
  RATE_LIMIT_ERROR,
  SERVER_ERROR,
  SESSION_ERROR,
  friendlyError,
} from "./friendly-error";

const apiError = (statusCode: number, message: unknown) =>
  Object.assign(new Error(String(message)), { statusCode, body: { message } });

describe("friendlyError", () => {
  it("keeps the backend's French sentence", () => {
    expect(
      friendlyError(apiError(400, "Le code doit contenir 6 chiffres"), "fallback"),
    ).toBe("Le code doit contenir 6 chiffres");
  });

  it("keeps a wrong-code 401 message when asked to", () => {
    const err = apiError(401, "Code de vérification invalide ou expiré");
    expect(friendlyError(err, "fallback")).toBe(SESSION_ERROR);
    expect(friendlyError(err, "fallback", { keepUnauthorized: true })).toBe(
      "Code de vérification invalide ou expiré",
    );
  });

  it("keeps the resend-cooldown 429 message, generic one otherwise", () => {
    expect(
      friendlyError(apiError(429, "Veuillez attendre avant de renvoyer le code"), "f"),
    ).toBe("Veuillez attendre avant de renvoyer le code");
    expect(friendlyError(apiError(429, "ThrottlerException: Too Many Requests"), "f")).toBe(
      RATE_LIMIT_ERROR,
    );
  });

  it("replaces network, server and technical failures", () => {
    expect(friendlyError(new TypeError("Failed to fetch"), "f")).toBe(NETWORK_ERROR);
    expect(friendlyError(apiError(502, "Bad Gateway"), "f")).toBe(SERVER_ERROR);
    expect(friendlyError(apiError(400, "property foo should not exist"), "fallback")).toBe(
      "fallback",
    );
  });

  it("uses the first line of a class-validator list", () => {
    expect(friendlyError(apiError(400, ["Adresse email invalide"]), "f")).toBe(
      "Adresse email invalide",
    );
  });
});
