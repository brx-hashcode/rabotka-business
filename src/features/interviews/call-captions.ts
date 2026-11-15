"use client";

import { useCallback, useEffect, useRef } from "react";

import { addCallTranscript, type CallTranscriptLine } from "#/lib/api/interview-controller";

/** A Jitsi call's events, as far as the transcript needs them. */
export type CallEvent = {
  name?: string;
  key?: string;
  /** videoConferenceJoined: my own participant id. */
  id?: string;
  /** transcribingStatusChanged: whether the server transcribes the call. */
  on?: boolean;
  /** transcriptionChunkReceived: one participant's sentence. */
  data?: {
    messageID?: string;
    final?: string;
    participant?: { id?: string; name?: string };
  };
};

export type CallCaptionsApi = {
  executeCommand: (command: string, ...args: unknown[]) => void;
  addListener: (event: string, listener: (payload?: CallEvent) => void) => void;
};

/** Lines per request: the server takes twenty at most. */
const BATCH = 20;
/** Sentences gathered this long before they are sent. */
const FLUSH_MS = 2500;

/**
 * One finished sentence of the call's captions as a transcript line; null for
 * a sentence still being recognised (no `final`) or one already taken.
 */
export function captionLine(event: CallEvent | undefined, myId: string | null, seen: Set<string>): CallTranscriptLine | null {
  const d = event?.data;
  const text = d?.final?.trim();
  if (!d?.messageID || !text || seen.has(d.messageID)) return null;
  seen.add(d.messageID);
  const id = d.participant?.id;
  return {
    text,
    at: new Date().toISOString(),
    speaker: d.participant?.name?.trim() || undefined,
    self: Boolean(id && myId && id === myId),
  };
}

/**
 * The business's call: our Jitsi transcribes it on the server (the
 * « Sous-titres »), and this page relays each finished sentence, everyone's,
 * to the interview's transcript, the « Compte rendu » is written from.
 * Nobody switches anything on, and no browser listens to anyone.
 *
 * Returns what to attach to the call's API once it is ready.
 */
export function useCallCaptions(interviewId: string | undefined, enabled: boolean) {
  const queue = useRef<CallTranscriptLine[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!interviewId) return;
    while (queue.current.length > 0) {
      const batch = queue.current.splice(0, BATCH);
      // A lost batch is a few sentences: the call goes on, nothing to show.
      void addCallTranscript(interviewId, batch).catch(() => undefined);
    }
  }, [interviewId]);

  // Leaving the page sends what is still waiting.
  useEffect(() => flush, [flush]);

  return useCallback(
    (api: CallCaptionsApi) => {
      if (!enabled || !interviewId) return;
      const seen = new Set<string>();
      let myId: string | null = null;
      api.addListener("videoConferenceJoined", (e) => {
        myId = e?.id ?? null;
        // The server's transcription, for everyone, without captions on screen:
        // « Sous-titres » still shows them to whoever wants them.
        api.executeCommand("setSubtitles", true, false);
      });
      api.addListener("transcriptionChunkReceived", (e) => {
        const line = captionLine(e, myId, seen);
        if (!line) return;
        queue.current.push(line);
        if (queue.current.length >= BATCH) flush();
        else timer.current ??= setTimeout(flush, FLUSH_MS);
      });
      api.addListener("videoConferenceLeft", flush);
    },
    [enabled, interviewId, flush],
  );
}
