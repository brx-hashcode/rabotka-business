import { HeaderSkeleton } from "#/components/page-skeletons";
import { EditorBones } from "#/features/careers-editor/components/careers-editor-page";

/** While the page loads: its shape, not a spinner. */
export default function Loading() {
  return (
    <div role="status" aria-label="Chargement" className="w-full space-y-6 pt-2">
      <HeaderSkeleton action />
      <EditorBones />
    </div>
  );
}
