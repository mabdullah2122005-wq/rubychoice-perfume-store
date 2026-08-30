"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Toast = {
  id: number;
  kind: "success" | "error" | "info";
  message: string;
};

type ToastContextValue = {
  toast: (kind: Toast["kind"], message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Minimal toast layer used by client components.
 * - Fires a transient banner in the bottom-right.
 * - Auto-dismiss after 3.5s, also dismissible by click.
 *
 * Compared to a library this is ~70 lines, zero deps, and matches the
 * monochrome theme without extra CSS.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>(
    (kind, message) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, kind, message }]);
      // Auto-dismiss after 3.5s
      setTimeout(() => remove(id), 3500);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-xs flex-col gap-2"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    // enter animation on next tick
    requestAnimationFrame(() => setShow(true));
  }, []);

  const palette =
    toast.kind === "success"
      ? "border-ink/20 bg-ink text-cream"
      : toast.kind === "error"
      ? "border-wine/40 bg-wine/10 text-wine"
      : "border-parchment bg-surface text-ink";

  return (
    <button
      type="button"
      onClick={onDismiss}
      className={`pointer-events-auto rounded-full border px-4 py-2 text-left text-sm shadow-md transition ${palette} ${
        show ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      {toast.message}
    </button>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Helpful during dev — surfaces accidentally using the hook outside the
    // provider rather than silently failing.
    if (typeof window !== "undefined") {
      console.warn("useToast called outside <ToastProvider>");
    }
    return { toast: () => {} };
  }
  return ctx;
}
