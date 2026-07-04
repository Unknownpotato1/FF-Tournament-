import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FF Tournament — India's No.1 Free Fire Tournament Platform",
  description:
    "Join exciting Free Fire custom tournaments, compete with real players, and win cash prizes. 1v1 & 2v2 Clash Squad tournaments with daily payouts.",
  keywords: [
    "Free Fire",
    "FF Tournament",
    "Free Fire Tournament",
    "Clash Squad",
    "Esports India",
    "Free Fire Cash Prize",
    "Custom Room",
    "1v1 Free Fire",
    "2v2 Free Fire",
  ],
  authors: [{ name: "FF Tournament" }],
  manifest: "/manifest.json",
  applicationName: "FF Tournament",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FF Tournament",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    title: "FF Tournament — India's No.1 Free Fire Tournament Platform",
    description:
      "Join exciting Free Fire custom tournaments, compete with real players, and win cash prizes.",
    siteName: "FF Tournament",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "FF Tournament",
    description: "India's No.1 Free Fire Tournament Platform",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#050507",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FF Tournament" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster />
        <SonnerToaster position="top-center" theme="dark" />
      </body>
    </html>
  );
}
