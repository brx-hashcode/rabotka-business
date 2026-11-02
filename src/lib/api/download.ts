import { refreshSession, SessionError } from "#/lib/auth/session-client";

/**
 * Downloads a file the API renders (a PDF takes a few seconds): the session
 * is refreshed once on a 401, the server's message is kept on a refusal, and
 * the file keeps the name the server gave it.
 */
export async function downloadFile(url: string, fallbackName: string): Promise<void> {
  const send = () => fetch(url, { credentials: "same-origin" });
  let res = await send();
  if (res.status === 401 && (await refreshSession())) res = await send();
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throw new SessionError(typeof data.message === "string" ? data.message : "", res.status, data);
  }
  const name = filenameFrom(res.headers.get("content-disposition"), fallbackName);
  const href = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/** The exact name (`filename*`, UTF-8) when the server gives one, else the plain one. */
export function filenameFrom(disposition: string | null, fallback: string): string {
  const header = disposition ?? "";
  const exact = /filename\*=UTF-8''([^;]+)/i.exec(header)?.[1];
  if (exact) {
    try {
      return decodeURIComponent(exact);
    } catch {
      // A malformed escape: the plain name below.
    }
  }
  return /filename="([^"]+)"/.exec(header)?.[1] ?? fallback;
}
