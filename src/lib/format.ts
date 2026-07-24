// Amounts are stored in paisa (1/100 PKR) to keep integer math; retail
// prices are shown as whole rupees.
const pkr = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

export function formatPrice(cents: number): string {
  return pkr.format(Math.round(cents / 100));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Short, human-facing order id shown to customers (e.g. "RC-10042"). The
// database keeps a long unguessable id internally; this is what people quote.
const ORDER_NUMBER_BASE = 10000;

export function formatOrderNumber(orderNumber: number): string {
  return `RC-${ORDER_NUMBER_BASE + orderNumber}`;
}

/** Parses whatever a customer types ("RC-10042", "10042", "#10042", "42"). */
export function parseOrderNumber(input: string): number | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;
  const n = Number(digits);
  if (!Number.isFinite(n)) return null;
  // Accept the displayed number or the raw sequence value.
  const raw = n > ORDER_NUMBER_BASE ? n - ORDER_NUMBER_BASE : n;
  return raw > 0 ? raw : null;
}

/**
 * Reassuring delivery estimate — 3 to 6 days out (dispatch + 2–4 day transit),
 * shown like other brands ("Est. delivery: 8–11 July").
 */
export function estimatedDelivery(createdAt: Date | string): string {
  const base = new Date(createdAt);
  const min = new Date(base);
  min.setDate(min.getDate() + 3);
  const max = new Date(base);
  max.setDate(max.getDate() + 6);
  const sameMonth = min.getMonth() === max.getMonth();
  const day = (d: Date) => d.getDate();
  const monthYear = (d: Date) =>
    d.toLocaleDateString("en-PK", { month: "long", year: "numeric" });
  return sameMonth
    ? `${day(min)}–${day(max)} ${monthYear(max)}`
    : `${day(min)} ${min.toLocaleDateString("en-PK", { month: "short" })} – ${day(max)} ${max.toLocaleDateString("en-PK", { month: "short" })} ${max.getFullYear()}`;
}
