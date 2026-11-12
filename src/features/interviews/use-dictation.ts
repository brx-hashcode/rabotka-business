"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

/**
 * The browser's own speech recognition (Chrome, Edge, Safari), in French:
 * « Dicter » in the notes, and « Transcrire l'entretien » during the visio.
 * It hears only this device's microphone, never the other side of a call.
 * Absent on Firefox (`supported` false).
 */
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

export function recognitionClass(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noSubscribe = () => () => {};

/** The browser's own dictation (Chrome, Edge, Safari), in French; absent elsewhere. */
export function useDictation(
  onText: (text: string) => void,
  /** The voice meter opens its own microphone stream: off beside a call, on phones that share one badly. */
  { meter = true }: { meter?: boolean } = {},
) {
  const supported = useSyncExternalStore(noSubscribe, () => recognitionClass() !== null, () => false);
  const [listening, setListening] = useState(false);
  /** The words heard so far, not yet final: shown in grey under the notes. */
  const [interim, setInterim] = useState("");
  /** The microphone's level, for the meter; the recognition has no level of its own. */
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  /** Why the browser stopped listening (« network », « audio-capture »…): none while it works. */
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<Recognition | null>(null);
  const wanted = useRef(false);
  const audio = useRef<{ stream: MediaStream; context: AudioContext } | null>(null);
  const handler = useRef(onText);
  useEffect(() => {
    handler.current = onText;
  });

  const release = () => {
    audio.current?.stream.getTracks().forEach((t) => t.stop());
    void audio.current?.context.close();
    audio.current = null;
    setAnalyser(null);
  };
  useEffect(
    () => () => {
      wanted.current = false;
      ref.current?.stop();
      audio.current?.stream.getTracks().forEach((t) => t.stop());
      void audio.current?.context.close();
    },
    [],
  );

  const listen = (Klass: new () => Recognition) => {
    const r = new Klass();
    r.lang = "fr-FR";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let pending = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (!res) continue;
        if (res.isFinal) handler.current(res[0].transcript);
        else pending += res[0].transcript;
      }
      setInterim(pending);
    };
    // The browser ends a dictation after a silence: picked up again until « Arrêter ».
    r.onend = () => {
      setInterim("");
      if (wanted.current) {
        try {
          r.start();
          return;
        } catch {
          /* already restarting */
        }
      }
      setListening(false);
      release();
    };
    r.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      wanted.current = false;
      setError(e.error);
      if (e.error === "not-allowed") toast.error("Autorisez le micro dans votre navigateur pour dicter.");
    };
    ref.current = r;
    r.start();
  };

  const start = async () => {
    const Klass = recognitionClass();
    if (!Klass) return;
    setError(null);
    wanted.current = true;
    setListening(true);
    setStartedAt(Date.now());
    listen(Klass);
    if (!meter) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContext();
      const node = context.createAnalyser();
      node.fftSize = 1024;
      node.smoothingTimeConstant = 0.6;
      context.createMediaStreamSource(stream).connect(node);
      audio.current = { stream, context };
      setAnalyser(node);
    } catch {
      // No meter without the microphone's stream; the dictation itself may still run.
    }
  };
  const stop = () => {
    wanted.current = false;
    ref.current?.stop();
    setListening(false);
    setInterim("");
    release();
  };
  return { supported, listening, interim, analyser, startedAt, error, start, stop };
}

/** What to tell someone whose browser stopped transcribing them. */
export function speechErrorText(error: string): string {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Le micro est refusé à la transcription : autorisez-le dans votre navigateur.";
  }
  if (error === "audio-capture") return "Votre micro n'est pas disponible pour la transcription.";
  if (error === "network") return "Le service vocal de votre navigateur ne répond pas.";
  return "La transcription s'est arrêtée sur ce navigateur.";
}
