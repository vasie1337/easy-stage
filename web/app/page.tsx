'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'

export default function Home() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/stages${query ? `?q=${encodeURIComponent(query)}` : ''}`)
  }

  const popularSearches = ['Marketing', 'IT', 'Finance', 'Zorg', 'Techniek', 'HR']

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <span className="font-semibold">easystage.nl</span>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl text-center py-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            Vind je perfecte stage
          </h1>
          <p className="text-lg text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            Doorzoek duizenden stages in heel Nederland
          </p>
          
          {/* Search Box */}
          <form onSubmit={handleSearch} className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Zoek op functie, bedrijf of stad..."
                  className="h-12 pl-12 pr-4 text-base"
                  autoFocus
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-6">
                Zoeken
              </Button>
            </div>
          </form>

          {/* Popular searches */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            <span className="text-sm text-muted-foreground">Populair:</span>
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => router.push(`/stages?q=${encodeURIComponent(term)}`)}
                className="text-sm px-3 py-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>

          {/* Browse all */}
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
            <Button variant="ghost" onClick={() => router.push('/stages')}>
              <Sparkles className="h-4 w-4 mr-2" />
              Bekijk alle stages
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
