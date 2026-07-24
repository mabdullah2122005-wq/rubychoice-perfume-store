import FavouritesGrid from "@/components/FavouritesGrid";

export const metadata = {
  title: "My favourites",
  description: "The fragrances you've saved at Ruby Choice.",
};

export default function FavouritesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">Saved for later</p>
      <h1 className="mt-1 font-serif text-4xl sm:text-5xl">My favourites</h1>
      <FavouritesGrid />
    </div>
  );
}
