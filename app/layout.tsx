import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShipWeek — leave with a deployed project",
  description:
    "A free 3-day build sprint for final-year students. Generate a project worth shipping, claim a seat, and leave with a live link, an AI review and a certificate.",
  openGraph: {
    title: "ShipWeek — leave with a deployed project",
    description:
      "Generate a project idea you actually want to build, then ship it in 3 days. 500 seats. Free.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f0e5",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${instrument.variable}`}>
      <body>{children}</body>
    </html>
  );
}
