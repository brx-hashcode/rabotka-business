import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

import { BrandLogo } from "#/components/brand-logo";
import { Button } from "#/components/ui/button";

/**
 * Placeholder until the business sign-up screens exist (email code, then the
 * organisation and its documents — the backend side is in place). Every
 * « Créer un compte » on the landing points here.
 */
export default function SignUpPage() {
  return (
    <div className="flex min-h-svh flex-col bg-card px-6 py-10 sm:px-12">
      <Link href="/" aria-label="Rabotka — accueil" className="self-start">
        <BrandLogo />
      </Link>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6">
        <div className="space-y-2">
          <h1 className="font-semibold text-3xl tracking-tight">Créer votre espace entreprise</h1>
          <p className="text-muted-foreground">
            L&apos;inscription en ligne ouvre très bientôt. En attendant, vous
            pouvez vous connecter si votre organisation a déjà un compte.
          </p>
        </div>
        <Button size="xl" render={<Link href="/auth/sign-in" />} className="w-full rounded-full">
          Se connecter
        </Button>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-muted-foreground text-sm transition-colors hover:bg-page hover:text-foreground"
        >
          <IconArrowLeft className="size-4" />
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
