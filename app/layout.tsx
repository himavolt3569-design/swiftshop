import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Goreto.store - Curated Essentials",
  description:
    "A refined online market for curated essentials. Fast delivery across Nepal.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
