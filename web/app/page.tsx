import { SearchBox } from './components/SearchBox'

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🎓</span>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Stage Zoeker
            </h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400">
            Doorzoek stages van Stagemarkt en Nationale Vacaturebank
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <SearchBox />
      </main>
    </div>
  )
}
