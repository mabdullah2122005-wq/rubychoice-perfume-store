"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const AUTOPLAY_MS = 5000;

/**
 * Auto-playing hero slider. Slides by finger-swipe on touch screens and by
 * cursor drag on desktop (pointer events + live translateX), snaps smoothly
 * on release, has dot navigation, pauses while interacting, and respects
 * prefers-reduced-motion.
 */
export default function HeroSlider({
  slides,
}: {
  slides: { src: string; alt: string }[];
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [dragX, setDragX] = useState<number | null>(null);
  const dragState = useRef<{ pointerId: number; startX: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const last = slides.length - 1;

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || dragX !== null || slides.length < 2) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      AUTOPLAY_MS
    );
    return () => clearInterval(timer);
  }, [paused, reducedMotion, dragX, slides.length]);

  function onPointerDown(e: React.PointerEvent) {
    // Dots and their container handle their own clicks.
    if ((e.target as HTMLElement).closest("button")) return;
    dragState.current = { pointerId: e.pointerId, startX: e.clientX };
    frameRef.current?.setPointerCapture(e.pointerId);
    setDragX(0);
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragState.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    let delta = e.clientX - drag.startX;
    // Rubber-band resistance past the first/last slide.
    if ((index === 0 && delta > 0) || (index === last && delta < 0)) {
      delta *= 0.3;
    }
    setDragX(delta);
  }

  function onPointerEnd(e: React.PointerEvent) {
    const drag = dragState.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    dragState.current = null;
    const width = frameRef.current?.clientWidth ?? 1;
    const delta = e.clientX - drag.startX;
    const threshold = Math.min(60, width * 0.15);
    if (delta <= -threshold && index < last) setIndex(index + 1);
    else if (delta >= threshold && index > 0) setIndex(index - 1);
    setDragX(null);
  }

  const dragging = dragX !== null;

  return (
    <div
      ref={frameRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Ruby Choice imagery"
      className={`relative touch-pan-y select-none overflow-hidden rounded-3xl border border-parchment shadow-2xl shadow-black/15 ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <div
        className="flex"
        style={{
          transform: `translateX(calc(-${index * 100}% + ${dragX ?? 0}px))`,
          transition:
            dragging || reducedMotion
              ? "none"
              : "transform 700ms cubic-bezier(0.33, 1, 0.68, 1)",
        }}
      >
        {slides.map((slide, i) => (
          <div key={slide.src} className="relative aspect-[4/5] w-full shrink-0">
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              preload={i === 0}
              sizes="(max-width: 640px) 88vw, (max-width: 768px) 384px, 448px"
              draggable={false}
              className="object-cover"
              aria-hidden={i !== index}
            />
          </div>
        ))}
      </div>

      {/* soft base gradient so the dots stay visible over bright photos */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to image ${i + 1} of ${slides.length}`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-white" : "w-2 bg-white/55 hover:bg-white/90"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
