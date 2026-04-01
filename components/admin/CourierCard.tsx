'use client'

import { MapPin, Truck, ToggleLeft, ToggleRight, Globe, MapPinned } from 'lucide-react'
import { Courier } from '@/lib/types'
import { supabase } from '@/lib/supabase'

interface CourierCardProps {
  courier:  Courier
  onToggle: (id: string, active: boolean) => void
  onEdit:   (courier: Courier) => void
}

export function CourierCard({ courier, onToggle, onEdit }: CourierCardProps) {
  const toggle = async () => {
    await supabase.from('couriers').update({ is_active: !courier.is_active }).eq('id', courier.id)
    onToggle(courier.id, !courier.is_active)
  }

  const districts = courier.covered_districts ?? []
  const hasDistricts = districts.length > 0

  return (
    <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/20 overflow-hidden hover:shadow-float transition-shadow flex flex-col">
      {/* Coverage summary header */}
      <div className="h-28 bg-surface-container flex flex-col items-center justify-center relative px-4 gap-1">
        {hasDistricts ? (
          <>
            <MapPinned className="w-7 h-7 text-primary/40" />
            <p className="text-xs font-bold text-primary font-label">{districts.length} district{districts.length !== 1 ? 's' : ''} covered</p>
            <p className="text-[10px] text-on-surface-variant font-label text-center line-clamp-1">
              {districts.slice(0, 4).join(', ')}{districts.length > 4 ? ` +${districts.length - 4} more` : ''}
            </p>
          </>
        ) : (
          <>
            <Globe className="w-7 h-7 text-on-surface-variant/20" />
            <p className="text-xs text-on-surface-variant/50 font-label">Radius-based coverage</p>
          </>
        )}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-label font-bold ${courier.is_active ? 'bg-success/10 text-success' : 'bg-surface-container-high text-on-surface-variant'}`}>
            {courier.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-headline font-bold text-base text-on-surface">{courier.name}</h3>
            {!hasDistricts && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-on-surface-variant font-label">
                <MapPin className="w-3 h-3 shrink-0" />
                <span>{courier.hq_lat.toFixed(4)}, {courier.hq_lng.toFixed(4)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-on-surface-variant font-label shrink-0 ml-2">
            <Truck className="w-3 h-3" />
            <span>{courier.coverage_radius_km} km</span>
          </div>
        </div>

        {/* District chips preview */}
        {hasDistricts && (
          <div className="flex flex-wrap gap-1 mb-3">
            {districts.slice(0, 6).map((d) => (
              <span key={d} className="px-1.5 py-0.5 bg-primary/8 text-primary text-[10px] font-label rounded">
                {d}
              </span>
            ))}
            {districts.length > 6 && (
              <span className="px-1.5 py-0.5 bg-surface-container text-on-surface-variant text-[10px] font-label rounded">
                +{districts.length - 6}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/20 mt-auto">
          <button
            onClick={() => onEdit(courier)}
            className="flex-1 h-8 text-xs font-label font-semibold border border-outline-variant rounded-md hover:bg-surface-container transition-colors text-on-surface"
          >
            Edit
          </button>
          <button
            onClick={toggle}
            className={`flex-1 h-8 text-xs font-label font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
              courier.is_active
                ? 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                : 'bg-primary text-white hover:bg-primary-container'
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
