import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";

// Primary serif for headings — elegant, editorial
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

// Secondary display serif for accent headings
const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

// Clean sans-serif for body and UI
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Khali — Personalized AI News, Balanced",
  description:
    "Khali delivers personalized, AI-powered news through short videos, podcasts, and articles. Every political story shows both sides. Stay informed, not influenced.",
  keywords: [
    "news app",
    "AI news",
    "personalized news",
    "unbiased news",
    "political balance",
    "news aggregator",
    "short video news",
    "podcast news",
  ],
  openGraph: {
    title: "Khali — Personalized AI News, Balanced",
    description:
      "Bite-sized stories. Both sides. Built for you. Download Khali on iOS.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSerifDisplay.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
