"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconBrandGmail, IconBrandWindows, IconPlus } from "@tabler/icons-react";
import { Loader } from "lucide-react";
import { toast } from "sonner";

import { useConnectMailbox } from "#/features/cv-screening/components/mail-import";
import { friendlyError } from "#/lib/api/friendly-error";
import { disconnectMailbox, listMailboxes, mailboxesKey, PROVIDER_LABEL, type MailProviderSlug } from "#/lib/api/mailbox-controller";

const ICON: Record<MailProviderSlug, typeof IconBrandGmail> = { gmail: IconBrandGmail, outlook: IconBrandWindows };

/**
 * « Messageries connectées »: the mailboxes « Analyse de CV » picks CVs from,
 * to connect or disconnect. Hidden while no mail service can be connected.
 */
export function OrganisationMailboxes() {
  const queryClient = useQueryClient();
  const boxes = useQuery({ queryKey: mailboxesKey, queryFn: listMailboxes });
  const { connect, pending } = useConnectMailbox((provider) => toast.success(`${PROVIDER_LABEL[provider]} connecté.`));
  const disconnect = useMutation({
    mutationFn: disconnectMailbox,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: mailboxesKey }),
    onError: (err) => toast.error(friendlyError(err, "La messagerie n'a pas pu être déconnectée.")),
  });

  const data = boxes.data;
  if (!data) return null;
  const providers = (Object.keys(data.available) as MailProviderSlug[]).filter((p) => data.available[p]);
  if (providers.length === 0) return null;
  const missing = providers.filter((p) => !data.mailboxes.some((b) => b.provider === p && !b.expired));

  return (
    <section className="space-y-4 rounded-3xl bg-card p-6">
      <div className="space-y-1">
        <h2 className="font-semibold text-lg">Messageries connectées</h2>
        <p className="text-muted-foreground text-sm">
          Pour choisir des CV reçus par e-mail dans « Analyse de CV ». Rabotka ne lit que les pièces jointes que vous choisissez.
        </p>
      </div>

      {data.mailboxes.length > 0 && (
        <ul className="space-y-2">
          {data.mailboxes.map((box) => {
            const Icon = ICON[box.provider];
            return (
              <li key={box.id} className="flex items-center gap-3 rounded-2xl bg-page p-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-sm">{box.email}</span>
                  <span className={box.expired ? "block text-chip-amber-foreground text-xs" : "block text-muted-foreground text-xs"}>
                    {box.expired ? "À reconnecter" : PROVIDER_LABEL[box.provider]}
                  </span>
                </span>
                {box.expired && (
                  <button
                    type="button"
                    disabled={pending !== null}
                    onClick={() => void connect(box.provider)}
                    className="font-medium text-sm underline underline-offset-2 hover:no-underline disabled:opacity-50"
                  >
                    Reconnecter
                  </button>
                )}
                <button
                  type="button"
                  disabled={disconnect.isPending}
                  onClick={() => disconnect.mutate(box.id)}
                  className="font-medium text-muted-foreground text-sm hover:text-foreground disabled:opacity-50"
                >
                  Déconnecter
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {missing.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {missing.map((provider) => {
            const Icon = ICON[provider];
            return (
              <button
                key={provider}
                type="button"
                disabled={pending !== null}
                onClick={() => void connect(provider)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-page px-4 font-medium text-sm hover:bg-page/70 disabled:opacity-50"
              >
                {pending === provider ? <Loader className="size-4 animate-spin" /> : <Icon className="size-4" />}
                <IconPlus className="-ml-1 size-3.5" />
                {PROVIDER_LABEL[provider]}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
