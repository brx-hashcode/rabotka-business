export const NETWORK_ERROR =
  "Impossible de joindre Rabotka. Vérifiez votre connexion internet et réessayez.";
export const SERVER_ERROR =
  "Un problème est survenu de notre côté. Réessayez dans un instant.";
export const SESSION_ERROR = "Votre session a expiré. Reconnectez-vous.";
export const PERMISSION_ERROR = "Vous n'avez pas l'autorisation de faire ceci.";
export const RATE_LIMIT_ERROR =
  "Trop de tentatives. Patientez un instant et réessayez.";

/** HTTP status carried by an mvc-front-sdk ApiError (or our session errors). */
export function httpStatusOf(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const status = (error as { statusCode?: unknown }).statusCode;
  return typeof status === "number" ? status : null;
}

/**
 * Wording written for developers rather than for the person reading the
 * message: database and validation internals, raw values, HTTP phrases.
 */
const TECHNICAL =
  /prisma|invocation|\bundefined\b|\bnull\b|\bNaN\b|[0-9a-f]{8}-[0-9a-f]{4}-|must be (a|an|one of|longer|shorter)\b|should not exist|should not be empty|\bproperty\b|ECONN|ETIMEDOUT|timed? ?out|exception|\bstack\b|Error:|\bat \S+ \(|[{}]|\[object|unknown error|internal server error|bad request|unauthorized|forbidden|not found|network error|failed to fetch|load failed|unexpected token|json/i;

/**
 * A message fit to show a person. Ported from rabotka-admin.
 *
 * The server's own message is kept when it reads like a sentence meant for a
 * person — the backend writes French ones ("Code de vérification invalide ou
 * expiré"). Anything technical, and every network or server failure, is
 * replaced by a standard sentence or by the caller's `fallback`.
 *
 * `keepUnauthorized` keeps the server's 401 message instead of the generic
 * "session expired" — a wrong login code is a 401 that is not about a session.
 */
export function friendlyError(
  error: unknown,
  fallback: string,
  { keepUnauthorized = false } = {},
): string {
  const status = httpStatusOf(error);
  const message = messageOf(error);

  if (status === 0 || (status === null && isNetworkMessage(message))) {
    return NETWORK_ERROR;
  }
  if (status !== null && status >= 500) return SERVER_ERROR;
  if (status === 401 && !keepUnauthorized) return SESSION_ERROR;
  if (status === 429 && !isHuman(message)) return RATE_LIMIT_ERROR;

  if (isHuman(message)) return message;
  if (status === 403) return PERMISSION_ERROR;
  return fallback;
}

function isHuman(message: string | null): message is string {
  return message !== null && !TECHNICAL.test(message) && message.length <= 200;
}

function messageOf(error: unknown): string | null {
  if (typeof error === "string") return error.trim() || null;
  if (typeof error !== "object" || error === null) return null;

  const body = (error as { body?: { message?: unknown } }).body;
  const candidates = [body?.message, (error as { message?: unknown }).message];

  for (const candidate of candidates) {
    // A list is class-validator output; keep its first, human, line.
    if (Array.isArray(candidate)) {
      const first = candidate.find((c) => typeof c === "string");
      if (first) return first;
      continue;
    }
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

function isNetworkMessage(message: string | null): boolean {
  return (
    message !== null &&
    /network error|failed to fetch|load failed|networkerror/i.test(message)
  );
}
