import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'

export const metadata: Metadata = {
  title: "Over ons",
  description: "easystage.nl is de slimste manier om je stage te vinden. Wij verzamelen alle stages op één plek en matchen jou met de perfecte stageplek.",
  openGraph: {
    title: "Over ons | easystage.nl",
    description: "De slimste manier om je stage te vinden in Nederland.",
    url: "https://easystage.nl/about",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Over ons | easystage.nl",
    description: "De slimste manier om je stage te vinden in Nederland.",
  },
  alternates: {
    canonical: "https://easystage.nl/about",
  },
}

const roadmap = [
  { title: 'Stage zoeken', desc: 'Doorzoek duizenden stages', status: 'done' },
  { title: 'Stage alerts', desc: 'Notificaties voor nieuwe stages', status: 'next' },
  { title: 'CV builder', desc: 'Bouw je CV met AI', status: 'soon' },
  { title: 'Auto-sollicitatie', desc: 'Solliciteer automatisch', status: 'soon' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <Logo size={28} href={null} />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 py-16">
        <div className="container max-w-md space-y-16">
          {/* Over ons */}
          <section className="text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-4">
              Over ons
            </p>
            <h1 className="text-2xl font-bold mb-4">
              De slimste manier om je stage te vinden
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Geen eindeloos scrollen meer door verschillende websites. 
              Wij verzamelen alle stages op één plek en matchen jou met de perfecte stageplek. 
              Binnenkort helpen we je zelfs automatisch solliciteren.
            </p>
          </section>

          {/* Roadmap */}
          <section>
            <p className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-10 text-center">
              Roadmap
            </p>
            
            {/* Timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />
              
              {roadmap.map((item, i) => (
                <div key={item.title} className="relative pb-10 last:pb-0">
                  {/* Dot */}
                  <div className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${
                    item.status === 'done' 
                      ? 'bg-foreground' 
                      : 'bg-muted-foreground/40'
                  }`} />
                  
                  {/* Content - alternating sides */}
                  <div className={`${i % 2 === 0 ? 'pr-[calc(50%+1.5rem)] text-right' : 'pl-[calc(50%+1.5rem)]'}`}>
                    <p className={`font-medium ${item.status === 'done' ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {item.title}
                    </p>
                    <p className="text-sm text-muted-foreground/60">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Socials */}
          <section className="text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-6">
              Volg ons
            </p>
            <div className="flex justify-center gap-6">
              <a 
                href="https://linkedin.com/company/easystagenl" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a 
                href="https://instagram.com/easystage.nl" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="https://tiktok.com/@easystagenl" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
