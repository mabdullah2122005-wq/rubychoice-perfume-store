import { redirect } from "next/navigation";

// Favourites moved to a guest-friendly, device-local list at /favourites.
export default function WishlistRedirect() {
  redirect("/favourites");
}
