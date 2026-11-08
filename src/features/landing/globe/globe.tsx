"use client";

import { useEffect, useRef } from "react";
import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from "three";

import type { BusinessCountryName } from "#/lib/api/catalog-server";
import { flagUrl, PLACES } from "./country-places";
import { LAND_DOTS } from "./land-dots";

const OCEAN = 0x17351f;
const LAND = 0xcbffa5;
/** The globe faces Africa: this longitude in front, this latitude level. */
const FRONT_LNG = 17;
const FRONT_LAT = 2;

/** A point on the unit sphere (three's axes: y up, +z towards the camera). */
function toVector(lat: number, lng: number, radius = 1): Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}

/** A soft round dot, so the land reads as dots and not squares. */
function dotTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, Math.PI * 2);
    ctx.fill();
  }
  return new CanvasTexture(canvas);
}

/**
 * The countries Rabotka Business is open in, as flags on a dotted globe that
 * sways around Africa (and turns under a drag). WebGL for the globe; the flags
 * are plain images laid over it, placed each frame, faded when they turn away.
 * Still under « reduce motion », paused off screen. Decorative: the list
 * beside it says the same.
 */
export default function Globe({ countries }: Readonly<{ countries: BusinessCountryName[] }>) {
  const box = useRef<HTMLDivElement>(null);
  const flags = useRef<(HTMLSpanElement | null)[]>([]);
  const pinned = countries.filter((c) => PLACES[c.code]);

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // No WebGL: the flags list beside it is enough.
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    host.prepend(renderer.domElement);
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;touch-action:pan-y;cursor:grab";

    const scene = new Scene();
    const camera = new PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 3.9);

    const tilt = new Group();
    const spin = new Group();
    tilt.rotation.x = (FRONT_LAT * Math.PI) / 180;
    tilt.add(spin);
    scene.add(tilt);
    // The turn that brings FRONT_LNG to the front.
    const front = toVector(0, FRONT_LNG);
    const base = -Math.atan2(front.x, front.z);

    const ocean = new SphereGeometry(1, 64, 64);
    const oceanMaterial = new MeshBasicMaterial({ color: OCEAN });
    spin.add(new Mesh(ocean, oceanMaterial));

    const positions: number[] = [];
    for (let i = 0; i < LAND_DOTS.length; i += 2) {
      const v = toVector(LAND_DOTS[i], LAND_DOTS[i + 1], 1.003);
      positions.push(v.x, v.y, v.z);
    }
    const land = new BufferGeometry();
    land.setAttribute("position", new Float32BufferAttribute(positions, 3));
    const dot = dotTexture();
    const landMaterial = new PointsMaterial({
      color: LAND,
      size: 0.024,
      map: dot,
      transparent: true,
      alphaTest: 0.4,
      opacity: 1,
    });
    spin.add(new Points(land, landMaterial));

    const anchors = pinned.map((c) => toVector(PLACES[c.code].lat, PLACES[c.code].lng, 1.01));
    const world = new Vector3();
    let width = 0;
    let height = 0;

    const resize = () => {
      width = host.clientWidth;
      height = host.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const sizer = new ResizeObserver(resize);
    sizer.observe(host);

    // A drag turns it; let go and it eases back to Africa.
    let drag = 0;
    let dragging = false;
    let lastX = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      renderer.domElement.setPointerCapture(e.pointerId);
      renderer.domElement.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      drag += ((e.clientX - lastX) / Math.max(width, 1)) * Math.PI;
      lastX = e.clientX;
      if (still) draw(0);
    };
    const onUp = () => {
      dragging = false;
      renderer.domElement.style.cursor = "grab";
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = (t: number) => {
      if (!dragging && !still) drag *= 0.97;
      spin.rotation.y = base + (still ? 0 : Math.sin(t / 7000) * 0.42) + drag;
      scene.updateMatrixWorld();
      renderer.render(scene, camera);
      anchors.forEach((anchor, i) => {
        const el = flags.current[i];
        if (!el) return;
        world.copy(anchor).applyMatrix4(spin.matrixWorld);
        // Facing the camera: fully there; turning away: fading; behind: gone.
        const facing = world.z;
        world.project(camera);
        const x = ((world.x + 1) / 2) * width;
        const y = ((1 - world.y) / 2) * height;
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
        el.style.opacity = String(Math.max(0, Math.min(1, (facing - 0.15) / 0.25)));
        el.style.visibility = facing > 0.15 ? "visible" : "hidden";
      });
    };

    let frame = 0;
    let running = false;
    const loop = (t: number) => {
      draw(t);
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || still) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };
    draw(0);
    const seen = new IntersectionObserver(([entry]) => (entry?.isIntersecting ? start() : stop()));
    seen.observe(host);

    return () => {
      stop();
      seen.disconnect();
      sizer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointercancel", onUp);
      ocean.dispose();
      oceanMaterial.dispose();
      land.dispose();
      landMaterial.dispose();
      dot.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // The pins are laid out once per list of countries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinned.map((c) => c.code).join()]);

  return (
    <div ref={box} aria-hidden className="relative aspect-square w-full select-none">
      {pinned.map((c, i) => (
        <span
          key={c.code}
          ref={(el) => {
            flags.current[i] = el;
          }}
          className="group pointer-events-auto absolute top-0 left-0 opacity-0"
          title={c.name}
        >
          {/* A flag from flagcdn: nothing next/image could do better at this size. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flagUrl(c.code, 80)}
            alt=""
            className="size-4 rounded-full object-cover shadow-[0_0_0_1.5px_#0f2414,0_0_0_3px_#cbffa5] transition-transform group-hover:scale-125 sm:size-6 sm:shadow-[0_0_0_2px_#0f2414,0_0_0_3.5px_#cbffa5]"
          />
          <span className="-translate-x-1/2 pointer-events-none absolute top-full left-1/2 mt-1.5 whitespace-nowrap rounded-full bg-white px-2 py-0.5 font-medium text-[#0f2414] text-[11px] opacity-0 transition-opacity group-hover:opacity-100">
            {c.name}
          </span>
        </span>
      ))}
    </div>
  );
}
