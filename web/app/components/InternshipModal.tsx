'use client'

import { useEffect, useCallback } from 'react'
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
  mbo1: 'bg-emerald-500/20 text-emerald-400',
  mbo2: 'bg-emerald-500/20 text-emerald-400',
  mbo3: 'bg-teal-500/20 text-teal-400',
  mbo4: 'bg-teal-500/20 text-teal-400',
  hbo: 'bg-blue-500/20 text-blue-400',
  wo: 'bg-violet-500/20 text-violet-400',
}

interface InternshipModalProps {
  internship: Internship | null
  onClose: () => void
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('nl-NL', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return null
  }
}

function formatDescription(html: string): string {
  // Basic HTML cleanup for display
  return html
    ?.replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?p>/gi, '\n')
    .replace(/<\/?li>/gi, '\n• ')
    .replace(/<\/?ul>/gi, '\n')
    .replace(/<\/?ol>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim() || ''
}

export function InternshipModal({ internship, onClose }: InternshipModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  if (!internship) return null

  const levelColor = internship.level ? levelColors[internship.level] || 'bg-zinc-700/50 text-zinc-400' : null
  const startDate = formatDate(internship.start_date)
  const endDate = formatDate(internship.end_date)
  const description = formatDescription(internship.description || '')
  
  const applyUrl = internship.apply_option === 'email' 
    ? `mailto:${internship.apply_value}` 
    : internship.apply_value

  const googleMapsUrl = internship.location_lat && internship.location_lon
    ? `https://www.google.com/maps?q=${internship.location_lat},${internship.location_lon}`
    : internship.location_city 
    ? `https://www.google.com/maps/search/${encodeURIComponent(
        [internship.location_street, internship.location_zip, internship.location_city].filter(Boolean).join(', ')
      )}`
    : null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-8"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl mt-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-6 py-4">
          <div className="flex items-start gap-4">
            {internship.company_logo ? (
              <img
                src={internship.company_logo}
                alt=""
                className="w-14 h-14 rounded-xl object-cover bg-zinc-800 flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <span className="text-zinc-500 text-xl font-semibold">
                  {internship.company_name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-zinc-400">
                  {internship.company_name || 'Onbekend bedrijf'}
                </span>
                <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  internship.source === 'stagemarkt' ? 'bg-orange-500/20 text-orange-400' :
                  internship.source === 'nvb' ? 'bg-sky-500/20 text-sky-400' :
                  'bg-zinc-700/50 text-zinc-400'
                }`}>
                  {internship.source}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-white leading-tight">
                {internship.title || 'Geen titel'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Media */}
        {internship.media && internship.media.length > 0 && (
          <div className="px-6 pt-4">
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-thin scrollbar-thumb-zinc-700">
              {internship.media.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="h-32 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Quick Info Bar */}
        <div className="px-6 py-4 flex flex-wrap gap-3 border-b border-zinc-800/50">
          {/* Level */}
          {internship.level && (
            <span className={`px-3 py-1.5 text-sm font-medium rounded-lg ${levelColor}`}>
              {levelLabels[internship.level] || internship.level.toUpperCase()}
            </span>
          )}
          
          {/* Location */}
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-zinc-800 text-zinc-300">
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {internship.location_city}
            {internship.location_province && `, ${internship.location_province}`}
          </span>
          
          {/* Dates */}
          {startDate && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-zinc-800 text-zinc-300">
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {startDate}
              {endDate && ` - ${endDate}`}
            </span>
          )}
        </div>
        
        {/* Description */}
        <div className="px-6 py-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            Omschrijving
          </h3>
          <div className="text-zinc-300 leading-relaxed whitespace-pre-line">
            {description || 'Geen omschrijving beschikbaar.'}
          </div>
        </div>
        
        {/* Keywords */}
        {internship.keywords && internship.keywords.length > 0 && (
          <div className="px-6 pb-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
              Vaardigheden & Keywords
            </h3>
            <div className="flex flex-wrap gap-2">
              {internship.keywords.map((keyword, i) => (
                <span
                  key={i}
                  className="px-3 py-1 text-sm rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/50"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Company & Location Details */}
        <div className="px-6 pb-5 grid sm:grid-cols-2 gap-4">
          {/* Company Info */}
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
              Bedrijf
            </h3>
            <p className="font-medium text-white mb-1">{internship.company_name}</p>
            {internship.company_site && (
              <a
                href={internship.company_site}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 break-all"
              >
                {internship.company_site.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
          
          {/* Location */}
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
              Locatie
            </h3>
            <div className="text-sm text-zinc-300 space-y-0.5">
              {internship.location_street && <p>{internship.location_street}</p>}
              <p>
                {[internship.location_zip, internship.location_city].filter(Boolean).join(' ')}
              </p>
              {internship.location_province && (
                <p className="text-zinc-500">{internship.location_province}</p>
              )}
            </div>
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-sm text-blue-400 hover:text-blue-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Bekijk op kaart
              </a>
            )}
          </div>
        </div>
        
        {/* Apply CTA */}
        <div className="sticky bottom-0 px-6 py-4 bg-zinc-900/95 backdrop-blur border-t border-zinc-800">
          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            {internship.apply_option === 'email' ? (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Solliciteer via e-mail
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Bekijk vacature
              </>
            )}
          </a>
        </div>
      </div>
    </div>
  )
}
