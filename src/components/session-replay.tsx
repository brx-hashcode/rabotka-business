import Script from "next/script";

import { isIndexedHost } from "#/lib/seo/indexed-host";

/** The Sessio site token: public, it ships in every page. */
const SESSIO_TOKEN = "2c60d4b932c4c997ec46bbbacdcf9abc";
const SESSIO_SRC = "https://api-sessio.flamme.work/tracker.js";

/**
 * Sessio session replay (page views, clicks, replays with every form field
 * masked). Production only: develop and previews share the image, and their
 * test traffic would mix into the real visitors'. One inline script sets the
 * config and then adds the tracker, so the config always exists when the
 * tracker reads it.
 */
export function SessionReplay({ host }: { host: string | null }) {
  if (!isIndexedHost(host)) return null;
  return (
    <Script id="sessio" strategy="afterInteractive">
      {`window.TrackerConfig={token:${JSON.stringify(SESSIO_TOKEN)}};` +
        `var s=document.createElement("script");s.src=${JSON.stringify(SESSIO_SRC)};s.async=true;document.head.appendChild(s);`}
    </Script>
  );
}
