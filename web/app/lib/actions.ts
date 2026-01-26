'use server'

import { MeiliSearch } from 'meilisearch'

function getMeiliClient() {
  return new MeiliSearch({
    host: process.env.MEILI_URL || 'http://localhost:7700',
    apiKey: process.env.MEILI_KEY,
  })
}

function getInternshipsIndex() {
  return getMeiliClient().index('internships')
}

export interface Internship {
  id: string
  source: string
  title: string
  description: string
  media: string[]
  company_name: string
  company_site: string | null
  company_logo: string | null
  apply_option: 'email' | 'link'
  apply_value: string
  location_street: string | null
  location_zip: string | null
  location_city: string
  location_province: string | null
  location_country: string
  location_lat: number | null
  location_lon: number | null
  level: string | null
  sublevel: string | null
  keywords: string[]
  start_date: string | null
  end_date: string | null
  updated_at: string
}

export interface SearchFilters {
  level?: string
  city?: string
  province?: string
  source?: string
}

export type SortOption = 'relevance' | 'date_desc' | 'date_asc' | 'company'

export interface FacetDistribution {
  level?: Record<string, number>
  location_province?: Record<string, number>
  location_city?: Record<string, number>
  source?: Record<string, number>
}

export interface SearchResult {
  hits: Internship[]
  totalHits: number
  processingTimeMs: number
  facetDistribution: FacetDistribution
  page: number
  totalPages: number
}

const sortMapping: Record<SortOption, string[]> = {
  relevance: [],
  date_desc: ['updated_at:desc'],
  date_asc: ['updated_at:asc'],
  company: ['company_name:asc'],
}

export async function searchInternships(
  query: string,
  filters: SearchFilters = {},
  page: number = 1,
  hitsPerPage: number = 20,
  sort: SortOption = 'relevance'
): Promise<SearchResult> {
  const filterArray: string[] = []
  
  if (filters.level) filterArray.push(`level = "${filters.level}"`)
  if (filters.city) filterArray.push(`location_city = "${filters.city}"`)
  if (filters.province) filterArray.push(`location_province = "${filters.province}"`)
  if (filters.source) filterArray.push(`source = "${filters.source}"`)
  
  const res = await getInternshipsIndex().search<Internship>(query, {
    filter: filterArray.length > 0 ? filterArray.join(' AND ') : undefined,
    page,
    hitsPerPage,
    sort: sortMapping[sort],
    facets: ['level', 'location_province', 'location_city', 'source'],
  })
  
  const totalHits = (res as any).totalHits ?? res.estimatedTotalHits ?? res.hits.length
  
  return {
    hits: res.hits,
    totalHits,
    processingTimeMs: res.processingTimeMs,
    facetDistribution: (res.facetDistribution || {}) as FacetDistribution,
    page,
    totalPages: Math.ceil(totalHits / hitsPerPage),
  }
}

export interface GeoBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface GeoSearchResult {
  hits: Internship[]
  totalHits: number
}

export async function searchInternshipsGeo(
  query: string,
  filters: SearchFilters = {},
  bounds: GeoBounds,
  limit: number = 500
): Promise<GeoSearchResult> {
  const filterArray: string[] = []
  
  // Add geo bounding box filter
  // Meilisearch format: _geoBoundingBox([topRightLat, topRightLng], [bottomLeftLat, bottomLeftLng])
  filterArray.push(`_geoBoundingBox([${bounds.north}, ${bounds.east}], [${bounds.south}, ${bounds.west}])`)
  
  // Add other filters
  if (filters.level) filterArray.push(`level = "${filters.level}"`)
  if (filters.city) filterArray.push(`location_city = "${filters.city}"`)
  if (filters.province) filterArray.push(`location_province = "${filters.province}"`)
  if (filters.source) filterArray.push(`source = "${filters.source}"`)
  
  try {
    const res = await getInternshipsIndex().search<Internship>(query, {
      filter: filterArray.join(' AND '),
      limit,
      attributesToRetrieve: [
        'id', 'title', 'company_name', 'company_logo',
        'location_city', 'location_province', 'location_lat', 'location_lon',
        'level'
      ],
    })
    
    const totalHits = (res as any).totalHits ?? res.estimatedTotalHits ?? res.hits.length
    
    return {
      hits: res.hits,
      totalHits,
    }
  } catch (error) {
    console.error('Geo search failed:', error)
    return { hits: [], totalHits: 0 }
  }
}

export async function getInternshipById(id: string): Promise<Internship | null> {
  try {
    const doc = await getInternshipsIndex().getDocument<Internship>(id)
    return doc
  } catch {
    return null
  }
}

export async function getRelatedInternships(
  internship: Internship,
  limit: number = 4
): Promise<Internship[]> {
  try {
    // Search for similar internships by location and level
    const filterArray: string[] = []
    
    // Try to match same province
    if (internship.location_province) {
      filterArray.push(`location_province = "${internship.location_province}"`)
    }
    
    // Try to match same level
    if (internship.level) {
      filterArray.push(`level = "${internship.level}"`)
    }
    
    // Build search query from title keywords
    const titleWords = internship.title
      ?.split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 3)
      .join(' ') || ''
    
    const res = await getInternshipsIndex().search<Internship>(titleWords, {
      filter: filterArray.length > 0 ? filterArray.join(' AND ') : undefined,
      limit: limit + 1, // Fetch one extra in case current internship is in results
    })
    
    // Filter out current internship
    let hits = res.hits.filter(h => h.id !== internship.id).slice(0, limit)
    
    // If not enough results, try broader search
    if (hits.length < limit && internship.level) {
      const broaderRes = await getInternshipsIndex().search<Internship>('', {
        filter: `level = "${internship.level}"`,
        limit: limit + 1,
      })
      
      const existingIds = new Set(hits.map(h => h.id))
      existingIds.add(internship.id) // Exclude current
      
      for (const hit of broaderRes.hits) {
        if (!existingIds.has(hit.id) && hits.length < limit) {
          hits.push(hit)
        }
      }
    }
    
    return hits
  } catch (error) {
    console.error('Failed to fetch related internships:', error)
    return []
  }
}

export interface Stats {
  totalStages: number
  totalCompanies: number
  totalCities: number
  totalProvinces: number
  sourceBreakdown: Record<string, number>
  levelBreakdown: Record<string, number>
}

export async function getStats(): Promise<Stats> {
  try {
    // Get total count and facets (only filterable attributes)
    const res = await getInternshipsIndex().search('', {
      limit: 0,
      facets: ['source', 'level', 'location_city', 'location_province'],
    })
    
    const facets = res.facetDistribution || {}
    
    return {
      totalStages: res.estimatedTotalHits || 0,
      totalCompanies: 0, // Not available as facet
      totalCities: Object.keys(facets.location_city || {}).length,
      totalProvinces: Object.keys(facets.location_province || {}).length,
      sourceBreakdown: facets.source || {},
      levelBreakdown: facets.level || {},
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return {
      totalStages: 0,
      totalCompanies: 0,
      totalCities: 0,
      totalProvinces: 0,
      sourceBreakdown: {},
      levelBreakdown: {},
    }
  }
}
