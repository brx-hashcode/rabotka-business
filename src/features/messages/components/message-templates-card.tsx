"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { canHire } from "#/features/team/member-access";
import { useMember } from "#/features/team/use-member";
import { friendlyError } from "#/lib/api/friendly-error";
import {
  createMessageTemplate,
  deleteMessageTemplate,
  listMessageTemplates,
  MESSAGE_KIND_LABEL,
  messageTemplatesKey,
  PLACEHOLDERS,
  updateMessageTemplate,
  type MessageKind,
  type MessageTemplate,
  type MessageTemplateInput,
} from "#/lib/api/message-templates-controller";
import { cn } from "#/lib/utils";

const KINDS: MessageKind[] = ["INVITATION", "INFORMATION", "REFUSAL", "OTHER"];
const TITLE_MAX = 60;
const BODY_MAX = 1000;

/**
 * « Modèles de messages »: the words the team writes once and sends again,
 * with a refusal or to several candidates. Everyone reads them; those who
 * hire write them. Ready-made ones show for the kinds not written yet.
 */
export function MessageTemplatesCard() {
  const queryClient = useQueryClient();
  const hire = canHire(useMember().role);
  const { data } = useQuery({ queryKey: messageTemplatesKey, queryFn: listMessageTemplates });
  const [editing, setEditing] = useState<{ id?: string; input: MessageTemplateInput } | null>(null);
  const [removing, setRemoving] = useState<MessageTemplate | null>(null);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: messageTemplatesKey });

  const remove = useMutation({
    mutationFn: (id: string) => deleteMessageTemplate(id),
    onSuccess: () => {
      setRemoving(null);
      refresh();
      toast.success("Modèle supprimé.");
    },
    onError: (err) => toast.error(friendlyError(err, "Le modèle n'a pas pu être supprimé.")),
  });

  if (!data) return null;
  const own = data.templates;

  return (
    <section className="space-y-4 rounded-3xl bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="font-semibold text-lg">Modèles de messages</h2>
          <p className="text-muted-foreground text-sm">Écrits une fois, envoyés avec un refus ou à plusieurs candidats à la fois.</p>
        </div>
        {hire && (
          <button
            type="button"
            onClick={() => setEditing({ input: { kind: "INVITATION", title: "", body: "" } })}
            aria-label="Ajouter un modèle"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-page hover:bg-page/70"
          >
            <IconPlus className="size-4" />
          </button>
        )}
      </div>

      {own.length > 0 && (
        <ul className="space-y-2">
          {own.map((t) => (
            <li key={t.id} className="group flex items-start gap-3 rounded-2xl bg-page p-3">
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium text-sm">{t.title}</span>
                  <span className="shrink-0 rounded-full bg-card px-2 py-0.5 text-muted-foreground text-[11px]">{MESSAGE_KIND_LABEL[t.kind]}</span>
                </span>
                <span className="mt-0.5 line-clamp-2 block text-muted-foreground text-xs">{t.body}</span>
              </span>
              {hire && (
                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing({ id: t.id, input: { kind: t.kind, title: t.title, body: t.body } })}
                    aria-label={`Modifier « ${t.title} »`}
                    className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground"
                  >
                    <IconPencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemoving(t)}
                    aria-label={`Supprimer « ${t.title} »`}
                    className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-card hover:text-destructive"
                  >
                    <IconTrash className="size-4" />
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {data.suggested.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">{own.length > 0 ? "Aussi proposés" : "Proposés pour commencer"}</p>
          <ul className="space-y-2">
            {data.suggested.map((t) => (
              <li key={t.key} className="flex items-start gap-3 rounded-2xl bg-page/60 p-3">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium text-sm">{t.title}</span>
                    <span className="shrink-0 rounded-full bg-card px-2 py-0.5 text-muted-foreground text-[11px]">
                      {MESSAGE_KIND_LABEL[t.kind]}
                    </span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-muted-foreground text-xs">{t.body}</span>
                </span>
                {hire && (
                  <button
                    type="button"
                    onClick={() => setEditing({ input: { kind: t.kind, title: t.title, body: t.body } })}
                    className="shrink-0 rounded-full px-3 py-1.5 font-medium text-xs hover:bg-card"
                  >
                    Adapter
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {editing && <TemplateEditor key={editing.id ?? "new"} initial={editing} onClose={() => setEditing(null)} onSaved={refresh} />}

      <ActionDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        tone="warning"
        icon={<IconTrash className="size-5" />}
        title={`Supprimer « ${removing?.title ?? ""} » ?`}
        description="Les messages déjà envoyés ne changent pas."
        confirmLabel="Supprimer"
        pending={remove.isPending}
        onConfirm={() => removing && remove.mutate(removing.id)}
      />
    </section>
  );
}

function TemplateEditor({
  initial,
  onClose,
  onSaved,
}: Readonly<{ initial: { id?: string; input: MessageTemplateInput }; onClose: () => void; onSaved: () => void }>) {
  const [input, setInput] = useState(initial.input);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const save = useMutation({
    mutationFn: () => (initial.id ? updateMessageTemplate(initial.id, input) : createMessageTemplate(input)),
    onSuccess: () => {
      onSaved();
      onClose();
      toast.success("Modèle enregistré.");
    },
    onError: (err) => toast.error(friendlyError(err, "Le modèle n'a pas pu être enregistré.")),
  });
  // A placeholder goes where the cursor is.
  const insert = (token: string) => {
    const el = bodyRef.current;
    const at = el?.selectionStart ?? input.body.length;
    const end = el?.selectionEnd ?? at;
    const body = `${input.body.slice(0, at)}${token}${input.body.slice(end)}`.slice(0, BODY_MAX);
    setInput((v) => ({ ...v, body }));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(at + token.length, at + token.length);
    });
  };
  const valid = input.title.trim().length > 0 && input.body.trim().length > 0;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] gap-5 rounded-3xl border-0 bg-card p-6 shadow-soft sm:max-w-xl">
        <div className="space-y-1">
          <DialogTitle className="font-semibold text-xl">{initial.id ? "Modifier le modèle" : "Nouveau modèle"}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Les mots entre accolades sont remplacés pour chaque candidat.
          </DialogDescription>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={input.kind === k}
              onClick={() => setInput((v) => ({ ...v, kind: k }))}
              className={cn(
                "rounded-full px-3 py-1.5 font-medium text-xs transition-colors",
                input.kind === k ? "bg-selected text-selected-foreground" : "bg-page text-muted-foreground hover:text-foreground",
              )}
            >
              {MESSAGE_KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <Input
          value={input.title}
          onChange={(e) => setInput((v) => ({ ...v, title: e.target.value }))}
          maxLength={TITLE_MAX}
          placeholder="Nom du modèle, ex. « Proposer une rencontre »"
          className="h-11 rounded-xl border-0 bg-page px-4 shadow-none"
        />
        <div className="space-y-2">
          <Textarea
            ref={bodyRef}
            value={input.body}
            onChange={(e) => setInput((v) => ({ ...v, body: e.target.value }))}
            maxLength={BODY_MAX}
            rows={6}
            placeholder="Bonjour {prenom}, …"
            className="min-h-36 rounded-xl border-0 bg-page px-4 py-3 shadow-none"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground text-xs">Insérer :</span>
            {PLACEHOLDERS.map((p) => (
              <button
                key={p.token}
                type="button"
                onClick={() => insert(p.token)}
                className="rounded-full bg-page px-2.5 py-1 font-medium text-xs hover:bg-page/70"
              >
                {p.label}
              </button>
            ))}
            <span className="ml-auto text-muted-foreground text-xs tabular-nums">
              {input.body.length}/{BODY_MAX}
            </span>
          </div>
          <p className="text-muted-foreground text-xs">
            Aux candidats Rabotka, le message arrive dans Messages : pas de téléphone, d&apos;e-mail ni de lien.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-full px-4 font-medium text-sm hover:bg-page">
            Annuler
          </button>
          <button
            type="button"
            disabled={!valid || save.isPending}
            onClick={() => save.mutate()}
            className="h-10 rounded-full bg-ink px-5 font-medium text-sm text-white hover:bg-ink/90 disabled:opacity-50"
          >
            Enregistrer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
