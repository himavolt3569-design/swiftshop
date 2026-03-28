'use client'

import { MapPin, Truck, ToggleLeft, ToggleRight, Globe } from 'lucide-react'
import { Courier } from '@/lib/types'
import { supabase } from '@/lib/supabase'

interface CourierCardProps {
  courier:   Courier
  onToggle:  (id: string, active: boolean) => void
  onEdit:    (courier: Courier) => void
}

export function CourierCard({ courier, onToggle, onEdit }: CourierCardProps) {
  const toggle = async () => {
    await supabase.from('couriers').update({ is_active: !courier.is_active }).eq('id', courier.id)
    onToggle(courier.id, !courier.is_active)
  }

  const mapUrl = `https://www.openstreetmap.org/?mlat=${courier.hq_lat}&mlon=${courier.hq_lng}&zoom=11`

  return (
    <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/20 overflow-hidden hover:shadow-float transition-shadow">
      {/* Map placeholder */}
      <div className="h-36 bg-surface-container flex items-center justify-center relative">
        <Globe className="w-10 h-10 text-on-surface-variant/20" />
        <div className="absolute inset-0 flex items-end p-3">
          <a href={mapUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline font-label">
            View on map
          </a>
        </div>
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-label font-bold ${courier.is_active ? 'bg-success/10 text-success' : 'bg-surface-container-high text-on-surface-variant'}`}>
            {courier.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-headline font-bold text-base text-on-surface">{courier.name}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-on-surface-variant font-label">
              <MapPin className="w-3 h-3" />
              <span>{courier.hq_lat.toFixed(4)}, {courier.hq_lng.toFixed(4)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-label">
            <Truck className="w-3 h-3" />
            <span>{courier.coverage_radius_km} km</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/20">
          <button
            onClick={() => onEdit(courier)}
            className="flex-1 h-8 text-xs font-label font-semibold border border-outline-variant rounded-md hover:bg-surface-container transition-colors text-on-surface"
          >
            Edit
          </button>
          <button
            onClick={toggle}
            className={`flex-1 h-8 text-xs font-label font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
              courier.is_active ? 'bg-surface-container text-on-surface hover:bg-surface-container-high' : 'bg-primary text-white hover:bg-primary-container'
            }`}
          >
            {courier.is_active
              ? <><ToggleRight className="w-3.5 h-3.5" /> Deactivate</>
              : <><ToggleLeft  className="w-3.5 h-3.5" /> Activate</>}
          </button>
        </div>
      </div>
    </div>
  )
}
