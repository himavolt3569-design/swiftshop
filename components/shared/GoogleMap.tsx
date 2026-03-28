'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

interface GoogleMapProps {
  onPinDrop?: (lat: number, lng: number, address?: string) => void
  height?: number
}

const NEPAL_CENTER: [number, number] = [27.7172, 85.324]

export function GoogleMap({ onPinDrop, height = 280 }: GoogleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<import('leaflet').Map | null>(null)
  const markerRef    = useRef<import('leaflet').Marker | null>(null)
  const inputRef     = useRef<HTMLInputElement>(null)

  const [loaded,  setLoaded]  = useState(false)
  const [error,   setError]   = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<{ display_name: string; lat: string; lon: string }[]>([])
  const [showResults,   setShowResults]   = useState(false)

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    // Leaflet must be loaded client-side
    import('leaflet').then((L) => {
      // Fix default marker icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // Custom red pin matching SwiftShop brand
      const redIcon = L.divIcon({
        html: `<svg width="28" height="36" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C9.373 0 4 5.373 4 12c0 8.837 12 28 12 28S28 20.837 28 12c0-6.627-5.373-12-12-12z" fill="#942e02"/>
          <circle cx="16" cy="12" r="5" fill="white"/>
        </svg>`,
        className: '',
        iconSize:   [28, 36],
        iconAnchor: [14, 36],
      })

      const map = L.map(containerRef.current!, {
        center: NEPAL_CENTER,
        zoom: 13,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      const marker = L.marker(NEPAL_CENTER, { icon: redIcon, draggable: true }).addTo(map)
      mapRef.current    = map
      markerRef.current = marker

      const handleLatLng = async (lat: number, lng: number) => {
        // Reverse geocode via Nominatim (free, no key)
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          const data = await res.json()
          const addr = data.display_name as string | undefined
          setAddress(addr ?? null)
          onPinDrop?.(lat, lng, addr)
        } catch {
          onPinDrop?.(lat, lng)
        }
      }

      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        handleLatLng(lat, lng)
      })

      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng()
        handleLatLng(lat, lng)
      })

      setLoaded(true)
    }).catch(() => setError(true))

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link  = document.createElement('link')
      link.id     = 'leaflet-css'
      link.rel    = 'stylesheet'
      link.href   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    return () => {
      mapRef.current?.remove()
      mapRef.current    = null
      markerRef.current = null
    }
  }, [onPinDrop])

  const handleSearch = async (q: string) => {
    if (q.trim().length < 3) { setSearchResults([]); setShowResults(false); return }
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=np&format=json&limit=5`)
      const data = await res.json()
      setSearchResults(data)
      setShowResults(true)
    } catch {
      setSearchResults([])
    }
  }

  const selectResult = (r: { display_name: string; lat: string; lon: string }) => {
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    mapRef.current?.setView([lat, lng], 16)
    markerRef.current?.setLatLng([lat, lng])
    setAddress(r.display_name)
    onPinDrop?.(lat, lng, r.display_name)
    setShowResults(false)
    if (inputRef.current) inputRef.current.value = r.display_name
  }

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for your area or address…"
          className="w-full h-11 pl-9 pr-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-sm font-body text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
          autoComplete="off"
        />
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-[1000] top-full left-0 right-0 mt-1 bg-background border border-outline-variant/30 rounded-xl shadow-lift overflow-hidden">
            {searchResults.map((r, i) => (
              <button
                key={i}
                type="button"
                className="w-full text-left px-3 py-2.5 text-sm font-body text-on-surface hover:bg-surface-container transition-colors border-b border-outline-variant/10 last:border-0 truncate"
                onMouseDown={() => selectResult(r)}
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-outline-variant/30 relative" style={{ height }}>
        <div ref={containerRef} className="w-full h-full" />

        {!loaded && !error && (
          <div className="absolute inset-0 bg-surface-container flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-on-surface-variant font-label">Loading map…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-surface-container flex items-center justify-center">
            <p className="text-sm text-on-surface-variant font-body px-6 text-center">Map could not be loaded. You can still proceed.</p>
          </div>
        )}
      </div>

      {address && (
        <div className="flex items-center gap-2 text-xs text-success font-label">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{address}</span>
        </div>
      )}
    </div>
  )
}
