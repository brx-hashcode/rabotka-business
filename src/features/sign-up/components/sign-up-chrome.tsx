"use client";

import Image from "next/image";
import Link from "next/link";
import { IconCheck } from "@tabler/icons-react";

import { BusinessLockup } from "#/components/business-lockup";
import { cn } from "#/lib/utils";
import { DONE_PHOTO, STEPS } from "../steps";

const DONE_STEP = {
  kicker: "Demande envoyée",
  title: "Bienvenue sur Rabotka Business",
  text: "Nos équipes examinent votre organisation. Vous pouvez déjà découvrir votre espace.",
};


export function StepPhotoPanel({ index, done }: Readonly<{ index: number; done: boolean }>) {
  const photos: { src: string; focus?: string }[] = [
    ...STEPS.map((s) => ({ src: s.photo, focus: (s as { focus?: string }).focus })),
    { src: DONE_PHOTO },
  ];
  const active = done ? photos.length - 1 : index;
  const step = done ? DONE_STEP : STEPS[index];
  const current = done ? STEPS.length : index;

  return (
    <aside className="relative flex h-full w-full flex-col overflow-hidden rounded-[28px] bg-ink p-8 text-white xl:p-10">
      {photos.map(({ src, focus }, i) => (
        <Image
          key={src}
          src={src}
          style={focus ? { objectPosition: focus } : undefined}
          alt=""
          fill
          sizes="50vw"
          priority={i === 0}
          loading={i === 0 ? undefined : "eager"}
          className={cn(
            "object-cover transition-[opacity,transform] duration-700 ease-out",
            i === active ? "scale-100 opacity-100" : "scale-[1.04] opacity-0",
          )}
        />
      ))}
      <div className="absolute inset-0 bg-linear-to-b from-black/55 via-black/10 to-black/85" />

      <Link href="/" aria-label="Rabotka Business — accueil" className="relative self-start">
        <BusinessLockup inverse />
      </Link>

      <ol className="relative mt-10 w-full max-w-xs space-y-1 rounded-2xl bg-black/30 p-2 backdrop-blur-md">
        {STEPS.map((s, i) => {
          const complete = i < current;
          const isActive = i === current;
          return (
            <li
              key={s.id}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-300",
                isActive && "bg-white/15",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full font-semibold text-xs transition-colors duration-300",
                  complete && "bg-whatsapp text-white",
                  isActive && "bg-white text-ink",
                  !complete && !isActive && "bg-white/10 text-white/60",
                )}
              >
                {complete ? <IconCheck className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn("font-medium text-sm", isActive || complete ? "text-white" : "text-white/60")}>
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div
        key={active}
        className="relative mt-auto max-w-md space-y-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500"
      >
        <p className="font-medium text-header text-sm">{step.kicker}</p>
        <h2 className="font-semibold text-3xl leading-tight tracking-tight xl:text-[2.5rem]">{step.title}</h2>
        <p className="text-white/75">{step.text}</p>
      </div>
    </aside>
  );
}

export function ProgressHeader({ index, done }: Readonly<{ index: number; done: boolean }>) {
  const position = done ? STEPS.length : index + 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 text-sm">
        <p>
          <span className="font-semibold">{done ? "Inscription terminée" : `Étape ${position}`}</span>
          {!done && <span className="text-muted-foreground"> sur {STEPS.length} · {STEPS[index].label}</span>}
        </p>
        {!done && (
          <p className="text-muted-foreground">
            <span className="hidden sm:inline">Déjà un compte ? </span>
            <Link href="/auth/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
              Se connecter
            </Link>
          </p>
        )}
      </div>
      <div aria-hidden className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <span key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-page">
            <span
              className="block h-full rounded-full bg-ink transition-[width] duration-500 ease-out"
              style={{ width: i < position ? "100%" : "0%" }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
