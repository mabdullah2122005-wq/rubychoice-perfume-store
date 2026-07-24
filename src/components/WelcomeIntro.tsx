"use client";

import { useCallback, useEffect, useState } from "react";
import { site } from "@/lib/site";

const SEEN_KEY = "rc_seen";

// Brief branded welcome — shown once per browser session so every later page
// loads instantly. Server-rendered so it covers the page from the first paint
// (a pre-paint script in the layout hides it on repeat visits, no flash).
export default function WelcomeIntro() {
  const [show, setShow] = useState(true);

  const dismiss = useCallback(() => {
    setShow(false);
    document.documentElement.style.overflow = "";
  }, []);

  useEffect(() => {
    let seen = false;
    try {
      seen = Boolean(sessionStorage.getItem(SEEN_KEY));
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // no sessionStorage — treat as first visit
    }
    // Already welcomed this session → don't block, remove immediately.
    if (seen) {
      setShow(false);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.style.overflow = "hidden";
    const timer = setTimeout(dismiss, reduce ? 600 : 2000);
    return () => {
      clearTimeout(timer);
      document.documentElement.style.overflow = "";
    };
  }, [dismiss]);

  if (!show) return null;

  return (
    <div className="welcome-overlay" role="presentation" onClick={dismiss}>
      <div className="welcome-inner">
        <p className="welcome-brand font-serif">{site.name.toUpperCase()}</p>
        <span className="welcome-rule" aria-hidden />
        <p className="welcome-tag">Maison de parfum · Pakistan</p>
      </div>
    </div>
  );
}
