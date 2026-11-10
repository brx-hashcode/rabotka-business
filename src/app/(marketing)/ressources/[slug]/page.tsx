import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowLeft, IconCheck, IconClock } from "@tabler/icons-react";

import { Illustration } from "#/components/illustration";
import { DemoBlock } from "#/features/landing/components/demo-block";
import { PageHero } from "#/features/landing/components/page-hero";
import { GUIDES } from "#/features/landing/site-content";
import { marketingMetadata } from "#/lib/seo/marketing";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/ressources/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) return {};
  return marketingMetadata({ title: guide.title, description: guide.description, path: `/ressources/${guide.slug}` });
}

export default async function GuidePage({ params }: PageProps<"/ressources/[slug]">) {
  const { slug } = await params;
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) notFound();

  const others = GUIDES.filter((g) => g.slug !== guide.slug);

  return (
    <>
      <PageHero
        before={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Link href="/ressources" className="inline-flex items-center gap-1.5 font-medium hover:underline">
              <IconArrowLeft className="size-4" />
              Toutes les ressources
            </Link>
            <span className="inline-flex items-center gap-1.5 text-header-muted">
              <IconClock className="size-4" />
              Guide · {guide.minutes} min de lecture
            </span>
          </div>
        }
        title={guide.title}
        text={guide.description}
        actions={false}
        aside={
          <div className="flex aspect-4/3 items-center justify-center rounded-[2rem] bg-card p-8 sm:p-12">
            <Illustration name={guide.illustration} className="h-full w-auto" />
          </div>
        }
      />

      <section className="bg-card py-20 md:py-28">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[16rem_1fr] lg:gap-16">
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <nav aria-label="Dans ce guide" className="space-y-2">
              <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">Dans ce guide</p>
              <ol className="space-y-1">
                {guide.sections.map((section, i) => (
                  <li key={section.heading}>
                    <a
                      href={`#partie-${i + 1}`}
                      className="flex gap-3 rounded-2xl px-3 py-2 text-sm hover:bg-page"
                    >
                      <span className="font-semibold text-muted-foreground tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="hidden space-y-2 lg:block">
              <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">Autres guides</p>
              {others.map((g) => (
                <Link
                  key={g.slug}
                  href={`/ressources/${g.slug}`}
                  className="block rounded-2xl bg-page p-3 font-medium text-sm hover:bg-page/70"
                >
                  {g.title}
                </Link>
              ))}
            </div>
          </aside>

          <article className="min-w-0 space-y-4">
            {guide.sections.map((section, i) => (
              <section
                key={section.heading}
                id={`partie-${i + 1}`}
                className="scroll-mt-6 space-y-3 rounded-3xl bg-page p-6 sm:p-8"
              >
                <span className="font-semibold text-muted-foreground text-xs tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="font-semibold text-2xl tracking-tight">{section.heading}</h2>
                {section.paragraphs?.map((p) => (
                  <p key={p} className="max-w-3xl text-muted-foreground leading-relaxed">
                    {p}
                  </p>
                ))}
                {section.list && (
                  <ul className="space-y-2 pt-1">
                    {section.list.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-whatsapp text-white">
                          <IconCheck className="size-3" strokeWidth={3} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </article>
        </div>
      </section>

      <DemoBlock title="Appliquez cette méthode avec Rabotka" />
    </>
  );
}
