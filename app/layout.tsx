import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Goreto.store — Curated Essentials from Nepal",
  description:
    "Discover curated essentials from the finest artisans across Nepal. Fast delivery, real tracking, premium quality.",
  openGraph: {
    title: "Goreto.store — Curated Essentials from Nepal",
    description:
      "Discover curated essentials from the finest artisans across Nepal. Fast delivery, real tracking, premium quality.",
    siteName: "Goreto.store",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        {children}
        <div className="grain-overlay" aria-hidden="true" />
      </body>
    </html>
  );
}
