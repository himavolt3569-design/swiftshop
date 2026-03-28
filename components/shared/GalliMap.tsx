'use client'

import { useEffect, useRef, useState } from 'react'

interface GalliMapProps {
  onPinDrop?: (lat: number, lng: number, address?: string) => void
  height?: number
}

declare global {
  interface Window {
    galliMapSDK?: {
      init: (config: { container: string; center: [number, number]; zoom: number; token: string }) => {
        on: (event: string, cb: (e: { lngLat: { lat: number; lng: number } }) => void) => void
      }
    }
  }
}

export function GalliMap({ onPinDrop, height = 280 }: GalliMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef      = useRef<ReturnType<NonNullable<typeof window.galliMapSDK>['init']> | null>(null)
  const [loaded, setLoaded]   = useState(false)
  const [error, setError]     = useState(false)
  const [dropped, setDropped] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()

        const script = document.createElement('script')
        script.src   = 'https://maps.gallimap.com/api/v1/js?key=' + (process.env.NEXT_PUBLIC_GALLI_API_KEY ?? '')
        script.async = true
        script.onload = () => setLoaded(true)
        script.onerror = () => setError(true)
        document.head.appendChild(script)
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!loaded || !containerRef.current) return
    if (!window.galliMapSDK) {
      setError(true)
      return
    }

    const map = window.galliMapSDK.init({
      container: 'galli-map-container',
      center:    [85.324, 27.7172],
      zoom:      12,
      token:     process.env.NEXT_PUBLIC_GALLI_API_KEY ?? '',
    })
    mapRef.current = map

    map.on('click', (e) => {
      const { lat, lng } = e.lngLat
      setDropped({ lat, lng })
      onPinDrop?.(lat, lng)
    })
  }, [loaded, onPinDrop])

  return (
    <div className="rounded-lg overflow-hidden border border-outline-variant/30 relative" style={{ height }}>
      <div ref={containerRef} id="galli-map-container" className="w-full h-full" />

      {!loaded && !error && (
        <div className="absolute inset-0 bg-surface-container flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-on-surface-variant font-label">Loading map...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-surface-container flex items-center justify-center">
          <div className="text-center px-6">
            <p className="text-sm text-on-surface-variant font-body">Map could not be loaded.</p>
            <p className="text-xs text-on-surface-variant/70 font-body mt-1">You can still proceed with your order.</p>
          </div>
        </div>
      )}

      {dropped && (
        <div className="absolute bottom-3 left-3 bg-surface-container-lowest/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-label text-on-surface border border-outline-variant/20">
          Pin: {dropped.lat.toFixed(5)}, {dropped.lng.toFixed(5)}
        </div>
      )}
    </div>
  )
}
