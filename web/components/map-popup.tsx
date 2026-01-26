'use client'

import Link from 'next/link'
import { MapPin, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Internship } from '@/app/lib/actions'

const levelLabels: Record<string, string> = {
  mbo1: 'MBO 1',
  mbo2: 'MBO 2',
  mbo3: 'MBO 3',
  mbo4: 'MBO 4',
  mbo: 'MBO',
  hbo: 'HBO',
  wo: 'WO',
}

function getInitials(name: string): string {
  return name
    ?.split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '?'
}

interface MapPopupProps {
  internship: Internship
}

export function MapPopup({ internship }: MapPopupProps) {
  return (
    <div className="p-1">
      <div className="flex gap-3">
        {/* Company logo/initials */}
        <div className="shrink-0">
          {internship.company_logo ? (
            <img
              src={internship.company_logo}
              alt=""
              className="w-10 h-10 rounded-lg object-cover bg-muted"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
                ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground ${internship.company_logo ? 'hidden' : ''}`}>
            {getInitials(internship.company_name)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate mb-0.5">
            {internship.company_name}
          </p>
          <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-tight">
            {internship.title}
          </h3>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">
            {internship.location_city}
          </span>
        </span>
        {internship.level && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {levelLabels[internship.level] || internship.level.toUpperCase()}
          </Badge>
        )}
      </div>

      {/* Action */}
      <Link
        href={`/stages/${internship.id}`}
        className="mt-3 flex items-center justify-center gap-1.5 w-full px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Bekijk stage
        <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  )
}
