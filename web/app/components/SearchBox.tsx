'use client'

import { useState, useEffect } from 'react'
import { searchInternships, Internship } from '../lib/meili'
import { InternshipCard } from './InternshipCard'

export function SearchBox() {
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
          { 
            level: level || undefined, 
            source: source || undefined 
          },
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
    }, 200)

    return () => clearTimeout(timer)
  }, [query, level, source])

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-950 pb-4 pt-2 -mt-2">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek op functie, bedrijf, stad..."
            className="w-full pl-12 pr-4 py-4 text-lg rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            autoFocus
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3 mt-4">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Alle niveaus</option>
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
            className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Alle bronnen</option>
            <option value="stagemarkt">Stagemarkt</option>
            <option value="nvb">Nationale Vacaturebank</option>
          </select>

          {(level || source || query) && (
            <button
              onClick={() => { setQuery(''); setLevel(''); setSource('') }}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
              Zoeken...
            </span>
          ) : total !== null ? (
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {total.toLocaleString('nl-NL')} stages gevonden
            </span>
          ) : null}
        </p>
      </div>

      {/* Results */}
      {!loading && results.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Geen resultaten gevonden
          </h3>
          <p className="text-zinc-500">
            Probeer andere zoektermen of filters
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {results.map((internship) => (
            <InternshipCard key={internship.id} internship={internship} />
          ))}
        </div>
      )}

      {/* Load more hint */}
      {results.length > 0 && results.length < (total || 0) && (
        <p className="text-center text-sm text-zinc-500 py-4">
          Toon {results.length} van {total?.toLocaleString('nl-NL')} resultaten — verfijn je zoekopdracht voor meer specifieke resultaten
        </p>
      )}
    </div>
  )
}
