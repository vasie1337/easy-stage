import { MeiliSearch } from 'meilisearch'

export const meili = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILI_URL || 'http://46.224.211.168:7700',
  apiKey: process.env.NEXT_PUBLIC_MEILI_KEY || 'masterkey123',
})

export const internshipsIndex = meili.index('internships')

export interface Internship {
  id: string
  source: string
  title: string
  description: string
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

export async function searchInternships(
  query: string,
  filters: SearchFilters = {},
  page: number = 1,
  hitsPerPage: number = 20
) {
  const filterArray: string[] = []
  
  if (filters.level) filterArray.push(`level = "${filters.level}"`)
  if (filters.city) filterArray.push(`location_city = "${filters.city}"`)
  if (filters.province) filterArray.push(`location_province = "${filters.province}"`)
  if (filters.source) filterArray.push(`source = "${filters.source}"`)
  
  return internshipsIndex.search<Internship>(query, {
    filter: filterArray.length > 0 ? filterArray.join(' AND ') : undefined,
    page,
    hitsPerPage,
    attributesToHighlight: ['title', 'description', 'company_name'],
  })
}
