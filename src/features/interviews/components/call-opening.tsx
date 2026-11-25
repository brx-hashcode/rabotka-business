"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { IconVideo } from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import type { CallCaptionsApi } from "../call-captions";

/** Later than this, something is wrong: the screen says so and offers to try again. */
export const SLOW_MS = 15_000;
/** A server that tells nothing: shown this long after its page has loaded. */
export const LOADED_GRACE_MS = 3_000;

/**
 * Once, when the call has something to show: its page before joining, the
 * call itself, or a message of its own. Returns what stops watching.
 */
export function whenCallShows(api: Pick<CallCaptionsApi, "addListener">, frame: HTMLIFrameElement | null, show: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let done = false;
  const once = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    show();
  };
  for (const event of ["prejoinScreenLoaded", "videoConferenceJoined", "errorOccurred"]) api.addListener(event, once);
  const onLoad = () => {
    timer ??= setTimeout(once, LOADED_GRACE_MS);
  };
  frame?.addEventListener("load", onLoad);
  return () => {
    done = true;
    clearTimeout(timer);
    frame?.removeEventListener("load", onLoad);
  };
}

/** Over the call until it has something to show: Jitsi's frame is blank for seconds. */
export function CallOpening() {
  const t = useTranslations("interviews.visio");
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_MS);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div role="status" className="absolute inset-0 z-5 flex flex-col items-center justify-center gap-5 bg-card p-6 text-center">
      <span className="relative flex size-16 items-center justify-center">
        <span aria-hidden className="absolute inset-0 rounded-full bg-whatsapp/25 motion-safe:animate-ping" />
        <span className="relative flex size-16 items-center justify-center rounded-full bg-brand-lime text-brand-lime-foreground">
          <IconVideo className="size-7" />
        </span>
      </span>
      <div className="max-w-xs space-y-1">
        <p className="font-semibold">{t("opening")}</p>
        <p className="text-muted-foreground text-sm">{slow ? t("openingSlow") : t("openingHint")}</p>
      </div>
      {slow && (
        // The page again, not the frame: a start script that failed is not asked for twice.
        <Button variant="ghost" className="rounded-full bg-page px-6" onClick={() => window.location.reload()}>
          {t("retry")}
        </Button>
      )}
    </div>
  );
}
