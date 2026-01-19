'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { searchInternships, Internship, SearchFilters, SortOption, FacetDistribution } from '../lib/actions'
import { InternshipCard } from '../components/InternshipCard'
import { InternshipModal } from '../components/InternshipModal'

const levelLabels: Record<string, string> = {
  mbo1: 'MBO 1',
  mbo2: 'MBO 2',
  mbo3: 'MBO 3',
  mbo4: 'MBO 4',
  hbo: 'HBO',
  wo: 'WO',
}

const sortLabels: Record<SortOption, string> = {
  relevance: 'Relevantie',
  date_desc: 'Nieuwste eerst',
  date_asc: 'Oudste eerst',
  company_asc: 'Bedrijf (A-Z)',
}

function StagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State from URL
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [level, setLevel] = useState(searchParams.get('level') || '')
  const [province, setProvince] = useState(searchParams.get('province') || '')
  const [city, setCity] = useState(searchParams.get('city') || '')
  const [source, setSource] = useState(searchParams.get('source') || '')
  const [sort, setSort] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'relevance')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  
  // Results
  const [results, setResults] = useState<Internship[]>([])
  const [totalHits, setTotalHits] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(0)
  const [facets, setFacets] = useState<FacetDistribution>({})
  const [processingTime, setProcessingTime] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  
  // UI State
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  // Update URL when filters change
  const updateUrl = useCallback((params: Record<string, string>) => {
    const url = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.set(key, value)
    })
    const queryString = url.toString()
    router.push(`/stages${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }, [router])

  // Perform search
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const filters: SearchFilters = {}
        if (level) filters.level = level
        if (province) filters.province = province
        if (city) filters.city = city
        if (source) filters.source = source
        
        const res = await searchInternships(query, filters, page, 24, sort)
        setResults(res.hits)
        setTotalHits(res.totalHits)
        setTotalPages(res.totalPages)
        setFacets(res.facetDistribution)
        setProcessingTime(res.processingTimeMs)
      } catch (err) {
        console.error(err)
        setResults([])
        setTotalHits(0)
      }
      setLoading(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [query, level, province, city, source, sort, page])
  
  // Update URL when state changes
  useEffect(() => {
    updateUrl({
      q: query,
      level,
      province,
      city,
      source,
      sort: sort !== 'relevance' ? sort : '',
      page: page > 1 ? String(page) : '',
    })
  }, [query, level, province, city, source, sort, page, updateUrl])
  
  // Reset page when filters change
  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value)
    setPage(1)
  }

  const hasActiveFilters = level || province || city || source
  const activeFilterCount = [level, province, city, source].filter(Boolean).length
  
  // Get sorted facets for dropdowns
  const sortedProvinces = Object.entries(facets.location_province || {}).sort((a, b) => b[1] - a[1])
  const sortedCities = Object.entries(facets.location_city || {}).sort((a, b) => b[1] - a[1]).slice(0, 50)
  
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950/20 via-transparent to-cyan-950/20 pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold hover:opacity-80 transition-opacity">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm">
              S
            </span>
            <span className="hidden sm:inline">StageZoeker</span>
          </Link>
          
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            {!loading && (
              <span className="hidden sm:inline">
                {totalHits.toLocaleString('nl-NL')} stages • {processingTime}ms
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              placeholder="Zoek op functie, bedrijf, stad, of vaardigheid..."
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-zinc-500 focus:border-blue-500/50 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-lg"
              autoFocus
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setPage(1) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-500 text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          
          {/* Desktop filters */}
          <div className={`${showFilters ? 'flex' : 'hidden'} sm:flex flex-wrap items-center gap-3 w-full sm:w-auto`}>
            {/* Level */}
            <select
              value={level}
              onChange={(e) => handleFilterChange(setLevel, e.target.value)}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none cursor-pointer hover:bg-white/10 transition-colors"
            >
              <option value="">Alle niveaus</option>
              {Object.entries(levelLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label} {facets.level?.[value] ? `(${facets.level[value]})` : ''}
                </option>
              ))}
            </select>
            
            {/* Province */}
            <select
              value={province}
              onChange={(e) => { handleFilterChange(setProvince, e.target.value); setCity('') }}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none cursor-pointer hover:bg-white/10 transition-colors"
            >
              <option value="">Alle provincies</option>
              {sortedProvinces.map(([value, count]) => (
                <option key={value} value={value}>
                  {value} ({count})
                </option>
              ))}
            </select>
            
            {/* City */}
            <select
              value={city}
              onChange={(e) => handleFilterChange(setCity, e.target.value)}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none cursor-pointer hover:bg-white/10 transition-colors"
            >
              <option value="">Alle steden</option>
              {sortedCities.map(([value, count]) => (
                <option key={value} value={value}>
                  {value} ({count})
                </option>
              ))}
            </select>
            
            {/* Source */}
            <select
              value={source}
              onChange={(e) => handleFilterChange(setSource, e.target.value)}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none cursor-pointer hover:bg-white/10 transition-colors"
            >
              <option value="">Alle bronnen</option>
              {Object.entries(facets.source || {}).map(([value, count]) => (
                <option key={value} value={value}>
                  {value === 'stagemarkt' ? 'Stagemarkt' : value === 'nvb' ? 'NVB' : value} ({count})
                </option>
              ))}
            </select>
          </div>
          
          {/* Spacer */}
          <div className="flex-1" />
          
          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none cursor-pointer hover:bg-white/10 transition-colors"
          >
            {Object.entries(sortLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          
          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={() => { setLevel(''); setProvince(''); setCity(''); setSource(''); setPage(1) }}
              className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              Wis filters
            </button>
          )}
        </div>
        
        {/* Popular Keywords (from facets) */}
        {!loading && facets.keywords && Object.keys(facets.keywords).length > 0 && !query && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-zinc-500 mr-1">Populair:</span>
            {Object.entries(facets.keywords)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([keyword, count]) => (
                <button
                  key={keyword}
                  onClick={() => setQuery(keyword)}
                  className="px-3 py-1 text-sm bg-white/5 border border-white/10 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-colors"
                >
                  {keyword}
                  <span className="ml-1.5 text-zinc-600">{count}</span>
                </button>
              ))}
          </div>
        )}
        
        {/* Results */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-5 animate-pulse">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5" />
                  <div className="flex-1">
                    <div className="h-3 bg-white/5 rounded w-1/2 mb-2" />
                    <div className="h-4 bg-white/5 rounded w-full" />
                  </div>
                </div>
                <div className="h-3 bg-white/5 rounded w-full mb-2" />
                <div className="h-3 bg-white/5 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((internship) => (
                <InternshipCard
                  key={internship.id}
                  internship={internship}
                  onClick={() => setSelectedInternship(internship)}
                />
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                >
                  Vorige
                </button>
                
                <div className="flex items-center gap-1">
                  {/* First page */}
                  {page > 3 && (
                    <>
                      <button
                        onClick={() => setPage(1)}
                        className="w-10 h-10 rounded-lg bg-white/5 text-sm hover:bg-white/10 transition-colors"
                      >
                        1
                      </button>
                      {page > 4 && <span className="px-2 text-zinc-600">...</span>}
                    </>
                  )}
                  
                  {/* Pages around current */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                    if (pageNum > totalPages) return null
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm transition-colors ${
                          pageNum === page
                            ? 'bg-blue-500 text-white font-semibold'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  
                  {/* Last page */}
                  {page < totalPages - 2 && (
                    <>
                      {page < totalPages - 3 && <span className="px-2 text-zinc-600">...</span>}
                      <button
                        onClick={() => setPage(totalPages)}
                        className="w-10 h-10 rounded-lg bg-white/5 text-sm hover:bg-white/10 transition-colors"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                >
                  Volgende
                </button>
              </div>
            )}
            
            {/* Results count */}
            <p className="text-center text-sm text-zinc-500 mt-4">
              Pagina {page} van {totalPages} • {totalHits.toLocaleString('nl-NL')} stages totaal
            </p>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-zinc-300 mb-2">Geen resultaten gevonden</h3>
            <p className="text-zinc-500 max-w-md mx-auto">
              Probeer andere zoektermen of pas je filters aan
            </p>
            {hasActiveFilters && (
              <button
                onClick={() => { setLevel(''); setProvince(''); setCity(''); setSource(''); setQuery('') }}
                className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10 transition-colors"
              >
                Alle filters wissen
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Detail Modal */}
      {selectedInternship && (
        <InternshipModal
          internship={selectedInternship}
          onClose={() => setSelectedInternship(null)}
        />
      )}
    </div>
  )
}

export default function StagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <StagesContent />
    </Suspense>
  )
}
