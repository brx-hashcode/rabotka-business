import type { BusinessCatalog, DocumentList } from "#/lib/api/types";

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

export type IdentifierKey = keyof BusinessCatalog["identifiers"];
export const IDENTIFIER_KEYS: readonly IdentifierKey[] = ["registrationNumber", "taxId", "statisticalId"];

/** Which paper carries each official number. */
const IDENTIFIER_PAPER: Record<IdentifierKey, string> = {
  registrationNumber: "RCCM",
  taxId: "NIU",
  statisticalId: "SCIEN_SCIET",
};

/**
 * The official numbers to ask, as the papers go (the server's
 * `identifiersFor`): a number is asked when its paper is one the type may
 * send — no N° RCCM for an association or an embassy — and required when that
 * paper is required on its own, as a company's RCCM and NIU. Null: not asked.
 */
export function officialIdentifiers(
  documents: DocumentList,
  legalForm: string | undefined,
  fields: BusinessCatalog["identifiers"],
) {
  const required = (legalForm && documents.requiredByLegalForm?.[legalForm]) || documents.required;
  const accepted = new Set([...documents.recommended, ...documents.optional, ...required.flat()]);
  const mustSend = new Set(required.filter((g) => g.length === 1).map((g) => g[0]));
  return Object.fromEntries(
    IDENTIFIER_KEYS.map((key) => {
      const field = fields[key];
      const paper = IDENTIFIER_PAPER[key];
      return [key, field && accepted.has(paper) ? { ...field, required: mustSend.has(paper) } : null];
    }),
  ) as Record<IdentifierKey, (NonNullable<BusinessCatalog["identifiers"][IdentifierKey]> & { required: boolean }) | null>;
}
