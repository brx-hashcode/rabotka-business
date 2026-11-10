"use client";

import { useMutation } from "@tanstack/react-query";
import { IconCheck } from "@tabler/icons-react";

import { BusinessLockup } from "#/components/business-lockup";
import { withdrawFromPool } from "#/lib/api/careers-controller";
import { friendlyError } from "#/lib/api/friendly-error";

/**
 * The candidate takes back « garder ma candidature »: one button rather than
 * on opening the page, so a mail scanner that follows links withdraws
 * nobody. Their application itself is not withdrawn.
 */
export function PoolWithdrawPage({ token }: Readonly<{ token: string }>) {
  const withdraw = useMutation({ mutationFn: () => withdrawFromPool(token) });
  return (
    <main className="min-h-svh bg-page px-4 py-8 sm:py-14">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="flex justify-center">
          <BusinessLockup />
        </div>
        <section className="space-y-5 rounded-3xl bg-card p-6 sm:p-8">
          {withdraw.isSuccess ? (
            <div className="flex items-start gap-3 rounded-2xl bg-chip-green p-4 text-chip-green-foreground">
              <IconCheck className="mt-0.5 size-5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-semibold">C&apos;est fait</p>
                <p className="text-sm">
                  Le recruteur ne garde plus votre candidature pour d&apos;autres postes. Votre candidature pour «{" "}
                  {withdraw.data.jobTitle} » reste à l&apos;étude.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h1 className="font-semibold text-xl">Retirer ma candidature de sa liste</h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Vous aviez accepté que le recruteur garde votre candidature pour vous proposer d&apos;autres postes. En la
                  retirant, il ne la retrouvera plus. Votre candidature actuelle, elle, reste à l&apos;étude.
                </p>
              </div>
              <button
                type="button"
                disabled={withdraw.isPending}
                onClick={() => withdraw.mutate()}
                className="h-12 w-full rounded-full bg-ink font-medium text-white hover:bg-ink/90 disabled:opacity-40"
              >
                Retirer ma candidature de sa liste
              </button>
              {withdraw.isError && (
                <p className="text-destructive text-sm">
                  {friendlyError(withdraw.error, "Ce lien n'est plus valable : la candidature n'est peut-être plus gardée.")}
                </p>
              )}
            </>
          )}
        </section>
        <p className="text-center text-muted-foreground text-xs">Rabotka · www.rabotka.work</p>
      </div>
    </main>
  );
}
