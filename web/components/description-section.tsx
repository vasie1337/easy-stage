'use client'

interface DescriptionSectionProps {
  description: string | null | undefined
}

function isHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text)
}

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&ndash;': '–',
    '&mdash;': '—',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&ldquo;': '\u201C',
    '&rdquo;': '\u201D',
    '&bull;': '•',
    '&hellip;': '…',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&euro;': '€',
    // Dutch/accented characters
    '&eacute;': 'é',
    '&egrave;': 'è',
    '&euml;': 'ë',
    '&iuml;': 'ï',
    '&ouml;': 'ö',
    '&uuml;': 'ü',
    '&aacute;': 'á',
    '&agrave;': 'à',
    '&auml;': 'ä',
    '&oacute;': 'ó',
    '&ograve;': 'ò',
    '&uacute;': 'ú',
    '&ugrave;': 'ù',
    '&ccedil;': 'ç',
    '&ntilde;': 'ñ',
  }
  
  let result = text
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'gi'), char)
  }
  
  // Handle numeric entities like &#39; &#x27;
  result = result.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
  result = result.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  
  return result
}

function cleanHtmlDescription(html: string): string {
  let result = html
  
  // Remove common navigation/noise elements
  const noisePatterns = [
    /<nav[^>]*>[\s\S]*?<\/nav>/gi,
    /<header[^>]*>[\s\S]*?<\/header>/gi,
    /<footer[^>]*>[\s\S]*?<\/footer>/gi,
    /<aside[^>]*>[\s\S]*?<\/aside>/gi,
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /<style[^>]*>[\s\S]*?<\/style>/gi,
  ]
  
  for (const pattern of noisePatterns) {
    result = result.replace(pattern, '')
  }
  
  // Add line breaks before block elements for proper spacing
  result = result.replace(/<(h[1-6]|p|div|li|tr|dt|dd)[^>]*>/gi, '\n<$1>')
  
  // Add space after closing tags that might run together
  result = result.replace(/<\/(span|strong|b|em|i|a|label)>/gi, '</$1> ')
  
  // Remove common job listing metadata labels (we show these elsewhere)
  const metaLabels = [
    /Job\s*Title\s*/gi,
    /Job\s*Location\s*/gi,
    /Location\s*:/gi,
    /Functie\s*titel\s*/gi,
    /Locatie\s*:/gi,
    /Standplaats\s*:/gi,
  ]
  for (const pattern of metaLabels) {
    result = result.replace(pattern, '')
  }
  
  // Remove empty tags
  result = result.replace(/<(\w+)[^>]*>\s*<\/\1>/g, '')
  
  // Decode HTML entities
  result = decodeHtmlEntities(result)
  
  // Clean up multiple spaces
  result = result.replace(/  +/g, ' ')
  
  return result.trim()
}

function formatPlainText(text: string): string {
  // Decode entities first
  let result = decodeHtmlEntities(text)
  
  const noisePatterns = [
    /^menu$/i,
    /^waar ben je naar op zoek\??$/i,
    /^headerafbeelding$/i,
    /^tel:?\s*$/i,
    /^e-?mail:?\s*$/i,
    /^telefoon:?\s*$/i,
    /^website:?\s*$/i,
    /^adres:?\s*$/i,
    /^contact:?\s*$/i,
    /^vragen\??$/i,
    /^geïnteresseerd\??$/i,
    /^,\s*$/,
    /^\d+$/,  // Just numbers (like step numbers)
    /^onze recruiters/i,
    /^je hebt de baan/i,
  ]

  const lines = result.split('\n').map(line => line.trim())
  
  const cleanLines = lines.filter(line => {
    if (!line) return false
    for (const pattern of noisePatterns) {
      if (pattern.test(line)) return false
    }
    return true
  })

  // Remove duplicates
  const uniqueLines: string[] = []
  const seenLines = new Set<string>()
  
  for (const line of cleanLines) {
    // Normalize for comparison
    const normalized = line.toLowerCase().replace(/\s+/g, ' ').trim()
    
    // Skip if we've seen this exact line or a very similar one
    if (seenLines.has(normalized)) continue
    if (normalized.length > 20) {
      // Check for substring duplicates
      let isDupe = false
      for (const seen of seenLines) {
        if (seen.length > 20 && (seen.includes(normalized) || normalized.includes(seen))) {
          isDupe = true
          break
        }
      }
      if (isDupe) continue
    }
    
    seenLines.add(normalized)
    uniqueLines.push(line)
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
            prose-headings:font-semibold prose-headings:text-foreground prose-headings:mt-4 prose-headings:mb-2
            prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-2
            prose-li:text-muted-foreground prose-li:my-0.5
            prose-ul:my-2 prose-ol:my-2
            prose-strong:text-foreground
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
