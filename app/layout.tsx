import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  description: "LOCKT is a sports reputation platform where fans lock takes, ride or fade calls, and build receipts.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "LOCKT",
    description: "LOCKT is a sports reputation platform where fans lock takes, ride or fade calls, and build receipts.",
    url: "/",
    siteName: "LOCKT",
    type: "website",
    images: [{ url: "/brand/lockt-wordmark.svg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LOCKT",
    description: "LOCKT is a sports reputation platform where fans lock takes, ride or fade calls, and build receipts.",
    images: ["/brand/lockt-wordmark.svg"],
  },
  icons: {
    icon: "/brand/lockt-icon.svg",
    shortcut: "/brand/lockt-icon.svg",
    apple: "/brand/lockt-icon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  themeColor: "#020202",
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
      <body className="min-h-full flex flex-col">
        <AppProviders>
          {children}
          <DevRoutePanel />
        </AppProviders>
      </body>
    </html>
  );
}
