'use client'

import { useState, useEffect } from 'react'
import { searchInternships, Internship } from './lib/meili'
import { InternshipCard } from './components/InternshipCard'

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Internship[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [level, setLevel] = useState('')
  const [source, setSource] = useState('')

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchInternships(
          query,
          { level: level || undefined, source: source || undefined },
          1,
          50
        )
        setResults(res.hits)
        setTotal((res as any).totalHits ?? res.estimatedTotalHits ?? res.hits.length)
      } catch (err) {
        console.error(err)
        setResults([])
        setTotal(0)
      }
      setLoading(false)
    }, 250)

    return () => clearTimeout(timer)
  }, [query, level, source])

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold">StageZoeker</span>
          <nav className="flex items-center gap-6 text-sm text-zinc-600">
            <a href="#" className="hover:text-zinc-900">Over</a>
            <a href="#" className="hover:text-zinc-900">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h1 className="text-4xl font-bold text-zinc-900 mb-3">
            Vind je stage
          </h1>

          {/* Search */}
          <div className="flex gap-3 max-w-2xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek op functie, bedrijf of stad..."
              className="flex-1 px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-colors"
              autoFocus
            />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-900 outline-none bg-white"
            >
              <option value="">Niveau</option>
              <option value="mbo1">MBO 1</option>
              <option value="mbo2">MBO 2</option>
              <option value="mbo3">MBO 3</option>
              <option value="mbo4">MBO 4</option>
              <option value="hbo">HBO</option>
              <option value="wo">WO</option>
            </select>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-900 outline-none bg-white"
            >
              <option value="">Bron</option>
              <option value="stagemarkt">Stagemarkt</option>
              <option value="nvb">NVB</option>
            </select>
          </div>
        </div>
      </section>

      {/* Results */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Count */}
        <div className="mb-6">
          {loading ? (
            <span className="text-sm text-zinc-400">Laden...</span>
          ) : (
            <span className="text-sm text-zinc-500">
              {total?.toLocaleString('nl-NL')} resultaten
            </span>
          )}
        </div>

        {/* Grid */}
        {results.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((internship) => (
              <InternshipCard key={internship.id} internship={internship} />
            ))}
          </div>
        ) : !loading ? (
          <div className="text-center py-20 text-zinc-400">
            Geen resultaten
          </div>
        ) : null}
      </main>
    </div>
  )
}
