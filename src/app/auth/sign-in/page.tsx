import { Suspense } from "react";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { AuthShell } from "#/features/auth/components/auth-shell";
import { SignInFlow } from "#/features/auth/components/sign-in-flow";
import { SIGN_UP_HREF } from "#/features/landing/content";

/**
 * The sign-in page: the only way in, from a link or an expired session alike.
 *
 * Full screen, no site header (it lives outside the (site) group): the form
 * column on the left, the wall of what the space does on the right
 * (AuthShell). Below `lg` only the form remains. No « sign in / create an
 * account » tabs: most people here have an account, and creating one is a
 * page of its own (the wizard), so a link under the form says where it is.
 */
export default function SignInPage() {
  const t = useTranslations("auth.signIn");
  return (
    <AuthShell>
      <div className="flex flex-1 flex-col justify-center py-12">
        <Suspense>
          <SignInFlow
            layout="split"
            belowForm={
              <p className="text-muted-foreground text-sm">
                {t("noAccount")}{" "}
                <Link href={SIGN_UP_HREF} className="font-medium text-foreground underline underline-offset-4">
                  {t("createAccount")}
                </Link>
              </p>
            }
          />
        </Suspense>
      </div>
    </AuthShell>
  );
}
