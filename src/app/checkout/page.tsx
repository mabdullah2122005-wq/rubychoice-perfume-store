import CheckoutForm from "@/components/CheckoutForm";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  // Online-payment options only appear when a gateway is configured
  // (or in development, where both run in clearly-marked demo mode).
  const isDev = process.env.NODE_ENV !== "production";
  const cardEnabled = Boolean(process.env.STRIPE_SECRET_KEY) || isDev;
  const payfastEnabled =
    Boolean(process.env.PAYFAST_MERCHANT_ID && process.env.PAYFAST_SECURED_KEY) || isDev;
  return <CheckoutForm cardEnabled={cardEnabled} payfastEnabled={payfastEnabled} />;
}
