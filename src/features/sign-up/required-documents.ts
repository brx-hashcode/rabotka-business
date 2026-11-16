import type { DocumentList } from "#/lib/api/types";

/**
 * What the documents step asks for, from the catalog of the chosen type:
 * the required groups (every group, one paper of each) for its legal form,
 * and the recommended and complementary papers not already in a group.
 *
 * « Autre organisation » may send any paper: its one group is the whole list,
 * shown as the papers to pick from rather than as a group (`anyPaper`).
 */
export function requiredDocuments(
  documents: DocumentList,
  legalForm: string | undefined,
  sent: Readonly<Record<string, unknown>>,
) {
  const required = (legalForm && documents.requiredByLegalForm?.[legalForm]) || documents.required;
  const anyPaper = required.length === 1 && required[0].length > 3;
  const groups = anyPaper ? [] : required;
  const inGroups = new Set(groups.flat());
  return {
    groups,
    anyPaper,
    recommended: documents.recommended.filter((t) => !inGroups.has(t)),
    optional: documents.optional.filter((t) => !inGroups.has(t)),
    /** The groups no paper sent meets yet. */
    missing: required.filter((group) => !group.some((t) => sent[t])),
  };
}
