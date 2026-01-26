'use client'

import { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, Filter, SearchX, Sparkles, Loader2, List, Map } from 'lucide-react'
import { searchInternships, Internship, SearchFilters, SortOption, FacetDistribution } from '../lib/actions'
import { InternshipCard } from '@/components/internship-card'
import { ThemeToggle } from '@/components/theme-toggle'
import { SearchSuggestions, saveRecentSearch } from '@/components/search-suggestions'
import { Logo } from '@/components/logo'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

// Dynamic import for MapView (Leaflet doesn't work with SSR)
import dynamic from 'next/dynamic'
const MapView = dynamic(() => import('@/components/map-view').then(mod => ({ default: mod.MapView })), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-180px)] min-h-[400px] rounded-lg border bg-muted flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
})

type ViewMode = 'list' | 'map'

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
  const [viewMode, setViewMode] = useState<ViewMode>((searchParams.get('view') as ViewMode) || 'list')
  
  const [results, setResults] = useState<Internship[]>([])
  const [totalHits, setTotalHits] = useState(0)
  const [facets, setFacets] = useState<FacetDistribution>({})
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const observerRef = useRef<HTMLDivElement>(null)
  
  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  // Update URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (level) params.set('level', level)
    if (province) params.set('province', province)
    if (sort !== 'relevance') params.set('sort', sort)
    if (viewMode !== 'list') params.set('view', viewMode)
    
    const queryString = params.toString()
    router.replace(`/stages${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }, [query, level, province, sort, viewMode, router])

  // Initial search
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true)
      setPage(1)
      try {
        const filters: SearchFilters = {}
        if (level) filters.level = level
        if (province) filters.province = province
        
        const res = await searchInternships(query, filters, 1, 20, sort)
        setResults(res.hits)
        setTotalHits(res.totalHits)
        setFacets(res.facetDistribution)
        setHasMore(res.hits.length < res.totalHits)
        
        if (query) saveRecentSearch(query)
      } catch (err) {
        console.error(err)
        setResults([])
        setTotalHits(0)
      }
      setLoading(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [query, level, province, sort])
  
  // Load more (infinite scroll)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    
    setLoadingMore(true)
    const nextPage = page + 1
    
    try {
      const filters: SearchFilters = {}
      if (level) filters.level = level
      if (province) filters.province = province
      
      const res = await searchInternships(query, filters, nextPage, 20, sort)
      setResults(prev => [...prev, ...res.hits])
      setPage(nextPage)
      setHasMore(results.length + res.hits.length < res.totalHits)
    } catch (err) {
      console.error(err)
    }
    setLoadingMore(false)
  }, [loadingMore, hasMore, page, query, level, province, sort, results.length])
  
  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )
    
    if (observerRef.current) {
      observer.observe(observerRef.current)
    }
    
    return () => observer.disconnect()
  }, [loadMore, loading])
  
  const resetFilters = () => {
    setQuery('')
    setLevel('')
    setProvince('')
  }

  const hasFilters = query || level || province
  const activeFilterCount = [level, province].filter(Boolean).length

  const sortedProvinces = Object.entries(facets.location_province || {}).sort((a, b) => b[1] - a[1])

  const handleSelectSuggestion = (term: string) => {
    setQuery(term)
    setShowSuggestions(false)
    searchInputRef.current?.blur()
  }

  // View toggle buttons
  const ViewToggle = () => (
    <div className="flex rounded-lg border bg-muted p-1">
      <button
        onClick={() => setViewMode('list')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          viewMode === 'list'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">Lijst</span>
      </button>
      <button
        onClick={() => setViewMode('map')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          viewMode === 'map'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Map className="h-4 w-4" />
        <span className="hidden sm:inline">Kaart</span>
      </button>
    </div>
  )

  // Filter controls (shared between desktop and mobile)
  const FilterControls = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={mobile ? 'space-y-4 p-4' : 'flex flex-wrap items-center gap-3'}>
      <Select value={level} onValueChange={(v) => { setLevel(v === 'all' ? '' : v) }}>
        <SelectTrigger className={mobile ? 'w-full' : 'w-[130px]'}>
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

      <Select value={province} onValueChange={(v) => { setProvince(v === 'all' ? '' : v) }}>
        <SelectTrigger className={mobile ? 'w-full' : 'w-[160px]'}>
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

      {!mobile && <div className="flex-1" />}

      {!mobile && <ViewToggle />}

      {viewMode === 'list' && (
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className={mobile ? 'w-full' : 'w-[150px]'}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevantie</SelectItem>
            <SelectItem value="date_desc">Nieuwste eerst</SelectItem>
            <SelectItem value="date_asc">Oudste eerst</SelectItem>
            <SelectItem value="company">Bedrijf A-Z</SelectItem>
          </SelectContent>
        </Select>
      )}

      {mobile && (
        <>
          <div className="pt-2">
            <p className="text-sm font-medium mb-2">Weergave</p>
            <ViewToggle />
          </div>
          {hasFilters && (
            <Button variant="outline" onClick={resetFilters} className="w-full">
              Filters wissen
            </Button>
          )}
        </>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {totalHits.toLocaleString('nl-NL')} stages
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container py-6">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value) }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Zoek op functie, bedrijf of stad... (druk /)"
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
          <SearchSuggestions
            query={query}
            onSelect={handleSelectSuggestion}
            visible={showSuggestions}
          />
        </div>

        {/* Mobile filter button */}
        <div className="flex items-center justify-between mb-4 sm:hidden">
          <span className="text-sm text-muted-foreground">
            {totalHits.toLocaleString('nl-NL')} stages
          </span>
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[80vh]">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <FilterControls mobile />
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Filters */}
        <div className="hidden sm:block mb-6">
          <FilterControls />
          {hasFilters && (
            <div className="mt-3">
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Filters wissen
              </Button>
            </div>
          )}
        </div>

        {/* Results */}
        {viewMode === 'map' ? (
          <MapView 
            query={query} 
            filters={{ level: level || undefined, province: province || undefined }} 
          />
        ) : loading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg border bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="space-y-2">
              {results.map((internship, i) => (
                <div key={internship.id} className="stagger-item">
                  <InternshipCard internship={internship} />
                </div>
              ))}
            </div>

            {/* Infinite scroll trigger */}
            <div ref={observerRef} className="py-8 flex justify-center">
              {loadingMore && (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              )}
              {!hasMore && results.length > 20 && (
                <p className="text-sm text-muted-foreground">
                  Alle {totalHits.toLocaleString('nl-NL')} stages geladen
                </p>
              )}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="text-center py-16 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <SearchX className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Geen stages gevonden</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {query 
                ? `We konden geen stages vinden voor "${query}". Probeer andere zoektermen of pas je filters aan.`
                : 'Pas je filters aan om stages te vinden.'}
            </p>
            {hasFilters && (
              <Button onClick={resetFilters}>
                <Sparkles className="h-4 w-4 mr-2" />
                Alle stages bekijken
              </Button>
            )}
            
            {/* Suggestions when no results */}
            {query && (
              <div className="mt-8">
                <p className="text-sm text-muted-foreground mb-3">Probeer een van deze zoektermen:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Marketing', 'IT', 'Finance', 'Zorg', 'HR'].map(term => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-3 py-1 text-sm rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <StagesContent />
    </Suspense>
  )
}
