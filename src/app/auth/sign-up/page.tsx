import { Suspense } from "react";

import { SignUpWizard } from "#/features/sign-up/components/sign-up-wizard";

/**
 * The business sign-up, full screen: a photo per step on the left, the form
 * on the right. Suspense for nuqs, which reads the step from the URL.
 */
export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpWizard />
    </Suspense>
  );
}
