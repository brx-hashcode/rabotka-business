import { BrandLoader } from "#/components/brand-loader";

/** Between pages: the brand loader under the header while the next page renders. */
export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Chargement"
      className="flex min-h-[calc(100svh-4rem)] items-center justify-center px-4"
    >
      <BrandLoader />
    </div>
  );
}
