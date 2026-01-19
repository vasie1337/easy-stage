'use client'

import { useState } from 'react'

type MediaItem = string | { url?: string; type?: string; embedCode?: string | null }

interface MediaGalleryProps {
  media: MediaItem[] | null | undefined
}

function extractUrl(item: MediaItem): string | null {
  if (!item) return null
  
  // If it's a string, use it directly
  if (typeof item === 'string') {
    const trimmed = item.trim()
    if (trimmed === '') return null
    // Handle relative URLs
    if (trimmed.startsWith('/')) {
      return `https://stagemarkt.nl${trimmed}`
    }
    return trimmed
  }
  
  // If it's an object with a url property
  if (typeof item === 'object' && item.url) {
    return item.url
  }
  
  return null
}

function MediaImage({ src }: { src: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  if (status === 'error') return null

  return (
    <div
      className={`relative shrink-0 w-64 h-40 rounded-lg overflow-hidden bg-muted ${
        status === 'loading' ? 'animate-pulse' : ''
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          status === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
        loading="lazy"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
    </div>
  )
}

export function MediaGallery({ media }: MediaGalleryProps) {
  if (!media || !Array.isArray(media) || media.length === 0) return null
  
  // Extract URLs from media items (handles both string[] and object[])
  const validUrls = media
    .map(extractUrl)
    .filter((url): url is string => url !== null && url.startsWith('http'))

  if (validUrls.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
        {validUrls.map((url, i) => (
          <MediaImage key={`${i}-${url.slice(-20)}`} src={url} />
        ))}
      </div>
    </div>
  )
}
