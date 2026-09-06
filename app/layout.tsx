import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "מחולל הזמנות עבודה | קבוצת משה חדיף",
  description: "יצירה, שמירה והדפסה של הזמנות עבודה וציוד",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="he" dir="rtl"><body>{children}</body></html>;
}
