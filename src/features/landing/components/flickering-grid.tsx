"use client";

import { useEffect, useRef } from "react";

import { cn } from "#/lib/utils";

type Props = {
  className?: string;
  /** One square's side, in CSS pixels. */
  squareSize?: number;
  gridGap?: number;
  /** Any CSS colour the canvas understands (hex or rgb). */
  color?: string;
  maxOpacity?: number;
  /** Chance a square changes its opacity, per second. */
  flickerChance?: number;
};

/**
 * A grid of small squares whose opacity flickers at random, drawn on a canvas
 * that fills its parent. It only runs while on screen; still (one random
 * frame) for those who reduce motion.
 */
export function FlickeringGrid({
  className,
  squareSize = 4,
  gridGap = 6,
  color = "#ffffff",
  maxOpacity = 0.3,
  flickerChance = 0.3,
}: Readonly<Props>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cols = 0;
    let rows = 0;
    let opacities = new Float32Array(0);
    let dpr = 1;

    const setup = () => {
      const { width, height } = canvas.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      cols = Math.ceil(width / (squareSize + gridGap));
      rows = Math.ceil(height / (squareSize + gridGap));
      opacities = Float32Array.from({ length: cols * rows }, () => Math.random() * maxOpacity);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;
      const step = (squareSize + gridGap) * dpr;
      const side = squareSize * dpr;
      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          ctx.globalAlpha = opacities[x * rows + y];
          ctx.fillRect(x * step, y * step, side, side);
        }
      }
      ctx.globalAlpha = 1;
    };

    setup();
    draw();

    let frame = 0;
    let last = 0;
    let visible = false;
    const tick = (time: number) => {
      const dt = last ? (time - last) / 1000 : 0;
      last = time;
      for (let i = 0; i < opacities.length; i++) {
        if (Math.random() < flickerChance * dt) opacities[i] = Math.random() * maxOpacity;
      }
      draw();
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (still || frame) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    seen.observe(canvas);
    const resize = new ResizeObserver(() => {
      setup();
      draw();
    });
    resize.observe(canvas);

    return () => {
      stop();
      seen.disconnect();
      resize.disconnect();
    };
  }, [squareSize, gridGap, color, maxOpacity, flickerChance]);

  return <canvas ref={canvasRef} aria-hidden className={cn("pointer-events-none size-full", className)} />;
}
