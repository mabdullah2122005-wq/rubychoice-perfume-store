"use client";

import { useFavourites, type FavouriteItem } from "./FavouritesProvider";

function Heart({ filled, size = 18 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "var(--color-wine)" : "none"}
      stroke={filled ? "var(--color-wine)" : "currentColor"}
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M12 21s-7.5-4.7-9.7-9.2C.8 8.6 2.8 5 6.4 5c2.2 0 3.7 1.2 5.6 3.4C13.9 6.2 15.4 5 17.6 5c3.6 0 5.6 3.6 4.1 6.8C19.5 16.3 12 21 12 21z" />
    </svg>
  );
}

/**
 * Heart toggle backed by the local favourites list — no login required.
 * `variant="icon"` is a compact round button for product cards; `"full"` is a
 * bordered button for the product detail page.
 */
export default function FavouriteButton({
  product,
  variant = "icon",
}: {
  product: FavouriteItem;
  variant?: "icon" | "full";
}) {
  const { isFavourite, toggle } = useFavourites();
  const active = isFavourite(product.id);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(product);
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={active ? "Remove from favourites" : "Add to favourites"}
        className="flex items-center justify-center rounded-full border border-parchment bg-surface px-4 transition hover:border-gold"
      >
        <Heart filled={active} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? "Remove from favourites" : "Add to favourites"}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-parchment bg-cream/90 text-ink-soft shadow-sm backdrop-blur transition hover:border-wine hover:text-wine"
    >
      <Heart filled={active} size={16} />
    </button>
  );
}
