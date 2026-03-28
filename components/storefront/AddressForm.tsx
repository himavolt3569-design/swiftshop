'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { NEPAL_PROVINCES, PROVINCE_NAMES } from '@/lib/constants/nepal'
import { GoogleMap } from '@/components/shared/GoogleMap'
import { supabase }  from '@/lib/supabase'

interface AddressFormProps {
  value: {
    province: string
    district: string
    area: string
    landmark?: string
    lat?: number | null
    lng?: number | null
  }
  onChange: (updates: Partial<AddressFormProps['value']>) => void
  errors?: Record<string, string>
}

export function AddressForm({ value, onChange, errors = {} }: AddressFormProps) {
  const [districts, setDistricts]       = useState<string[]>([])
  const [coverage,  setCoverage]        = useState<'covered' | 'uncovered' | null>(null)
  const [checkingCoverage, setChecking] = useState(false)

  useEffect(() => {
    if (value.province && NEPAL_PROVINCES[value.province]) {
      setDistricts(NEPAL_PROVINCES[value.province])
    } else {
      setDistricts([])
    }
  }, [value.province])

  const handlePinDrop = async (lat: number, lng: number) => {
    onChange({ lat, lng })
    setChecking(true)
    setCoverage(null)
    try {
      const { data, error } = await supabase.rpc('check_courier_coverage', { p_lat: lat, p_lng: lng })
      if (error) throw error
      setCoverage(data ? 'covered' : 'uncovered')
    } catch {
      // Silently fail – allow order to proceed per spec
      setCoverage(null)
    } finally {
      setChecking(false)
    }
  }

  const field = (id: string, label: string, required = true) => (
    <div>
      <label htmlFor={id} className="block text-[13px] font-medium text-on-surface mb-1.5 font-label">
        {label}{required && <span className="text-error ml-0.5">*</span>}
      </label>
    </div>
  )

  const inputCls = (name: string) =>
    `w-full h-11 px-3 bg-surface-container-lowest border rounded-lg text-sm text-on-surface font-body placeholder:text-on-surface-variant/50 focus:outline-none transition-colors ${
      errors[name] ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'
    }`

  return (
    <div className="space-y-5">
      {/* Province */}
      <div>
        {field('province', 'Province')}
        <select
          id="province"
          value={value.province}
          onChange={(e) => onChange({ province: e.target.value, district: '' })}
          className={inputCls('province')}
          required
        >
          <option value="">Select Province</option>
          {PROVINCE_NAMES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {errors.province && <p className="text-xs text-error mt-1 font-label">{errors.province}</p>}
      </div>

      {/* District */}
      <div>
        {field('district', 'District')}
        <select
          id="district"
          value={value.district}
          onChange={(e) => onChange({ district: e.target.value })}
          className={inputCls('district')}
          disabled={!value.province}
          required
        >
          <option value="">Select District</option>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        {errors.district && <p className="text-xs text-error mt-1 font-label">{errors.district}</p>}
      </div>

      {/* Area */}
      <div>
        {field('area', 'Area / Tole / Street')}
        <input
          id="area"
          type="text"
          value={value.area}
          onChange={(e) => onChange({ area: e.target.value })}
          className={inputCls('area')}
          placeholder="e.g. Baneshwor-7, New Road"
          required
        />
        {errors.area && <p className="text-xs text-error mt-1 font-label">{errors.area}</p>}
      </div>

      {/* Landmark */}
      <div>
        <label htmlFor="landmark" className="block text-[13px] font-medium text-on-surface mb-1.5 font-label">Landmark <span className="text-on-surface-variant/60 font-normal">(optional)</span></label>
        <input
          id="landmark"
          type="text"
          value={value.landmark ?? ''}
          onChange={(e) => onChange({ landmark: e.target.value })}
          className={inputCls('landmark')}
          placeholder="Nearby landmark to help courier find you"
        />
      </div>

      {/* Map */}
      <div>
        <label className="block text-[13px] font-medium text-on-surface mb-1.5 font-label">Pin Your Location <span className="text-on-surface-variant/60 font-normal">(optional, helps courier)</span></label>
        <GoogleMap onPinDrop={handlePinDrop} height={260} />

        {/* Coverage indicator */}
        {checkingCoverage && (
          <div className="flex items-center gap-2 mt-2 text-xs text-on-surface-variant font-label">
            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Checking delivery coverage…
          </div>
        )}
        {coverage === 'covered' && (
          <div className="flex items-center gap-2 mt-2 text-xs text-success font-label">
            <CheckCircle className="w-3.5 h-3.5" />
            Delivery available to your area.
          </div>
        )}
        {coverage === 'uncovered' && (
          <div className="flex items-center gap-2 mt-2 text-xs text-error font-label">
            <AlertCircle className="w-3.5 h-3.5" />
            Delivery is not available to your area yet.
          </div>
        )}
      </div>
    </div>
  )
}
