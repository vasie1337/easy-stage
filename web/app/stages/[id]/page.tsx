import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowLeft, Calendar, Building2, Globe, Mail, ExternalLink } from "lucide-react"
import { getInternshipById, getRelatedInternships } from "@/app/lib/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { MediaGallery } from "@/components/media-gallery"
import { KeywordsSection } from "@/components/keywords-section"
import { DescriptionSection } from "@/components/description-section"
import { InternshipCard } from "@/components/internship-card"
import { LocationCard } from "@/components/location-card"
import { Logo } from "@/components/logo"

const levelLabels: Record<string, string> = {
  mbo1: 'MBO 1',
  mbo2: 'MBO 2',
  mbo3: 'MBO 3',
  mbo4: 'MBO 4',
  mbo: 'MBO',
  hbo: 'HBO',
  wo: 'WO',
}

// Dynamic metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const internship = await getInternshipById(id)

  if (!internship) {
    return {
      title: "Stage niet gevonden",
    }
  }

  const levelLabel = internship.level ? levelLabels[internship.level] || internship.level.toUpperCase() : ''
  const location = [internship.location_city, internship.location_province].filter(Boolean).join(', ')
  
  const title = `${internship.title} bij ${internship.company_name}`
  const description = `${levelLabel} stage bij ${internship.company_name}${location ? ` in ${location}` : ''}. ${internship.description?.slice(0, 150) || 'Bekijk deze stageplek en solliciteer direct.'}...`

  return {
    title,
    description,
    keywords: [
      internship.title,
      internship.company_name,
      'stage',
      levelLabel,
      internship.location_city,
      internship.location_province,
      ...(internship.keywords || []),
    ].filter((k): k is string => Boolean(k)),
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://easystage.nl/stages/${id}`,
      images: internship.media?.[0] ? [
        {
          url: internship.media[0],
          width: 800,
          height: 600,
          alt: internship.title,
        }
      ] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: internship.media?.[0] ? [internship.media[0]] : undefined,
    },
    alternates: {
      canonical: `https://easystage.nl/stages/${id}`,
    },
  }
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

function isNew(dateStr: string | null): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 7
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

  const relatedInternships = await getRelatedInternships(internship, 4)
  const isNewListing = isNew(internship.updated_at)

  const startDate = formatDate(internship.start_date)
  const endDate = formatDate(internship.end_date)
  
  const applyUrl = internship.apply_option === 'email'
    ? `mailto:${internship.apply_value}`
    : internship.apply_value

  // JSON-LD structured data for search engines
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: internship.title,
    description: internship.description || `Stage bij ${internship.company_name}`,
    datePosted: internship.updated_at,
    validThrough: internship.end_date,
    employmentType: "INTERN",
    hiringOrganization: {
      "@type": "Organization",
      name: internship.company_name,
      sameAs: internship.company_site,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress: internship.location_street,
        addressLocality: internship.location_city,
        addressRegion: internship.location_province,
        postalCode: internship.location_zip,
        addressCountry: internship.location_country || "NL",
      },
    },
    educationRequirements: internship.level ? {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: levelLabels[internship.level] || internship.level.toUpperCase(),
    } : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
          <div className="flex items-center gap-3">
            <Logo size={28} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        {/* Title section */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-2">
            {internship.level && (
              <Badge variant="secondary">
                {levelLabels[internship.level] || internship.level.toUpperCase()}
              </Badge>
            )}
            {isNewListing && (
              <Badge className="bg-green-500 hover:bg-green-500 text-white">
                Nieuw
              </Badge>
            )}
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            {internship.title}
          </h1>
          
          <p className="text-lg text-muted-foreground">
            {internship.company_name}
          </p>
        </div>

        {/* Media */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <MediaGallery media={internship.media} />
        </div>

        {/* Location Card */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <LocationCard
            street={internship.location_street}
            zip={internship.location_zip}
            city={internship.location_city}
            province={internship.location_province}
            country={internship.location_country}
            lat={internship.location_lat}
            lon={internship.location_lon}
          />
        </div>

        {/* Quick info */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[400ms]">
          <KeywordsSection keywords={internship.keywords} />
        </div>

        {/* Description */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
          <DescriptionSection description={internship.description} />
        </div>

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

        {/* Related Internships */}
        {relatedInternships.length > 0 && (
          <div className="mt-16 pt-8 border-t animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[600ms]">
            <h2 className="text-xl font-semibold mb-4">Vergelijkbare stages</h2>
            <div className="space-y-2">
              {relatedInternships.map((related) => (
                <InternshipCard key={related.id} internship={related} />
              ))}
            </div>
          </div>
        )}
      </main>
      </div>
    </>
  )
}
