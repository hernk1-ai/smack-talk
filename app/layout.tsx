import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DevRoutePanel } from "@/components/DevRoutePanel";
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
  title: "LOCKT — Lock Your Take. Check The Receipt.",
  description:
    "Lock your takes, ride or fade the Crowd, build REP, and show receipts on the sports reputation platform built for real fans.",
  icons: {
    icon: "/smack-talk-logo.png",
    shortcut: "/smack-talk-logo.png",
    apple: "/smack-talk-logo.png",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <DevRoutePanel />
      </body>
    </html>
  );
}
