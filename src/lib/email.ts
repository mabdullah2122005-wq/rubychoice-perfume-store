import { db } from "./db";
import { site } from "./site";
import { formatPrice, formatOrderNumber } from "./format";

// Transactional email via Resend's REST API (no SDK needed).
// Without RESEND_API_KEY the send becomes a console log, so development and
// unconfigured deployments never break — checkout must not depend on email.

export type EmailOrderItem = { name: string; quantity: number; priceCents: number };

export type EmailOrder = {
  id: string;
  orderNumber: number;
  email: string;
  shippingName: string;
  paymentMethod: string;
  totalCents: number;
  shippingCents: number;
  discountCents: number;
  couponCode: string | null;
  city: string;
  courierName?: string | null;
  trackingNumber?: string | null;
  items: EmailOrderItem[];
};

export type OrderEmailKind = "placed" | "paid" | "shipped" | "delivered";

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function fromAddress(): string {
  return process.env.EMAIL_FROM || `${site.name} <onboarding@resend.dev>`;
}

async function deliver(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email dev-log] to=${to} subject="${subject}" (RESEND_API_KEY not set — not sent)`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: fromAddress(), to: [to], subject, html }),
  });
  if (!res.ok) {
    console.error("email send failed:", res.status, await res.text().catch(() => ""));
  }
}

function shell(heading: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f6f6f4;font-family:Georgia,'Times New Roman',serif;color:#121212;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <p style="text-align:center;letter-spacing:6px;font-size:20px;margin:0 0 4px;">${esc(site.name.toUpperCase())}</p>
    <p style="text-align:center;letter-spacing:3px;font-size:10px;color:#6f6f6a;text-transform:uppercase;margin:0 0 28px;">Maison de parfum · Pakistan</p>
    <div style="background:#ffffff;border:1px solid #e7e5e0;border-radius:16px;padding:28px 24px;">
      <h1 style="font-size:24px;font-weight:normal;margin:0 0 16px;">${heading}</h1>
      ${bodyHtml}
    </div>
    <p style="text-align:center;font-size:12px;color:#6f6f6a;margin:24px 0 0;">
      Questions? WhatsApp us at <a href="https://wa.me/${site.whatsapp.number}" style="color:#121212;">${site.whatsapp.display}</a><br/>
      <a href="${site.url}" style="color:#6f6f6a;">${site.url.replace(/^https?:\/\//, "")}</a>
    </p>
  </div></body></html>`;
}

function itemsTable(order: EmailOrder): string {
  const subtotal = order.totalCents - order.shippingCents + order.discountCents;
  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e7e5e0;font-size:14px;">${esc(item.name)} × ${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e7e5e0;font-size:14px;text-align:right;">${formatPrice(item.priceCents * item.quantity)}</td>
      </tr>`
    )
    .join("");
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:6px 0;font-size:13px;color:${bold ? "#121212" : "#6f6f6a"};${bold ? "font-weight:bold;" : ""}">${label}</td>
     <td style="padding:6px 0;font-size:13px;text-align:right;${bold ? "font-weight:bold;" : ""}">${value}</td></tr>`;
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
    ${rows}
    ${line("Subtotal", formatPrice(subtotal))}
    ${order.discountCents > 0 ? line(`Discount (${esc(order.couponCode ?? "")})`, `−${formatPrice(order.discountCents)}`) : ""}
    ${line("Shipping", order.shippingCents === 0 ? "Free" : formatPrice(order.shippingCents))}
    ${line("Total", formatPrice(order.totalCents), true)}
  </table>`;
}

function trackNote(order: EmailOrder): string {
  return `<p style="font-size:13px;color:#6f6f6a;">Track any time at <a href="${site.url}/track" style="color:#121212;">${site.url.replace(/^https?:\/\//, "")}/track</a> with your order number:<br/><span style="font-family:monospace;font-size:14px;color:#121212;">${formatOrderNumber(order.orderNumber)}</span></p>`;
}

function buildOrderEmail(kind: OrderEmailKind, order: EmailOrder): { subject: string; html: string } {
  const shortId = formatOrderNumber(order.orderNumber);
  const name = esc(order.shippingName.split(" ")[0] || "there");

  if (kind === "placed" && order.paymentMethod === "BANK") {
    return {
      subject: `Order received — transfer details inside (${shortId})`,
      html: shell(
        `Shukriya, ${name} — your order is reserved`,
        `<p style="font-size:14px;line-height:1.6;">We've reserved your bottles. Transfer the total below and we ship the same day the payment clears.</p>
         ${itemsTable(order)}
         <div style="background:#f6f6f4;border-radius:12px;padding:14px 16px;font-size:13px;line-height:1.8;">
           <strong>Bank transfer details</strong><br/>
           Account title: ${esc(site.bank.title)}<br/>
           Bank: ${esc(site.bank.bank)}<br/>
           IBAN: <span style="font-family:monospace;">${esc(site.bank.iban)}</span><br/>
           Reference: <span style="font-family:monospace;">${shortId}</span>
         </div>
         <p style="font-size:13px;line-height:1.6;">Then send the receipt on WhatsApp (<a href="https://wa.me/${site.whatsapp.number}" style="color:#121212;">${site.whatsapp.display}</a>) so we can confirm it faster.</p>
         ${trackNote(order)}`
      ),
    };
  }

  if (kind === "placed") {
    return {
      subject: `Your order is confirmed ✓ (${shortId})`,
      html: shell(
        `Shukriya, ${name} — order confirmed`,
        `<p style="font-size:14px;line-height:1.6;">Your Cash on Delivery order is confirmed and being prepared. Keep <strong>${formatPrice(order.totalCents)}</strong> ready for the rider — our courier will call you before delivery. ${esc(site.deliveryNote)}.</p>
         ${itemsTable(order)}
         ${trackNote(order)}`
      ),
    };
  }

  if (kind === "paid") {
    return {
      subject: `Payment received — we're preparing your order (${shortId})`,
      html: shell(
        `Payment received, ${name}`,
        `<p style="font-size:14px;line-height:1.6;">Your payment is confirmed and your order is now being prepared for dispatch to ${esc(order.city)}. ${esc(site.deliveryNote)}.</p>
         ${itemsTable(order)}
         ${trackNote(order)}`
      ),
    };
  }

  if (kind === "shipped") {
    const courier = order.courierName
      ? `<div style="background:#f6f6f4;border-radius:12px;padding:14px 16px;font-size:13px;line-height:1.8;">
           <strong>Courier:</strong> ${esc(order.courierName)}${
             order.trackingNumber
               ? `<br/><strong>Tracking number:</strong> <span style="font-family:monospace;">${esc(order.trackingNumber)}</span>`
               : ""
           }
         </div>`
      : "";
    return {
      subject: `Your order is on its way 📦 (${shortId})`,
      html: shell(
        `On its way, ${name}!`,
        `<p style="font-size:14px;line-height:1.6;">Your parcel has been handed to the courier and is heading to ${esc(order.city)}. The rider will call your number before delivery${order.paymentMethod === "COD" ? ` — keep <strong>${formatPrice(order.totalCents)}</strong> ready` : ""}.</p>
         ${courier}
         ${itemsTable(order)}
         ${trackNote(order)}`
      ),
    };
  }

  return {
    subject: `Delivered — enjoy! (${shortId})`,
    html: shell(
      `Delivered — enjoy, ${name}`,
      `<p style="font-size:14px;line-height:1.6;">Your order has been delivered. Let it settle on your skin, live with it a few days — and if it moves you, a review on the product page means the world to a small maison.</p>
       <p style="font-size:14px;"><a href="${site.url}/shop" style="color:#121212;">Browse the collection again →</a></p>`
    ),
  };
}

/** Shapes a Prisma order (with items) into the email payload. */
export function toEmailOrder(order: {
  id: string;
  orderNumber: number;
  email: string;
  shippingName: string;
  paymentMethod: string;
  totalCents: number;
  shippingCents: number;
  discountCents: number;
  couponCode: string | null;
  city: string;
  courierName?: string | null;
  trackingNumber?: string | null;
  items: { name: string; quantity: number; priceCents: number }[];
}): EmailOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    email: order.email,
    shippingName: order.shippingName,
    paymentMethod: order.paymentMethod,
    totalCents: order.totalCents,
    shippingCents: order.shippingCents,
    discountCents: order.discountCents,
    couponCode: order.couponCode,
    city: order.city,
    courierName: order.courierName ?? null,
    trackingNumber: order.trackingNumber ?? null,
    items: order.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      priceCents: i.priceCents,
    })),
  };
}

/** Fire-and-forget: never throws, never blocks an order on email problems. */
export async function sendOrderEmail(kind: OrderEmailKind, order: EmailOrder): Promise<void> {
  try {
    const { subject, html } = buildOrderEmail(kind, order);
    await deliver(order.email, subject, html);
  } catch (error) {
    console.error(`order email (${kind}) failed:`, error);
  }
}

/**
 * Loads an order and sends its notification(s). Call inside `after()` so email
 * latency never delays the customer's response. Safe to await — it swallows
 * its own errors.
 */
export async function dispatchOrderEmails(
  orderId: string,
  kind: OrderEmailKind,
  opts?: { alertAdmin?: boolean }
): Promise<void> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: { select: { name: true, quantity: true, priceCents: true } } },
    });
    if (!order) return;
    const payload = toEmailOrder(order);
    await sendOrderEmail(kind, payload);
    if (opts?.alertAdmin) await sendAdminOrderAlert(payload);
  } catch (error) {
    console.error(`dispatchOrderEmails(${kind}) failed:`, error);
  }
}

/** Password-reset link. Never throws. */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  try {
    await deliver(
      to,
      `Reset your ${site.name} password`,
      shell(
        "Reset your password",
        `<p style="font-size:14px;line-height:1.6;">We received a request to reset the password for your ${esc(site.name)} account. Click below to choose a new one — this link expires in 1 hour.</p>
         <p style="margin:22px 0;"><a href="${resetUrl}" style="display:inline-block;background:#121212;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;">Reset password</a></p>
         <p style="font-size:13px;color:#6f6f6a;line-height:1.6;">If you didn't ask for this, you can safely ignore this email — your password won't change. Link not working? Paste this into your browser:<br/><span style="font-size:12px;word-break:break-all;">${esc(resetUrl)}</span></p>`
      )
    );
  } catch (error) {
    console.error("password reset email failed:", error);
  }
}

/** "Back in stock" alert for a single waiting shopper. Never throws. */
export async function sendBackInStockEmail(
  to: string,
  product: { name: string; slug: string; priceCents: number }
): Promise<void> {
  try {
    await deliver(
      to,
      `${product.name} is back in stock`,
      shell(
        `${esc(product.name)} is back`,
        `<p style="font-size:14px;line-height:1.6;">Good news — <strong>${esc(product.name)}</strong> is available again at ${formatPrice(product.priceCents)}. Our batches are small, so grab yours before it sells out again.</p>
         <p style="margin:22px 0;"><a href="${site.url}/product/${esc(product.slug)}" style="display:inline-block;background:#121212;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;">Shop ${esc(product.name)}</a></p>
         <p style="font-size:12px;color:#6f6f6a;">You're receiving this because you asked to be notified when it returned.</p>`
      )
    );
  } catch (error) {
    console.error("back-in-stock email failed:", error);
  }
}

/**
 * Emails everyone waiting on a restocked product, then marks them notified so
 * they're never emailed twice. Call inside `after()`. Never throws.
 */
export async function dispatchBackInStock(productId: string): Promise<void> {
  try {
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { name: true, slug: true, priceCents: true, stock: true },
    });
    if (!product || product.stock <= 0) return;

    const waiting = await db.stockNotification.findMany({
      where: { productId, notifiedAt: null },
      select: { id: true, email: true },
      take: 500,
    });
    if (waiting.length === 0) return;

    for (const row of waiting) {
      await sendBackInStockEmail(row.email, product);
    }
    await db.stockNotification.updateMany({
      where: { id: { in: waiting.map((w) => w.id) } },
      data: { notifiedAt: new Date() },
    });
  } catch (error) {
    console.error("dispatchBackInStock failed:", error);
  }
}

/** Heads-up to the store owner when money arrives. Off unless ORDER_ALERT_EMAIL is set. */
export async function sendAdminOrderAlert(order: EmailOrder): Promise<void> {
  const to = process.env.ORDER_ALERT_EMAIL;
  if (!to) return;
  try {
    const itemsText = order.items.map((i) => `${esc(i.name)} × ${i.quantity}`).join("<br/>");
    await deliver(
      to,
      `New order ${formatOrderNumber(order.orderNumber)} — ${formatPrice(order.totalCents)} ${order.paymentMethod} (${esc(order.city)})`,
      shell(
        "New order received",
        `<p style="font-size:14px;line-height:1.8;">
           <strong>${formatOrderNumber(order.orderNumber)}</strong><br/>
           <strong>${esc(order.shippingName)}</strong> · ${esc(order.city)} · ${order.paymentMethod}<br/>
           ${itemsText}<br/>
           Total: <strong>${formatPrice(order.totalCents)}</strong>
         </p>
         <p style="font-size:14px;"><a href="${site.url}/admin/orders" style="color:#121212;">Open order management →</a></p>`
      )
    );
  } catch (error) {
    console.error("admin order alert failed:", error);
  }
}
