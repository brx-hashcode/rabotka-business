import { cn } from "#/lib/utils";

/**
 * The space's loading states: the shape of the page about to appear, in
 * grey, pulsing quietly — never a spinner over a blank page. The route
 * `loading.tsx` files and the pages' own loading branches use the same
 * pieces, so nothing jumps between the two.
 */

/**
 * One grey shape: a tint of the text colour, so it reads the same on a card,
 * on the page and in dark mode. `onPage` marks the ones drawn on the page's
 * grey (a touch stronger there).
 */
export function Bone({ className, onPage }: Readonly<{ className?: string; onPage?: boolean }>) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-xl", onPage ? "bg-foreground/[0.08]" : "bg-foreground/[0.06]", className)}
    />
  );
}

function Card({ className, children }: Readonly<{ className?: string; children?: React.ReactNode }>) {
  return <div className={cn("rounded-3xl bg-card p-6", className)}>{children}</div>;
}

function Status({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div role="status" aria-label="Chargement" className="w-full space-y-6 pt-2">
      {children}
    </div>
  );
}

/** A page's title and its sentence, with an action on the right when it has one. */
export function HeaderSkeleton({ action }: Readonly<{ action?: boolean }>) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-3">
        <Bone onPage className="h-9 w-56" />
        <Bone onPage className="h-4 w-80 max-w-[70vw]" />
      </div>
      {action && <Bone onPage className="h-12 w-44 rounded-full" />}
    </div>
  );
}

/** Figures in tiles, as on the dashboard, Missions or Factures. */
export function TilesSkeleton({ count = 4 }: Readonly<{ count?: number }>) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4", count === 3 ? "sm:grid-cols-3" : "xl:grid-cols-4")}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-4 rounded-2xl bg-page p-5">
          <div className="flex items-center gap-3">
            <Bone onPage className="size-10" />
            <Bone onPage className="h-4 w-24" />
          </div>
          <Bone onPage className="h-8 w-20" />
          <Bone onPage className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

// ── Cards, each the shape of the real one ──

export type CardKind = "offer" | "application" | "profile" | "talent" | "mission" | "contact";

/** An offer in « Offres »: type and status, title, date, place, seats, pay. */
function OfferCardBones() {
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-card p-6">
      <div className="flex justify-between">
        <Bone className="h-6 w-20 rounded-full" />
        <Bone className="h-6 w-24 rounded-full" />
      </div>
      <div className="space-y-2">
        <Bone className="h-5 w-11/12" />
        <Bone className="h-5 w-3/5" />
      </div>
      <div className="space-y-2">
        <Bone className="h-3.5 w-3/4" />
        <Bone className="h-3.5 w-1/2" />
        <Bone className="h-3.5 w-2/5" />
      </div>
      <Bone className="h-5 w-32" />
    </div>
  );
}

/** A candidature: picture, name with status and age, reliability, the offer box, the decision. */
function ApplicationCardBones() {
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-page p-5">
      <div className="flex items-start gap-3.5">
        <Bone onPage className="size-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Bone onPage className="h-4 w-3/5" />
          <div className="flex gap-2">
            <Bone onPage className="h-5 w-16 rounded-full" />
            <Bone onPage className="h-5 w-20" />
          </div>
          <Bone onPage className="h-3.5 w-28" />
        </div>
      </div>
      <div className="space-y-2 rounded-2xl bg-card p-3">
        <Bone className="h-3 w-20" />
        <Bone className="h-4 w-4/5" />
        <Bone className="h-3 w-28" />
      </div>
      <div className="flex gap-2">
        <Bone onPage className="size-9 rounded-full" />
        <Bone onPage className="h-9 flex-1 rounded-full" />
        <Bone onPage className="h-9 flex-1 rounded-full" />
      </div>
    </div>
  );
}

/** A profile in the search: picture, name, trade, figures, description, profile and contact. */
function ProfileCardBones() {
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-page p-5">
      <div className="flex items-start gap-3.5">
        <Bone onPage className="size-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Bone onPage className="h-4 w-3/5" />
          <Bone onPage className="h-3.5 w-2/5" />
          <Bone onPage className="h-3 w-4/5" />
        </div>
        <Bone onPage className="size-9 rounded-full" />
      </div>
      <div className="space-y-2">
        <Bone onPage className="h-3.5" />
        <Bone onPage className="h-3.5 w-3/4" />
      </div>
      <div className="flex gap-2">
        <Bone onPage className="h-10 flex-1 rounded-full" />
        <Bone onPage className="h-10 flex-1 rounded-full" />
      </div>
    </div>
  );
}

/** A worker in « Mes profils »: picture, name, figures, the menu, tags, the last mission, invite and contact. */
function TalentCardBones() {
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-page p-5">
      <div className="flex items-start gap-3.5">
        <Bone onPage className="size-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Bone onPage className="h-4 w-3/5" />
          <Bone onPage className="h-3.5 w-2/5" />
          <Bone onPage className="h-3 w-1/3" />
        </div>
        <Bone onPage className="size-9 rounded-full" />
      </div>
      <div className="flex gap-1.5">
        <Bone onPage className="h-5 w-32 rounded-full" />
        <Bone onPage className="h-5 w-16 rounded-full" />
      </div>
      <Bone onPage className="h-3 w-4/5" />
      <div className="flex gap-2">
        <Bone onPage className="h-10 flex-1 rounded-full" />
        <Bone onPage className="h-10 flex-1 rounded-full" />
      </div>
    </div>
  );
}

/** A mission: date block, title and status, the offer's box, the team's seats and people. */
function MissionCardBones() {
  return (
    <div className="flex flex-col gap-5 rounded-3xl bg-card p-5">
      <div className="flex items-start gap-3.5">
        <Bone className="h-[3.75rem] w-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Bone className="h-4 w-4/5" />
          <Bone className="h-3 w-1/2" />
        </div>
        <Bone className="h-5 w-20 rounded-full" />
      </div>
      <div className="space-y-2 rounded-2xl bg-page p-3">
        <Bone onPage className="h-3.5" />
        <Bone onPage className="h-3.5 w-3/5" />
        <Bone onPage className="h-3 w-2/5" />
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <Bone className="h-3 w-14" />
          <Bone className="h-3 w-16" />
        </div>
        <Bone className="h-1.5 rounded-full" />
      </div>
      <div className="space-y-1.5">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2.5 rounded-2xl bg-page p-2">
            <Bone onPage className="size-9" />
            <div className="flex-1 space-y-1.5">
              <Bone onPage className="h-3.5 w-1/2" />
              <Bone onPage className="h-3 w-16 rounded-full" />
            </div>
            <Bone onPage className="size-9 rounded-full" />
          </div>
        ))}
      </div>
      <Bone className="h-4 w-28" />
    </div>
  );
}

/** A contact: who, phone and e-mail, the offers, since when. */
function ContactCardBones() {
  return (
    <div className="flex flex-col gap-5 rounded-3xl bg-card p-6">
      <div className="flex items-center gap-4">
        <Bone className="size-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Bone className="h-5 w-3/5" />
          <Bone className="h-3.5 w-2/5" />
        </div>
      </div>
      <div className="space-y-2">
        <Bone className="h-11 rounded-2xl" />
        <Bone className="h-11 rounded-2xl" />
      </div>
      <Bone className="h-5 w-40 rounded-full" />
      <Bone className="h-3 w-32" />
    </div>
  );
}

const CARD: Record<CardKind, () => React.ReactElement> = {
  offer: OfferCardBones,
  application: ApplicationCardBones,
  profile: ProfileCardBones,
  talent: TalentCardBones,
  mission: MissionCardBones,
  contact: ContactCardBones,
};

/** Cards of one kind, three to a row (two, one on smaller screens). */
export function CardGridSkeleton({ kind, count = 6 }: Readonly<{ kind: CardKind; count?: number }>) {
  const Card = CARD[kind];
  return (
    <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} />
      ))}
    </div>
  );
}

/** Aide's claims: title and status, a line of text, the date. */
export function ClaimRowsSkeleton({ count = 3 }: Readonly<{ count?: number }>) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-2 rounded-2xl bg-page p-4">
          <div className="flex items-center gap-2">
            <Bone onPage className="h-4 w-1/3" />
            <Bone onPage className="h-5 w-16 rounded-full" />
          </div>
          <Bone onPage className="h-3.5 w-3/4" />
          <Bone onPage className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

/** Rows one under the other, as in Factures or Aide. */
export function RowsSkeleton({ count = 5 }: Readonly<{ count?: number }>) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl bg-page p-4">
          <Bone onPage className="size-10" />
          <div className="flex-1 space-y-2">
            <Bone onPage className="h-4 w-2/5" />
            <Bone onPage className="h-3 w-1/4" />
          </div>
          <Bone onPage className="hidden h-9 w-24 rounded-full sm:block" />
        </div>
      ))}
    </div>
  );
}

/** Search and tabs above a list. */
function FiltersBones() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Bone className="h-11 flex-1 rounded-full" />
        <Bone className="hidden h-11 w-72 rounded-full sm:block" />
      </div>
      <Bone className="h-10 w-full max-w-xl rounded-full" />
    </div>
  );
}

/** Labelled fields, as in a form. */
function FieldsBones({ count = 5 }: Readonly<{ count?: number }>) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-2">
          <Bone className="h-3.5 w-28" />
          <Bone className={cn("rounded-xl", i === 1 ? "h-28" : "h-12")} />
        </div>
      ))}
    </div>
  );
}

// ── Whole pages ──

export function DashboardSkeleton() {
  return (
    <Status>
      <Card className="space-y-8 p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <Bone className="h-10 w-64" />
            <Bone className="h-4 w-96 max-w-[70vw]" />
          </div>
          <Bone className="h-10 w-64 rounded-full" />
        </div>
        <TilesSkeleton />
      </Card>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-4 lg:col-span-2">
          <Bone className="h-6 w-48" />
          <Bone className="h-60" />
        </Card>
        <Card className="space-y-5">
          <Bone className="h-6 w-56" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Bone className="h-3.5 w-full" />
              <Bone className="h-2" />
            </div>
          ))}
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="space-y-3">
            <Bone className="h-6 w-32" />
            <Bone className="h-16 rounded-2xl" />
            <Bone className="h-16 rounded-2xl" />
            <Bone className="h-16 rounded-2xl" />
          </Card>
        ))}
      </div>
    </Status>
  );
}

/**
 * Candidatures, Trouver des profils, Mes profils (cards in a section with
 * its filters), Offres, Missions, contacts (cards on the page).
 */
export function GridPageSkeleton({
  kind,
  tiles,
  filters = true,
  action,
}: Readonly<{ kind: CardKind; tiles?: number; filters?: boolean; action?: boolean }>) {
  const onPage = kind === "offer" || kind === "mission" || kind === "contact";
  return (
    <Status>
      <HeaderSkeleton action={action} />
      {tiles && (
        <Card className="p-6 sm:p-8">
          <TilesSkeleton count={tiles} />
        </Card>
      )}
      {onPage ? (
        <>
          {filters && <Bone onPage className="h-11 w-full max-w-md rounded-full" />}
          <CardGridSkeleton kind={kind} />
        </>
      ) : (
        <Card className="space-y-5">
          {filters && <FiltersBones />}
          <CardGridSkeleton kind={kind} />
        </Card>
      )}
    </Status>
  );
}

/** Factures (rows with an icon), Aide (claims). */
export function ListPageSkeleton({ tiles, action, claims }: Readonly<{ tiles?: number; action?: boolean; claims?: boolean }>) {
  return (
    <Status>
      <HeaderSkeleton action={action} />
      {tiles && (
        <Card className="p-6 sm:p-8">
          <TilesSkeleton count={tiles} />
        </Card>
      )}
      <Card className="space-y-4">
        {claims ? <Bone className="h-10 w-56 rounded-full" /> : <Bone className="h-6 w-36" />}
        {claims ? <ClaimRowsSkeleton /> : <RowsSkeleton />}
      </Card>
    </Status>
  );
}

/** An offer: its header and figures, the candidates, the details beside. */
export function OfferDetailSkeleton() {
  return (
    <Status>
      <Bone onPage className="h-4 w-24" />
      <Card className="space-y-8 p-6 sm:p-8">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Bone className="h-6 w-20 rounded-full" />
            <Bone className="h-6 w-20 rounded-full" />
          </div>
          <Bone className="h-10 w-2/3" />
          <Bone className="h-4 w-64" />
        </div>
        <TilesSkeleton />
      </Card>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="space-y-4">
          <Bone className="h-6 w-32" />
          <Bone className="h-10 w-full max-w-lg rounded-full" />
          <RowsSkeleton count={4} />
        </Card>
        <Card className="space-y-4">
          <Bone className="h-6 w-24" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Bone className="size-9" />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-3 w-20" />
                <Bone className="h-4 w-36" />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </Status>
  );
}

/** A form, with what sits beside it on wide screens. */
export function FormPageSkeleton({ aside = true, back }: Readonly<{ aside?: boolean; back?: boolean }>) {
  return (
    <Status>
      {back && <Bone onPage className="h-4 w-24" />}
      <HeaderSkeleton />
      <div className={cn("grid items-start gap-6", aside && "lg:grid-cols-[minmax(0,1fr)_22rem]")}>
        <Card className={cn("p-6 sm:p-8", !aside && "max-w-3xl")}>
          <FieldsBones />
        </Card>
        {aside && (
          <Card className="space-y-4">
            <Bone className="h-4 w-32" />
            <Bone className="h-7 w-3/4" />
            <Bone className="h-32 rounded-2xl" />
            <Bone className="h-24 rounded-2xl" />
          </Card>
        )}
      </div>
    </Status>
  );
}

/** Abonnement: the plan in use, then the plans to choose from. */
export function SubscriptionSkeleton() {
  return (
    <Status>
      <HeaderSkeleton />
      <Card className="space-y-5 p-6 sm:p-8">
        <Bone className="h-7 w-40" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Bone className="h-20 rounded-2xl" />
          <Bone className="h-20 rounded-2xl" />
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="space-y-4">
            <Bone className="h-6 w-28" />
            <Bone className="h-10 w-40" />
            {[0, 1, 2, 3].map((j) => (
              <Bone key={j} className="h-4 w-3/4" />
            ))}
            <Bone className="h-12 rounded-full" />
          </Card>
        ))}
      </div>
    </Status>
  );
}

/** A conversation: who, then messages either side, then the field to write. */
export function ThreadSkeleton() {
  return (
    <div role="status" aria-label="Chargement" className="flex h-full flex-col">
      <div className="flex items-center gap-3 p-4 sm:px-6">
        <Bone className="size-12 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Bone className="h-4 w-40" />
          <Bone className="h-3 w-56" />
        </div>
      </div>
      <div className="flex-1 space-y-3 px-4 py-6 sm:px-6">
        <Bone className="h-12 w-3/5" />
        <Bone className="ml-auto h-12 w-1/2" />
        <Bone className="h-16 w-2/3" />
        <Bone className="ml-auto h-10 w-2/5" />
      </div>
      <div className="p-3 sm:px-4">
        <Bone className="h-12 rounded-2xl" />
      </div>
    </div>
  );
}

/** A claim: the exchange with the team, the claim beside. */
export function ClaimDetailSkeleton() {
  return (
    <Status>
      <Bone onPage className="h-4 w-20" />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="h-[calc(100svh-11rem)] min-h-[28rem] p-0">
          <ThreadSkeleton />
        </Card>
        <Card className="order-first space-y-4 lg:order-none">
          <Bone className="h-6 w-24 rounded-full" />
          <Bone className="h-8 w-3/4" />
          <Bone className="h-20" />
        </Card>
      </div>
    </Status>
  );
}

/** A candidate's profile. */
export function ProfileSkeleton() {
  return (
    <Status>
      <Card className="space-y-6 p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <Bone className="size-20 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Bone className="h-7 w-1/2" />
            <Bone className="h-4 w-1/3" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Bone className="h-20 rounded-2xl" />
          <Bone className="h-20 rounded-2xl" />
          <Bone className="h-20 rounded-2xl" />
        </div>
        <Bone className="h-24" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Bone className="aspect-square rounded-2xl" />
          <Bone className="aspect-square rounded-2xl" />
          <Bone className="aspect-square rounded-2xl" />
        </div>
      </Card>
    </Status>
  );
}

/** A page of a PDF, while it is drawn. */
export function DocumentPageSkeleton() {
  return (
    <div role="status" aria-label="Chargement" className="mx-auto aspect-[1/1.414] w-full max-w-3xl space-y-4 rounded-xl bg-white p-10 shadow-soft">
      <Bone className="mx-auto size-14 rounded-2xl" />
      <Bone className="mx-auto h-5 w-40" />
      <Bone className="h-px" />
      <Bone className="h-4 w-1/3" />
      <Bone className="h-4 w-2/3" />
      <Bone className="h-4 w-1/2" />
      <Bone className="mt-8 h-24" />
      <Bone className="h-10" />
    </div>
  );
}
