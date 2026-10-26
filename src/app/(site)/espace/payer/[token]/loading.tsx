import { FormPageSkeleton } from "#/components/page-skeletons";

/** While the page loads: its shape, not a spinner. */
export default function Loading() {
  return <FormPageSkeleton aside={false} />;
}
