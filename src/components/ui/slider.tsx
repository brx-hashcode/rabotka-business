"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";

import { cn } from "#/lib/utils";

/** Range slider; one thumb per value in `value` / `defaultValue`. */
function Slider({
  className,
  value,
  defaultValue,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const thumbs = (value ?? defaultValue ?? [0]).length;

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      value={value}
      defaultValue={defaultValue}
      className={cn(
        "relative flex w-full touch-none select-none items-center py-2 data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-muted">
        <SliderPrimitive.Range className="absolute h-full bg-foreground" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbs }, (_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className="block size-4 rounded-full bg-foreground shadow-sm ring-offset-background transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-110"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
