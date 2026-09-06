import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "מחולל הזמנות עבודה | קבוצת משה חדיף",
  description: "יצירה, שמירה והדפסה של הזמנות עבודה וציוד",
  manifest: "/manifest-or-v2.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
      { url: "/or-icon-192-v2.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/or-apple-touch-icon-v2.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "OR הזמנות",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#304a3e",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="he" dir="rtl"><body>{children}</body></html>;
}
