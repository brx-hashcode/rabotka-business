"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog as SheetPrimitive } from "radix-ui";
import { IconCheck, IconChevronRight, IconEye, IconMail, IconPlugOff, IconPlus, IconSearch, IconShieldLock, IconX } from "@tabler/icons-react";
import { Loader } from "lucide-react";
import { toast } from "sonner";

import { GmailLogo, OutlookLogo } from "#/components/mail-provider-logos";
import { PreviewSheet } from "#/components/preview-sheet";
import { Input } from "#/components/ui/input";
import { friendlyError } from "#/lib/api/friendly-error";
import {
  connectMailbox,
  disconnectMailbox,
  listMailboxes,
  listMailCvs,
  mailAttachmentUrl,
  mailboxesKey,
  PROVIDER_LABEL,
  type Mailbox,
  type Mailboxes,
  type MailProviderSlug,
} from "#/lib/api/mailbox-controller";
import { cn } from "#/lib/utils";
import { initials, kindFromName, looksLikeCv, pickKey, togglePick, toPick, type MailPick } from "../mail-picks";
import { fileSize } from "./cv-bits";

export const PROVIDER_LOGO: Record<MailProviderSlug, typeof GmailLogo> = { gmail: GmailLogo, outlook: OutlookLogo };

/** A provider's logo on a white tile, so its colours read the same in both themes. */
export function ProviderTile({ provider, className }: Readonly<{ provider: MailProviderSlug; className?: string }>) {
  const Logo = PROVIDER_LOGO[provider];
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl bg-white", className)}>
      <Logo className="size-5" />
    </span>
  );
}

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
      } else if (status === "scope") {
        toast.error(`L'accès à vos e-mails n'a pas été autorisé : reconnectez ${PROVIDER_LABEL[provider]} et cochez la case qui permet à Rabotka de lire vos e-mails.`);
      } else if (status === "api_disabled") {
        toast.error(`La lecture des e-mails ${PROVIDER_LABEL[provider]} n'est pas encore activée pour Rabotka. Réessayez plus tard.`);
      } else if (status !== "denied") {
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
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-muted-foreground text-xs">
        <span aria-hidden className="h-px flex-1 bg-page" />
        ou depuis votre messagerie
        <span aria-hidden className="h-px flex-1 bg-page" />
      </div>
      <div className={cn("grid gap-2.5", providers.length > 1 && "sm:grid-cols-2")}>
        {providers.map((provider) => {
          const box = data.mailboxes.find((b) => b.provider === provider && !b.expired);
          return (
            <button
              key={provider}
              type="button"
              disabled={disabled || pending !== null}
              onClick={() => (box ? setOpenId(box.id) : void connect(provider))}
              className="group flex min-w-0 items-center gap-3 rounded-2xl bg-page p-3 text-left transition-colors hover:bg-page/70 disabled:opacity-50"
            >
              <ProviderTile provider={provider} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-sm">{PROVIDER_LABEL[provider]}</span>
                <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground text-xs">
                  {box ? (
                    <>
                      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-whatsapp-dark" />
                      <span className="truncate">{box.email}</span>
                    </>
                  ) : (
                    "Connecter votre compte"
                  )}
                </span>
              </span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground group-hover:text-foreground">
                {pending === provider ? (
                  <Loader className="size-4 animate-spin" />
                ) : box ? (
                  <IconChevronRight className="size-4" />
                ) : (
                  <IconPlus className="size-4" />
                )}
              </span>
            </button>
          );
        })}
      </div>

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
  const [preview, setPreview] = useState<{ pick: MailPick; kind: "pdf" | "image"; from: string } | null>(null);
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

  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay className="data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
        <SheetPrimitive.Content
          aria-describedby={undefined}
          className="data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-card shadow-soft outline-none data-[state=closed]:duration-300 data-[state=open]:duration-500 sm:w-[min(40rem,92vw)]"
        >
          <header className="flex items-center gap-3 px-5 pt-5 pb-4 sm:px-6">
            <ProviderTile provider={mailbox.provider} className="size-11 rounded-2xl" />
            <div className="min-w-0 flex-1">
              <SheetPrimitive.Title className="font-semibold text-lg leading-tight">CV reçus par e-mail</SheetPrimitive.Title>
              <p className="flex min-w-0 items-center gap-1.5 text-muted-foreground text-sm">
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-whatsapp-dark" />
                <span className="truncate">{mailbox.email}</span>
              </p>
            </div>
            <button
              type="button"
              disabled={disconnect.isPending}
              onClick={() => disconnect.mutate()}
              className="hidden h-9 shrink-0 items-center gap-1.5 rounded-full bg-page px-3.5 font-medium text-muted-foreground text-sm hover:text-foreground disabled:opacity-50 sm:inline-flex"
            >
              <IconPlugOff className="size-4" />
              Déconnecter
            </button>
            <SheetPrimitive.Close aria-label="Fermer" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-page hover:bg-page/70">
              <IconX className="size-4" />
            </SheetPrimitive.Close>
          </header>

          <div className="space-y-3 px-5 pb-3 sm:px-6">
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
            <button
              type="button"
              disabled={disconnect.isPending}
              onClick={() => disconnect.mutate()}
              className="inline-flex items-center gap-1.5 font-medium text-muted-foreground text-xs hover:text-foreground disabled:opacity-50 sm:hidden"
            >
              <IconPlugOff className="size-3.5" />
              Déconnecter {PROVIDER_LABEL[mailbox.provider]}
            </button>
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
                  <ProviderTile provider={mailbox.provider} className="size-6 rounded-md [&>svg]:size-3.5" />
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
                  <article key={mail.id} className="rounded-2xl bg-page p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card font-semibold text-muted-foreground text-xs"
                      >
                        {initials(mail.fromName)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="min-w-0 truncate font-medium text-sm">{mail.fromName || "Expéditeur inconnu"}</p>
                          <time className="shrink-0 text-muted-foreground text-xs" dateTime={mail.date}>
                            {new Date(mail.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </time>
                        </div>
                        {mail.subject && <p className="truncate text-muted-foreground text-xs">{mail.subject}</p>}
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {mail.attachments.map((a) => {
                        const pick = toPick(mailbox.id, mail, a);
                        const on = picked.has(pickKey(pick));
                        const full = !on && chosen.length >= total;
                        const kind = kindFromName(a.name);
                        const k = KIND_TILE[kind];
                        return (
                          <li key={a.id} className="flex min-w-0 items-center gap-1.5">
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={on}
                              disabled={full}
                              onClick={() => setChosen((c) => togglePick(c, pick, total))}
                              className={cn(
                                "flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors disabled:opacity-40",
                                on ? "bg-chip-green text-chip-green-foreground" : "bg-card hover:bg-card/70",
                              )}
                            >
                              <span
                                aria-hidden
                                className={cn(
                                  "flex size-5 shrink-0 items-center justify-center rounded-md transition-colors",
                                  on ? "bg-whatsapp-dark text-white" : "bg-page",
                                )}
                              >
                                {on && <IconCheck className="size-3.5" strokeWidth={3} />}
                              </span>
                              <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 font-semibold text-[10px]", k.tile)}>{k.label}</span>
                              <span className="min-w-0 flex-1 truncate font-medium text-sm" title={a.name}>
                                {a.name}
                              </span>
                              {looksLikeCv(a.name, mail.subject) && (
                                <span className="hidden shrink-0 rounded-full bg-page px-2 py-0.5 font-medium text-[11px] text-whatsapp-dark sm:inline">
                                  CV probable
                                </span>
                              )}
                              <span className={cn("shrink-0 text-xs tabular-nums", on ? "opacity-70" : "text-muted-foreground")}>{fileSize(a.size)}</span>
                            </button>
                            <button
                              type="button"
                              disabled={kind === "docx"}
                              onClick={() => setPreview({ pick, kind: kind === "image" ? "image" : "pdf", from: mail.fromName })}
                              aria-label={`Aperçu de ${a.name}`}
                              title={kind === "docx" ? "Aperçu disponible pour les PDF et les photos" : "Aperçu"}
                              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                            >
                              <IconEye className="size-4" />
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
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-sm">
                  <span className="font-semibold tabular-nums">
                    {chosen.length} / {total}
                  </span>{" "}
                  <span className="text-muted-foreground">CV choisis</span>
                </p>
                <div className="flex gap-1" aria-hidden>
                  {Array.from({ length: total }, (_, i) => (
                    <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < chosen.length ? "bg-whatsapp-dark" : "bg-page")} />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDone(chosen)}
                className="h-12 shrink-0 rounded-full bg-ink px-6 font-medium text-white hover:bg-ink/90"
              >
                {added > 0 ? `Ajouter ${added} CV` : "Valider"}
              </button>
            </div>
          </footer>
          <PreviewSheet
            open={preview !== null}
            onOpenChange={(next) => !next && setPreview(null)}
            title={preview?.pick.name ?? ""}
            subtitle={preview?.from || undefined}
            src={preview ? mailAttachmentUrl(preview.pick) : undefined}
            kind={preview?.kind ?? "pdf"}
            fileName={preview?.pick.name}
            unavailable="Cette pièce jointe n'a pas pu être affichée."
          />
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}
