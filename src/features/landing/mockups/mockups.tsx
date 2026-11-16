import {
  IconArrowRight,
  IconBrandLinkedin,
  IconBriefcase,
  IconCalendarEvent,
  IconCheck,
  IconFileText,
  IconMapPin,
  IconMessage,
  IconRepeat,
  IconSearch,
  IconThumbUp,
  IconMessageCircle,
  IconPhone,
  IconVideo,
  IconWriting,
} from "@tabler/icons-react";

import { useLocale } from "next-intl";

import { ProviderTile } from "#/components/mail-provider-logos";
import { CriterionBar, ScoreRing, VerdictChip } from "#/features/cv-screening/components/cv-bits";
import { cn } from "#/lib/utils";
import type { MockupKey } from "../content";
import { siteCopy } from "../copy";
import { PipelineMockup, TeamMockup } from "./ats-mockups";
import { FloatCard, MockupFrame } from "./frame";

/*
 * Example data only: fictional people, illustrative scores. Nothing here is a
 * statistic about Rabotka.
 */

/** The mock-ups' words in the reader's language (copy/<locale>.json → mockups). */
function useMockupCopy() {
  return siteCopy(useLocale() as "fr" | "en").mockups;
}

const SCORES = [88, 74, 61, 38];

function useRanked() {
  return useMockupCopy().ranked.map((r, i) => ({ ...r, score: SCORES[i] }));
}

type Ranked = ReturnType<typeof useRanked>[number];

function Initials({ name, className }: Readonly<{ name: string; className?: string }>) {
  const parts = name.split(/[\s-]+/);
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-page font-semibold text-[11px] text-muted-foreground",
        className,
      )}
    >
      {(parts[0][0] + parts[parts.length - 1][0]).toUpperCase()}
    </span>
  );
}

function RankedRow({ r, i }: Readonly<{ r: Ranked; i: number }>) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-page p-2.5">
      <span className="w-4 text-center font-semibold text-muted-foreground text-xs">{i + 1}</span>
      <ScoreRing score={r.score} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{r.name}</p>
        <p className="truncate text-muted-foreground text-xs">{r.job}</p>
      </div>
      <span className="hidden sm:inline">
        <VerdictChip score={r.score} />
      </span>
    </div>
  );
}

/** The hero: the ranked CVs, the mailbox they came from, an interview confirmed. */
export function HeroMockup() {
  const m = useMockupCopy().hero;
  const RANKED = useRanked();
  return (
    <div className="relative pt-6 pb-8 sm:pr-10">
      <MockupFrame label={m.label} title={m.title}>
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1">
            <p className="font-semibold">{m.heading}</p>
            <span className="rounded-full bg-chip-green px-2.5 py-1 font-medium text-chip-green-foreground text-xs">{m.ranked}</span>
          </div>
          {RANKED.map((r, i) => (
            <RankedRow key={r.name} r={r} i={i} />
          ))}
        </div>
      </MockupFrame>
      <FloatCard className="-bottom-1 left-4 hidden items-center gap-3 sm:flex">
        <ProviderTile provider="gmail" className="size-9" />
        <div>
          <p className="font-medium text-xs">{m.gmail}</p>
          <p className="text-[11px] text-muted-foreground">{m.gmailAddress}</p>
        </div>
      </FloatCard>
      <FloatCard className="-top-5 right-0 hidden items-center gap-2.5 md:flex">
        <span className="flex size-8 items-center justify-center rounded-full bg-chip-green text-chip-green-foreground">
          <IconCheck className="size-4" />
        </span>
        <div>
          <p className="font-medium text-xs">{m.confirmed}</p>
          <p className="text-[11px] text-muted-foreground">{m.confirmedWhen}</p>
        </div>
      </FloatCard>
    </div>
  );
}

function CvMockup() {
  const copy = useMockupCopy();
  const m = copy.cv;
  return (
    <div className="relative pb-6 md:pr-16">
      <MockupFrame label={m.label} title={m.title}>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <ScoreRing score={86} size={52} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{copy.ranked[0].name}</p>
                <VerdictChip score={86} />
              </div>
              <p className="text-muted-foreground text-xs">{m.summary}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
            <div className="space-y-2 text-xs">
              <p className="font-medium text-sm">{m.strengthsTitle}</p>
              {m.strengths.map((p) => (
                <p key={p} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-whatsapp-dark" />
                  {p}
                </p>
              ))}
            </div>
            <div className="space-y-2 rounded-2xl bg-page p-3">
              <CriterionBar label={copy.criteria.skills} value={90} />
              <CriterionBar label={copy.criteria.experience} value={85} />
              <CriterionBar label={copy.criteria.location} value={100} />
            </div>
          </div>
          <div className="space-y-1.5 rounded-2xl bg-page p-3 text-xs">
            <p className="font-medium text-sm">{m.pathTitle}</p>
            {m.path.map((step, i) => (
              <div key={step.role} className="flex items-center justify-between gap-2 rounded-xl bg-card px-3 py-2">
                <span className="truncate">{step.role}</span>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5", i === 0 ? "bg-chip-green text-chip-green-foreground" : "bg-page")}>
                  {step.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </MockupFrame>
      <FloatCard className="right-0 bottom-0 hidden w-52 space-y-2 md:block">
        <p className="font-medium text-xs">{m.fromMailbox}</p>
        {(
          [
            ["gmail", "CV_Grace_Loubaki.pdf"],
            ["gmail", "CV Kiminou.docx"],
          ] as const
        ).map(([p, f]) => (
          <div key={f} className="flex items-center gap-2 rounded-xl bg-page p-2">
            <ProviderTile provider={p} className="size-7 rounded-lg [&>svg]:size-4" />
            <span className="truncate text-[11px]">{f}</span>
            <IconCheck className="ml-auto size-3.5 shrink-0 text-whatsapp-dark" />
          </div>
        ))}
      </FloatCard>
    </div>
  );
}

function OfferMockup() {
  const m = useMockupCopy().offer;
  return (
    <MockupFrame label={m.label} title={m.title}>
      <div className="space-y-3">
        <div className="rounded-2xl bg-page px-4 py-3 text-sm">{m.prompt}</div>
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-chip-violet px-3 py-1 font-medium text-chip-violet-foreground text-xs">
            <IconWriting className="size-3.5" />
            {m.badge}
          </span>
        </div>
        <div className="space-y-2 rounded-2xl bg-page p-4">
          <p className="font-semibold">{m.heading}</p>
          <p className="text-muted-foreground text-xs leading-relaxed">{m.p1}</p>
          <p className="text-muted-foreground text-xs leading-relaxed">{m.p2}</p>
          <p className="pt-1 text-[11px] text-muted-foreground">
            {m.tradeLabel} <span className="font-medium text-foreground">{m.trade}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <span className="h-9 flex-1 rounded-full bg-page" />
          <span className="flex h-9 flex-[2] items-center justify-center rounded-full bg-ink font-medium text-white text-xs">
            {m.use}
          </span>
        </div>
      </div>
    </MockupFrame>
  );
}

/** A LinkedIn post of an offer, as it shows in the feed, and what came of it. */
function LinkedinMockup() {
  const m = useMockupCopy().linkedin;
  return (
    <div className="relative pb-10">
      <MockupFrame label={m.label} title={m.title}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-lime font-semibold text-[#0f2414] text-sm">
              SM
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm">{m.author}</p>
              <p className="truncate text-[11px] text-muted-foreground">{m.role}</p>
            </div>
            <IconBrandLinkedin className="size-6 shrink-0 text-[#0a66c2]" />
          </div>
          <p className="text-xs leading-relaxed">{m.post}</p>
          <div className="overflow-hidden rounded-2xl bg-page">
            {/* The offer's share image, as the app makes it (carrieres/[slug]/[reference]/opengraph-image). */}
            <div className="p-1.5 pb-0">
            <div className="relative flex aspect-[1200/630] flex-col items-center justify-between overflow-hidden rounded-xl bg-white px-4 py-3.5 text-[#0f2414]">
              <span className="-top-[27%] -right-[12%] absolute aspect-square w-[35%] rounded-full bg-[#cbffa5]" />
              <span className="-bottom-[33%] -left-[14%] absolute aspect-square w-[35%] rounded-full bg-[#eef6e8]" />
              <span className="relative flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-md bg-[#0f2414] font-semibold text-[#cbffa5] text-[8px]">
                  LC
                </span>
                <span className="font-light text-[11px]">{m.company}</span>
                <span className="rounded-full bg-[#cbffa5] px-1.5 py-px font-light text-[9px]">{m.hiring}</span>
              </span>
              <span className="relative max-w-[80%] text-center font-light text-lg leading-[1.05] tracking-tight sm:text-2xl">
                {m.offerTitle}
              </span>
              <span className="relative flex flex-col items-center gap-2">
                <span className="flex gap-1.5">
                  <span className="flex items-center gap-1 rounded-full bg-[#eef6e8] px-2 py-0.5 font-light text-[9px]">
                    <IconMapPin className="size-2.5" /> Pointe-Noire
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-[#eef6e8] px-2 py-0.5 font-light text-[9px]">
                    <IconBriefcase className="size-2.5" /> {m.type}
                  </span>
                </span>
                <span className="flex items-center gap-1 rounded-full bg-[#0f2414] px-3 py-1 font-light text-[9px] text-white">
                  {m.apply} <IconArrowRight className="size-2.5 text-[#cbffa5]" />
                </span>
              </span>
            </div>
            </div>
            <div className="px-3 py-2">
              <p className="font-medium text-xs">{m.applyAt}</p>
              <p className="text-[10px] text-muted-foreground">business.rabotka.work/carrieres</p>
            </div>
          </div>
          <div className="flex items-center justify-around pt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <IconThumbUp className="size-3.5" /> {m.like}
            </span>
            <span className="flex items-center gap-1">
              <IconMessage className="size-3.5" /> {m.comment}
            </span>
            <span className="flex items-center gap-1">
              <IconRepeat className="size-3.5" /> {m.repost}
            </span>
          </div>
        </div>
      </MockupFrame>
      <FloatCard className="-bottom-1 right-2 flex items-center gap-3 sm:right-6">
        <span className="flex size-9 items-center justify-center rounded-xl bg-[#0a66c2] text-white">
          <IconBrandLinkedin className="size-5" />
        </span>
        <span>
          <span className="block font-medium text-xs">{m.applications}</span>
          <span className="block text-[11px] text-muted-foreground">{m.applicationsWhen}</span>
        </span>
      </FloatCard>
    </div>
  );
}

function ApplicantsMockup() {
  const copy = useMockupCopy();
  const m = copy.applicants;
  const RANKED = useRanked();
  return (
    <div className="relative pb-10">
      <MockupFrame label={m.label} title={m.title}>
        <div className="space-y-2">
          {RANKED.slice(0, 3).map((r, i) => (
            <div key={r.name} className={cn("rounded-2xl bg-page p-2.5", i === 0 && "space-y-2.5")}>
              <div className="flex items-center gap-3">
                <span className={cn("size-4 shrink-0 rounded-md", i > 0 ? "bg-whatsapp-dark" : "bg-card")}>
                  {i > 0 && <IconCheck className="size-4 p-0.5 text-white" />}
                </span>
                <ScoreRing score={r.score} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{r.name}</p>
                  <p className="truncate text-muted-foreground text-xs">{r.job}</p>
                </div>
                <VerdictChip score={r.score} />
              </div>
              {i === 0 && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl bg-card p-3">
                  <CriterionBar label={copy.criteria.trade} value={95} />
                  <CriterionBar label={copy.criteria.experience} value={80} />
                  <CriterionBar label={copy.criteria.location} value={90} />
                  <CriterionBar label={copy.criteria.reliability} value={85} />
                </div>
              )}
            </div>
          ))}
        </div>
      </MockupFrame>
      <FloatCard className="right-4 -bottom-1 left-4 flex items-center gap-2 bg-ink text-white sm:left-auto">
        <span className="text-xs">{m.selected}</span>
        <span className="rounded-full bg-white/15 px-3 py-1.5 font-medium text-xs">{m.decline}</span>
      </FloatCard>
    </div>
  );
}

const INTERVIEW_ROWS = [
  { date: "14", icon: IconMapPin, tone: "confirmed" },
  { date: "15", icon: IconVideo, tone: "join" },
  { date: "18", icon: IconPhone, tone: "sent" },
] as const;

function InterviewsMockup() {
  const m = useMockupCopy().interviews;
  return (
    <div className="relative pb-8 md:pr-20">
      <MockupFrame label={m.label} title={m.title}>
        <div className="space-y-3">
          {INTERVIEW_ROWS.map(({ date, icon: Icon, tone }, i) => {
            const row = m.rows[i];
            return (
              <div key={date} className="flex items-center gap-3 rounded-2xl bg-page p-3">
                <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-card">
                  <span className="text-[10px] text-muted-foreground uppercase">{row.day}</span>
                  <span className="font-semibold text-sm leading-none">{date}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{row.who}</p>
                  <p className="flex items-center gap-1 text-muted-foreground text-xs">
                    <Icon className="size-3.5" />
                    {row.when}
                  </p>
                </div>
                {tone === "confirmed" && (
                  <span className="rounded-full bg-chip-green px-2.5 py-1 font-medium text-chip-green-foreground text-xs">{row.status}</span>
                )}
                {tone === "join" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 font-medium text-primary-foreground text-xs">
                    <IconVideo className="size-3.5" />
                    {row.status}
                  </span>
                )}
                {tone === "sent" && (
                  <span className="rounded-full bg-page px-2.5 py-1 font-medium text-muted-foreground text-xs ring-1 ring-foreground/10">{row.status}</span>
                )}
              </div>
            );
          })}
        </div>
      </MockupFrame>
      <FloatCard className="right-0 bottom-0 hidden w-60 space-y-2 md:block">
        <p className="flex items-center gap-1.5 font-medium text-xs">
          <IconFileText className="size-3.5" />
          {m.reportTitle}
        </p>
        <p className="text-[11px] text-muted-foreground leading-snug">{m.reportText}</p>
        <div className="space-y-1">
          {m.reportPoints.map((x) => (
            <p key={x} className="flex items-center gap-2 rounded-xl bg-page px-2.5 py-1.5 text-[11px]">
              <IconCheck className="size-3.5 text-whatsapp-dark" />
              {x}
            </p>
          ))}
        </div>
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <IconCalendarEvent className="size-3.5" />
          {m.calendars}
        </p>
      </FloatCard>
    </div>
  );
}

function TrackingMockup() {
  const m = useMockupCopy().tracking;
  return (
    <div className="relative pb-8 md:pr-16">
      <MockupFrame label={m.label} title={m.title}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{m.heading}</p>
            <span className="inline-flex rounded-full bg-page p-0.5 text-[11px]">
              {m.ranges.map((range, i) => (
                <span
                  key={range}
                  className={cn("rounded-full px-2 py-1", i === 1 ? "bg-selected font-medium text-selected-foreground" : "text-muted-foreground")}
                >
                  {range}
                </span>
              ))}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {m.tiles.map((l, i) => [l, ["24", "9", "4"][i]] as const).map(([l, v]) => (
              <div key={l} className="rounded-2xl bg-page p-3">
                <p className="truncate text-[11px] text-muted-foreground">{l}</p>
                <p className="font-semibold text-xl tabular-nums">{v}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2 rounded-2xl bg-page p-3">
            {m.funnel.map((l, i) => [l, [100, 80, 38, 17][i]] as const).map(([l, w]) => (
              <div key={l} className="flex items-center gap-3 text-[11px]">
                <span className="w-16 shrink-0 text-muted-foreground">{l}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-card">
                  <span className="block h-full rounded-full bg-whatsapp-dark" style={{ width: `${w}%` }} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </MockupFrame>
      <FloatCard className="right-0 bottom-0 hidden w-40 space-y-2 md:block">
        <span className="flex items-center gap-1.5 font-medium text-xs">
          <IconFileText className="size-4 text-destructive" />
          {m.pdf}
        </span>
        <div className="space-y-1 rounded-xl bg-white p-2.5">
          <span className="block h-1.5 w-1/2 rounded bg-[#1f8f4e]" />
          <span className="block h-1.5 w-full rounded bg-black/10" />
          <span className="block h-1.5 w-5/6 rounded bg-black/10" />
          <span className="block h-6 w-full rounded bg-black/5" />
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <IconBriefcase className="size-3.5" />
          {m.contract}
        </span>
      </FloatCard>
    </div>
  );
}

const PEOPLE = [
  { name: "Fortuné Mabiala", city: "Brazzaville" },
  { name: "Clarisse Kouassi", city: "Abidjan" },
  { name: "Brian Otieno", city: "Nairobi" },
];

function ProfilesMockup() {
  const m = useMockupCopy().profiles;
  const PROFILES = PEOPLE.map((p, i) => ({ ...p, ...m.people[i] }));
  return (
    <MockupFrame label={m.label} title={m.title}>
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 rounded-full bg-page px-4 py-2.5 text-muted-foreground text-sm">
          <IconSearch className="size-4" />
          {m.search}
        </div>
        {PROFILES.map((p) => (
          <div key={p.name} className="flex items-center gap-3 rounded-2xl bg-page p-3">
            <Initials name={p.name} className="size-10 bg-card" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate font-medium text-sm">
                {p.name}
                <span className="flex size-4 items-center justify-center rounded-full bg-whatsapp-dark text-white">
                  <IconCheck className="size-2.5" strokeWidth={3} />
                </span>
              </p>
              <p className="truncate text-muted-foreground text-xs">
                {p.job} · {p.city}
              </p>
              <div className="mt-1 flex gap-1">
                {p.tags.map((t) => (
                  <span key={t} className="rounded-full bg-card px-2 py-0.5 text-[10px]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <span className="hidden size-8 items-center justify-center rounded-full bg-card sm:flex">
              <IconMessageCircle className="size-4" />
            </span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

const MOCKUPS: Record<MockupKey, () => React.ReactNode> = {
  cv: CvMockup,
  offer: OfferMockup,
  linkedin: LinkedinMockup,
  applicants: ApplicantsMockup,
  interviews: InterviewsMockup,
  tracking: TrackingMockup,
  profiles: ProfilesMockup,
  team: TeamMockup,
  pipeline: PipelineMockup,
};

export function FeatureMockup({ id }: Readonly<{ id: MockupKey }>) {
  const Mockup = MOCKUPS[id];
  return <Mockup />;
}

