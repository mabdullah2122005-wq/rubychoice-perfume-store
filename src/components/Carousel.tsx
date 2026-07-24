"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";

/**
 * Horizontal slider built on native CSS scroll-snap: buttery touch swiping
 * on mobile (with edge-to-edge bleed), arrow buttons on desktop, no library.
 * Item widths are controlled by the caller via `itemClassName`.
 */
export default function Carousel({
  children,
  label,
  itemClassName,
}: {
  children: React.ReactNode;
  label: string;
  itemClassName: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  function slide(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? ("auto" as const)
      : ("smooth" as const);
    el.scrollBy({ left: direction * Math.round(el.clientWidth * 0.9), behavior });
  }

  const arrowClass =
    "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-parchment bg-surface text-ink shadow-lg shadow-black/10 transition hover:bg-ink hover:text-cream md:flex";

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={update}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0"
      >
        {Children.map(children, (child) => (
          // items-stretch on the track + h-full on the child = equal-height cards
          <div className={`flex shrink-0 snap-start ${itemClassName} [&>*]:w-full`}>{child}</div>
        ))}
      </div>

      {canPrev && (
        <button
          type="button"
          onClick={() => slide(-1)}
          aria-label={`${label}: scroll back`}
          className={`${arrowClass} -left-4`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      )}
      {canNext && (
        <button
          type="button"
          onClick={() => slide(1)}
          aria-label={`${label}: scroll forward`}
          className={`${arrowClass} -right-4`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      )}
    </div>
  );
}
