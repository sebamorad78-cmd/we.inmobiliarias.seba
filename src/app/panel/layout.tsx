import type { Metadata } from "next";
import "@/styles/panel.css";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel" },
  robots: { index: false, follow: false },
};

export default function PanelRoot({ children }: { children: React.ReactNode }) {
  return children;
}
