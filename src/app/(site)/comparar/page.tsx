import type { Metadata } from "next";
import { CompareView } from "./view";

export const metadata: Metadata = { title: "Comparar propiedades", robots: { index: false } };

export default function ComparePage() {
  return <CompareView />;
}
