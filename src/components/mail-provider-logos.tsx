import type { SVGProps } from "react";

import { cn } from "#/lib/utils";

/** Gmail's « M », in its own colours. */
export function GmailLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="52 42 88 66" aria-hidden {...props}>
      <path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6" />
      <path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15" />
      <path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2" />
      <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
      <path fill="#c5221f" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2" />
    </svg>
  );
}

/** Outlook's envelope and « O », in its own blues. */
export function OutlookLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden {...props}>
      <rect x="11" y="5" width="19" height="22" rx="2.5" fill="#0364b8" />
      <path fill="#28a8ea" d="M11 7.5A2.5 2.5 0 0 1 13.5 5h14A2.5 2.5 0 0 1 30 7.5V13l-9.5 6-9.5-6z" />
      <path fill="#1490df" d="M11 13l9.5 6 9.5-6v11.5a2.5 2.5 0 0 1-2.5 2.5h-14a2.5 2.5 0 0 1-2.5-2.5z" />
      <path fill="#0a2767" opacity=".5" d="M11 13l9.5 6 9.5-6-9.5 8z" />
      <rect x="2" y="8.5" width="15" height="15" rx="2.2" fill="#0f78d4" />
      <ellipse cx="9.5" cy="16" rx="3.6" ry="4.3" fill="none" stroke="#fff" strokeWidth="2.1" />
    </svg>
  );
}

export const PROVIDER_LOGO = { gmail: GmailLogo, outlook: OutlookLogo } as const;

/** A provider's logo on a white tile, so its colours read the same in both themes. */
export function ProviderTile({ provider, className }: Readonly<{ provider: keyof typeof PROVIDER_LOGO; className?: string }>) {
  const Logo = PROVIDER_LOGO[provider];
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl bg-white", className)}>
      <Logo className="size-5" />
    </span>
  );
}
