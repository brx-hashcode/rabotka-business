import Image from "next/image";

import { cn } from "#/lib/utils";


export function BrandLoader({ className }: Readonly<{ className?: string }>) {
  return (
    <div aria-hidden className={cn("flex flex-col items-center gap-5", className)}>
      <span className="relative flex size-20 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-white/70 motion-safe:animate-ping [animation-duration:1.6s]" />
        <span className="relative flex size-20 items-center justify-center rounded-full bg-white">
          <Image
            src="/rabotka-logo.png"
            alt=""
            width={48}
            height={48}
            unoptimized
            priority
            className="size-12 object-contain"
          />
        </span>
      </span>
      <span className="flex flex-col items-center gap-1 leading-none">
        <span className="font-bold font-display text-2xl text-header-foreground">Rabotka</span>
        <span className="text-header-muted text-xs">Job Matching</span>
      </span>
      <span className="h-1 w-28 overflow-hidden rounded-full bg-header-foreground/10">
        <span className="loader-sweep block h-full w-2/5 rounded-full bg-header-foreground/70" />
      </span>
    </div>
  );
}
