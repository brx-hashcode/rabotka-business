"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog as SheetPrimitive } from "radix-ui";
import { IconBrandGmail, IconBrandWindows, IconCheck, IconMail, IconPaperclip, IconSearch, IconShieldLock, IconX } from "@tabler/icons-react";
import { Loader } from "lucide-react";
import { toast } from "sonner";

import { Input } from "#/components/ui/input";
import { friendlyError } from "#/lib/api/friendly-error";
import {
  connectMailbox,
  disconnectMailbox,
  listMailboxes,
  listMailCvs,
  mailboxesKey,
  PROVIDER_LABEL,
  type Mailbox,
  type Mailboxes,
  type MailProviderSlug,
} from "#/lib/api/mailbox-controller";
import { cn } from "#/lib/utils";
import { kindFromName, pickKey, togglePick, toPick, type MailPick } from "../mail-picks";
import { fileSize } from "./cv-bits";

const ICON: Record<MailProviderSlug, typeof IconBrandGmail> = { gmail: IconBrandGmail, outlook: IconBrandWindows };

const KIND_TILE = {
  pdf: { label: "PDF", tile: "bg-destructive/10 text-destructive" },
  docx: { label: "Word", tile: "bg-chip-violet text-chip-violet-foreground" },
  image: { label: "Photo", tile: "bg-chip-amber text-chip-amber-foreground" },
} as const;

/** Waits for the typing to settle before searching. */
function useDebounced<T>(value: T, ms = 400): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/**
 * Opens a provider's consent screen in a popup and resolves once its page
 * says how it went (see the backend's mailbox callback page).
 */
export function useConnectMailbox(onConnected: (provider: MailProviderSlug) => void) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<MailProviderSlug | null>(null);
  const handler = useRef<((ev: MessageEvent) => void) | null>(null);

  useEffect(() => () => {
    if (handler.current) window.removeEventListener("message", handler.current);
  }, []);

  async function connect(provider: MailProviderSlug) {
    // Opened on the click itself, or the browser blocks it; the address follows.
    const popup = window.open("", "rabotka-mailbox", "width=520,height=680");
    setPending(provider);
    try {
      const { url } = await connectMailbox(provider);
      if (!popup) {
        window.location.assign(url);
        return;
      }
      popup.location.href = url;
    } catch (err) {
      popup?.close();
      setPending(null);
      toast.error(friendlyError(err, "La connexion n'a pas pu commencer. Réessayez dans un instant."));
      return;
    }

    if (handler.current) window.removeEventListener("message", handler.current);
    const onMessage = (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return;
      const status = (ev.data as { rabotkaMailbox?: string } | null)?.rabotkaMailbox;
      if (!status) return;
      window.removeEventListener("message", onMessage);
      handler.current = null;
      setPending(null);
      if (status === "connected") {
        void queryClient.invalidateQueries({ queryKey: mailboxesKey }).then(() => onConnected(provider));
      } else if (status === "error") {
        toast.error(`La connexion à ${PROVIDER_LABEL[provider]} n'a pas abouti. Réessayez.`);
      }
    };
    handler.current = onMessage;
    window.addEventListener("message", onMessage);
    // Closed by hand without an answer: stop waiting.
    const watch = window.setInterval(() => {
      if (!popup || popup.closed) {
        window.clearInterval(watch);
        setTimeout(() => setPending((p) => (p === provider ? null : p)), 800);
      }
    }, 600);
  }

  return { connect, pending };
}

/**
 * « Ou importez-les depuis votre messagerie »: a button per mail service the
 * server offers. Connected, it opens the mails; not yet, the consent screen.
 */
export function MailImport({
  picks,
  room,
  disabled,
  onChange,
}: Readonly<{
  picks: MailPick[];
  /** CVs the mails may bring: the analysis's room, less the files added. */
  room: number;
  disabled: boolean;
  onChange: (picks: MailPick[]) => void;
}>) {
  const boxes = useQuery({ queryKey: mailboxesKey, queryFn: listMailboxes, staleTime: 60_000 });
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  // Once a connection lands (the list is fresh by then), open its mails.
  const { connect, pending } = useConnectMailbox((provider) => {
    const box = queryClient
      .getQueryData<Mailboxes>(mailboxesKey)
      ?.mailboxes.findLast((b) => b.provider === provider && !b.expired);
    if (box) setOpenId(box.id);
  });

  const data = boxes.data;
  if (!data) return null;
  const providers = (Object.keys(data.available) as MailProviderSlug[]).filter((p) => data.available[p]);
  if (providers.length === 0) return null;
  const open = data.mailboxes.find((b) => b.id === openId);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-muted-foreground text-sm">Ou importez-les depuis votre messagerie</span>
      {providers.map((provider) => {
        const box = data.mailboxes.find((b) => b.provider === provider && !b.expired);
        const Icon = ICON[provider];
        return (
          <button
            key={provider}
            type="button"
            disabled={disabled || pending !== null}
            onClick={() => (box ? setOpenId(box.id) : void connect(provider))}
            title={box?.email}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-page px-4 font-medium text-sm hover:bg-page/70 disabled:opacity-50"
          >
            {pending === provider ? <Loader className="size-4 animate-spin" /> : <Icon className="size-4" />}
            {box ? PROVIDER_LABEL[provider] : `Connecter ${PROVIDER_LABEL[provider]}`}
          </button>
        );
      })}

      {open && (
        <MailCvSheet
          key={open.id}
          mailbox={open}
          open={openId !== null}
          onOpenChange={(next) => !next && setOpenId(null)}
          picks={picks}
          room={room}
          onDone={(next) => {
            onChange(next);
            setOpenId(null);
          }}
          onReconnect={() => {
            setOpenId(null);
            void connect(open.provider);
          }}
        />
      )}
    </div>
  );
}

/**
 * The recent mails of one mailbox that carry a CV, to tick. Nothing leaves the
 * mailbox until the analysis is started; then the server reads the ticked files.
 */
function MailCvSheet({
  mailbox,
  open,
  onOpenChange,
  picks,
  room,
  onDone,
  onReconnect,
}: Readonly<{
  mailbox: Mailbox;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  picks: MailPick[];
  room: number;
  onDone: (picks: MailPick[]) => void;
  onReconnect: () => void;
}>) {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const search = useDebounced(q.trim());
  const [chosen, setChosen] = useState<MailPick[]>(picks);
  // For the picks of every mailbox together.
  const total = room;

  const mails = useInfiniteQuery({
    queryKey: [...mailboxesKey, mailbox.id, "mails", search],
    queryFn: ({ pageParam }) => listMailCvs(mailbox.id, { q: search || undefined, page: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next ?? undefined,
    enabled: open,
    retry: (n, err) => (err as { statusCode?: number }).statusCode !== 409 && n < 1,
    staleTime: 60_000,
  });
  const expired = (mails.error as { statusCode?: number } | null)?.statusCode === 409;
  const list = mails.data?.pages.flatMap((p) => p.mails) ?? [];
  const picked = new Set(chosen.map(pickKey));
  const added = chosen.filter((p) => !picks.some((o) => pickKey(o) === pickKey(p))).length;

  const disconnect = useMutation({
    mutationFn: () => disconnectMailbox(mailbox.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mailboxesKey });
      onDone(picks.filter((p) => p.mailboxId !== mailbox.id));
      toast.success(`${PROVIDER_LABEL[mailbox.provider]} déconnecté.`);
    },
    onError: (err) => toast.error(friendlyError(err, "La messagerie n'a pas pu être déconnectée.")),
  });

  const Icon = ICON[mailbox.provider];

  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay className="data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
        <SheetPrimitive.Content
          aria-describedby={undefined}
          className="data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-card shadow-soft outline-none data-[state=closed]:duration-300 data-[state=open]:duration-500 sm:w-[min(40rem,92vw)]"
        >
          <header className="flex items-start gap-3 px-5 pt-5 pb-3 sm:px-6">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-page">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <SheetPrimitive.Title className="font-semibold text-lg">CV reçus par e-mail</SheetPrimitive.Title>
              <p className="flex flex-wrap items-center gap-x-2 text-muted-foreground text-sm">
                <span className="truncate">{mailbox.email}</span>
                <button
                  type="button"
                  disabled={disconnect.isPending}
                  onClick={() => disconnect.mutate()}
                  className="font-medium text-foreground underline underline-offset-2 hover:no-underline disabled:opacity-50"
                >
                  Déconnecter
                </button>
              </p>
            </div>
            <SheetPrimitive.Close aria-label="Fermer" className="flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-page">
              <IconX className="size-5" />
            </SheetPrimitive.Close>
          </header>

          <div className="px-5 pb-3 sm:px-6">
            <div className="relative">
              <IconSearch className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-4 size-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(ev) => setQ(ev.target.value)}
                placeholder="Rechercher : nom, poste, objet…"
                aria-label="Rechercher dans les e-mails"
                className="h-11 rounded-full border-0 bg-page pr-4 pl-11 shadow-none"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-5 pb-4 sm:px-6">
            {expired ? (
              <div className="space-y-3 rounded-2xl bg-chip-amber p-4 text-chip-amber-foreground text-sm">
                <p>{PROVIDER_LABEL[mailbox.provider]} ne répond plus : connectez votre messagerie de nouveau pour retrouver vos e-mails.</p>
                <button
                  type="button"
                  onClick={onReconnect}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-card px-4 font-medium text-foreground hover:bg-card/70"
                >
                  <Icon className="size-4" />
                  Reconnecter {PROVIDER_LABEL[mailbox.provider]}
                </button>
              </div>
            ) : mails.isLoading ? (
              Array.from({ length: 5 }, (_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-page" />)
            ) : mails.isError ? (
              <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-destructive text-sm">
                {friendlyError(mails.error, "Vos e-mails n'ont pas pu être lus. Réessayez dans un instant.")}
              </p>
            ) : list.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl bg-page px-6 py-10 text-center">
                <IconMail className="size-6 text-muted-foreground" />
                <p className="font-medium">{search ? "Aucun e-mail ne correspond" : "Aucun CV reçu ces 4 derniers mois"}</p>
                <p className="text-muted-foreground text-sm">Seuls les e-mails avec un PDF, un fichier Word ou une photo en pièce jointe apparaissent.</p>
              </div>
            ) : (
              <>
                {list.map((mail) => (
                  <article key={mail.id} className="space-y-2.5 rounded-2xl bg-page p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 truncate font-medium">{mail.fromName || "Expéditeur inconnu"}</p>
                      <time className="shrink-0 text-muted-foreground text-xs" dateTime={mail.date}>
                        {new Date(mail.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </time>
                    </div>
                    {mail.subject && <p className="line-clamp-1 text-muted-foreground text-sm">{mail.subject}</p>}
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {mail.attachments.map((a) => {
                        const pick = toPick(mailbox.id, mail, a);
                        const on = picked.has(pickKey(pick));
                        const full = !on && chosen.length >= total;
                        const k = KIND_TILE[kindFromName(a.name)];
                        return (
                          <li key={a.id} className="min-w-0">
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={on}
                              disabled={full}
                              onClick={() => setChosen((c) => togglePick(c, pick, total))}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors disabled:opacity-40",
                                on ? "bg-selected text-selected-foreground" : "bg-card hover:bg-card/70",
                              )}
                            >
                              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg font-semibold text-[10px]", k.tile)}>
                                {k.label}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium text-sm" title={a.name}>
                                  {a.name}
                                </span>
                                <span className={cn("block text-xs", on ? "opacity-70" : "text-muted-foreground")}>{fileSize(a.size)}</span>
                              </span>
                              <span
                                className={cn(
                                  "flex size-5 shrink-0 items-center justify-center rounded-full",
                                  on ? "bg-whatsapp-dark text-white" : "bg-page",
                                )}
                              >
                                {on && <IconCheck className="size-3.5" />}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                ))}
                {mails.hasNextPage && (
                  <button
                    type="button"
                    disabled={mails.isFetchingNextPage}
                    onClick={() => void mails.fetchNextPage()}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-page font-medium text-sm hover:bg-page/70 disabled:opacity-60"
                  >
                    {mails.isFetchingNextPage && <Loader className="size-4 animate-spin" />}
                    Charger plus
                  </button>
                )}
              </>
            )}
          </div>

          <footer className="space-y-3 px-5 pt-3 pb-5 sm:px-6">
            <p className="flex items-start gap-2 text-muted-foreground text-xs">
              <IconShieldLock className="mt-px size-4 shrink-0" />
              Rabotka lit uniquement les pièces jointes que vous choisissez ; rien n&apos;est envoyé depuis votre messagerie.
            </p>
            <div className="flex items-center gap-3">
              <p className="flex-1 text-sm">
                <IconPaperclip className="mr-1 inline size-4 align-[-3px]" />
                <span className="font-semibold tabular-nums">
                  {chosen.length} / {total}
                </span>{" "}
                <span className="text-muted-foreground">CV choisis</span>
              </p>
              <button
                type="button"
                onClick={() => onDone(chosen)}
                className="h-12 rounded-full bg-ink px-6 font-medium text-white hover:bg-ink/90"
              >
                {added > 0 ? `Ajouter ${added} CV` : "Valider"}
              </button>
            </div>
          </footer>
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}
