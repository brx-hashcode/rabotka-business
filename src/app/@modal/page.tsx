/**
 * Closes the dialog on a soft navigation to "/". A parallel slot keeps showing
 * its last state when the new URL has no match in it, so "/" needs its own
 * empty page here — [...catchAll] only matches one segment or more.
 */
export default function ModalRoot() {
  return null;
}
