'use client'

import { Badge } from "@/components/ui/badge"

interface KeywordsSectionProps {
  keywords: string[] | null | undefined
}

export function KeywordsSection({ keywords }: KeywordsSectionProps) {
  if (!keywords || keywords.length === 0) return null

  // Separate short keywords (tags) from long ones (descriptions/requirements)
  const shortKeywords: string[] = []
  const longKeywords: string[] = []

  // Patterns that indicate requirements, not skills
  const requirementPatterns = [
    /^je /i,
    /^u /i,
    /^wij /i,
    /^we /i,
    /niveau \d/i,
  ]

  keywords.forEach(keyword => {
    if (!keyword || typeof keyword !== 'string') return
    
    const trimmed = keyword.trim()
    if (!trimmed) return

    // Skip if it looks like a requirement
    const isRequirement = requirementPatterns.some(p => p.test(trimmed))
    if (isRequirement) return

    // Short keywords (< 40 chars) as badges, longer as list
    if (trimmed.length <= 40) {
      shortKeywords.push(trimmed)
    } else if (trimmed.length <= 100) {
      longKeywords.push(trimmed)
    }
    // Skip very long ones (> 100 chars) - they're probably not useful
  })

  // Remove duplicates
  const uniqueShort = [...new Set(shortKeywords)]
  const uniqueLong = [...new Set(longKeywords)]

  if (uniqueShort.length === 0 && uniqueLong.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="font-semibold mb-3">Vaardigheden</h2>
      
      {/* Short keywords as badges */}
      {uniqueShort.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {uniqueShort.slice(0, 12).map((keyword, i) => (
            <Badge key={i} variant="secondary" className="font-normal">
              {keyword}
            </Badge>
          ))}
          {uniqueShort.length > 12 && (
            <span className="text-sm text-muted-foreground self-center">
              +{uniqueShort.length - 12} meer
            </span>
          )}
        </div>
      )}

      {/* Longer keywords as compact list */}
      {uniqueLong.length > 0 && (
        <ul className="text-sm text-muted-foreground space-y-1 mt-2">
          {uniqueLong.slice(0, 6).map((keyword, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-muted-foreground/50 mt-1">•</span>
              <span>{keyword}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
