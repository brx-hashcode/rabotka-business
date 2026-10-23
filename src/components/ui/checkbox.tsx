"use client";

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "#/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // Outline drawn as an inset shadow so it reads on the grey page as on
        // white; ticked, it fills with the header's near-black (as the mockup).
        "peer size-4.5 shrink-0 cursor-pointer rounded-[5px] bg-card text-white shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--foreground)_28%,transparent)] transition-[background-color,box-shadow] outline-none hover:shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--foreground)_50%,transparent)] focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=checked]:bg-ink data-[state=checked]:shadow-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
