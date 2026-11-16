import type { Messages, NamespaceKeys, NestedKeyOf, useTranslations } from "next-intl";

/**
 * A translator bound to one namespace, as useTranslations (client) or
 * getTranslations (server) return it: pure helpers take one, so they work on
 * both sides and in tests (createTranslator with MESSAGES.fr).
 */
export type Translator<Namespace extends NamespaceKeys<Messages, NestedKeyOf<Messages>>> = ReturnType<
  typeof useTranslations<Namespace>
>;

export type LabelsT = Translator<"labels">;
