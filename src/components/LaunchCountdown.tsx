"use client";

import { useEffect, useState } from "react";

function parts(msLeft: number) {
  const s = Math.max(0, Math.floor(msLeft / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export default function LaunchCountdown({ target }: { target: string }) {
  // Computed only after mount so server and client HTML always match.
  const [left, setLeft] = useState<ReturnType<typeof parts> | null>(null);

  useEffect(() => {
    const targetMs = new Date(target).getTime();
    const tick = () => setLeft(parts(targetMs - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [target]);

  const cells = [
    { label: "Days", value: left?.days },
    { label: "Hours", value: left?.hours },
    { label: "Minutes", value: left?.minutes },
    { label: "Seconds", value: left?.seconds },
  ];

  return (
    <div className="flex justify-center gap-3 sm:gap-4" aria-label="Time until launch">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="w-16 rounded-2xl border border-parchment bg-surface py-3 sm:w-20 sm:py-4"
        >
          <p className="font-serif text-2xl tabular-nums sm:text-3xl">
            {cell.value === undefined ? "—" : String(cell.value).padStart(2, "0")}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            {cell.label}
          </p>
        </div>
      ))}
    </div>
  );
}
