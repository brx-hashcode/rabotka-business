import { isProductHuntLaunched, parseProductHuntVotes, productHuntBadgeUrl } from "./content";

/**
 * The launch's upvote count, or null before launch, during the hidden first
 * hours, or when Product Hunt is slow or down: the badge then shows without a
 * number rather than holding the landing up.
 */
export async function productHuntVotesServer(): Promise<number | null> {
  if (!isProductHuntLaunched()) return null;
  try {
    const res = await fetch(productHuntBadgeUrl(), {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    return parseProductHuntVotes(await res.text());
  } catch {
    return null;
  }
}
