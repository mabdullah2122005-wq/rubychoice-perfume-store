"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Root error boundary. Catches uncaught errors in any page or layout so
 * users never see a blank screen, and tells us about them in the console.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to whatever monitoring Vercel captures via the browser;
    // also logs to server console in dev because of "use client" boundaries.
    console.error("[app/error.tsx]", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="text-xs uppercase tracking-[0.3em] text-wine">Something went wrong</p>
      <h1 className="mt-3 font-serif text-3xl sm:text-4xl">
        We couldn&apos;t load this page
      </h1>
      <p className="mt-3 text-sm text-ink-soft">
        The issue has been logged. Try again, or head back to the shop while we sort it out.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-ink-soft">ref: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/shop" className="btn-outline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
