'use client'

import { MapPin, Navigation, ExternalLink } from 'lucide-react'

interface LocationCardProps {
  street?: string | null
  zip?: string | null
  city: string
  province?: string | null
  country?: string
  lat?: number | null
  lon?: number | null
  className?: string
}

export function LocationCard({
  street,
  zip,
  city,
  province,
  country = 'NL',
  lat,
  lon,
  className = '',
}: LocationCardProps) {
  const hasCoords = lat !== null && lon !== null && lat !== undefined && lon !== undefined
  
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lon}`
    : `https://www.google.com/maps/search/${encodeURIComponent(
        [street, zip, city, province].filter(Boolean).join(', ')
      )}`

  const addressLines = [
    street,
    [zip, city].filter(Boolean).join(' '),
    province,
  ].filter(Boolean)

  return (
    <div className={`rounded-xl border bg-card overflow-hidden ${className}`}>
      {/* Address Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground mb-1">Locatie</h3>
              <div className="text-sm text-muted-foreground space-y-0.5">
                {addressLines.map((line, i) => (
                  <p key={i} className="truncate">{line}</p>
                ))}
                {country && country !== 'NL' && (
                  <p className="text-xs text-muted-foreground/70">{country}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action button */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Bekijk op kaart
        </a>
      </div>
    </div>
  )
}
