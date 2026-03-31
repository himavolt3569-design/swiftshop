'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { CourierCard }  from '@/components/admin/CourierCard'
import { AdminDrawer }  from '@/components/admin/AdminDrawer'
import { supabase }     from '@/lib/supabase'
import { useSessionStore } from '@/store/sessionStore'
import { Courier } from '@/lib/types'

const EMPTY_FORM = { name: '', api_endpoint: '', api_key: '', hq_lat: '', hq_lng: '', coverage_radius_km: '', priority: '1', is_active: true }

const NEPALI_COURIERS = [
  { name: 'Prabhu Courier',      hq_lat: 27.7172, hq_lng: 85.3240, coverage_radius_km: 100, priority: 1 },
  { name: 'Blue Dart Nepal',     hq_lat: 27.7172, hq_lng: 85.3240, coverage_radius_km: 80,  priority: 2 },
  { name: 'DHL Express Nepal',   hq_lat: 27.7172, hq_lng: 85.3240, coverage_radius_km: 150, priority: 3 },
  { name: 'First Flight Courier',hq_lat: 27.7172, hq_lng: 85.3240, coverage_radius_km: 80,  priority: 4 },
  { name: 'Aramex Nepal',        hq_lat: 27.7172, hq_lng: 85.3240, coverage_radius_km: 120, priority: 5 },
  { name: 'Khaali Sisiss',       hq_lat: 27.7172, hq_lng: 85.3240, coverage_radius_km: 50,  priority: 6 },
]

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

  const openNew  = () => { setEditing(null); setForm(EMPTY_FORM); setDrawerOpen(true) }
  const openEdit = (c: Courier) => {
    setEditing(c)
    setForm({ name: c.name, api_endpoint: c.api_endpoint, api_key: c.api_key, hq_lat: String(c.hq_lat), hq_lng: String(c.hq_lng), coverage_radius_km: String(c.coverage_radius_km), priority: String(c.priority), is_active: c.is_active })
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    if (!form.name) { addToast('error', 'Courier name is required.'); return }
    setSaving(true)
    const payload = { name: form.name, api_endpoint: form.api_endpoint, api_key: form.api_key, hq_lat: parseFloat(form.hq_lat), hq_lng: parseFloat(form.hq_lng), coverage_radius_km: parseFloat(form.coverage_radius_km), priority: parseInt(form.priority), is_active: form.is_active }
    if (editing) { await supabase.from('couriers').update(payload).eq('id', editing.id); addToast('success', 'Courier updated.') }
    else { await supabase.from('couriers').insert(payload); addToast('success', 'Courier added.') }
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
                const payloads = NEPALI_COURIERS.map((c) => ({
                  ...c, api_endpoint: '', api_key: '', is_active: true,
                }))
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
          <div><label className={labelCls}>Courier Name *</label><input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div><label className={labelCls}>API Endpoint</label><input className={inputCls} value={form.api_endpoint} onChange={(e) => setForm((f) => ({ ...f, api_endpoint: e.target.value }))} placeholder="https://api.courier.com/orders" /></div>
          <div><label className={labelCls}>API Key</label><input type="password" className={inputCls} value={form.api_key} onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>HQ Latitude</label><input type="number" className={inputCls} value={form.hq_lat} onChange={(e) => setForm((f) => ({ ...f, hq_lat: e.target.value }))} placeholder="27.7172" /></div>
            <div><label className={labelCls}>HQ Longitude</label><input type="number" className={inputCls} value={form.hq_lng} onChange={(e) => setForm((f) => ({ ...f, hq_lng: e.target.value }))} placeholder="85.3240" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Coverage Radius (km)</label><input type="number" className={inputCls} value={form.coverage_radius_km} onChange={(e) => setForm((f) => ({ ...f, coverage_radius_km: e.target.value }))} /></div>
            <div><label className={labelCls}>Priority (1 = highest)</label><input type="number" className={inputCls} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} /></div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="courier_active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="accent-primary" />
            <label htmlFor="courier_active" className="text-sm font-label text-on-surface">Active</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="admin-btn-primary flex-1">{saving ? 'Saving…' : editing ? 'Update' : 'Add Courier'}</button>
            <button onClick={() => setDrawerOpen(false)} className="admin-btn-secondary">Cancel</button>
          </div>
        </div>
      </AdminDrawer>
    </div>
  )
}
