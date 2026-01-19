'use client'

import { Internship } from '../lib/actions'

const levelLabels: Record<string, string> = {
  mbo1: 'MBO 1',
  mbo2: 'MBO 2',
  mbo3: 'MBO 3',
  mbo4: 'MBO 4',
  hbo: 'HBO',
  wo: 'WO',
}

const levelColors: Record<string, string> = {
  mbo1: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  mbo2: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  mbo3: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  mbo4: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  hbo: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  wo: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
}

interface InternshipCardProps {
  internship: Internship
  onClick: () => void
}

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, '') || ''
}

function truncate(text: string, length: number): string {
  const clean = stripHtml(text)
  if (clean.length <= length) return clean
  return clean.slice(0, length).trim() + '...'
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  } catch {
    return null
  }
}

export function InternshipCard({ internship, onClick }: InternshipCardProps) {
  const levelColor = internship.level ? levelColors[internship.level] || 'bg-zinc-700/50 text-zinc-400 border-zinc-600' : null
  const formattedDate = formatDate(internship.start_date)
  const description = truncate(internship.description || '', 120)
  
  return (
    <article
      onClick={onClick}
      className="group relative bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800/80 rounded-xl overflow-hidden hover:border-zinc-600 hover:shadow-lg hover:shadow-zinc-900/50 transition-all duration-200 cursor-pointer"
    >
      {/* Top accent bar based on level */}
      {internship.level && (
        <div className={`h-1 w-full ${
          internship.level.startsWith('mbo') ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
          internship.level === 'hbo' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
          'bg-gradient-to-r from-violet-500 to-purple-500'
        }`} />
      )}
      
      <div className="p-5">
        {/* Header: Company info */}
        <div className="flex items-start gap-3 mb-3">
          {internship.company_logo ? (
            <img
              src={internship.company_logo}
              alt=""
              className="w-10 h-10 rounded-lg object-cover bg-zinc-800 flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <span className="text-zinc-500 text-sm font-medium">
                {internship.company_name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-400 truncate">
              {internship.company_name || 'Onbekend bedrijf'}
            </p>
            <h2 className="font-semibold text-white group-hover:text-zinc-100 line-clamp-2 leading-snug">
              {internship.title || 'Geen titel'}
            </h2>
          </div>
        </div>
        
        {/* Description preview */}
        {description && (
          <p className="text-sm text-zinc-500 mb-4 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
        
        {/* Keywords */}
        {internship.keywords && internship.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {internship.keywords.slice(0, 3).map((keyword, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50"
              >
                {keyword}
              </span>
            ))}
            {internship.keywords.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-zinc-500">
                +{internship.keywords.length - 3}
              </span>
            )}
          </div>
        )}
        
        {/* Footer: Metadata */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-800/50">
          <div className="flex items-center gap-2 text-xs text-zinc-500 min-w-0">
            {/* Location */}
            <span className="flex items-center gap-1 truncate">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">
                {internship.location_city}
                {internship.location_province && `, ${internship.location_province}`}
              </span>
            </span>
            
            {/* Start date */}
            {formattedDate && (
              <>
                <span className="text-zinc-700">•</span>
                <span className="flex items-center gap-1 flex-shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formattedDate}
                </span>
              </>
            )}
          </div>
          
          {/* Level badge */}
          {internship.level && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded border flex-shrink-0 ${levelColor}`}>
              {levelLabels[internship.level] || internship.level.toUpperCase()}
            </span>
          )}
        </div>
      </div>
      
      {/* Source indicator */}
      <div className="absolute top-3 right-3">
        <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${
          internship.source === 'stagemarkt' ? 'bg-orange-500/20 text-orange-400' :
          internship.source === 'nvb' ? 'bg-sky-500/20 text-sky-400' :
          'bg-zinc-700/50 text-zinc-400'
        }`}>
          {internship.source}
        </span>
      </div>
    </article>
  )
}
