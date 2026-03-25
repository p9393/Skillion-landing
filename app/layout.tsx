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
    "Build your SDI Score: the non-custodial reputation layer for serious traders. Verified skill becomes portable capital. Merit over hype — join the waitlist now.",
  keywords: [
    "SDI score",
    "trading reputation system",
    "non-custodial trading score",
    "reputation finance",
    "skill-based finance",
    "trader score DeFi",
    "verified trading performance",
    "prop firm alternative",
    "merit-based capital access",
    "trader reputation infrastructure",
    "financial reputation layer",
    "Skillion Finance",
    "reputation-based financial infrastructure",
  ],
  authors: [{ name: "Skillion Finance", url: "https://www.skillion.finance" }],
  creator: "Skillion Finance",
  publisher: "Skillion Finance",
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
    site: "@SkillionFi",
    title: "Skillion Finance — Where Skill Becomes Capital",
    description:
      "Build your SDI Score. Non-custodial reputation layer for serious traders. Merit over capital. Skill over hype.",
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
      "max-video-preview": -1,
    },
  },
};

// JSON-LD structured data — Organization + WebSite + SoftwareApplication schema
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
        width: 512,
        height: 512,
      },
      description:
        "A non-custodial Reputation-Based Financial Infrastructure where verified trading skill becomes a measurable, portable financial asset. Build your SDI Score and unlock access, tools, and capital.",
      foundingDate: "2025",
      contactPoint: {
        "@type": "ContactPoint",
        email: "info@skillion.finance",
        contactType: "customer support",
      },
      sameAs: [
        "https://discord.com/channels/1485968255037214890/1485968255804899422",
        "https://t.me/Skillion_Finance",
        "https://www.instagram.com/p9393195/",
      ],
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
    {
      "@type": "SoftwareApplication",
      "@id": "https://www.skillion.finance/#app",
      name: "Skillion Finance",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      url: "https://www.skillion.finance",
      description: "Non-custodial trading reputation infrastructure. Build your SDI Score and unlock merit-based capital access.",
      publisher: { "@id": "https://www.skillion.finance/#organization" },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
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

