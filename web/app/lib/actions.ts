'use server'

import { MeiliSearch } from 'meilisearch'

const meili = new MeiliSearch({
  host: process.env.MEILI_URL || 'http://46.224.211.168:7700',
  apiKey: process.env.MEILI_KEY || '6daf6cf0f21a0662676c9eb287d4c7a25e82a367',
})

const internshipsIndex = meili.index('internships')

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
  
  const res = await internshipsIndex.search<Internship>(query, {
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

export async function getInternshipById(id: string): Promise<Internship | null> {
  try {
    const doc = await internshipsIndex.getDocument<Internship>(id)
    return doc
  } catch {
    return null
  }
}
