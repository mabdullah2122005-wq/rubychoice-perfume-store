"use client";

import { useCart } from "./CartProvider";
import { site } from "@/lib/site";
import { formatPrice } from "@/lib/format";

// A progress line that shifts colour as the cart grows — warm when far,
// turning green the moment free delivery (over Rs 5,000) is unlocked.
export default function FreeShippingBar({ compact = false }: { compact?: boolean }) {
  const { subtotalCents } = useCart();
  const threshold = site.freeShippingThresholdCents;
  const progress = threshold > 0 ? Math.min(1, subtotalCents / threshold) : 1;
  const pct = Math.round(progress * 100);
  const reached = subtotalCents >= threshold;
  const remaining = Math.max(0, threshold - subtotalCents);

  // Hue travels from warm amber (~30°) to fresh green (~142°) as it fills.
  const hue = 30 + progress * 112;
  const fillColor = reached ? "hsl(142 60% 41%)" : `hsl(${hue} 72% 47%)`;

  return (
    <div className={compact ? "" : "rounded-2xl border border-parchment bg-surface p-4"}>
      <div className="flex items-center justify-between gap-3">
        <p className={`${compact ? "text-xs" : "text-sm"} font-medium`}>
          {reached ? (
            <span style={{ color: "hsl(142 55% 34%)" }}>
              ✓ Free delivery unlocked — enjoy!
            </span>
          ) : (
            <span className="text-ink">
              You&apos;re{" "}
              <span className="font-semibold" style={{ color: fillColor }}>
                {formatPrice(remaining)}
              </span>{" "}
              away from <span className="whitespace-nowrap">free delivery</span>
            </span>
          )}
        </p>
        {!compact && (
          <span className="shrink-0 text-xs tabular-nums text-ink-soft">{pct}%</span>
        )}
      </div>

      <div
        className={`mt-2 overflow-hidden rounded-full bg-parchment ${compact ? "h-1.5" : "h-2.5"}`}
        role="progressbar"
        aria-label="Progress towards free delivery"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.max(pct, subtotalCents > 0 ? 6 : 0)}%`,
            backgroundColor: fillColor,
            boxShadow: `0 0 10px ${fillColor}66`,
          }}
        />
      </div>

      {!compact && !reached && (
        <p className="mt-2 text-[11px] text-ink-soft">
          Free delivery on Cash-on-Delivery orders over {formatPrice(threshold)} —
          or pay online (card / PayFast / bank) and delivery is always free.
        </p>
      )}
    </div>
  );
}
