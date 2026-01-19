import type { Metadata, Viewport } from "next"
import { Nunito } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const nunito = Nunito({ 
  subsets: ["latin"],
  variable: "--font-sans",
})

const siteConfig = {
  name: "easystage.nl",
  description: "Vind je perfecte stage in Nederland. Doorzoek duizenden stages bij MBO, HBO en WO niveau. De slimste manier om je stageplek te vinden.",
  url: "https://easystage.nl",
  ogImage: "https://easystage.nl/logo_bg.png",
  keywords: [
    "stage",
    "stages",
    "stageplek",
    "stageplaats",
    "stage zoeken",
    "stage vinden",
    "MBO stage",
    "HBO stage",
    "WO stage",
    "Nederland",
    "stagemarkt",
    "stagevacatures",
    "afstudeerstage",
    "meewerkstage",
    "snuffelstage",
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - Vind je perfecte stage`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - Vind je perfecte stage`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@easystagenl",
  },
  alternates: {
    canonical: siteConfig.url,
  },
  icons: {
    icon: "/logo_bg.png",
    apple: "/logo_bg.png",
  },
  category: "education",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
}

// Organization structured data for SEO
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "easystage.nl",
  url: "https://easystage.nl",
  logo: "https://easystage.nl/logo.png",
  description: "De slimste manier om je stage te vinden in Nederland",
  sameAs: [
    "https://linkedin.com/company/easystagenl",
    "https://instagram.com/easystage.nl",
    "https://tiktok.com/@easystagenl",
  ],
}

// WebSite structured data for search box
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "easystage.nl",
  url: "https://easystage.nl",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://easystage.nl/stages?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
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
