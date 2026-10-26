import { GridPageSkeleton } from "#/components/page-skeletons";

/** While the page loads: its shape, not a spinner. */
export default function Loading() {
  return <GridPageSkeleton tiles={4} />;
}
