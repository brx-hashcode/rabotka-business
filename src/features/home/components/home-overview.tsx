"use client";

import Link from "next/link";
import { IconBriefcase, IconBuilding, IconUsers } from "@tabler/icons-react";

import { useSessionUser } from "#/hooks/use-session-user";

const NEXT_UP = [
  {
    icon: IconBuilding,
    title: "Votre organisation",
    text: "Les informations et documents de votre entreprise, et leur vérification.",
    href: "/espace/organisation",
  },
  {
    icon: IconBriefcase,
    title: "Vos offres",
    text: "Publiez vos offres d'emploi et suivez-les.",
  },
  {
    icon: IconUsers,
    title: "Vos candidats",
    text: "Les profils qui correspondent à vos offres, au même endroit.",
  },
];

/** Placeholder home: a greeting and what the dashboard will hold. */
export function HomeOverview() {
  const { data: user } = useSessionUser();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 sm:px-6">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">
          {user?.first_name ? `Bonjour ${user.first_name}` : "Bienvenue"}
        </h1>
        <p className="text-muted-foreground">
          Votre espace pour recruter avec Rabotka.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {NEXT_UP.map(({ icon: Icon, title, text, href }) => {
          const card = (
            <div className="h-full space-y-3 rounded-2xl bg-card p-5 transition-colors group-hover:bg-card/70">
              <span className="flex size-10 items-center justify-center rounded-full bg-page">
                <Icon className="size-5" />
              </span>
              <div className="space-y-1">
                <p className="font-medium">{title}</p>
                <p className="text-muted-foreground text-sm">{text}</p>
              </div>
            </div>
          );
          return href ? (
            <Link key={title} href={href} className="group">
              {card}
            </Link>
          ) : (
            <div key={title}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
