import { CareersShell } from "#/features/careers/components/careers-shell";
import { CompanyPageSkeleton } from "#/features/careers/components/company-page-skeleton";

/** While the server reads the page: its shape, not a blank screen. */
export default function Loading() {
  return (
    <CareersShell>
      <CompanyPageSkeleton />
    </CareersShell>
  );
}
