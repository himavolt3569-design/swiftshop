'use client'

import { useState, useEffect } from 'react'
import { NEPAL_PROVINCES, PROVINCE_NAMES, NEPAL_CITIES } from '@/lib/constants/nepal'

interface AddressFormProps {
  value: {
    province: string
    district: string
    city?: string
    area: string
    landmark?: string
  }
  onChange: (updates: Partial<AddressFormProps['value']>) => void
  errors?: Record<string, string>
}

export function AddressForm({ value, onChange, errors = {} }: AddressFormProps) {
  const [districts, setDistricts] = useState<string[]>([])
  const [cities,    setCities]    = useState<string[]>([])

  useEffect(() => {
    if (value.province && NEPAL_PROVINCES[value.province]) {
      setDistricts(NEPAL_PROVINCES[value.province])
    } else {
      setDistricts([])
    }
  }, [value.province])

  useEffect(() => {
    if (value.district && NEPAL_CITIES[value.district]) {
      setCities(NEPAL_CITIES[value.district])
    } else {
      setCities([])
    }
  }, [value.district])

  const inputCls = (name: string) =>
    `w-full h-11 px-3 bg-surface-container-lowest border rounded-lg text-sm text-on-surface font-body placeholder:text-on-surface-variant/50 focus:outline-none transition-colors ${
      errors[name] ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'
    }`

  const label = (text: string, required = true, optional = false) => (
    <label className="block text-[13px] font-medium text-on-surface mb-1.5 font-label">
      {text}
      {required && <span className="text-error ml-0.5">*</span>}
      {optional && <span className="text-on-surface-variant/60 font-normal ml-1">(optional)</span>}
    </label>
  )

  return (
    <div className="space-y-5">
      {/* Province */}
      <div>
        {label('Province')}
        <select
          value={value.province}
          onChange={(e) => onChange({ province: e.target.value, district: '', city: '' })}
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
        {label('District')}
        <select
          value={value.district}
          onChange={(e) => onChange({ district: e.target.value, city: '' })}
          className={inputCls('district')}
          disabled={!value.province}
          required
        >
          <option value="">Select District</option>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        {errors.district && <p className="text-xs text-error mt-1 font-label">{errors.district}</p>}
      </div>

      {/* City */}
      {cities.length > 0 && (
        <div>
          {label('City / Municipality', false, true)}
          <select
            value={value.city ?? ''}
            onChange={(e) => onChange({ city: e.target.value })}
            className={inputCls('city')}
            disabled={!value.district}
          >
            <option value="">Select City</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {/* Area */}
      <div>
        {label('Area / Tole / Street')}
        <input
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
        {label('Landmark', false, true)}
        <input
          type="text"
          value={value.landmark ?? ''}
          onChange={(e) => onChange({ landmark: e.target.value })}
          className={inputCls('landmark')}
          placeholder="Nearby landmark to help courier find you"
        />
      </div>
    </div>
  )
}
