"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { sendSignUpCode, verifySignUpCode } from "#/lib/api/signup-controller";
import type { AccountValues } from "./account-step";
import { CodeInput, completeCode } from "./code-input";
import { FormError, StepActions, StepHeading } from "./form-bits";

const RESEND_SECONDS = 60;

/** The 6-digit code sent to the account email; it hands back the signup token. */
export function VerifyStep({
  account,
  onBack,
  onDone,
}: Readonly<{
  account: AccountValues;
  onBack: () => void;
  onDone: (signupToken: string) => void;
}>) {
  const t = useTranslations("signUp");
  const friendlyError = useFriendlyError();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function verify() {
    const code = completeCode(value);
    if (!code) {
      setError(t("code.incomplete"));
      return;
    }
    setError(null);
    setPending(true);
    try {
      const { signupToken } = await verifySignUpCode(account.email, code);
      onDone(signupToken);
    } catch (err) {
      setError(friendlyError(err, t("code.failed"), { keepUnauthorized: true }));
      setPending(false);
    }
  }

  async function resend() {
    setError(null);
    try {
      await sendSignUpCode({ email: account.email, firstName: account.firstName, lastName: account.lastName });
      setValue("");
      setCooldown(RESEND_SECONDS);
      toast.success(t("code.resent"));
    } catch (err) {
      toast.error(friendlyError(err, t("code.resendFailed")));
    }
  }

  return (
    <form
      noValidate
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        void verify();
      }}
    >
      <StepHeading
        title={t("verify.title")}
        text={t("verify.text", { email: account.email })}
      />

      <CodeInput value={value} onChange={setValue} disabled={pending} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">{t("verify.nothing")}</span>
        <button
          type="button"
          onClick={() => void resend()}
          disabled={cooldown > 0}
          className="font-medium underline-offset-4 hover:underline disabled:text-muted-foreground disabled:no-underline"
        >
          {cooldown > 0 ? t("code.resendIn", { seconds: cooldown }) : t("code.resend")}
        </button>
        <button type="button" onClick={onBack} className="font-medium underline-offset-4 hover:underline">
          {t("verify.changeEmail")}
        </button>
      </div>

      <FormError message={error} />
      <StepActions onBack={onBack} continueLabel={t("verify.submit")} pending={pending} />
    </form>
  );
}
