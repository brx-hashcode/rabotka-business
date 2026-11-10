/**
 * The chime of a new notification, as rabotka-admin plays it (the same
 * sound, as AAC: 21 kB instead of a 346 kB WAV).
 *
 * Browsers only play sound after a gesture on the page: the first click or
 * key primes the element, muted, so the chimes that follow (fired by the
 * socket, not by a gesture) are not blocked. Several notifications at once
 * ring once.
 */

const SRC = "/media/notification.m4a";
const VOLUME = 0.5;
/** Pushes closer together than this ring once. */
const MIN_GAP_MS = 1500;

let audio: HTMLAudioElement | null = null;
let lastPlayed = 0;

function element(): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof Audio === "undefined") return null;
  if (!audio) {
    audio = new Audio(SRC);
    audio.preload = "auto";
    audio.volume = VOLUME;
  }
  return audio;
}

/** Primes the sound on the first gesture; returns the cleanup. */
export function armNotificationSound(): () => void {
  const unlock = () => {
    remove();
    const el = element();
    if (!el) return;
    el.muted = true;
    el.play()
      .then(() => {
        el.pause();
        el.currentTime = 0;
      })
      .catch(() => undefined)
      .finally(() => {
        el.muted = false;
      });
  };
  const remove = () => {
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
  return remove;
}

export function playNotificationSound(now = Date.now()): void {
  if (now - lastPlayed < MIN_GAP_MS) return;
  const el = element();
  if (!el) return;
  lastPlayed = now;
  try {
    el.currentTime = 0;
  } catch {
    // Not loaded yet: it plays from the start anyway.
  }
  void el.play().catch(() => undefined);
}
