'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { useTheme } from 'next-themes'
import { searchInternships, searchInternshipsGeo, type Internship, type SearchFilters, type GeoBounds } from '@/app/lib/actions'
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

// Component to handle viewport-based loading when zoomed in
function ViewportLoader({
  query,
  filters,
  onMarkersLoaded,
  onLoadingChange,
}: {
  query: string
  filters: SearchFilters
  onMarkersLoaded: (markers: Internship[], isViewportLoad: boolean) => void
  onLoadingChange: (loading: boolean) => void
}) {
  const map = useMap()
  const debounceRef = useRef<NodeJS.Timeout>(null)
  const lastLoadRef = useRef<string>('')

  const loadForViewport = useCallback(async () => {
    const zoom = map.getZoom()
    
    // Only do viewport-based loading when zoomed in enough
    if (zoom < 10) return
    
    const bounds = map.getBounds()
    const loadKey = `${zoom}-${bounds.getNorth().toFixed(2)}-${bounds.getSouth().toFixed(2)}`
    
    // Skip if we already loaded for this viewport
    if (loadKey === lastLoadRef.current) return
    lastLoadRef.current = loadKey
    
    onLoadingChange(true)
    
    try {
      const geoBounds: GeoBounds = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      }
      
      const result = await searchInternshipsGeo(query, filters, geoBounds, 1000)
      
      if (result.hits.length > 0) {
        const markersWithCoords = result.hits.filter(
          m => m.location_lat != null && m.location_lon != null
        )
        onMarkersLoaded(markersWithCoords, true)
      }
    } catch (err) {
      console.error('Viewport load failed:', err)
    }
    
    onLoadingChange(false)
  }, [map, query, filters, onMarkersLoaded, onLoadingChange])

  useMapEvents({
    moveend: () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(loadForViewport, 400)
    },
    zoomend: () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(loadForViewport, 400)
    },
  })

  return null
}

// Theme-aware tile layer
function TileLayerWithTheme() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
  const [mounted, setMounted] = useState(false)
  const [totalHits, setTotalHits] = useState(0)
  const [isViewportMode, setIsViewportMode] = useState(false)

  // Initial load - get overview markers
  const loadInitialMarkers = useCallback(async () => {
    setLoading(true)
    
    try {
      const result = await searchInternships(query, filters, 1, 1000, 'relevance')
      
      const markersWithCoords = result.hits.filter(
        m => m.location_lat != null && m.location_lon != null
      )
      
      setMarkers(markersWithCoords)
      setTotalHits(result.totalHits)
      setIsViewportMode(false)
    } catch (err) {
      console.error('Failed to load markers:', err)
    }
    
    setLoading(false)
  }, [query, filters])

  // Handle viewport-loaded markers - simply replace with new results
  const handleViewportMarkers = useCallback((newMarkers: Internship[], isViewportLoad: boolean) => {
    if (isViewportLoad && newMarkers.length > 0) {
      setMarkers(newMarkers)
      setIsViewportMode(true)
    }
  }, [])

  // Initial load and reload on filter changes
  useEffect(() => {
    loadInitialMarkers()
  }, [loadInitialMarkers])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-[calc(100vh-180px)] min-h-[400px] rounded-lg border bg-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="relative h-[calc(100vh-180px)] min-h-[400px] rounded-lg border overflow-hidden">
      {loading && (
        <div className="absolute top-4 right-4 z-[1001] bg-background/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2 shadow-sm border">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Laden...</span>
        </div>
      )}
      
      <div className="absolute top-4 left-14 z-[1001] bg-background/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border">
        <span className="text-xs font-medium">
          {markers.length.toLocaleString('nl-NL')} stages
          {!isViewportMode && totalHits > markers.length && (
            <span className="text-muted-foreground"> (zoom in voor meer)</span>
          )}
        </span>
      </div>

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
        <ViewportLoader
          query={query}
          filters={filters}
          onMarkersLoaded={handleViewportMarkers}
          onLoadingChange={setLoading}
        />
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
