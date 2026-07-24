"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const AUTOPLAY_MS = 6000;

const slides = [
  {
    image: "/products/photos/bois-fume.jpg",
    eyebrow: "Rare naturals",
    title: "Composed from whole flowers, not formulas",
    text: "We buy named-farm florals and resins and macerate every blend for six weeks — depth you can smell.",
    cta: { label: "Shop the collection", href: "/shop" },
  },
  {
    image: "/products/photos/aurore.jpg",
    eyebrow: "Bottled by hand",
    title: "Small batches, filled and wax-stamped in our atelier",
    text: "The juice you receive is months old, not years. Every flacon is finished by hand in our atelier.",
    cta: { label: "Our story", href: "/about" },
  },
  {
    image: "/products/photos/mitti-attar.jpg",
    eyebrow: "Heritage attars",
    title: "Traditional alcohol-free oils, the old way",
    text: "From mitti to desi gulab — concentrated attars that wear close to the skin, all day long.",
    cta: { label: "Explore attars", href: "/shop?type=Attar+Oil" },
  },
  {
    image: "/products/photos/noir-oud.jpg",
    eyebrow: "Honest luxury",
    title: "Cash on Delivery, nationwide",
    text: "Free shipping over Rs 5,000 and delivery in 2–4 working days. Luxury should never feel risky.",
    cta: { label: "Start shopping", href: "/shop" },
  },
];

export default function StorySlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [dragX, setDragX] = useState<number | null>(null);
  const drag = useRef<{ pointerId: number; startX: number } | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const last = slides.length - 1;

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || dragX !== null) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, reducedMotion, dragX]);

  function onDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("a,button")) return;
    drag.current = { pointerId: e.pointerId, startX: e.clientX };
    frame.current?.setPointerCapture(e.pointerId);
    setDragX(0);
  }
  function onMove(e: React.PointerEvent) {
    if (!drag.current || e.pointerId !== drag.current.pointerId) return;
    let d = e.clientX - drag.current.startX;
    if ((index === 0 && d > 0) || (index === last && d < 0)) d *= 0.3;
    setDragX(d);
  }
  function onUp(e: React.PointerEvent) {
    if (!drag.current || e.pointerId !== drag.current.pointerId) return;
    const width = frame.current?.clientWidth ?? 1;
    const d = e.clientX - drag.current.startX;
    const threshold = Math.min(80, width * 0.12);
    if (d <= -threshold && index < last) setIndex(index + 1);
    else if (d >= threshold && index > 0) setIndex(index - 1);
    drag.current = null;
    setDragX(null);
  }

  const dragging = dragX !== null;

  return (
    <section
      ref={frame}
      aria-roledescription="carousel"
      aria-label="What sets Ruby Choice apart"
      className={`relative touch-pan-y select-none overflow-hidden ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div
        className="flex"
        style={{
          transform: `translateX(calc(-${index * 100}% + ${dragX ?? 0}px))`,
          transition: dragging || reducedMotion ? "none" : "transform 700ms cubic-bezier(0.33,1,0.68,1)",
        }}
      >
        {slides.map((slide, i) => (
          <div key={slide.eyebrow} className="relative h-[400px] w-full shrink-0 sm:h-[460px]">
            <Image
              src={slide.image}
              alt=""
              fill
              sizes="100vw"
              draggable={false}
              className="object-cover"
              aria-hidden={i !== index}
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20" />
            <div className="relative mx-auto flex h-full max-w-6xl items-center px-6 sm:px-10">
              <div className="max-w-lg text-cream">
                <p className="text-xs uppercase tracking-[0.3em] text-cream/80">{slide.eyebrow}</p>
                <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl md:text-5xl">
                  {slide.title}
                </h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/85 sm:text-base">
                  {slide.text}
                </p>
                <Link
                  href={slide.cta.href}
                  className="mt-6 inline-block rounded-full bg-cream px-6 py-3 text-xs font-medium uppercase tracking-[0.18em] text-ink transition hover:bg-white"
                >
                  {slide.cta.label}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.eyebrow}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1} of ${slides.length}`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-cream" : "w-2 bg-cream/50 hover:bg-cream/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
