'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { searchInternships, Internship, SearchFilters, SortOption, FacetDistribution } from '../lib/actions'
import { InternshipCard } from '@/components/internship-card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const levelLabels: Record<string, string> = {
  mbo1: 'MBO 1',
  mbo2: 'MBO 2',
  mbo3: 'MBO 3',
  mbo4: 'MBO 4',
  mbo: 'MBO',
  hbo: 'HBO',
  wo: 'WO',
}

function StagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [level, setLevel] = useState(searchParams.get('level') || '')
  const [province, setProvince] = useState(searchParams.get('province') || '')
  const [sort, setSort] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'relevance')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  
  const [results, setResults] = useState<Internship[]>([])
  const [totalHits, setTotalHits] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [facets, setFacets] = useState<FacetDistribution>({})
  const [loading, setLoading] = useState(true)
  
  // Update URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (level) params.set('level', level)
    if (province) params.set('province', province)
    if (sort !== 'relevance') params.set('sort', sort)
    if (page > 1) params.set('page', String(page))
    
    const queryString = params.toString()
    router.replace(`/stages${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }, [query, level, province, sort, page, router])

  // Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const filters: SearchFilters = {}
        if (level) filters.level = level
        if (province) filters.province = province
        
        const res = await searchInternships(query, filters, page, 20, sort)
        setResults(res.hits)
        setTotalHits(res.totalHits)
        setTotalPages(res.totalPages)
        setFacets(res.facetDistribution)
      } catch (err) {
        console.error(err)
        setResults([])
        setTotalHits(0)
      }
      setLoading(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [query, level, province, sort, page])
  
  const resetFilters = () => {
    setQuery('')
    setLevel('')
    setProvince('')
    setPage(1)
  }

  const hasFilters = query || level || province

  const sortedProvinces = Object.entries(facets.location_province || {}).sort((a, b) => b[1] - a[1])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="font-semibold">
            easystage.nl
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {totalHits.toLocaleString('nl-NL')} stages
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Zoek op functie, bedrijf of stad..."
            className="pl-9 pr-9"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Select value={level} onValueChange={(v) => { setLevel(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle niveaus</SelectItem>
              {Object.entries(levelLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={province} onValueChange={(v) => { setProvince(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Provincie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle provincies</SelectItem>
              {sortedProvinces.map(([value, count]) => (
                <SelectItem key={value} value={value}>
                  {value} ({count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevantie</SelectItem>
              <SelectItem value="date_desc">Nieuwste eerst</SelectItem>
              <SelectItem value="date_asc">Oudste eerst</SelectItem>
              <SelectItem value="company">Bedrijf A-Z</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset
            </Button>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-[76px] rounded-lg border bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="space-y-2">
              {results.map((internship) => (
                <InternshipCard key={internship.id} internship={internship} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Vorige
                </Button>
                
                <span className="text-sm text-muted-foreground px-4">
                  {page} / {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Volgende
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Geen stages gevonden</p>
            {hasFilters && (
              <Button variant="link" onClick={resetFilters} className="mt-2">
                Filters wissen
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function StagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <StagesContent />
    </Suspense>
  )
}
