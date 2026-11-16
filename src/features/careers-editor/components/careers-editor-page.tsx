"use client";

import type { Locale } from "#/i18n/config";
import { contentLocale, contentMessages } from "#/i18n/content";
import { useTranslations } from "next-intl";
import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconCircleCheckFilled,
  IconCircleDashed,
  IconCopy,
  IconExternalLink,
  IconLock,
  IconPhotoPlus,
  IconPlus,
  IconTrash,
  IconWorldWww,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Bone } from "#/components/page-skeletons";
import { Input } from "#/components/ui/input";
import { Spinner } from "#/components/ui/spinner";
import { Textarea } from "#/components/ui/textarea";
import {
  addCareersPhoto,
  careersPageKey,
  getCareersPage,
  getMyBusiness,
  myBusinessKey,
  removeCareersCover,
  removeCareersPhoto,
  setCareersBenefits,
  updateMyBusiness,
  uploadCareersCover,
  type CareersPage,
} from "#/lib/api/business-controller";
import { getCareersCompany } from "#/lib/api/careers-controller";
import { copyText } from "#/lib/clipboard";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import type { MyBusiness, UpdateMyBusiness } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { CareersPreview } from "./careers-preview";

const MAX_PHOTOS = 6;
const MAX_BENEFITS = 8;
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_DESCRIPTION = 2000;

type Busy = "cover" | "photo" | "remove" | "benefits";

/** The page's own origin, once in the browser (empty while rendering on the server). */
function useOrigin(): string {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
}

/** One image picked from the device, checked before it is sent. */
function usePicker(onFile: (file: File) => void) {
  const t = useTranslations("careersEditor");
  const input = useRef<HTMLInputElement>(null);
  const element = (
    <input
      ref={input}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (file.size > MAX_BYTES) toast.error(t("photoTooBig"));
        else onFile(file);
      }}
    />
  );
  return { open: () => input.current?.click(), element };
}

/**
 * « Page carrières »: the organisation's public page, edited on the left and
 * seen as candidates see it on the right. Open once the organisation is
 * verified (that is when it gets its address).
 */
export function CareersEditorPage() {
  const t = useTranslations("careersEditor");
  const friendlyError = useFriendlyError();
  const { data: business, isLoading, error } = useQuery({ queryKey: myBusinessKey, queryFn: getMyBusiness });

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-semibold text-3xl tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        {business?.publicSlug && business.verificationStatus === "VERIFIED" && (
          <a
            href={`/carrieres/${business.publicSlug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 font-medium text-sm text-white"
          >
            <IconExternalLink className="size-4" />
            {t("seePage")}
          </a>
        )}
      </div>

      {isLoading ? (
        <EditorBones />
      ) : !business ? (
        <p className="rounded-3xl bg-card p-6 text-muted-foreground">
          {friendlyError(error, t("notBusiness"))}
        </p>
      ) : business.verificationStatus !== "VERIFIED" || !business.publicSlug ? (
        <div className="flex items-start gap-4 rounded-3xl bg-card p-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-page">
            <IconLock className="size-5" />
          </span>
          <div className="space-y-2">
            <p className="font-semibold">{t("lockedTitle")}</p>
            <p className="text-muted-foreground text-sm">
              {t("lockedText")}
            </p>
            <Link href="/espace/organisation" className="inline-flex font-medium text-sm underline underline-offset-2">
              {t("lockedLink")}
            </Link>
          </div>
        </div>
      ) : (
        <Editor business={business} slug={business.publicSlug} />
      )}
    </div>
  );
}

function Editor({ business, slug }: Readonly<{ business: MyBusiness; slug: string }>) {
  const t = useTranslations("careersEditor");
  const friendlyError = useFriendlyError();
  const queryClient = useQueryClient();
  const origin = useOrigin();
  const [view, setView] = useState<"edit" | "preview">("edit");
  const page = useQuery({ queryKey: careersPageKey, queryFn: getCareersPage });
  const company = useQuery({ queryKey: ["careers", slug], queryFn: () => getCareersCompany(slug), retry: false });

  const saveBusiness = useMutation({
    mutationFn: (body: UpdateMyBusiness) => updateMyBusiness(body),
    onSuccess: ({ business: next }) => queryClient.setQueryData(myBusinessKey, next),
    onError: (err) => toast.error(friendlyError(err, t("saveFailed"))),
  });
  const savePage = useMutation({
    mutationFn: ({ run }: { busy: Busy; run: () => Promise<CareersPage> }) => run(),
    onSuccess: (next) => queryClient.setQueryData(careersPageKey, next),
    onError: (err) => toast.error(friendlyError(err, t("updateFailed"))),
  });
  const busy = savePage.isPending ? savePage.variables?.busy : undefined;

  if (page.isError)
    return (
      <p className="rounded-3xl bg-card p-6 text-muted-foreground">
        {friendlyError(page.error, t("loadFailed"))}
      </p>
    );
  if (!page.data) return <EditorBones />;
  const data = page.data;
  const path = `/carrieres/${slug}`;

  const steps = [
    { label: t("steps.logo"), done: !!business.logoUrl, href: "/espace/organisation" },
    { label: t("steps.cover"), done: !!data.coverUrl, href: "#couverture" },
    { label: t("steps.presentation"), done: !!business.description?.trim(), href: "#presentation" },
    { label: t("steps.photos"), done: data.photos.length > 0, href: "#photos" },
    { label: t("steps.benefits"), done: data.benefits.length > 0, href: "#avantages" },
  ];

  return (
    <>
      <div role="tablist" aria-label={t("view")} className="inline-flex rounded-full bg-card p-1 lg:hidden">
        {(
          [
            ["edit", t("edit")],
            ["preview", t("preview")],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={view === key}
            onClick={() => setView(key)}
            className={cn(
              "rounded-full px-4 py-1.5 font-medium text-sm",
              view === key ? "bg-selected text-selected-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div className={cn("space-y-6", view === "preview" && "hidden lg:block")}>
          <Progress steps={steps} />

          <Section title={t("address.title")} hint={t("address.hint")}>
            <div className="flex items-center gap-2 rounded-2xl bg-page py-1.5 pr-1.5 pl-4">
              <IconWorldWww className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm">{`${origin.replace(/^https?:\/\//, "")}${path}`}</span>
              <button
                type="button"
                onClick={async () => {
                  const copied = await copyText(`${window.location.origin}${path}`);
                  if (copied) toast.success(t("address.copied"));
                  else toast.error(t("address.copyFailed"));
                }}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-ink px-3 font-medium text-sm text-white"
              >
                <IconCopy className="size-4" />
                {t("address.copy")}
              </button>
            </div>
            <DistributeSwitch
              on={business.distributeOffers ?? true}
              pending={saveBusiness.isPending}
              onChange={(distributeOffers) =>
                saveBusiness.mutate(
                  { distributeOffers },
                  {
                    onSuccess: () =>
                      toast.success(
                        distributeOffers ? t("distribute.on") : t("distribute.off"),
                      ),
                  },
                )
              }
            />
          </Section>

          <CoverSection
            coverUrl={data.coverUrl}
            busy={busy}
            onUpload={(file) => savePage.mutate({ busy: "cover", run: () => uploadCareersCover(file) })}
            onRemove={() => savePage.mutate({ busy: "cover", run: removeCareersCover })}
          />

          <PresentationSection
            // Starts again from each saved version.
            key={business.description ?? ""}
            description={business.description ?? ""}
            pending={saveBusiness.isPending}
            onSave={(description) =>
              saveBusiness.mutate(
                { description: description || null },
                { onSuccess: () => toast.success(t("presentation.saved")) },
              )
            }
          />

          <PhotosSection
            photos={data.photos}
            busy={busy}
            onAdd={(file) => savePage.mutate({ busy: "photo", run: () => addCareersPhoto(file) })}
            onRemove={(i) => savePage.mutate({ busy: "remove", run: () => removeCareersPhoto(i) })}
          />

          <BenefitsSection
            benefits={data.benefits}
            // The public page is French until the business chooses its language: French unless it presents itself in another.
            language={contentLocale([business.description])}
            pending={busy === "benefits"}
            onChange={(benefits) => savePage.mutate({ busy: "benefits", run: () => setCareersBenefits(benefits) })}
          />
        </div>

        <aside className={cn("space-y-3 lg:sticky lg:top-24", view === "edit" && "hidden lg:block")}>
          <div className="space-y-0.5 px-1">
            <p className="font-semibold">{t("preview")}</p>
            <p className="text-muted-foreground text-sm">{t("previewHint")}</p>
          </div>
          <CareersPreview
            address={`${origin.replace(/^https?:\/\//, "")}${path}`}
            offers={company.data?.offers}
            company={{
              name: business.name,
              logoUrl: business.logoUrl,
              categoryLabel: business.categoryLabel,
              city: business.city,
              website: business.website,
              description: business.description,
              coverUrl: data.coverUrl,
              photos: data.photos,
              benefits: data.benefits,
            }}
          />
        </aside>
      </div>
    </>
  );
}

function Section({
  id,
  title,
  hint,
  aside,
  children,
}: Readonly<{ id?: string; title: string; hint?: string; aside?: ReactNode; children: ReactNode }>) {
  return (
    <section id={id} className="scroll-mt-28 space-y-4 rounded-3xl bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="font-semibold text-lg">{title}</h2>
          {hint && <p className="text-muted-foreground text-sm">{hint}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Count({ n, max }: Readonly<{ n: number; max: number }>) {
  return (
    <span className="shrink-0 rounded-full bg-page px-2.5 py-1 font-medium text-muted-foreground text-xs tabular-nums">
      {n}/{max}
    </span>
  );
}

/** How complete the page is, each missing piece one tap away. */
function Progress({ steps }: Readonly<{ steps: { label: string; done: boolean; href: string }[] }>) {
  const t = useTranslations("careersEditor");
  const done = steps.filter((s) => s.done).length;
  const complete = done === steps.length;
  return (
    <section className="space-y-4 rounded-3xl bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="font-semibold text-lg">{complete ? t("progress.completeTitle") : t("progress.title")}</h2>
          <p className="text-muted-foreground text-sm">
            {complete
              ? t("progress.completeText")
              : t("progress.text")}
          </p>
        </div>
        <span className="shrink-0 font-semibold text-2xl tabular-nums">
          {done}
          <span className="text-muted-foreground text-base">/{steps.length}</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-page">
        <div
          className="h-full rounded-full bg-whatsapp-dark transition-[width]"
          style={{ width: `${(done / steps.length) * 100}%` }}
        />
      </div>
      <ul className="flex flex-wrap gap-2">
        {steps.map((s) => (
          <li key={s.label}>
            <Link
              href={s.href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full bg-page py-1.5 pr-3 pl-2 font-medium text-sm",
                s.done ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.done ? (
                <IconCircleCheckFilled className="size-4 text-whatsapp-dark" />
              ) : (
                <IconCircleDashed className="size-4" />
              )}
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DistributeSwitch({
  on,
  pending,
  onChange,
}: Readonly<{ on: boolean; pending: boolean; onChange: (on: boolean) => void }>) {
  const t = useTranslations("careersEditor");
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={pending}
      onClick={() => onChange(!on)}
      className="flex w-full items-start gap-3 rounded-2xl bg-page p-4 text-left disabled:opacity-60"
    >
      <span className={cn("relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors", on ? "bg-whatsapp-dark" : "bg-foreground/15")}>
        <span
          className={cn(
            "absolute top-0.5 left-0 size-4 rounded-full bg-white transition-transform",
            on ? "translate-x-4.5" : "translate-x-0.5",
          )}
        />
      </span>
      <span className="space-y-0.5">
        <span className="block font-medium text-sm">{t("distribute.label")}</span>
        <span className="block text-muted-foreground text-xs">
          {t("distribute.text")}
        </span>
      </span>
    </button>
  );
}

/** A spinner over an image while it is sent or removed. */
function Working() {
  return (
    <span className="absolute inset-0 flex items-center justify-center bg-black/35">
      <Spinner className="size-6 text-white" />
    </span>
  );
}

function CoverSection({
  coverUrl,
  busy,
  onUpload,
  onRemove,
}: Readonly<{ coverUrl: string | null; busy: Busy | undefined; onUpload: (file: File) => void; onRemove: () => void }>) {
  const t = useTranslations("careersEditor");
  const picker = usePicker(onUpload);
  const working = busy === "cover";
  return (
    <Section id="couverture" title={t("cover.title")} hint={t("cover.hint")}>
      {coverUrl ? (
        <div className="relative overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element -- the business's own upload */}
          <img src={coverUrl} alt="" className="aspect-[4/1] w-full object-cover" />
          {working && <Working />}
          <div className="absolute right-3 bottom-3 flex gap-2">
            <button
              type="button"
              onClick={picker.open}
              disabled={!!busy}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-card/90 px-3.5 font-medium text-sm backdrop-blur disabled:opacity-60"
            >
              <IconPhotoPlus className="size-4" />
              {t("cover.change")}
            </button>
            <button
              type="button"
              aria-label={t("cover.remove")}
              onClick={onRemove}
              disabled={!!busy}
              className="inline-flex size-9 items-center justify-center rounded-full bg-card/90 backdrop-blur disabled:opacity-60"
            >
              <IconTrash className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={picker.open}
          disabled={!!busy}
          className="relative flex aspect-[4/1] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl bg-page text-muted-foreground transition-colors hover:text-foreground"
        >
          {working ? (
            <Spinner className="size-6" />
          ) : (
            <>
              <span className="flex size-11 items-center justify-center rounded-full bg-card">
                <IconPhotoPlus className="size-5" />
              </span>
              <span className="font-medium text-foreground text-sm">{t("cover.add")}</span>
              <span className="text-xs">{t("cover.format")}</span>
            </>
          )}
        </button>
      )}
      {picker.element}
    </Section>
  );
}

function PresentationSection({
  description,
  pending,
  onSave,
}: Readonly<{ description: string; pending: boolean; onSave: (text: string) => void }>) {
  const t = useTranslations("careersEditor");
  const [text, setText] = useState(description);
  const dirty = text.trim() !== description.trim();
  return (
    <Section id="presentation" title={t("presentation.title")} hint={t("presentation.hint")}>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={MAX_DESCRIPTION}
        rows={6}
        placeholder={t("presentation.placeholder")}
        className="min-h-36 rounded-2xl border-0 bg-page px-4 py-3 text-base shadow-none focus-visible:ring-2 focus-visible:ring-whatsapp/40 md:text-[15px]"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-xs tabular-nums">
          {text.length}/{MAX_DESCRIPTION}
        </span>
        <div className="flex gap-2">
          {dirty && (
            <button
              type="button"
              onClick={() => setText(description)}
              disabled={pending}
              className="h-10 rounded-full px-4 font-medium text-muted-foreground text-sm hover:text-foreground"
            >
              {t("cancel")}
            </button>
          )}
          <button
            type="button"
            onClick={() => onSave(text.trim())}
            disabled={!dirty || pending}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 font-medium text-sm text-white disabled:opacity-50"
          >
            {pending && <Spinner className="size-4" />}
            {t("save")}
          </button>
        </div>
      </div>
    </Section>
  );
}

function PhotosSection({
  photos,
  busy,
  onAdd,
  onRemove,
}: Readonly<{ photos: string[]; busy: Busy | undefined; onAdd: (file: File) => void; onRemove: (index: number) => void }>) {
  const t = useTranslations("careersEditor");
  const picker = usePicker(onAdd);
  return (
    <Section
      id="photos"
      title={t("photos.title")}
      hint={t("photos.hint")}
      aside={<Count n={photos.length} max={MAX_PHOTOS} />}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((src, i) => (
          <div key={src} className="group relative overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element -- the business's own upload */}
            <img src={src} alt="" className="aspect-[4/3] w-full object-cover" />
            <button
              type="button"
              aria-label={t("photos.remove", { n: i + 1 })}
              onClick={() => onRemove(i)}
              disabled={!!busy}
              className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-full bg-card/90 backdrop-blur transition-opacity disabled:opacity-60 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
            >
              <IconTrash className="size-4" />
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={picker.open}
            disabled={!!busy}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-2xl bg-page text-muted-foreground transition-colors hover:text-foreground"
          >
            {busy === "photo" ? (
              <Spinner className="size-5" />
            ) : (
              <>
                <IconPlus className="size-5" />
                <span className="font-medium text-sm">{t("add")}</span>
              </>
            )}
          </button>
        )}
      </div>
      {busy === "remove" && <p className="text-muted-foreground text-xs">{t("photos.removing")}</p>}
      {picker.element}
    </Section>
  );
}

function BenefitsSection({
  benefits,
  pending,
  onChange,
  language,
}: Readonly<{
  benefits: string[];
  pending: boolean;
  onChange: (next: string[]) => void;
  /** The language the business presents itself in: the ideas are added to its public page. */
  language: Locale;
}>) {
  const t = useTranslations("careersEditor");
  const [text, setText] = useState("");
  const full = benefits.length >= MAX_BENEFITS;
  const has = (b: string) => benefits.some((x) => x.toLowerCase() === b.toLowerCase());
  const ideas = (contentMessages(language).careersEditor.raw("benefits.ideas") as string[]).filter((b) => !has(b));

  const add = (value: string) => {
    const b = value.trim();
    if (!b || full) return;
    if (has(b)) {
      toast(t("benefits.already"));
      return;
    }
    onChange([...benefits, b]);
    setText("");
  };

  return (
    <Section
      id="avantages"
      title={t("benefits.title")}
      hint={t("benefits.hint")}
      aside={<Count n={benefits.length} max={MAX_BENEFITS} />}
    >
      {benefits.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {benefits.map((b) => (
            <li key={b} className="inline-flex items-center gap-1.5 rounded-full bg-selected py-1.5 pr-1.5 pl-3 font-medium text-selected-foreground text-sm">
              {b}
              <button
                type="button"
                aria-label={t("benefits.remove", { name: b })}
                onClick={() => onChange(benefits.filter((x) => x !== b))}
                disabled={pending}
                className="rounded-full p-0.5 hover:bg-black/10"
              >
                <IconX className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {!full && (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              add(text);
            }}
            className="flex gap-2"
          >
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={80}
              placeholder={t("benefits.placeholder")}
              className="h-11 rounded-xl border-0 bg-page px-4 shadow-none"
            />
            <button
              type="submit"
              disabled={!text.trim() || pending}
              className="h-11 shrink-0 rounded-xl bg-ink px-4 font-medium text-sm text-white disabled:opacity-50"
            >
              {t("add")}
            </button>
          </form>
          {ideas.length > 0 && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs">{t("benefits.ideasTitle")}</p>
              <div className="flex flex-wrap gap-2">
                {ideas.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => add(b)}
                    disabled={pending}
                    className="inline-flex items-center gap-1 rounded-full bg-page py-1.5 pr-3 pl-2 text-muted-foreground text-sm hover:text-foreground disabled:opacity-60"
                  >
                    <IconPlus className="size-3.5" />
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Section>
  );
}

/** While the page loads: its two columns, in grey. */
export function EditorBones() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_28rem]">
      <div className="space-y-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-4 rounded-3xl bg-card p-6">
            <Bone className="h-6 w-48" />
            <Bone className="h-4 w-72 max-w-full" />
            <Bone className="h-28" />
          </div>
        ))}
      </div>
      <div className="hidden space-y-3 lg:block">
        <div className="space-y-1.5 px-1">
          <Bone onPage className="h-5 w-20" />
          <Bone onPage className="h-4 w-44" />
        </div>
        <div className="space-y-3 rounded-3xl bg-card p-3">
          <Bone className="mx-2 h-6 rounded-full" />
          <div className="space-y-3 rounded-2xl bg-page p-3">
            <div className="overflow-hidden rounded-2xl bg-card">
              <Bone className="aspect-[4/1] w-full rounded-none" />
              <div className="px-4 pb-4">
                <div className="flex items-end justify-between gap-3">
                  <div className="relative -mt-8 rounded-2xl bg-card p-1">
                    <Bone className="size-16 rounded-xl" />
                  </div>
                  <Bone className="h-8 w-28 rounded-full" />
                </div>
                <div className="mt-2.5 space-y-2">
                  <Bone className="h-5 w-32" />
                  <Bone className="h-3 w-24" />
                </div>
              </div>
            </div>
            <div className="space-y-2 rounded-2xl bg-card p-4">
              <Bone className="h-4 w-20" />
              <Bone className="h-3 w-full" />
              <Bone className="h-3 w-4/5" />
            </div>
            {[0, 1].map((i) => (
              <Bone key={i} className="h-14 rounded-2xl bg-card" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
