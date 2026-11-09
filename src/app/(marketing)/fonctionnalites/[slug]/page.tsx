import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowRight, IconCheck } from "@tabler/icons-react";

import { DemoBlock } from "#/features/landing/components/demo-block";
import { FaqBlock } from "#/features/landing/components/landing-sections";
import { PageHero } from "#/features/landing/components/page-hero";
import { SectionHeading } from "#/features/landing/components/section-heading";
import { FEATURES, FEATURES_HREF } from "#/features/landing/content";
import { FeatureMockup } from "#/features/landing/mockups/mockups";
import { FEATURE_PAGES } from "#/features/landing/site-content";
import { marketingMetadata } from "#/lib/seo/marketing";

export const dynamicParams = false;

export function generateStaticParams() {
  return FEATURES.map((f) => ({ slug: f.slug }));
}

function find(slug: string) {
  const feature = FEATURES.find((f) => f.slug === slug);
  if (!feature || feature.id === "pipeline") return null;
  return { feature, page: FEATURE_PAGES[feature.id] };
}

export async function generateMetadata({ params }: PageProps<"/fonctionnalites/[slug]">): Promise<Metadata> {
  const found = find((await params).slug);
  if (!found) return {};
  return marketingMetadata({
    title: found.page.metaTitle,
    description: found.page.metaDescription,
    path: found.feature.href,
  });
}

export default async function FeaturePage({ params }: PageProps<"/fonctionnalites/[slug]">) {
  const found = find((await params).slug);
  if (!found) notFound();
  const { feature, page } = found;
  const others = FEATURES.filter((f) => f.id !== feature.id).slice(0, 4);

  return (
    <>
      <PageHero
        kicker={feature.label}
        title={page.heading}
        text={page.intro}
        aside={<FeatureMockup id={feature.id} />}
      />

      <section className="bg-card py-20 md:py-28">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="space-y-6">
            <SectionHeading kicker="Ce que vous y gagnez" title={feature.title} text={feature.text} />
            <ul className="space-y-2.5">
              {feature.points.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-whatsapp text-white">
                    <IconCheck className="size-3" strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid content-start gap-4 sm:grid-cols-2">
            {page.benefits.map((b) => (
              <div key={b.title} className="space-y-2 rounded-3xl bg-page p-6">
                <h3 className="font-semibold text-lg">{b.title}</h3>
                <p className="text-muted-foreground text-sm">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl space-y-10 px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              kicker="Le même pipeline"
              title="Les autres outils de votre ATS"
              text="Chaque fonctionnalité alimente la suivante : tout reste au même endroit."
            />
            <Link
              href={FEATURES_HREF}
              className="group inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline"
            >
              Toutes les fonctionnalités
              <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map(({ id, href, label, description, icon: Icon, tone }) => (
              <li key={id}>
                <Link href={href} className="group flex h-full flex-col gap-4 rounded-3xl bg-card p-6">
                  <span className={`flex size-11 items-center justify-center rounded-2xl ${tone}`}>
                    <Icon className="size-5" />
                  </span>
                  <span className="space-y-1">
                    <span className="block font-semibold">{label}</span>
                    <span className="block text-muted-foreground text-sm">{description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FaqBlock items={page.faq} title={`${feature.label} : vos questions`} text="Les réponses aux questions que l'on nous pose le plus." />

      <DemoBlock />
    </>
  );
}
