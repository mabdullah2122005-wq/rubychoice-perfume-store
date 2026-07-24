"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";

/** Empties the local cart once after a completed checkout. */
export default function ClearCartOnSuccess() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
