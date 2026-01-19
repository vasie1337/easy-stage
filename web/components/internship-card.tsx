'use client'

import Link from "next/link"
import { MapPin, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Internship } from "@/app/lib/actions"

const levelLabels: Record<string, string> = {
  mbo1: 'MBO 1',
  mbo2: 'MBO 2',
  mbo3: 'MBO 3',
  mbo4: 'MBO 4',
  mbo: 'MBO',
  hbo: 'HBO',
  wo: 'WO',
}

interface InternshipCardProps {
  internship: Internship
}

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() || ''
}

function getInitials(name: string): string {
  return name
    ?.split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '?'
}

export function InternshipCard({ internship }: InternshipCardProps) {
  const description = stripHtml(internship.description || '').slice(0, 120)

  return (
    <Link
      href={`/stages/${internship.id}`}
      className="group block p-4 rounded-lg border bg-card hover:bg-accent/50 hover:border-accent transition-all duration-200 hover:shadow-md"
    >
      <div className="flex gap-4">
        {/* Company logo/initials */}
        <div className="shrink-0">
          {internship.company_logo ? (
            <img
              src={internship.company_logo}
              alt=""
              className="w-12 h-12 rounded-lg object-cover bg-muted"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
                ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className={`w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-sm font-medium text-secondary-foreground ${internship.company_logo ? 'hidden' : ''}`}>
            {getInitials(internship.company_name)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground truncate">
                  {internship.company_name}
                </p>
              </div>
              <h3 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {internship.title}
              </h3>
            </div>
            {internship.level && (
              <Badge variant="secondary" className="shrink-0">
                {levelLabels[internship.level] || internship.level.toUpperCase()}
              </Badge>
            )}
          </div>
          
          {/* Description preview */}
          {description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
              {description}...
            </p>
          )}
          
          {/* Meta */}
          <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">
                {internship.location_city}
                {internship.location_province && `, ${internship.location_province}`}
              </span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
