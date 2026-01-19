import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MapPin, Calendar, Building2, Globe, Mail, ExternalLink } from "lucide-react"
import { getInternshipById } from "@/app/lib/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { MediaGallery } from "@/components/media-gallery"
import { KeywordsSection } from "@/components/keywords-section"
import { DescriptionSection } from "@/components/description-section"

const levelLabels: Record<string, string> = {
  mbo1: 'MBO 1',
  mbo2: 'MBO 2',
  mbo3: 'MBO 3',
  mbo4: 'MBO 4',
  mbo: 'MBO',
  hbo: 'HBO',
  wo: 'WO',
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return null
  }
}

export default async function InternshipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const internship = await getInternshipById(id)

  if (!internship) {
    notFound()
  }

  const startDate = formatDate(internship.start_date)
  const endDate = formatDate(internship.end_date)
  
  const applyUrl = internship.apply_option === 'email'
    ? `mailto:${internship.apply_value}`
    : internship.apply_value

  const mapsUrl = internship.location_lat && internship.location_lon
    ? `https://www.google.com/maps?q=${internship.location_lat},${internship.location_lon}`
    : `https://www.google.com/maps/search/${encodeURIComponent(
        [internship.location_street, internship.location_zip, internship.location_city].filter(Boolean).join(', ')
      )}`

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/stages" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Terug naar zoeken</span>
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        {/* Title section */}
        <div className="mb-8">
          {internship.level && (
            <div className="mb-2">
              <Badge variant="secondary">
                {levelLabels[internship.level] || internship.level.toUpperCase()}
              </Badge>
            </div>
          )}
          
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            {internship.title}
          </h1>
          
          <p className="text-lg text-muted-foreground">
            {internship.company_name}
          </p>
        </div>

        {/* Media */}
        <MediaGallery media={internship.media} />

        {/* Quick info */}
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          {/* Location */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
          >
            <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Locatie</p>
              <p className="text-sm text-muted-foreground">
                {internship.location_street && <span>{internship.location_street}<br /></span>}
                {internship.location_zip} {internship.location_city}
                {internship.location_province && <span><br />{internship.location_province}</span>}
              </p>
            </div>
          </a>

          {/* Dates */}
          {(startDate || endDate) && (
            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Periode</p>
                <p className="text-sm text-muted-foreground">
                  {startDate && <span>Start: {startDate}</span>}
                  {startDate && endDate && <br />}
                  {endDate && <span>Eind: {endDate}</span>}
                </p>
              </div>
            </div>
          )}

          {/* Company */}
          <div className="flex items-start gap-3 p-4 rounded-lg border">
            <Building2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-medium">Bedrijf</p>
              <p className="text-sm text-muted-foreground truncate">
                {internship.company_name}
              </p>
              {internship.company_site && (
                <a
                  href={internship.company_site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  <Globe className="h-3 w-3" />
                  Website
                </a>
              )}
            </div>
          </div>

          {/* Apply method */}
          <div className="flex items-start gap-3 p-4 rounded-lg border">
            {internship.apply_option === 'email' ? (
              <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            ) : (
              <ExternalLink className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <p className="font-medium">Solliciteren via</p>
              <p className="text-sm text-muted-foreground truncate">
                {internship.apply_option === 'email' ? internship.apply_value : 'Externe website'}
              </p>
            </div>
          </div>
        </div>

        {/* Keywords */}
        <KeywordsSection keywords={internship.keywords} />

        {/* Description */}
        <DescriptionSection description={internship.description} />

        {/* Apply CTA */}
        <div className="sticky bottom-4 flex justify-center pt-4">
          <Button asChild size="lg" className="shadow-lg">
            <a href={applyUrl} target="_blank" rel="noopener noreferrer">
              {internship.apply_option === 'email' ? (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Solliciteer via e-mail
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Bekijk vacature
                </>
              )}
            </a>
          </Button>
        </div>
      </main>
    </div>
  )
}
