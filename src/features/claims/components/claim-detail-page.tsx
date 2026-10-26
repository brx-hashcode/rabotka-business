"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconArrowLeft, IconHeadset, IconLock, IconSend2 } from "@tabler/icons-react";
import { toast } from "sonner";

import { ImageGallerySheet } from "#/components/image-gallery-sheet";
import { SafeImage } from "#/components/safe-image";
import { Skeleton } from "#/components/ui/skeleton";
import { Bone, ThreadSkeleton } from "#/components/page-skeletons";
import {
  addClaimComment,
  claimsKey,
  getClaim,
  listClaimComments,
  uploadClaimImages,
  type ClaimComment,
  type ClaimStatus,
} from "#/lib/api/claim-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { cn } from "#/lib/utils";
import { ImagePicker, isClosed, StatusPill } from "./claim-bits";

const when = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

/**
 * One claim: what was reported, and the conversation with the Rabotka team
 * about it (polled). Closed once the claim is treated or rejected, as in the
 * client app.
 */
export function ClaimDetailPage({ id }: Readonly<{ id: string }>) {
  const queryClient = useQueryClient();
  const claim = useQuery({ queryKey: [...claimsKey, id], queryFn: () => getClaim(id), refetchInterval: 30_000 });
  const comments = useQuery({ queryKey: [...claimsKey, id, "comments"], queryFn: () => listClaimComments(id), refetchInterval: 15_000 });
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  const send = useMutation({
    mutationFn: async () => {
      const attachment_urls = files.length ? await uploadClaimImages(files) : undefined;
      return addClaimComment(id, { content: text.trim() || undefined, attachment_urls });
    },
    onSuccess: async () => {
      setText("");
      setFiles([]);
      await queryClient.invalidateQueries({ queryKey: [...claimsKey, id] });
    },
    onError: (err) => toast.error(friendlyError(err, "Le message n'a pas pu être envoyé.")),
  });

  const count = comments.data?.length ?? 0;
  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [count]);

  const c = claim.data;
  const closed = c ? isClosed(c.status as ClaimStatus) : false;

  return (
    <div className="w-full space-y-6 pt-2">
      <Link href="/espace/reclamations" className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground">
        <IconArrowLeft className="size-4" />
        Aide
      </Link>

      {claim.isLoading ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="h-[calc(100svh-11rem)] min-h-[28rem] rounded-3xl bg-card">
            <ThreadSkeleton />
          </div>
          <div className="order-first space-y-4 rounded-3xl bg-card p-6 lg:order-none">
            <Bone className="h-6 w-24 rounded-full" />
            <Bone className="h-8 w-3/4" />
            <Bone className="h-20" />
          </div>
        </div>
      ) : !c ? (
        <p className="rounded-3xl bg-card p-6 text-muted-foreground">{friendlyError(claim.error, "Cette demande est introuvable.")}</p>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] 2xl:grid-cols-[minmax(0,1fr)_28rem]">
          <section className="flex h-[calc(100svh-11rem)] min-h-[28rem] flex-col overflow-hidden rounded-3xl bg-card">
            <div className="flex items-center gap-3 p-5 sm:px-6">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-page">
                <IconHeadset className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">Échanges avec l&apos;équipe Rabotka</h2>
                <p className="text-muted-foreground text-xs">Réponse dans votre espace, et une notification à chaque message.</p>
              </div>
            </div>

            <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-page/40 px-4 py-5 sm:px-6">
              {comments.isLoading ? (
                <Skeleton className="h-24 rounded-2xl" />
              ) : count === 0 ? (
                <p className="py-10 text-center text-muted-foreground text-sm">
                  Aucune réponse pour le moment. Ajoutez une précision si besoin : l&apos;équipe la verra.
                </p>
              ) : (
                comments.data!.map((m) => <Comment key={m.id} comment={m} onImage={(images, index) => setViewer({ images, index })} />)
              )}
            </div>

            {closed ? (
              <p className="flex items-center justify-center gap-2 px-6 py-4 text-muted-foreground text-sm">
                <IconLock className="size-4" />
                Cette demande est {c.status === "COMPLETED" ? "résolue" : "refusée"} : vous ne pouvez plus y répondre.
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if ((text.trim() || files.length) && !send.isPending) send.mutate();
                }}
                className="space-y-2 p-3 sm:px-4"
              >
                {files.length > 0 && <ImagePicker files={files} onChange={setFiles} disabled={send.isPending} compact />}
                <div className="flex items-end gap-2">
                  {files.length === 0 && <ImagePicker files={files} onChange={setFiles} disabled={send.isPending} compact />}
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                    rows={1}
                    maxLength={2000}
                    placeholder="Écrivez à l'équipe…"
                    aria-label="Votre message"
                    className="field-sizing-content max-h-40 min-h-12 flex-1 resize-none rounded-2xl bg-page px-4 py-3 text-[15px] outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    type="submit"
                    aria-label="Envoyer"
                    disabled={(!text.trim() && files.length === 0) || send.isPending}
                    className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ink text-white hover:bg-ink/90 disabled:opacity-40"
                  >
                    <IconSend2 className="size-5" />
                  </button>
                </div>
              </form>
            )}
          </section>

          <aside className="order-first space-y-4 rounded-3xl bg-card p-6 lg:sticky lg:top-24 lg:order-none">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={c.status as ClaimStatus} />
              <span className="text-muted-foreground text-xs">Envoyée le {when(c.createdAt)}</span>
            </div>
            <h1 className="break-words font-semibold text-2xl tracking-tight">{c.title}</h1>
            <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{c.description}</p>
            {c.attachmentUrls.length > 0 && (
              <Thumbs urls={c.attachmentUrls} onOpen={(index) => setViewer({ images: c.attachmentUrls, index })} />
            )}
          </aside>
        </div>
      )}

      {viewer && <ImageGallerySheet images={viewer.images} index={viewer.index} title={c?.title ?? "Photos"} onClose={() => setViewer(null)} />}
    </div>
  );
}

function Comment({ comment: m, onImage }: Readonly<{ comment: ClaimComment; onImage: (images: string[], index: number) => void }>) {
  const team = m.createdByType === "user";
  const images = m.attachmentUrls ?? [];
  return (
    <div className={cn("flex flex-col", team ? "items-start" : "items-end")}>
      <div className={cn("max-w-[80%] space-y-2 rounded-2xl px-4 py-2.5", team ? "rounded-tl-md bg-card" : "rounded-tr-md bg-brand-lime text-[#0f2414]")}>
        {/* The team speaks as one: no staff name or role on the business's screen. */}
        {team && <p className="font-semibold text-xs">Équipe Rabotka</p>}
        {m.content && <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">{m.content}</p>}
        {images.length > 0 && <Thumbs urls={images} small onOpen={(index) => onImage(images, index)} />}
        <p className={cn("text-right text-[11px]", team ? "text-muted-foreground" : "text-[#0f2414]/60")}>{when(m.createdAt)}</p>
      </div>
    </div>
  );
}

function Thumbs({ urls, onOpen, small }: Readonly<{ urls: string[]; onOpen: (index: number) => void; small?: boolean }>) {
  return (
    <div className="flex flex-wrap gap-2">
      {urls.map((url, i) => (
        <button
          key={url}
          type="button"
          onClick={() => onOpen(i)}
          aria-label="Agrandir l'image"
          className={cn("overflow-hidden rounded-xl bg-page", small ? "size-20" : "size-24")}
        >
          <SafeImage src={url} className="size-full object-cover" />
        </button>
      ))}
    </div>
  );
}
