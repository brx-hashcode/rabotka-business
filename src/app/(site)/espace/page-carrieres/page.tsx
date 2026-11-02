import type { Metadata } from "next";

import { CareersEditorPage } from "#/features/careers-editor/components/careers-editor-page";

export const metadata: Metadata = { title: "Page carrières" };

export default function Page() {
  return <CareersEditorPage />;
}
