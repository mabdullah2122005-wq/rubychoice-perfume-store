import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata = { title: "Forgot password" };

export default function ForgotPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center font-serif text-4xl">Forgot your password?</h1>
      <p className="mt-2 text-center text-sm text-ink-soft">
        Enter your email and we&apos;ll send you a link to reset it.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
