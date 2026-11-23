"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconArrowBackUp, IconBrandLinkedin, IconExternalLink, IconLoader2, IconPhotoEdit } from "@tabler/icons-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#/components/ui/dialog";
import { Textarea } from "#/components/ui/textarea";
import { INTL_LOCALE, type Locale } from "#/i18n/config";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import {
  connectLinkedin,
  disconnectLinkedin,
  getLinkedin,
  getLinkedinPosts,
  linkedinKey,
  linkedinPostsKey,
  postOnLinkedin,
} from "#/lib/api/linkedin-controller";
import { cn, getInitials } from "#/lib/utils";
import { defaultLinkedinText, linkedinDialogState, type LinkedinOfferText } from "../linkedin-post";
import { offerShareLinks, offerShareUrl } from "../share-url";

const LINKEDIN_BLUE = "bg-[#0a66c2] text-white hover:bg-[#0a66c2]/90";
const BUTTON = "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 font-medium text-sm disabled:opacity-50";

/** The offer as the post describes it; its careers link is made here. */
export type LinkedinOffer = Omit<LinkedinOfferText, "url"> & { id: string; reference: string };

/**
 * « Publier sur LinkedIn »: the offer goes on the recruiter's own LinkedIn as
 * a card that opens its careers page, where candidates apply (counted as
 * « LinkedIn »). Connected once (a popup, like the mailbox); without
 * Rabotka's LinkedIn app set up, LinkedIn's own share box instead.
 */
export function LinkedinPostDialog({
  open,
  onOpenChange,
  offer,
  slug,
}: Readonly<{ open: boolean; onOpenChange: (open: boolean) => void; offer: LinkedinOffer; slug: string }>) {
  const queryClient = useQueryClient();
  const t = useTranslations("offers.linkedin");
  const locale = useLocale() as Locale;
  const friendlyError = useFriendlyError();
  const info = useQuery({ queryKey: linkedinKey, queryFn: getLinkedin, enabled: open });
  const posts = useQuery({
    queryKey: linkedinPostsKey(offer.id),
    queryFn: () => getLinkedinPosts(offer.id),
    enabled: open && !!info.data?.account,
    // A queued post goes out in a few seconds: follow it until it does.
    refetchInterval: (q) => (q.state.data?.[0]?.status === "QUEUED" ? 3000 : false),
  });
  const state = linkedinDialogState(info.data, posts.data);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const [text, setText] = useState(() =>
    defaultLinkedinText({ ...offer, url: offerShareUrl(origin, slug, offer.reference, "linkedin") }),
  );
  const { connect, connecting } = useLinkedinConnect();
  // The card's picture: the offer's share image, or one of the recruiter's own.
  const [ownImage, setOwnImage, ownPreview] = usePickedImage();
  const imageInput = useRef<HTMLInputElement>(null);
  const pickImage = (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error(t("badType"));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error(t("tooBig"));
      return;
    }
    setOwnImage(file);
  };

  const shareBox = offerShareLinks(origin, slug, offer.reference, offer.title).linkedin;
  const published = posts.data?.find((p) => p.status === "PUBLISHED");
  // The confirmation shows what went out (the newest post's own picture, or
  // the offer's); the large preview shows what « Publier » would send.
  const ogImage = `${offerShareUrl(origin, slug, offer.reference)}/opengraph-image`;
  const postedImage = posts.data?.[0]?.imageUrl ?? null;
  // Posting again keeps the last post's own picture, until another is picked
  // or the recruiter goes back to the offer's.
  const [backToOffer, setBackToOffer] = useState(false);
  const keptImage = state === "posted" && !backToOffer ? postedImage : null;
  const previewSrc = ownPreview ?? keptImage ?? ogImage;
  const showsOwn = !!ownImage || !!keptImage;
  const failed = posts.data?.[0]?.status === "FAILED" ? posts.data[0] : null;

  const publish = useMutation({
    mutationFn: () => postOnLinkedin(offer.id, text, state === "posted", ownImage, state === "posted" && backToOffer && !ownImage),
    onSuccess: () => {
      setOwnImage(null);
      setBackToOffer(false);
      toast.success(t("posting"));
      void queryClient.invalidateQueries({ queryKey: linkedinPostsKey(offer.id) });
    },
    onError: (err) => toast.error(friendlyError(err, t("failed"))),
  });
  const disconnect = useMutation({
    mutationFn: disconnectLinkedin,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: linkedinKey }),
    onError: (err) => toast.error(friendlyError(err, t("disconnectFailed"))),
  });

  const account = info.data?.account;

  // Writing the post needs room: text beside the picture, « Publier » always in view.
  const composing = !info.isLoading && (state === "ready" || state === "posted" || state === "pending");
  const fileInput = (
    <input
      ref={imageInput}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="hidden"
      onChange={(e) => {
        pickImage(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );
  const header = (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0a66c2] text-white">
        <IconBrandLinkedin className="size-5" />
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <DialogTitle className="font-semibold text-xl">{t("title")}</DialogTitle>
        <DialogDescription className="text-muted-foreground text-sm">{t("text")}</DialogDescription>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[90svh] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-3xl border-0 bg-card p-0 shadow-soft",
          composing ? "max-w-4xl" : "max-w-lg",
        )}
      >
        {!composing ? (
          <div className="space-y-5 overflow-y-auto p-6">
            {header}
            {info.isLoading ? (
              <div className="h-40 animate-pulse rounded-2xl bg-page" />
            ) : state === "upgrade" ? (
              // The plan leaves it out: say so, keep LinkedIn's own share box, and where to get it.
              <div className="space-y-4">
                <p className="rounded-2xl bg-page px-4 py-3 text-sm">{t("notIncluded")}</p>
                <a href={shareBox} target="_blank" rel="noreferrer" className={`${BUTTON} ${LINKEDIN_BLUE} w-full`}>
                  <IconBrandLinkedin className="size-4" />
                  {t("shareOn")}
                </a>
                <Link href="/espace/abonnement" onClick={() => onOpenChange(false)} className={`${BUTTON} w-full bg-page hover:bg-page/70`}>
                  {t("seePlans")}
                </Link>
              </div>
            ) : state === "share" ? (
              <div className="space-y-4">
                <p className="text-sm">{t("shareBox")}</p>
                <a href={shareBox} target="_blank" rel="noreferrer" className={`${BUTTON} ${LINKEDIN_BLUE} w-full`}>
                  <IconBrandLinkedin className="size-4" />
                  {t("open")}
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm">
                  {state === "expired" ? t("expired") : t("connectOnce")}
                </p>
                <button type="button" onClick={() => void connect()} disabled={connecting} className={`${BUTTON} ${LINKEDIN_BLUE} w-full`}>
                  {connecting ? <IconLoader2 className="size-4 animate-spin" /> : <IconBrandLinkedin className="size-4" />}
                  {state === "expired" ? t("reconnect") : t("connect")}
                </button>
                <a href={shareBox} target="_blank" rel="noreferrer" className={`${BUTTON} w-full bg-page hover:bg-page/70`}>
                  {t("withoutConnecting")}
                </a>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="px-6 pt-6 pb-4">{header}</div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-6">
              {state === "pending" && (
                <p className="flex items-center gap-2 rounded-2xl bg-page px-4 py-3 text-sm">
                  <IconLoader2 className="size-4 animate-spin" />
                  {t("posting")}
                </p>
              )}
              {published && state !== "pending" && (
                // What went out: the picture it carried (its own, or the offer's) and the link.
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl bg-page p-3 sm:flex-nowrap sm:pr-4">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    {/* The picture it carried, marked with LinkedIn's badge. */}
                    <div className="relative hidden shrink-0 sm:block">
                      {/* eslint-disable-next-line @next/next/no-img-element -- LinkedIn's address for the posted picture, or the OG image */}
                      <img src={postedImage ?? ogImage} alt="" className="aspect-[1200/630] w-28 rounded-xl object-cover" />
                      <span className="absolute -right-1.5 -bottom-1.5 flex size-6 items-center justify-center rounded-lg bg-[#0a66c2] text-white ring-2 ring-page">
                        <IconBrandLinkedin className="size-3.5" />
                      </span>
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-medium text-sm">
                        {t("published", {
                          date: published.publishedAt ? publishedDate(published.publishedAt, INTL_LOCALE[locale]) : "none",
                        })}
                      </p>
                      <p className="text-muted-foreground text-xs leading-relaxed">{t("again")}</p>
                    </div>
                  </div>
                  {published.url && (
                    <a
                      href={published.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-card px-4 font-medium text-sm hover:bg-card/70 sm:w-auto"
                    >
                      {t("see")}
                      <IconExternalLink className="size-4" />
                    </a>
                  )}
                </div>
              )}
              {failed && (
                <p className="rounded-2xl bg-chip-amber px-4 py-3 text-chip-amber-foreground text-sm">
                  {t("lastFailed", { error: failed.error ?? t("retry") })}
                </p>
              )}

              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_20rem]">
                {/* The text: what LinkedIn shows above the picture, with the link to apply. */}
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium text-sm">{t("postText")}</span>
                    <span className="text-muted-foreground text-xs tabular-nums">{text.length} / 3000</span>
                  </div>
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, 3000))}
                    aria-label={t("postText")}
                    className="min-h-72 flex-1 resize-none rounded-2xl border-0 bg-page px-4 py-3 text-[15px] leading-relaxed shadow-none md:min-h-96"
                  />
                  <p className="text-muted-foreground text-xs">{t("linkNote")}</p>
                </div>

                {/* The picture, shown large under the text. */}
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm">{t("image")}</span>
                  {/* A fixed block, so the dialog keeps its size, filled by the picture. */}
                  <div className="flex aspect-[1200/630] w-full items-center justify-center overflow-hidden rounded-2xl bg-page">
                    {/* eslint-disable-next-line @next/next/no-img-element -- a local preview or the careers page's own OG image */}
                    <img src={previewSrc} alt="" className="block h-full w-full object-cover" />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {ownImage ? t("ownImage") : keptImage ? t("keptImage") : t("offerImage")}
                  </p>
                  <button
                    type="button"
                    onClick={() => imageInput.current?.click()}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 font-medium text-background text-sm hover:bg-foreground/85"
                  >
                    <IconPhotoEdit className="size-[18px]" />
                    {showsOwn ? t("changeImage") : t("useOwn")}
                  </button>
                  {showsOwn && (
                    <button
                      type="button"
                      onClick={() => {
                        setOwnImage(null);
                        setBackToOffer(true);
                      }}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-page px-5 font-medium text-sm hover:bg-page/70"
                    >
                      <IconArrowBackUp className="size-4" />
                      {t("backToOffer")}
                    </button>
                  )}
                  <p className="text-center text-muted-foreground text-xs">{t("formats")}</p>
                  {fileInput}
                </div>
              </div>
            </div>

            {/* Always in view: who posts, and « Publier ». */}
            <div className="flex flex-col-reverse items-stretch gap-3 bg-page px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              {account && (
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-9">
                    {account.pictureUrl && <AvatarImage src={account.pictureUrl} alt="" />}
                    <AvatarFallback className="bg-card text-xs">{getInitials(account.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium">{account.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {t("onFeed")}{" "}
                      <button type="button" onClick={() => disconnect.mutate()} disabled={disconnect.isPending} className="underline underline-offset-2 hover:text-foreground">
                        {t("disconnect")}
                      </button>
                    </p>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => publish.mutate()}
                disabled={publish.isPending || state === "pending" || !text.trim()}
                className={`${BUTTON} ${LINKEDIN_BLUE} sm:min-w-52`}
              >
                {publish.isPending ? <IconLoader2 className="size-4 animate-spin" /> : <IconBrandLinkedin className="size-4" />}
                {state === "posted" ? t("publishAgain") : t("publish")}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** « 10 novembre », with the year once it is no longer this one. */
function publishedDate(iso: string, intlLocale: string): string {
  const date = new Date(iso);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(intlLocale, { day: "numeric", month: "long", ...(sameYear ? {} : { year: "numeric" }) });
}

/**
 * A picked picture and its local preview address, made when it is picked and
 * freed when it is replaced or the dialog goes.
 */
function usePickedImage(): [File | null, (file: File | null) => void, string | null] {
  const [picked, setPicked] = useState<{ file: File; url: string } | null>(null);
  const current = useRef<string | null>(null);
  useEffect(() => () => {
    if (current.current) URL.revokeObjectURL(current.current);
  }, []);
  const set = (file: File | null) => {
    if (current.current) URL.revokeObjectURL(current.current);
    const url = file ? URL.createObjectURL(file) : null;
    current.current = url;
    setPicked(file && url ? { file, url } : null);
  };
  return [picked?.file ?? null, set, picked?.url ?? null];
}

/** LinkedIn's consent screen in a popup; the callback page tells us how it went. */
function useLinkedinConnect() {
  const queryClient = useQueryClient();
  const t = useTranslations("offers.linkedin");
  const friendlyError = useFriendlyError();
  const [connecting, setConnecting] = useState(false);
  const handler = useRef<((ev: MessageEvent) => void) | null>(null);

  useEffect(() => () => {
    if (handler.current) window.removeEventListener("message", handler.current);
  }, []);

  async function connect() {
    // Opened on the click itself, or the browser blocks it; the address follows.
    const popup = window.open("", "rabotka-linkedin", "width=520,height=680");
    setConnecting(true);
    try {
      const { url } = await connectLinkedin();
      if (!popup) {
        window.location.assign(url);
        return;
      }
      popup.location.href = url;
    } catch (err) {
      popup?.close();
      setConnecting(false);
      toast.error(friendlyError(err, t("connectFailed")));
      return;
    }

    if (handler.current) window.removeEventListener("message", handler.current);
    const onMessage = (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return;
      const status = (ev.data as { rabotkaLinkedin?: string } | null)?.rabotkaLinkedin;
      if (!status) return;
      window.removeEventListener("message", onMessage);
      handler.current = null;
      setConnecting(false);
      if (status === "connected") void queryClient.invalidateQueries({ queryKey: linkedinKey });
      else if (status !== "denied") toast.error(t("connectError"));
    };
    handler.current = onMessage;
    window.addEventListener("message", onMessage);
    // Closed by hand without an answer: stop waiting.
    const watch = window.setInterval(() => {
      if (!popup || popup.closed) {
        window.clearInterval(watch);
        setTimeout(() => setConnecting(false), 800);
      }
    }, 600);
  }

  return { connect, connecting };
}
