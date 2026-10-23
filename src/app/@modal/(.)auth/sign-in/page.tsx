import { Suspense } from "react";

import { AuthDialog } from "#/features/auth/components/auth-dialog";
import { SignInFlow } from "#/features/auth/components/sign-in-flow";

/** /auth/sign-in reached by a link inside the app: a dialog over the page. */
export default function SignInModal() {
  return (
    <AuthDialog>
      <Suspense>
        <SignInFlow />
      </Suspense>
    </AuthDialog>
  );
}
