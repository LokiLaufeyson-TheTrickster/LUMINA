import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import AppGuard from "@/components/AppGuard";

export const metadata: Metadata = {
  title: "LUMINA — Life Unfolding through Memory, Introspection & Narrative Analysis",
  description: "An emotionally intelligent journaling system. Capture thoughts, track moods, score emotions, and nurture your inner garden.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LUMINA",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFF9F5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <ServiceWorkerRegistration />
        <AppGuard>{children}</AppGuard>
      </body>
    </html>
  );
}
