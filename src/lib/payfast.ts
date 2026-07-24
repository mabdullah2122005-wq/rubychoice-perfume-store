import { createHash } from "node:crypto";
import { site } from "./site";

// PayFast (Pakistan) hosted checkout — gopayfast.com, operated by APPS.
// Flow: server obtains a one-time ACCESS_TOKEN, the browser form-POSTs the
// customer to PayFast's payment page, PayFast redirects back to our return
// route with err_code + validation_hash.
//
// Configure in .env after merchant onboarding:
//   PAYFAST_MERCHANT_ID, PAYFAST_SECURED_KEY
//   PAYFAST_BASE_URL — https://ipguat.apps.net.pk for sandbox/UAT (default);
//                      the production host is provided by PayFast.
// Field names below follow PayFast's merchant integration guide — confirm
// them against the copy you receive at onboarding before going live.

const DEFAULT_BASE = "https://ipguat.apps.net.pk";

function baseUrl(): string {
  return (process.env.PAYFAST_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");
}

export function payfastConfigured(): boolean {
  return Boolean(
    process.env.PAYFAST_MERCHANT_ID && process.env.PAYFAST_SECURED_KEY
  );
}

export function payfastOrigin(): string | null {
  try {
    return new URL(baseUrl()).origin;
  } catch {
    return null;
  }
}

export type PayfastRedirect = {
  action: string;
  fields: Record<string, string>;
};

export async function createPayfastRedirect(order: {
  id: string;
  totalCents: number;
  email: string;
  phone: string;
}): Promise<PayfastRedirect> {
  const merchantId = process.env.PAYFAST_MERCHANT_ID!;
  const securedKey = process.env.PAYFAST_SECURED_KEY!;
  const amount = (order.totalCents / 100).toFixed(2);

  const tokenParams = new URLSearchParams({
    MERCHANT_ID: merchantId,
    SECURED_KEY: securedKey,
    BASKET_ID: order.id,
    TXNAMT: amount,
    CURRENCY_CODE: "PKR",
  });
  const tokenRes = await fetch(
    `${baseUrl()}/Ecommerce/api/Transaction/GetAccessToken?${tokenParams}`,
    { method: "GET", cache: "no-store" }
  );
  if (!tokenRes.ok) {
    throw new Error(`PayFast token request failed: ${tokenRes.status}`);
  }
  const tokenData = (await tokenRes.json()) as { ACCESS_TOKEN?: string };
  if (!tokenData.ACCESS_TOKEN) {
    throw new Error("PayFast did not return an access token.");
  }

  return {
    action: `${baseUrl()}/Ecommerce/api/Transaction/PostTransaction`,
    fields: {
      MERCHANT_ID: merchantId,
      MERCHANT_NAME: site.name,
      TOKEN: tokenData.ACCESS_TOKEN,
      PROCCODE: "00",
      TXNAMT: amount,
      CURRENCY_CODE: "PKR",
      CUSTOMER_MOBILE_NO: order.phone,
      CUSTOMER_EMAIL_ADDRESS: order.email,
      SIGNATURE: createHash("md5")
        .update(`${merchantId}:${site.name}:${amount}:${order.id}`)
        .digest("hex"),
      VERSION: "MERCHANT-CART-0.1",
      TXNDESC: `${site.name} order ${order.id}`,
      SUCCESS_URL: `${site.url}/api/payments/payfast/return`,
      FAILURE_URL: `${site.url}/api/payments/payfast/return`,
      BASKET_ID: order.id,
      ORDER_DATE: new Date().toISOString(),
      CHECKOUT_URL: `${site.url}/api/payments/payfast/return`,
    },
  };
}

export type PayfastVerdict = "paid" | "failed" | "unverified";

/**
 * Judges a PayFast redirect/callback. "paid" only when the validation hash
 * matches — a browser hitting the return URL by hand cannot forge it without
 * the secured key. A successful err_code with a missing/mismatched hash is
 * "unverified": the order stays PENDING for the admin to confirm.
 */
export function verifyPayfastReturn(params: {
  basketId: string;
  errCode: string;
  validationHash?: string;
}): PayfastVerdict {
  const success = params.errCode === "000" || params.errCode === "00";
  if (!success) return "failed";

  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const securedKey = process.env.PAYFAST_SECURED_KEY;
  if (!merchantId || !securedKey || !params.validationHash) return "unverified";

  const expected = createHash("sha256")
    .update(`${params.basketId}|${securedKey}|${merchantId}|${params.errCode}`)
    .digest("hex");
  return expected.toLowerCase() === params.validationHash.toLowerCase()
    ? "paid"
    : "unverified";
}
