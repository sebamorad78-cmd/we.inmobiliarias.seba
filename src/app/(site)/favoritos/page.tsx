import type { Metadata } from "next";
import { FavoritesView } from "./view";

export const metadata: Metadata = { title: "Favoritos", robots: { index: false } };

export default function FavoritesPage() {
  return <FavoritesView />;
}
