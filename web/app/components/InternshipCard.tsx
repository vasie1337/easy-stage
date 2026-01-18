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
    <a
      href={internship.apply_option === 'email' ? `mailto:${internship.apply_value}` : internship.apply_value}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-lg border border-zinc-200 p-5 hover:border-zinc-400 transition-colors"
    >
      {/* Company */}
      <p className="text-sm text-zinc-500 mb-1">
        {internship.company_name || 'Onbekend'}
      </p>

      {/* Title */}
      <h2 className="font-semibold text-zinc-900 mb-3 line-clamp-2">
        {internship.title || 'Geen titel'}
      </h2>

      {/* Meta */}
      <div className="flex flex-wrap gap-2 text-xs">
        {internship.level && (
          <span className="px-2 py-1 rounded bg-zinc-100 text-zinc-600">
            {levelLabels[internship.level] || internship.level}
          </span>
        )}
        {internship.location_city && (
          <span className="px-2 py-1 rounded bg-zinc-100 text-zinc-600">
            {internship.location_city}
          </span>
        )}
        <span className="px-2 py-1 rounded bg-zinc-100 text-zinc-500">
          {internship.source === 'stagemarkt' ? 'Stagemarkt' : 'NVB'}
        </span>
      </div>
    </a>
  )
}
