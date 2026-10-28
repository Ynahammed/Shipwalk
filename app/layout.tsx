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
  title: "ShipWeek — build your first AI project in 60 minutes",
  description:
    "A free 60-minute AI build. No prior AI experience required: call a real LLM API, deploy a working project, and leave with a live link, an AI review and a certificate.",
  openGraph: {
    title: "ShipWeek — build your first AI project in 60 minutes",
    description:
      "One hour, one AI project, one live URL for your resume. 500 seats. Free.",
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
