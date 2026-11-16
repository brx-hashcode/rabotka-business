import { LoaderIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { cn } from "#/lib/utils";

export function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof LoaderIcon>): React.ReactElement {
  const t = useTranslations("ui");
  return (
    <LoaderIcon
      aria-label={t("loading")}
      className={cn("animate-spin", className)}
      role="status"
      {...props}
    />
  );
}
