import Link from 'next/link'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <span className="font-semibold">StageZoeker</span>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container max-w-2xl text-center py-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Vind je perfecte stage
          </h1>
          <Button asChild size="lg">
            <Link href="/stages">
              <Search className="h-4 w-4 mr-2" />
              Start met zoeken
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
