/**
 * Which application statuses still have a conversation worth opening.
 *
 * The worker's job feed gets this decided server-side and arrives with
 * `applicationId` already null or set — see `chattable-applications.ts` in the
 * backend. The employer's lists carry a raw status instead, so the same rule
 * has to be applied here.
 *
 * Kept as one exported set rather than written inline at each call site, so the
 * two sides of the app cannot answer the question differently — an employer
 * seeing a chat button the worker does not is the kind of asymmetry nobody
 * reports and everybody notices.
 *
 * Mirrors LIVE_APPLICATION_STATUSES in ProfileChatService, which is the
 * authority. A status missing here only hides a button; a status wrongly
 * present renders one the API then refuses, which is worse.
 */
const CHATTABLE_STATUSES = new Set([
  "PENDING",
  "VIEWED",
  "WAITING_PAYMENT",
  "ACCEPTED",
  "STARTED",
]);

/**
 * The application id when its thread is still open, null otherwise.
 *
 * Shaped to feed `StartChatButton` directly, which renders nothing on null —
 * so a dead application simply has no button rather than a disabled one.
 */
export function chattableApplicationId(
  id: string,
  status: string,
): string | null {
  return CHATTABLE_STATUSES.has(status) ? id : null;
}
