import Link from "next/link"
import { MapPin } from "lucide-react"
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

export function InternshipCard({ internship }: InternshipCardProps) {
  return (
    <Link
      href={`/stages/${internship.id}`}
      className="group block p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">
            {internship.company_name}
          </p>
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
      
      <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        <span className="truncate">
          {internship.location_city}
          {internship.location_province && `, ${internship.location_province}`}
        </span>
      </div>
    </Link>
  )
}
