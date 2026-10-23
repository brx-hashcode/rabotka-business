"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

import { cn } from "#/lib/utils";

export const CODE_LENGTH = 6;

/**
 * Six boxes for a 6-digit code: one digit each, focus moving on as you type,
 * back on Backspace, and a pasted code filling them all. `value` is the code
 * as typed so far, gaps as spaces.
 */
export function CodeInput({
  value,
  onChange,
  disabled,
  autoFocus = true,
  boxClassName,
}: Readonly<{
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  /** For a tinted background, where the default page-grey boxes vanish. */
  boxClassName?: string;
}>) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: CODE_LENGTH }, (_, i) => value[i]?.trim() ?? "");

  function setAt(index: number, char: string) {
    onChange(digits.map((d, i) => (i === index ? char || " " : d || " ")).join(""));
  }

  function onType(index: number, raw: string) {
    const char = raw.replace(/\D/g, "").slice(-1);
    setAt(index, char);
    if (char && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted.padEnd(CODE_LENGTH, " "));
    inputs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  return (
    <div className="flex gap-2 sm:gap-2.5">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputs.current[i] = el;
          }}
          value={digit}
          onChange={(e) => onType(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && i === 0}
          maxLength={1}
          aria-label={`Chiffre ${i + 1}`}
          disabled={disabled}
          className={cn(
            "size-12 shrink-0 rounded-xl bg-page text-center font-semibold text-lg outline-none transition-shadow sm:size-14 sm:text-xl",
            "focus-visible:ring-2 focus-visible:ring-whatsapp/40",
            boxClassName,
          )}
        />
      ))}
    </div>
  );
}

/** The digits of a code typed in CodeInput, or null while incomplete. */
export function completeCode(value: string): string | null {
  const code = value.replace(/\s/g, "");
  return code.length === CODE_LENGTH ? code : null;
}
