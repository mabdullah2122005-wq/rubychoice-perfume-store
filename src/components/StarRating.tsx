"use client";

type Props = {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
};

export default function StarRating({ value, onChange, size = 16 }: Props) {
  const interactive = Boolean(onChange);
  return (
    <div className="flex items-center gap-0.5" role={interactive ? "radiogroup" : undefined} aria-label={interactive ? "Rating" : `Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        const star_ = (
          <svg
            key={star}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? "var(--color-gold)" : "none"}
            stroke="var(--color-gold)"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6-5.4-2.9L6.6 19.7l1.1-6L3.2 9.4l6.1-.8L12 3z" />
          </svg>
        );
        if (!interactive) return star_;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            role="radio"
            aria-checked={star === Math.round(value)}
            className="transition hover:scale-110"
          >
            {star_}
          </button>
        );
      })}
    </div>
  );
}
