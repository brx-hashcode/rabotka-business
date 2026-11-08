import { Suspense } from "react";
import { headers } from "next/headers";

import { SignUpWizard } from "#/features/sign-up/components/sign-up-wizard";

/**
 * The business sign-up, full screen: a photo per step on the left, the form
 * on the right. Suspense for nuqs, which reads the step from the URL.
 */
export default async function SignUpPage() {
  // Cloudflare tells where the visitor is: their country is suggested first.
  const visitorCountry = (await headers()).get("cf-ipcountry");
  return (
    <Suspense>
      <SignUpWizard visitorCountry={visitorCountry} />
    </Suspense>
  );
}
