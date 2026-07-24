"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// A device-local favourites list — works without an account, mirroring the
// cart. Stores just enough to render a card and count the badge.
export type FavouriteItem = {
  id: string;
  slug: string;
  name: string;
  image: string;
  priceCents: number;
  sizeMl: number;
};

type FavouritesContextValue = {
  favourites: FavouriteItem[];
  count: number;
  isFavourite: (id: string) => boolean;
  toggle: (item: FavouriteItem) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const FavouritesContext = createContext<FavouritesContextValue | null>(null);
const STORAGE_KEY = "rubychoice-favourites-v1";
const MAX = 100;

function load(): FavouriteItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (i) =>
          i &&
          typeof i.id === "string" &&
          typeof i.slug === "string" &&
          typeof i.priceCents === "number"
      )
      .slice(0, MAX);
  } catch {
    return [];
  }
}

export function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFavourites(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favourites));
    } catch {
      // storage unavailable — favourites still work in memory this session
    }
  }, [favourites, hydrated]);

  const toggle = useCallback((item: FavouriteItem) => {
    setFavourites((prev) =>
      prev.some((f) => f.id === item.id)
        ? prev.filter((f) => f.id !== item.id)
        : [item, ...prev].slice(0, MAX)
    );
  }, []);

  const remove = useCallback((id: string) => {
    setFavourites((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clear = useCallback(() => setFavourites([]), []);

  const value = useMemo<FavouritesContextValue>(() => {
    const ids = new Set(favourites.map((f) => f.id));
    return {
      favourites,
      count: favourites.length,
      isFavourite: (id: string) => ids.has(id),
      toggle,
      remove,
      clear,
    };
  }, [favourites, toggle, remove, clear]);

  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export function useFavourites(): FavouritesContextValue {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error("useFavourites must be used within FavouritesProvider");
  return ctx;
}
