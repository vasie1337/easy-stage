'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { useTheme } from 'next-themes'
import { searchInternshipsGeo, type Internship, type SearchFilters, type GeoBounds } from '@/app/lib/actions'
import { MapPopup } from './map-popup'
import { Loader2 } from 'lucide-react'

// Fix Leaflet default marker icon issue
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = defaultIcon

// Netherlands bounds
const NL_BOUNDS: GeoBounds = {
  north: 53.6,
  south: 50.7,
  east: 7.3,
  west: 3.3,
}

const NL_CENTER: [number, number] = [52.1326, 5.2913]

interface MapViewProps {
  query: string
  filters: SearchFilters
}

// Component to handle map events and data loading
function MapEventHandler({
  query,
  filters,
  onMarkersUpdate,
  onLoadingChange,
}: {
  query: string
  filters: SearchFilters
  onMarkersUpdate: (markers: Internship[]) => void
  onLoadingChange: (loading: boolean) => void
}) {
  const map = useMap()
  const debounceRef = useRef<NodeJS.Timeout>(null)
  const lastBoundsRef = useRef<string>('')

  const loadMarkers = useCallback(async () => {
    const bounds = map.getBounds()
    const boundsKey = `${bounds.getNorth()}-${bounds.getSouth()}-${bounds.getEast()}-${bounds.getWest()}`
    
    // Skip if bounds haven't changed significantly
    if (boundsKey === lastBoundsRef.current) return
    lastBoundsRef.current = boundsKey

    onLoadingChange(true)
    
    const geoBounds: GeoBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    }

    const result = await searchInternshipsGeo(query, filters, geoBounds, 500)
    onMarkersUpdate(result.hits)
    onLoadingChange(false)
  }, [map, query, filters, onMarkersUpdate, onLoadingChange])

  // Initial load
  useEffect(() => {
    loadMarkers()
  }, [loadMarkers])

  // Listen for map events
  useMapEvents({
    moveend: () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(loadMarkers, 300)
    },
    zoomend: () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(loadMarkers, 300)
    },
  })

  // Reload when filters change
  useEffect(() => {
    loadMarkers()
  }, [query, filters.level, filters.province, loadMarkers])

  return null
}

// Theme-aware tile layer
function TileLayerWithTheme() {
  const { resolvedTheme } = useTheme()
  const map = useMap()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Light mode: OpenStreetMap, Dark mode: CartoDB Dark Matter
  const tileUrl = mounted && resolvedTheme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  const attribution = mounted && resolvedTheme === 'dark'
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

  return <TileLayer url={tileUrl} attribution={attribution} />
}

// Custom cluster icon
function createClusterCustomIcon(cluster: any) {
  const count = cluster.getChildCount()
  let size = 'small'
  let dimensions = 30

  if (count >= 100) {
    size = 'large'
    dimensions = 50
  } else if (count >= 10) {
    size = 'medium'
    dimensions = 40
  }

  return L.divIcon({
    html: `<div class="cluster-icon cluster-${size}">${count}</div>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(dimensions, dimensions, true),
  })
}

export function MapView({ query, filters }: MapViewProps) {
  const [markers, setMarkers] = useState<Internship[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

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
      {loading && (
        <div className="absolute top-4 right-4 z-[1000] bg-background/90 backdrop-blur rounded-md px-3 py-2 flex items-center gap-2 shadow-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Laden...</span>
        </div>
      )}
      
      <div className="absolute top-4 left-4 z-[1000] bg-background/90 backdrop-blur rounded-md px-3 py-2 shadow-md">
        <span className="text-sm font-medium">{markers.length} stages in beeld</span>
      </div>

      <MapContainer
        center={NL_CENTER}
        zoom={8}
        className="h-full w-full"
        scrollWheelZoom={true}
        maxBounds={[
          [NL_BOUNDS.south - 1, NL_BOUNDS.west - 1],
          [NL_BOUNDS.north + 1, NL_BOUNDS.east + 1],
        ]}
        minZoom={6}
      >
        <TileLayerWithTheme />
        <MapEventHandler
          query={query}
          filters={filters}
          onMarkersUpdate={setMarkers}
          onLoadingChange={setLoading}
        />
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          animate={true}
        >
          {markers
            .filter(m => m.location_lat && m.location_lon)
            .map(internship => (
              <Marker
                key={internship.id}
                position={[internship.location_lat!, internship.location_lon!]}
              >
                <Popup className="map-popup" maxWidth={320} minWidth={280}>
                  <MapPopup internship={internship} />
                </Popup>
              </Marker>
            ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  )
}
