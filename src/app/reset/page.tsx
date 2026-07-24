import { Suspense } from "react";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata = { title: "Reset password", robots: { index: false } };

export default function ResetPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center font-serif text-4xl">Choose a new password</h1>
      <p className="mt-2 text-center text-sm text-ink-soft">
        Make it at least 10 characters.
      </p>
      <div className="mt-8">
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
