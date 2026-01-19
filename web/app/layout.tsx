import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const nunito = Nunito({ 
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "easystage.nl - Vind je stage",
  description: "Doorzoek duizenden stages",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className={`${nunito.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
