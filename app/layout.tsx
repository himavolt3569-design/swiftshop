import type { Metadata, Viewport } from "next";
import { Poppins, Playfair_Display, Noto_Serif } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  variable: "--font-noto",
  display: "swap",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Goreto.store - Curated Essentials from Nepal",
  description:
    "Discover curated essentials from the finest artisans across Nepal. Fast delivery, real tracking, premium quality.",
  openGraph: {
    title: "Goreto.store - Curated Essentials from Nepal",
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
    <html lang="en" className={`${poppins.variable} ${playfair.variable} ${notoSerif.variable}`}>
      <body>
        {children}
        <div className="grain-overlay" aria-hidden="true" />
      </body>
    </html>
  );
}
