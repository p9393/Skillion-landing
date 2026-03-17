import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LanguageProvider } from "./i18n/LanguageContext";
import "./globals.css";
import QuantumField from "./components/QuantumField";
import CustomCursor from "./components/CustomCursor";
import ScrollProgress from "./components/ScrollProgress";
import Preloader from "./components/Preloader";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

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

export const viewport: Viewport = {
  themeColor: "#131620",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  verification: {
    google: "KZ4SszvrNgxVXe0_0_m7v2w7m1Wl1_M9VfO4R6v_o",
  },
  title: {
    default: "Skillion Finance — Where Skill Becomes Capital",
    template: "%s | Skillion Finance",
  },
  description:
    "A Reputation-Based Financial Infrastructure where verified trading skill becomes a measurable, portable financial asset. Build your SDI score and unlock access, tools, and capital.",
  keywords: [
    "trading reputation system",
    "trader score",
    "SDI score",
    "skill-based finance",
    "financial infrastructure",
    "verified trading performance",
    "prop firm alternative",
    "merit-based capital",
    "trader reputation",
    "Skillion Finance",
  ],
  authors: [{ name: "Skillion Finance", url: "https://www.skillion.finance" }],
  creator: "Skillion Finance",
  category: "Finance",
  metadataBase: new URL("https://www.skillion.finance"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Skillion Finance — Where Skill Becomes Capital",
    description:
      "A Reputation-Based Financial Infrastructure. Your verified performance generates a score — and your score unlocks access, tools, and capital.",
    type: "website",
    url: "https://www.skillion.finance",
    siteName: "Skillion Finance",
    locale: "en_US",
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
    description:
      "A Reputation-Based Financial Infrastructure. Merit over capital. Skill over hype.",
    images: ["/og-image.png"],
    creator: "@SkillionFi",
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

// JSON-LD structured data — Organization + WebSite schema
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.skillion.finance/#organization",
      name: "Skillion Finance",
      url: "https://www.skillion.finance",
      logo: {
        "@type": "ImageObject",
        url: "https://www.skillion.finance/skillion-logo.svg",
      },
      description:
        "A Reputation-Based Financial Infrastructure where verified trading skill becomes a measurable, portable financial asset.",
      foundingDate: "2025",
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.skillion.finance/#website",
      url: "https://www.skillion.finance",
      name: "Skillion Finance",
      publisher: { "@id": "https://www.skillion.finance/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: "https://www.skillion.finance/?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ colorScheme: "dark" }}>
      <head>
        {/* Critical CSS inline — eliminates flash before external CSS loads */}
        <style
          dangerouslySetInnerHTML={{
            __html: `html,body{background:#0e1017!important;color-scheme:dark;min-height:100vh;}`,
          }}
        />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Global UI layer */}
        <Preloader />
        <CustomCursor />
        <ScrollProgress />

        {/* Quantum Field 3D background */}
        <QuantumField />

        <LanguageProvider>{children}</LanguageProvider>

        {/* Vercel Analytics & Speed Insights */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

