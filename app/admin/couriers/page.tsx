'use client'

import { useEffect, useState } from 'react'
import { Plus, ChevronDown, ChevronUp, X } from 'lucide-react'
import { CourierCard }     from '@/components/admin/CourierCard'
import { AdminDrawer }     from '@/components/admin/AdminDrawer'
import { supabase }        from '@/lib/supabase'
import { useSessionStore } from '@/store/sessionStore'
import { Courier }         from '@/lib/types'
import { NEPAL_PROVINCES } from '@/lib/constants/nepal'

const EMPTY_FORM = {
  name: '',
  api_endpoint: '',
  api_key: '',
  hq_lat: '',
  hq_lng: '',
  coverage_radius_km: '',
  priority: '1',
  is_active: true,
  covered_districts: [] as string[],
}

const NEPALI_COURIERS = [
  { name: 'Prabhu Courier',       hq_lat: 27.7172, hq_lng: 85.3240, coverage_radius_km: 100, priority: 1 },
  { name: 'Blue Dart Nepal',      hq_lat: 27.7172, hq_lng: 85.3240, coverage_radius_km: 80,  priority: 2 },
  { name: 'DHL Express Nepal',    hq_lat: 27.7172, hq_lng: 85.3240, coverage_radius_km: 150, priority: 3 },
  { name: 'First Flight Courier', hq_lat: 27.7172, hq_lng: 85.3240, coverage_radius_km: 80,  priority: 4 },
  { name: 'Aramex Nepal',         hq_lat: 27.7172, hq_lng: 85.3240, coverage_radius_km: 120, priority: 5 },
  { name: 'Khaali Sisiss',        hq_lat: 27.7172, hq_lng: 85.3240, coverage_radius_km: 50,  priority: 6 },
]

// ── District multi-select grouped by province ─────────────────────────────────
function DistrictPicker({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (districts: string[]) => void
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggle = (district: string) => {
    onChange(
      selected.includes(district)
        ? selected.filter((d) => d !== district)
        : [...selected, district],
    )
  }

  const toggleProvince = (province: string, districts: string[]) => {
    const allSelected = districts.every((d) => selected.includes(d))
    if (allSelected) {
      onChange(selected.filter((d) => !districts.includes(d)))
    } else {
      const union = Array.from(new Set([...selected, ...districts]))
      onChange(union)
    }
  }

  return (
    <div className="space-y-1.5">
      {Object.entries(NEPAL_PROVINCES).map(([province, districts]) => {
        const allSelected = districts.every((d) => selected.includes(d))
        const someSelected = districts.some((d) => selected.includes(d))
        const isOpen = expanded[province] ?? false

        return (
          <div key={province} className="border border-outline-variant/30 rounded-lg overflow-hidden">
            {/* Province header */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-surface-container hover:bg-surface-container-high transition-colors">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                onChange={() => toggleProvince(province, districts)}
                className="accent-primary w-3.5 h-3.5 shrink-0"
              />
              <button
                type="button"
                className="flex-1 text-left text-xs font-semibold text-on-surface font-label"
                onClick={() => setExpanded((e) => ({ ...e, [province]: !isOpen }))}
              >
                {province}
                {someSelected && (
                  <span className="ml-2 text-[10px] text-primary font-label">
                    ({districts.filter((d) => selected.includes(d)).length}/{districts.length})
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setExpanded((e) => ({ ...e, [province]: !isOpen }))}
                className="text-on-surface-variant/50"
              >
                {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* District checkboxes */}
            {isOpen && (
              <div className="grid grid-cols-2 gap-0 border-t border-outline-variant/20">
                {districts.map((d) => (
                  <label
                    key={d}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-container/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(d)}
                      onChange={() => toggle(d)}
                      className="accent-primary w-3 h-3 shrink-0"
                    />
                    <span className="text-xs text-on-surface font-body">{d}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CouriersPage() {
  const [couriers,   setCouriers]   = useState<Courier[]>([])
  const [loading,    setLoading]    = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing,    setEditing]    = useState<Courier | null>(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const { addToast } = useSessionStore()

  const fetchAll = async () => {
    setLoading(true)
    const { data } = await supabase.from('couriers').select('*').order('priority')
    setCouriers((data as Courier[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDrawerOpen(true)
  }

  const openEdit = (c: Courier) => {
    setEditing(c)
    setForm({
      name: c.name,
      api_endpoint: c.api_endpoint,
      api_key: c.api_key,
      hq_lat: String(c.hq_lat),
      hq_lng: String(c.hq_lng),
      coverage_radius_km: String(c.coverage_radius_km),
      priority: String(c.priority),
      is_active: c.is_active,
      covered_districts: c.covered_districts ?? [],
    })
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    if (!form.name) { addToast('error', 'Courier name is required.'); return }
    setSaving(true)
    const payload = {
      name: form.name,
      api_endpoint: form.api_endpoint,
      api_key: form.api_key,
      hq_lat: parseFloat(form.hq_lat) || 27.7172,
      hq_lng: parseFloat(form.hq_lng) || 85.3240,
      coverage_radius_km: parseFloat(form.coverage_radius_km) || 50,
      covered_districts: form.covered_districts.length ? form.covered_districts : null,
      priority: parseInt(form.priority) || 1,
      is_active: form.is_active,
    }
    if (editing) {
      await supabase.from('couriers').update(payload).eq('id', editing.id)
      addToast('success', 'Courier updated.')
    } else {
      await supabase.from('couriers').insert(payload)
      addToast('success', 'Courier added.')
    }
    setSaving(false)
    setDrawerOpen(false)
    fetchAll()
  }

  const handleToggle = (id: string, active: boolean) => {
    setCouriers((prev) => prev.map((c) => c.id === id ? { ...c, is_active: active } : c))
  }

  const inputCls = 'admin-input'
  const labelCls = 'admin-label'

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-headline text-4xl font-bold text-on-surface tracking-tight mb-1">Couriers</h2>
          <p className="text-on-surface-variant font-body text-sm">{couriers.length} courier{couriers.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          {couriers.length === 0 && !loading && (
            <button
              onClick={async () => {
                const payloads = NEPALI_COURIERS.map((c) => ({ ...c, api_endpoint: '', api_key: '', is_active: true, covered_districts: null }))
                const { error } = await supabase.from('couriers').insert(payloads)
                if (error) { addToast('error', 'Failed to seed couriers'); return }
                addToast('success', 'Nepali couriers seeded!')
                fetchAll()
              }}
              className="admin-btn-secondary flex items-center gap-2"
            >
              Seed Nepali Couriers
            </button>
          )}
          <button onClick={openNew} className="admin-btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Courier
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 bg-surface-container rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {couriers.map((c) => (
            <CourierCard key={c.id} courier={c} onToggle={handleToggle} onEdit={openEdit} />
          ))}
        </div>
      )}

      <AdminDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Courier' : 'Add Courier'}>
        <div className="space-y-5">
          {/* Basic info */}
          <div>
            <label className={labelCls}>Courier Name *</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>API Endpoint</label>
            <input className={inputCls} value={form.api_endpoint} onChange={(e) => setForm((f) => ({ ...f, api_endpoint: e.target.value }))} placeholder="https://api.courier.com/orders" />
          </div>
          <div>
            <label className={labelCls}>API Key</label>
            <input type="password" className={inputCls} value={form.api_key} onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))} />
          </div>

          {/* HQ location */}
          <div>
            <label className={labelCls}>HQ Location (for fallback distance calculation)</label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <input type="number" className={inputCls} placeholder="Latitude (27.7172)" value={form.hq_lat} onChange={(e) => setForm((f) => ({ ...f, hq_lat: e.target.value }))} />
              <input type="number" className={inputCls} placeholder="Longitude (85.3240)" value={form.hq_lng} onChange={(e) => setForm((f) => ({ ...f, hq_lng: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Fallback Radius (km)</label>
              <input type="number" className={inputCls} value={form.coverage_radius_km} onChange={(e) => setForm((f) => ({ ...f, coverage_radius_km: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Priority (1 = highest)</label>
              <input type="number" className={inputCls} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} />
            </div>
          </div>

          {/* Covered districts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls}>
                Covered Districts
                <span className="ml-1.5 text-[10px] text-on-surface-variant/60 font-normal normal-case tracking-normal">
                  (overrides radius — recommended)
                </span>
              </label>
              {form.covered_districts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, covered_districts: [] }))}
                  className="text-[10px] text-error hover:underline font-label flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>

            {/* Selected chips */}
            {form.covered_districts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2 p-2.5 bg-primary/5 border border-primary/15 rounded-lg">
                {form.covered_districts.map((d) => (
                  <span
                    key={d}
                    className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-label rounded-full"
                  >
                    {d}
                    <button type="button" onClick={() => setForm((f) => ({ ...f, covered_districts: f.covered_districts.filter((x) => x !== d) }))}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <DistrictPicker
              selected={form.covered_districts}
              onChange={(districts) => setForm((f) => ({ ...f, covered_districts: districts }))}
            />
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="courier_active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="accent-primary" />
            <label htmlFor="courier_active" className="text-sm font-label text-on-surface">Active</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="admin-btn-primary flex-1">
              {saving ? 'Saving…' : editing ? 'Update Courier' : 'Add Courier'}
            </button>
            <button onClick={() => setDrawerOpen(false)} className="admin-btn-secondary">Cancel</button>
          </div>
        </div>
      </AdminDrawer>
    </div>
  )
}
