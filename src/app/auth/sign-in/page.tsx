import { Suspense } from "react";

import { AuthShell, AuthTabs } from "#/features/auth/components/auth-shell";
import { SignInFlow } from "#/features/auth/components/sign-in-flow";

/**
 * The sign-in page: the only way in, from a link or an expired session alike.
 *
 * Full screen, no site header (it lives outside the (site) group): the form
 * column on the left, the wall of what the space does on the right
 * (AuthShell). Below `lg` only the form remains.
 */
export default function SignInPage() {
  return (
    <AuthShell>
      <div className="flex flex-1 flex-col justify-center py-12">
        <AuthTabs active="sign-in" />
        <div className="mt-8">
          <Suspense>
            <SignInFlow layout="split" />
          </Suspense>
        </div>
      </div>
    </AuthShell>
  );
}
