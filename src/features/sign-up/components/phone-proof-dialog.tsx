"use client";

import { useEffect, useRef, useState } from "react";
import { IconBrandWhatsapp } from "@tabler/icons-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { ActionDialog } from "#/components/action-dialog";
import { httpStatusOf } from "#/lib/api/friendly-error";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { sendSignUpPhoneCode, verifySignUpPhoneCode } from "#/lib/api/signup-controller";
import { useWhyNot } from "#/lib/use-why-not";
import { CodeInput, completeCode } from "./code-input";
import { FormError } from "./form-bits";

const RESEND_SECONDS = 60;

/**
 * The organisation's number, proven before the account is created: a code
 * goes to it on WhatsApp as the dialog opens. Unproven, the number would
 * take the WhatsApp sign-in of whoever owns it.
 */
export function PhoneProofDialog({
  phone,
  signupToken,
  onOpenChange,
  onProven,
  onChangeNumber,
}: Readonly<{
  /** International (+242…); null keeps the dialog closed. */
  phone: string | null;
  signupToken: string;
  onOpenChange: (open: boolean) => void;
  onProven: () => void;
  onChangeNumber: () => void;
}>) {
  const t = useTranslations("signUp");
  const whyNot = useWhyNot();
  const friendlyError = useFriendlyError();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  /** The number is already someone's on Rabotka: only another one helps. */
  const [taken, setTaken] = useState(false);
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const sentTo = useRef<string | null>(null);

  async function send(number: string) {
    setError(null);
    setTaken(false);
    setSending(true);
    try {
      await sendSignUpPhoneCode(number, signupToken);
      setValue("");
      setCooldown(RESEND_SECONDS);
      return true;
    } catch (err) {
      setTaken(httpStatusOf(err) === 409);
      setError(friendlyError(err, t("phoneProof.sendFailed")));
      return false;
    } finally {
      setSending(false);
    }
  }

  // Once per number: reopening for the same one does not send again.
  useEffect(() => {
    if (!phone || sentTo.current === phone) return;
    sentTo.current = phone;
    void send(phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per number
  }, [phone]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function confirm() {
    if (!phone) return;
    const code = completeCode(value);
    if (!code) {
      setError(t("code.incomplete"));
      return;
    }
    setError(null);
    setPending(true);
    try {
      await verifySignUpPhoneCode(phone, code, signupToken);
      onProven();
    } catch (err) {
      setError(friendlyError(err, t("code.failed"), { keepUnauthorized: true }));
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    if (phone && (await send(phone))) toast.success(t("code.resent"));
  }

  return (
    <ActionDialog
      open={phone !== null}
      onOpenChange={onOpenChange}
      icon={<IconBrandWhatsapp className="size-5" />}
      title={t("phoneProof.title")}
      description={
        sending ? t("phoneProof.sending", { phone: phone ?? "" }) : t("phoneProof.text", { phone: phone ?? "" })
      }
      confirmLabel={t("phoneProof.confirm")}
      onConfirm={() => void confirm()}
      pending={pending}
      confirmDisabled={sending || taken}
      confirmDisabledReason={taken ? t("phoneProof.changeNumber") : undefined}
    >
      {!taken && <CodeInput value={value} onChange={setValue} disabled={pending || sending} />}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {!taken && (
          <button
            type="button"
            onClick={() => void resend()}
            disabled={cooldown > 0 || sending}
            title={whyNot([cooldown > 0, { say: t("code.resendIn", { seconds: cooldown }) }])}
            className="font-medium underline-offset-4 hover:underline disabled:text-muted-foreground disabled:no-underline"
          >
            {cooldown > 0 ? t("code.resendIn", { seconds: cooldown }) : t("code.resend")}
          </button>
        )}
        <button type="button" onClick={onChangeNumber} className="font-medium underline-offset-4 hover:underline">
          {t("phoneProof.changeNumber")}
        </button>
      </div>
      <FormError message={error} />
    </ActionDialog>
  );
}
