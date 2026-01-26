'use client'

import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { useTheme } from 'next-themes'
import { searchInternships, type Internship, type SearchFilters } from '@/app/lib/actions'
import { MapPopup } from '@/components/map-popup'
import { Loader2 } from 'lucide-react'

// Custom marker icon - cleaner dot style
const defaultIcon = L.divIcon({
  html: `<div class="map-marker"></div>`,
  className: 'custom-marker-wrapper',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -8],
})

// Netherlands bounds
const NL_CENTER: [number, number] = [52.1326, 5.2913]

interface MapViewProps {
  query: string
  filters: SearchFilters
}

// Theme-aware tile layer
function TileLayerWithTheme() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Light: Stadia Alidade Smooth, Dark: Stadia Alidade Smooth Dark
  const tileUrl = mounted && resolvedTheme === 'dark'
    ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
    : 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png'

  const attribution = '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OSM</a>'

  return <TileLayer url={tileUrl} attribution={attribution} />
}

// Custom cluster icon
function createClusterCustomIcon(cluster: any) {
  const count = cluster.getChildCount()
  let sizeClass = 'small'
  
  if (count >= 100) {
    sizeClass = 'large'
  } else if (count >= 20) {
    sizeClass = 'medium'
  }

  return L.divIcon({
    html: `<div class="map-cluster map-cluster-${sizeClass}"><span>${count >= 1000 ? Math.floor(count / 1000) + 'k' : count}</span></div>`,
    className: 'map-cluster-wrapper',
    iconSize: L.point(40, 40, true),
  })
}

export function MapView({ query, filters }: MapViewProps) {
  const [markers, setMarkers] = useState<Internship[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [totalHits, setTotalHits] = useState(0)

  // Load markers using regular search (more reliable than geo search)
  const loadMarkers = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Use regular search with larger limit - clustering will handle display
      const result = await searchInternships(query, filters, 1, 1000, 'relevance')
      
      // Filter to only markers with valid coordinates
      const markersWithCoords = result.hits.filter(
        m => m.location_lat != null && m.location_lon != null
      )
      
      setMarkers(markersWithCoords)
      setTotalHits(result.totalHits)
      
      if (markersWithCoords.length === 0 && result.hits.length > 0) {
        setError('Stages gevonden, maar geen locatiedata beschikbaar')
      }
    } catch (err) {
      console.error('Failed to load markers:', err)
      setError('Kon stages niet laden')
    }
    
    setLoading(false)
  }, [query, filters])

  // Initial load and reload on filter changes
  useEffect(() => {
    loadMarkers()
  }, [loadMarkers])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render map on server
  if (!mounted) {
    return (
      <div className="h-[calc(100vh-180px)] min-h-[400px] rounded-lg border bg-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="relative h-[calc(100vh-180px)] min-h-[400px] rounded-lg border overflow-hidden">
      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-4 right-4 z-[1000] bg-background/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2 shadow-sm border">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Laden...</span>
        </div>
      )}
      
      {/* Count badge */}
      <div className="absolute top-4 left-4 z-[1000] bg-background/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border">
        <span className="text-xs font-medium">
          {markers.length.toLocaleString('nl-NL')} van {totalHits.toLocaleString('nl-NL')} stages op kaart
        </span>
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute top-14 left-4 z-[1000] bg-destructive/10 text-destructive rounded-md px-3 py-2 text-xs max-w-[220px]">
          {error}
        </div>
      )}

      <MapContainer
        center={NL_CENTER}
        zoom={8}
        className="h-full w-full"
        scrollWheelZoom={true}
        minZoom={7}
        maxZoom={18}
        zoomControl={true}
      >
        <TileLayerWithTheme />
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          animate={false}
          disableClusteringAtZoom={15}
          removeOutsideVisibleBounds={true}
        >
          {markers.map(internship => (
            <Marker
              key={internship.id}
              position={[internship.location_lat!, internship.location_lon!]}
              icon={defaultIcon}
            >
              <Popup className="map-popup" maxWidth={300} minWidth={260}>
                <MapPopup internship={internship} />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  )
}
