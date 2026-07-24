"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  image: string;
  sizeMl: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  /** True while the slide-out cart drawer is visible. */
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "rubychoice-cart-v1";
const MAX_QTY = 10;

// A cart line is a product at a specific size — so 5 ml and 30 ml of the same
// perfume are two separate lines.
export function cartLineId(item: { id: string; sizeMl: number }): string {
  return `${item.id}:${item.sizeMl}`;
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (i) =>
          i &&
          typeof i.id === "string" &&
          typeof i.priceCents === "number" &&
          typeof i.quantity === "number"
      )
      .slice(0, 20);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage full/unavailable — cart still works in memory
    }
  }, [items, hydrated]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find(
          (i) => i.id === item.id && i.sizeMl === item.sizeMl
        );
        if (existing) {
          return prev.map((i) =>
            i.id === item.id && i.sizeMl === item.sizeMl
              ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + quantity) }
              : i
          );
        }
        return [...prev, { ...item, quantity: Math.min(MAX_QTY, quantity) }];
      });
      // Adding to cart slides the drawer open so the shopper sees it landed.
      setIsOpen(true);
    },
    []
  );

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => cartLineId(i) !== lineId)
        : prev.map((i) =>
            cartLineId(i) === lineId ? { ...i, quantity: Math.min(MAX_QTY, quantity) } : i
          )
    );
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => prev.filter((i) => cartLineId(i) !== lineId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotalCents = items.reduce(
      (sum, i) => sum + i.priceCents * i.quantity,
      0
    );
    return {
      items,
      count,
      subtotalCents,
      isOpen,
      openCart,
      closeCart,
      addItem,
      setQuantity,
      removeItem,
      clear,
    };
  }, [items, isOpen, openCart, closeCart, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
