"use client";

export default function SignOutButton() {
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }
  return (
    <button
      type="button"
      onClick={signOut}
      className="text-xs uppercase tracking-widest text-wine hover:underline"
    >
      Sign out
    </button>
  );
}
