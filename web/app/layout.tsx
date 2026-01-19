import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: "StageZoeker - Vind je perfecte stage",
  description: "Doorzoek duizenden stages van Stagemarkt en NVB. Filter op niveau, locatie en meer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="dark">
      <body className={`${outfit.className} bg-[#0a0a0f] antialiased`}>{children}</body>
    </html>
  );
}
