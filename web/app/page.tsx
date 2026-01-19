import Link from 'next/link'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { getStats } from '@/app/lib/actions'

export default async function Home() {
  const stats = await getStats()
  
  const formatNumber = (num: number) => {
    return num.toLocaleString('nl-NL')
  }

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
          <p className="text-lg text-muted-foreground mb-8">
            Doorzoek {formatNumber(stats.totalStages)} stages in heel Nederland
          </p>
          <Button asChild size="lg">
            <Link href="/stages">
              <Search className="h-4 w-4 mr-2" />
              Start met zoeken
            </Link>
          </Button>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-16 pt-8 border-t">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">
                {formatNumber(stats.totalStages)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Stages</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">
                {formatNumber(stats.totalCities)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Steden</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">
                {stats.totalProvinces}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Provincies</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
