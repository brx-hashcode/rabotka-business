import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowLeft, IconCheck, IconClock } from "@tabler/icons-react";

import { DemoBlock } from "#/features/landing/components/demo-block";
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

  return (
    <>
      <article className="px-4 pt-10 pb-4 sm:px-6 md:pt-16">
        <div className="mx-auto w-full max-w-3xl space-y-8">
          <Link href="/ressources" className="inline-flex items-center gap-1.5 font-medium text-sm text-muted-foreground hover:text-foreground">
            <IconArrowLeft className="size-4" />
            Toutes les ressources
          </Link>
          <header className="space-y-4">
            <p className="inline-flex items-center gap-1.5 text-muted-foreground text-sm">
              <IconClock className="size-4" />
              Guide · {guide.minutes} min de lecture
            </p>
            <h1 className="font-semibold text-4xl leading-tight tracking-tight sm:text-5xl">{guide.title}</h1>
            <p className="text-lg text-muted-foreground">{guide.description}</p>
          </header>
          <div className="space-y-4">
            {guide.sections.map((section) => (
              <section key={section.heading} className="space-y-3 rounded-3xl bg-card p-6 sm:p-8">
                <h2 className="font-semibold text-2xl tracking-tight">{section.heading}</h2>
                {section.paragraphs?.map((p) => (
                  <p key={p} className="text-muted-foreground leading-relaxed">
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
          </div>
        </div>
      </article>
      <DemoBlock title="Appliquez cette méthode avec Rabotka" />
    </>
  );
}
