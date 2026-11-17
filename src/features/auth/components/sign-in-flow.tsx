"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { appConfig } from "#/config";
import { safeRedirectPath } from "#/lib/safe-redirect";
import { cn } from "#/lib/utils";
import {
  useResendOtpMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
} from "#/hooks/use-auth-mutations";
import { Step1EmailForm } from "./step1-email-form";
import { Step2OtpForm } from "./step2-otp-form";

/**
 * Email, then the 6-digit code, on the /auth/sign-in page.
 *
 * The backend answers send-otp with a 404 for an address that has no account,
 * shown as it comes ("Aucun compte trouvé…").
 */
export function SignInFlow({
  layout = "centered",
  belowForm,
}: Readonly<{
  /** "split": the full page's form column — left-aligned, no logo (the photo panel carries the brand). */
  layout?: "centered" | "split";
  /** Rendered right under the form's buttons (the page's back link). */
  belowForm?: React.ReactNode;
}>) {
  const split = layout === "split";
  const t = useTranslations("auth.signIn");
  const friendlyError = useFriendlyError();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get("next")) ?? appConfig.homePath;

  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useSendOtpMutation();
  const resendOtp = useResendOtpMutation();
  const verify = useVerifyOtpMutation(redirectTo);

  async function handleEmail({ email: value }: { email: string }) {
    setError(null);
    try {
      await sendOtp.mutateAsync(value);
      setEmail(value);
    } catch (err) {
      setError(friendlyError(err, t("sendFailed")));
    }
  }

  async function handleOtp({ otp }: { otp: string }) {
    if (!email) return;
    setError(null);
    try {
      await verify.mutateAsync({ email, otp });
      toast.success(t("signedIn"));
    } catch (err) {
      setError(
        friendlyError(err, t("codeFailed"), {
          keepUnauthorized: true,
        }),
      );
    }
  }

  async function handleResend() {
    if (!email) return;
    setError(null);
    try {
      await resendOtp.mutateAsync(email);
      toast.success(t("resent"));
    } catch (err) {
      toast.error(friendlyError(err, t("resendFailed")));
    }
  }

  return (
    <div className={cn("flex w-full flex-col", split ? "gap-8" : "gap-6")}>
      <div
        className={cn(
          "flex flex-col gap-3",
          split ? "items-start text-left" : "items-center text-center",
        )}
      >
        {!split && (
          <Image
            src="/rabotka-logo.png"
            alt="Rabotka"
            width={48}
            height={48}
            className="rounded-xl"
          />
        )}
        <div className="space-y-1.5">
          <h2
            className={cn(
              "font-semibold tracking-tight",
              split ? "text-3xl" : "text-xl",
            )}
          >
            {email ? t("titleCode") : t("titleEmail")}
          </h2>
          <p className="text-muted-foreground text-sm">
            {email ? t("introCode") : t("introEmail")}
          </p>
        </div>
      </div>

      {email ? (
        <Step2OtpForm
          email={email}
          onSubmit={handleOtp}
          onResend={handleResend}
          onBack={() => {
            setEmail(null);
            setError(null);
          }}
          isVerifying={verify.isPending || verify.isSuccess}
          isResending={resendOtp.isPending}
          serverError={error}
        />
      ) : (
        <Step1EmailForm
          defaultEmail={searchParams.get("email") ?? undefined}
          onSubmit={handleEmail}
          isLoading={sendOtp.isPending}
          serverError={error}
        />
      )}

      {belowForm}
    </div>
  );
}
