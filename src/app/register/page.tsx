import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Create account" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/account");
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center font-serif text-4xl">Join the maison</h1>
      <p className="mt-2 text-center text-sm text-ink-soft">
        Track orders, keep a wishlist, review fragrances
      </p>
      <div className="mt-8">
        <Suspense>
          <AuthForm mode="register" />
        </Suspense>
      </div>
    </div>
  );
}
