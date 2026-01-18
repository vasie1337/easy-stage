import { Internship } from '../lib/meili'

interface Props {
  internship: Internship
}

export function InternshipCard({ internship }: Props) {
  const levelLabels: Record<string, string> = {
    mbo1: 'MBO 1',
    mbo2: 'MBO 2',
    mbo3: 'MBO 3',
    mbo4: 'MBO 4',
    hbo: 'HBO',
    wo: 'WO',
  }

  return (
    <article className="group p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {internship.company_logo ? (
          <img
            src={internship.company_logo}
            alt=""
            className="w-14 h-14 rounded-xl object-contain bg-zinc-50 dark:bg-zinc-800 p-1 flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {internship.company_name?.charAt(0) || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
            {internship.title || 'Geen titel'}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 font-medium">
            {internship.company_name || 'Onbekend bedrijf'}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {internship.level && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            {levelLabels[internship.level] || internship.level}
          </span>
        )}
        {internship.location_city && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            📍 {internship.location_city}
          </span>
        )}
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500">
          {internship.source === 'stagemarkt' ? 'Stagemarkt' : 'NVB'}
        </span>
      </div>

      {/* Description */}
      {internship.description && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
          {internship.description.slice(0, 180)}
          {internship.description.length > 180 && '...'}
        </p>
      )}

      {/* Keywords */}
      {internship.keywords && internship.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {internship.keywords.slice(0, 4).map((keyword, i) => (
            <span 
              key={i} 
              className="px-2 py-0.5 rounded text-xs bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700"
            >
              {keyword}
            </span>
          ))}
          {internship.keywords.length > 4 && (
            <span className="px-2 py-0.5 text-xs text-zinc-400">
              +{internship.keywords.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="text-xs text-zinc-400 space-x-3">
          {internship.start_date && (
            <span>Start {new Date(internship.start_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
          )}
        </div>
        <a
          href={internship.apply_option === 'email' ? `mailto:${internship.apply_value}` : internship.apply_value}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
        >
          {internship.apply_option === 'email' ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              E-mail
            </>
          ) : (
            <>
              Bekijk
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </a>
      </div>
    </article>
  )
}
