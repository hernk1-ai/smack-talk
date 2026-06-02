import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { GoogleAnalyticsPageView } from "@/components/analytics/GoogleAnalyticsPageView";
import { DevRoutePanel } from "@/components/DevRoutePanel";
import { AppProviders } from "@/components/providers/AppProviders";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "LOCKT",
  description: "Watch the World Cup with your people. Match Hub, Schedule, and Game Rooms for calls and live reactions.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "LOCKT",
    description: "Watch the World Cup with your people. Match Hub, Schedule, and Game Rooms for calls and live reactions.",
    url: "/",
    siteName: "LOCKT",
    type: "website",
    images: [{ url: "/brand/lockt-wordmark.svg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LOCKT",
    description: "Watch the World Cup with your people. Match Hub, Schedule, and Game Rooms for calls and live reactions.",
    images: ["/brand/lockt-wordmark.svg"],
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icons/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "LOCKT",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  themeColor: "#0b0f0c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <GoogleAnalytics />
      </head>
      <body className="min-h-full flex flex-col">
        <AppProviders>
          <GoogleAnalyticsPageView />
          {children}
          <DevRoutePanel />
        </AppProviders>
      </body>
    </html>
  );
}
