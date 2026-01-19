'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Clock, TrendingUp } from 'lucide-react'

interface SearchSuggestionsProps {
  query: string
  onSelect: (term: string) => void
  visible: boolean
}

const popularSearches = [
  'Marketing', 'Software Developer', 'Finance', 'HR', 'Data Analyst',
  'Grafisch ontwerp', 'Administratie', 'Zorg', 'Techniek', 'Logistiek'
]

export function SearchSuggestions({ query, onSelect, visible }: SearchSuggestionsProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  if (!visible) return null

  const filteredPopular = query
    ? popularSearches.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : popularSearches.slice(0, 5)

  const filteredRecent = query
    ? recentSearches.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 3)
    : recentSearches.slice(0, 3)

  if (filteredPopular.length === 0 && filteredRecent.length === 0) return null

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
      {/* Recent searches */}
      {filteredRecent.length > 0 && (
        <div className="p-2">
          <p className="text-xs text-muted-foreground px-2 py-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Recent
          </p>
          {filteredRecent.map((term) => (
            <button
              key={term}
              onClick={() => onSelect(term)}
              className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors flex items-center gap-2"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              {term}
            </button>
          ))}
        </div>
      )}

      {/* Popular searches */}
      {filteredPopular.length > 0 && (
        <div className={`p-2 ${filteredRecent.length > 0 ? 'border-t' : ''}`}>
          <p className="text-xs text-muted-foreground px-2 py-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Populair
          </p>
          {filteredPopular.map((term) => (
            <button
              key={term}
              onClick={() => onSelect(term)}
              className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors flex items-center gap-2"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function saveRecentSearch(term: string) {
  if (!term.trim()) return
  
  const saved = localStorage.getItem('recentSearches')
  let recent: string[] = saved ? JSON.parse(saved) : []
  
  // Remove if already exists
  recent = recent.filter(s => s.toLowerCase() !== term.toLowerCase())
  
  // Add to front
  recent.unshift(term)
  
  // Keep only last 10
  recent = recent.slice(0, 10)
  
  localStorage.setItem('recentSearches', JSON.stringify(recent))
}
