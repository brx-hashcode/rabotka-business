import { permanentRedirect } from "next/navigation";

/**
 * No job board: careers pages exist per business only (/carrieres/[slug]).
 * The old address goes to the business site.
 */
export default function Page() {
  permanentRedirect("/");
}
