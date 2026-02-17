import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Joel the HypeTrader | Sentiment-Driven Trading Assistant",
  description:
    "AI-powered trading assistant that analyzes social media hype and news sentiment to help you make smarter trading decisions. Built by Lupin.",
  keywords: [
    "stock trading",
    "sentiment analysis",
    "AI trading",
    "StockTwits",
    "market sentiment",
    "trading assistant",
  ],
  authors: [{ name: "Lupin" }],
  creator: "Lupin",
  publisher: "Lupin",
  manifest: "/manifest.json",
  icons: {
    icon: "/lupin-logo.png",
    apple: "/lupin-logo.png",
  },
  openGraph: {
    title: "Joel the HypeTrader",
    description: "Sentiment-driven trading assistant powered by AI",
    type: "website",
    siteName: "Joel the HypeTrader",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f0f11",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-dark-900 text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
