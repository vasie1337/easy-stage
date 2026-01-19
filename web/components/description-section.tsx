'use client'

interface DescriptionSectionProps {
  description: string | null | undefined
}

function isHtml(text: string): boolean {
  // Check if text contains HTML tags
  return /<[a-z][\s\S]*>/i.test(text)
}

function cleanHtmlDescription(html: string): string {
  // Light cleanup - remove empty tags, normalize whitespace
  return html
    .replace(/<(\w+)[^>]*>\s*<\/\1>/g, '') // Remove empty tags
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function formatPlainText(text: string): string {
  // For plain text descriptions, apply the same cleanup as before
  const noisePatterns = [
    /^headerafbeelding$/i,
    /^tel:?\s*$/i,
    /^e-?mail:?\s*$/i,
    /^telefoon:?\s*$/i,
    /^website:?\s*$/i,
    /^adres:?\s*$/i,
    /^contact:?\s*$/i,
    /^,\s*$/,
    /^\s*,\s+\w+$/,
  ]

  const lines = text.split('\n').map(line => line.trim())
  
  const cleanLines = lines.filter(line => {
    if (!line) return false
    for (const pattern of noisePatterns) {
      if (pattern.test(line)) return false
    }
    return true
  })

  // Remove duplicates
  const uniqueLines: string[] = []
  for (const line of cleanLines) {
    const isDuplicate = uniqueLines.slice(-5).some(
      prev => prev.length > 20 && line.length > 20 && 
              (prev === line || prev.includes(line) || line.includes(prev))
    )
    if (!isDuplicate) {
      uniqueLines.push(line)
    }
  }

  return uniqueLines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function DescriptionSection({ description }: DescriptionSectionProps) {
  if (!description) return null

  const hasHtml = isHtml(description)

  return (
    <div className="mb-8">
      <h2 className="font-semibold mb-3">Omschrijving</h2>
      
      {hasHtml ? (
        <div 
          className="prose prose-sm prose-neutral dark:prose-invert max-w-none
            prose-headings:font-semibold prose-headings:text-foreground
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-li:text-muted-foreground
            prose-ul:my-2 prose-ol:my-2
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: cleanHtmlDescription(description) }}
        />
      ) : (
        <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
          {formatPlainText(description)}
        </p>
      )}
    </div>
  )
}
