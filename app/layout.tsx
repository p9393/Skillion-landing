import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LanguageProvider } from "./i18n/LanguageContext";
import "./globals.css";
import QuantumField from "./components/QuantumField";
import CustomCursor from "./components/CustomCursor";
import ScrollProgress from "./components/ScrollProgress";
import Preloader from "./components/Preloader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Skillion Finance — Where Skill Becomes Capital",
  description: "A Reputation-Based Financial Infrastructure where verified trading skill becomes a measurable, portable financial asset. Join the merit-first revolution.",
  keywords: ["trading reputation", "skill score", "financial infrastructure", "verified performance", "trader reputation"],
  authors: [{ name: "Skillion Finance", url: "https://skillion.finance" }],
  metadataBase: new URL("https://skillion.finance"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Skillion Finance — Where Skill Becomes Capital",
    description: "A Reputation-Based Financial Infrastructure. Your verified performance generates a score — and your score unlocks access, tools, and capital.",
    type: "website",
    url: "https://skillion.finance",
    siteName: "Skillion Finance",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Skillion Finance — Where Skill Becomes Capital",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Skillion Finance — Where Skill Becomes Capital",
    description: "A Reputation-Based Financial Infrastructure. Merit over capital. Skill over hype.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ colorScheme: 'dark' }}>
      <head>
        <meta name="theme-color" content="#131620" />
        {/* Critical CSS inline — applied before ANY external file loads, eliminates flash */}
        <style dangerouslySetInnerHTML={{
          __html: `
          html,body{background: #0e1017 !important; color-scheme:dark; min-height: 100vh;}
        `}} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Global UI layer — mounted above all page content */}
        <Preloader />
        <CustomCursor />
        <ScrollProgress />

        {/* Quantum Field 3D background — outside stacking context */}
        <QuantumField />

        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
