'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { searchInternships, Internship } from '../lib/actions'

const levelLabels: Record<string, string> = {
  mbo1: 'MBO 1',
  mbo2: 'MBO 2',
  mbo3: 'MBO 3',
  mbo4: 'MBO 4',
  hbo: 'HBO',
  wo: 'WO',
}

export default function StagesPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Internship[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
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
          60
        )
        setResults(res.hits)
        setTotal(res.totalHits)
      } catch (err) {
        console.error(err)
        setResults([])
        setTotal(0)
      }
      setLoading(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [query, level, source])

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold hover:text-zinc-300 transition-colors">
            StageZoeker
          </Link>
          <span className="text-sm text-zinc-500">
            {total !== null && `${total.toLocaleString('nl-NL')} stages`}
          </span>
        </div>
      </header>

      {/* Search Bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek op functie, bedrijf of stad..."
              className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none transition-colors"
              autoFocus
            />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-zinc-500 focus:outline-none cursor-pointer"
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
              className="px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-zinc-500 focus:outline-none cursor-pointer"
            >
              <option value="">Bron</option>
              <option value="stagemarkt">Stagemarkt</option>
              <option value="nvb">NVB</option>
            </select>
            {(query || level || source) && (
              <button
                onClick={() => { setQuery(''); setLevel(''); setSource('') }}
                className="px-4 py-3 text-zinc-400 hover:text-white transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 animate-pulse">
                <div className="h-3 bg-zinc-800 rounded w-1/3 mb-3" />
                <div className="h-4 bg-zinc-800 rounded w-full mb-2" />
                <div className="h-4 bg-zinc-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((internship) => (
              <a
                key={internship.id}
                href={internship.apply_option === 'email' ? `mailto:${internship.apply_value}` : internship.apply_value}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-600 transition-colors"
              >
                <p className="text-sm text-zinc-500 mb-1">
                  {internship.company_name || 'Onbekend'}
                </p>
                <h2 className="font-medium text-white group-hover:text-zinc-300 mb-3 line-clamp-2">
                  {internship.title || 'Geen titel'}
                </h2>
                <div className="flex flex-wrap gap-2 text-xs">
                  {internship.level && (
                    <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400">
                      {levelLabels[internship.level] || internship.level}
                    </span>
                  )}
                  {internship.location_city && (
                    <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400">
                      {internship.location_city}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-zinc-500">
            Geen resultaten gevonden
          </div>
        )}

        {results.length > 0 && results.length < (total || 0) && (
          <p className="text-center text-sm text-zinc-600 mt-8">
            {results.length} van {total?.toLocaleString('nl-NL')}
          </p>
        )}
      </main>
    </div>
  )
}
