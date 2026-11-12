"use client";

import { useEffect, useRef } from "react";

import type { TranscriptLineInput } from "#/lib/api/interview-controller";
import { useDictation } from "./use-dictation";

/** Sent every this often, or sooner once a few sentences wait. */
const FLUSH_MS = 4000;
const FLUSH_LINES = 5;

/**
 * « Transcrire l'entretien », on this side of the call: while `on`, the
 * browser recognises this person's own voice and `send` receives the
 * finished sentences, each with the moment it was said. A failed send keeps
 * them for the next one.
 */
export function useCallTranscript(on: boolean, send: (lines: TranscriptLineInput[]) => Promise<unknown>) {
  const queue = useRef<TranscriptLineInput[]>([]);
  const sending = useRef(false);
  const sender = useRef(send);
  useEffect(() => {
    sender.current = send;
  });

  const flush = async () => {
    if (sending.current || queue.current.length === 0) return;
    sending.current = true;
    const batch = queue.current.splice(0, 20);
    try {
      await sender.current(batch);
    } catch {
      queue.current.unshift(...batch);
    } finally {
      sending.current = false;
    }
  };

  // No meter: the call already holds the microphone, and phones share it badly.
  const speech = useDictation(
    (text) => {
      const clean = text.trim();
      if (!clean) return;
      queue.current.push({ text: clean, at: new Date().toISOString() });
      if (queue.current.length >= FLUSH_LINES) void flush();
    },
    { meter: false },
  );

  const { supported, listening, error, start, stop } = speech;
  useEffect(() => {
    if (!on || !supported) return;
    if (!listening) void start();
    const timer = setInterval(() => void flush(), FLUSH_MS);
    return () => {
      clearInterval(timer);
      void flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- started once per switch, not per render
  }, [on, supported]);
  useEffect(() => {
    if (!on && listening) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stopped when switched off
  }, [on]);

  return { supported, listening, error };
}
