import { Bone } from "#/components/page-skeletons";
import { cn } from "#/lib/utils";

/**
 * The company page while it loads, in its own shape: the low cover with the
 * logo over its edge and the button beside it, the name, « À propos », then
 * the offers. Nothing moves when the real page replaces it.
 */
export function CompanyPageSkeleton() {
  return (
    <div role="status" aria-label="Chargement" className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-card">
        <Bone className="aspect-[4/1] w-full rounded-none" />
        <div className="px-5 pb-6 sm:px-8 sm:pb-7">
          <div className="flex items-end justify-between gap-4">
            <div className="relative -mt-12 rounded-3xl bg-card p-1.5 sm:-mt-14">
              <Bone className="size-24 rounded-[1.1rem] sm:size-28 sm:rounded-[1.3rem]" />
            </div>
            <Bone className="h-10 w-36 rounded-full sm:mb-1 sm:w-44" />
          </div>
          <div className="mt-4 space-y-2.5">
            <Bone className="h-8 w-56 max-w-full" />
            <Bone className="h-4 w-40" />
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-3xl bg-card p-6 sm:p-8">
        <Bone className="mb-4 h-6 w-28" />
        {["w-full", "w-full", "w-11/12", "w-3/5"].map((w, i) => (
          <Bone key={i} className={cn("h-3.5", w)} />
        ))}
        <div className="flex flex-wrap gap-2 pt-3">
          {["w-28", "w-32", "w-36", "w-24"].map((w, i) => (
            <Bone key={i} className={cn("h-8 rounded-full", w)} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Bone onPage className="mx-2 h-6 w-40" />
        {["w-1/2", "w-2/5", "w-3/5"].map((w, i) => (
          <div key={i} className="flex items-center gap-3 rounded-3xl bg-card px-6 py-5">
            <div className="min-w-0 flex-1 space-y-2.5">
              <Bone className={cn("h-5", w)} />
              <Bone className="h-3.5 w-1/3" />
            </div>
            <Bone className="size-10 shrink-0 rounded-full" />
          </div>
        ))}
      </section>
    </div>
  );
}
