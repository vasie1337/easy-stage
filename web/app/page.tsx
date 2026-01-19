'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'
import { AuthButton } from '@/components/auth-button'

export default function Home() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/stages${query ? `?q=${encodeURIComponent(query)}` : ''}`)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <span className="font-semibold">easystage.nl</span>
          <div className="flex items-center gap-3">
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Over ons
            </Link>
            <ThemeToggle />
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            Vind je perfecte stage
          </h1>
          <p className="text-muted-foreground mb-6">
            Doorzoek duizenden stages in Nederland
          </p>
          
          <form onSubmit={handleSearch}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Functie, bedrijf of locatie..."
                  className="h-10 pl-9"
                  autoFocus
                />
              </div>
              <Button type="submit" className="h-10">
                Zoeken
              </Button>
            </div>
          </form>

          <button
            onClick={() => router.push('/stages')}
            className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            bekijk alle stages →
          </button>
        </div>
      </main>
    </div>
  )
}
