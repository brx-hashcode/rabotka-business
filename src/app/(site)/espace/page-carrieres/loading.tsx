import { useTranslations } from "next-intl";

import { HeaderSkeleton } from "#/components/page-skeletons";
import { EditorBones } from "#/features/careers-editor/components/careers-editor-page";

/** While the page loads: its shape, not a spinner. */
export default function Loading() {
  const t = useTranslations("ui");
  return (
    <div role="status" aria-label={t("loading")} className="w-full space-y-6 pt-2">
      <HeaderSkeleton action />
      <EditorBones />
    </div>
  );
}
