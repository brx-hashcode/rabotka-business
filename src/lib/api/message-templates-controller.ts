import { BusinessBaseController } from "./base-controller";

export type MessageKind = "INVITATION" | "REFUSAL" | "INFORMATION" | "OTHER";

export const MESSAGE_KIND_LABEL: Record<MessageKind, string> = {
  INVITATION: "Invitation",
  REFUSAL: "Refus",
  INFORMATION: "Demande d'information",
  OTHER: "Autre",
};

/** A template the business wrote. */
export type MessageTemplate = {
  id: string;
  kind: MessageKind;
  title: string;
  body: string;
  updatedAt: string;
  author: string | null;
};

/** A ready-made one, offered while the business has none of its kind. */
export type SuggestedTemplate = { key: string; kind: MessageKind; title: string; body: string };

export type MessageTemplateInput = { kind: MessageKind; title: string; body: string };

/** `business/me/message-templates` and `business/me/offers/:id/messages`. */
class MessageTemplatesController extends BusinessBaseController {
  list(): Promise<{ templates: MessageTemplate[]; suggested: SuggestedTemplate[] }> {
    return this.get("/business/me/message-templates");
  }

  create(input: MessageTemplateInput): Promise<{ id: string }> {
    return this.post("/business/me/message-templates", input);
  }

  update(id: string, input: MessageTemplateInput): Promise<{ id: string }> {
    return this.patch(`/business/me/message-templates/${encodeURIComponent(id)}`, input);
  }

  remove(id: string): Promise<{ deleted: boolean }> {
    return this.delete(`/business/me/message-templates/${encodeURIComponent(id)}`);
  }

  /** One message to several candidates of an offer; `{prenom}`… filled in for each. */
  send(offerId: string, input: { rabotka?: string[]; external?: string[]; body: string }): Promise<{ sent: number; skipped: number }> {
    return this.post(`/business/me/offers/${encodeURIComponent(offerId)}/messages`, input);
  }
}

const controller = new MessageTemplatesController();

export const listMessageTemplates = controller.list.bind(controller);
export const createMessageTemplate = controller.create.bind(controller);
export const updateMessageTemplate = controller.update.bind(controller);
export const deleteMessageTemplate = controller.remove.bind(controller);
export const sendCandidatesMessage = controller.send.bind(controller);
export const messageTemplatesKey = ["message-templates"] as const;

/** The placeholders a template may use, as the editor offers them. */
export const PLACEHOLDERS = [
  { token: "{prenom}", label: "Prénom" },
  { token: "{poste}", label: "Poste" },
  { token: "{entreprise}", label: "Entreprise" },
] as const;

/** The same filling as the server's, for the preview. */
export function renderTemplate(body: string, vars: { prenom: string; poste: string; entreprise: string }): string {
  return body.replace(/\{\s*(prenom|prénom|poste|entreprise)\s*\}/gi, (_, key: string) => {
    const k = key.toLowerCase().replace("é", "e") as keyof typeof vars;
    return vars[k]?.trim() || "";
  });
}
