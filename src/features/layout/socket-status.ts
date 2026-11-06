/**
 * Whether the notifications socket is connected (use-notifications-socket.ts).
 * While it is, what it pushes (new applications, CVs read, notifications)
 * refreshes on its own, so the polls that stood in for it slow down to a
 * fallback pace; they go back to their own pace the moment it drops.
 */
let connected = false;

export function setSocketConnected(value: boolean): void {
  connected = value;
}

export function socketConnected(): boolean {
  return connected;
}

/**
 * A poll interval (ms) for something the socket also pushes: `own` while it is
 * down, `fallback` (never faster than `own`) while it is up. Call it inside a
 * `refetchInterval` function: React Query reads it again after each fetch.
 */
export function pollEvery(own: number, fallback = 120_000): number {
  return connected ? Math.max(own, fallback) : own;
}
