import { IconArrowRight } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import { LocalLink as Link } from "#/components/local-link";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";
import { DEMO_HREF, SIGN_UP_HREF } from "../content";

/** « Demander une démo », the site's first call to action. */
export function DemoButton({ className, label }: Readonly<{ className?: string; label?: string }>) {
  const t = useTranslations("site.buttons");
  return (
    <Button
      variant="ghost"
      size="xl"
      render={<Link href={DEMO_HREF} />}
      className={cn("rounded-full bg-ink px-6 text-white hover:bg-ink/90", className)}
    >
      {label ?? t("demo")}
      <IconArrowRight />
    </Button>
  );
}

/** « Ouvrir un compte », the second way in, beside the demo. */
export function SignUpButton({ className, label }: Readonly<{ className?: string; label?: string }>) {
  const t = useTranslations("site.buttons");
  return (
    <Button
      variant="ghost"
      size="xl"
      render={<Link href={SIGN_UP_HREF} />}
      className={cn("rounded-full bg-card/70 px-6 hover:bg-card", className)}
    >
      {label ?? t("signUp")}
    </Button>
  );
}
