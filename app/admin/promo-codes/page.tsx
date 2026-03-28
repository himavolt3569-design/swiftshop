'use client'

import { useEffect, useState } from 'react'
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import { AdminTable }  from '@/components/admin/AdminTable'
import { AdminDrawer } from '@/components/admin/AdminDrawer'
import { supabase }    from '@/lib/supabase'
import { useSessionStore } from '@/store/sessionStore'
import { PromoCode } from '@/lib/types'

interface PromoRow extends Record<string, unknown> {
  id: string; code: string; type: 'percent' | 'flat'; value: number
  min_order_amount: number; usage_count: number; usage_limit: number
  expires_at: string | null; is_active: boolean
}

const COLS = [
  { key: 'code',      label: 'Code',     sortable: true,
    render: (r: PromoRow) => <span className="font-mono font-bold text-on-surface tracking-widest">{r.code}</span> },
  { key: 'type',      label: 'Type',     render: (r: PromoRow) => r.type === 'percent' ? 'Percent (%)' : 'Flat (NPR)' },
  { key: 'value',     label: 'Value',    render: (r: PromoRow) => r.type === 'percent' ? `${r.value}%` : `NPR ${r.value}` },
  { key: 'usage',     label: 'Usage',    render: (r: PromoRow) => `${r.usage_count} / ${r.usage_limit}` },
  { key: 'expires_at', label: 'Expires', render: (r: PromoRow) => r.expires_at ? new Date(r.expires_at).toLocaleDateString() : '-' },
  { key: 'is_active', label: 'Status',   render: (r: PromoRow) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-label ${r.is_active ? 'bg-success/10 text-success' : 'bg-surface-container text-on-surface-variant'}`}>
      {r.is_active ? 'Active' : 'Inactive'}
    </span>
  )},
]

const EMPTY_FORM = { code: '', type: 'percent' as 'percent' | 'flat', value: '', min_order_amount: '', usage_limit: '', expires_at: '', is_active: true }

export default function PromoCodesPage() {
  const [codes,      setCodes]      = useState<PromoRow[]>([])
  const [loading,    setLoading]    = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing,    setEditing]    = useState<PromoCode | null>(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const { addToast } = useSessionStore()

  const fetchAll = async () => {
    setLoading(true)
    const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false })
    setCodes((data as PromoRow[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const openNew  = () => { setEditing(null); setForm(EMPTY_FORM); setDrawerOpen(true) }
  const openEdit = (r: PromoRow) => {
    const c = r as unknown as PromoCode
    setEditing(c)
    setForm({ code: c.code, type: c.type, value: String(c.value), min_order_amount: String(c.min_order_amount), usage_limit: String(c.usage_limit), expires_at: c.expires_at ? c.expires_at.substring(0, 10) : '', is_active: c.is_active })
    setDrawerOpen(true)
  }

  const handleToggle = async (r: PromoRow) => {
    await supabase.from('promo_codes').update({ is_active: !r.is_active }).eq('id', r.id)
    fetchAll()
  }

  const handleSave = async () => {
    if (!form.code || !form.value) { addToast('error', 'Code and value are required.'); return }
    setSaving(true)
    const payload = { code: form.code.toUpperCase(), type: form.type, value: parseFloat(form.value), min_order_amount: parseFloat(form.min_order_amount || '0'), usage_limit: parseInt(form.usage_limit || '100'), expires_at: form.expires_at || null, is_active: form.is_active }
    if (editing) { await supabase.from('promo_codes').update(payload).eq('id', editing.id); addToast('success', 'Code updated.') }
    else { await supabase.from('promo_codes').insert(payload); addToast('success', 'Code created.') }
    setSaving(false); setDrawerOpen(false); fetchAll()
  }

  const inputCls = 'admin-input'
  const labelCls = 'admin-label'

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-headline text-4xl font-bold text-on-surface tracking-tight mb-1">Promo Codes</h2>
          <p className="text-on-surface-variant font-body text-sm">{codes.length} codes</p>
        </div>
        <button onClick={openNew} className="admin-btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Code</button>
      </div>

      <AdminTable columns={COLS as never} data={codes as never[]} keyField="id" loading={loading} onRowClick={(r) => openEdit(r as unknown as PromoRow)} emptyMessage="No promo codes yet." />

      <AdminDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Promo Code' : 'Add Promo Code'}>
        <div className="space-y-5">
          <div><label className={labelCls}>Code *</label><input className={inputCls + ' uppercase tracking-widest font-mono'} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SUMMER20" /></div>
          <div><label className={labelCls}>Discount Type</label>
            <select className={inputCls} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'percent' | 'flat' }))}>
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat Amount (NPR)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Value *</label><input type="number" className={inputCls} value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} /></div>
            <div><label className={labelCls}>Min. Order (NPR)</label><input type="number" className={inputCls} value={form.min_order_amount} onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Usage Limit</label><input type="number" className={inputCls} value={form.usage_limit} onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))} /></div>
            <div><label className={labelCls}>Expires On</label><input type="date" className={inputCls} value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))} /></div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="promo_active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="accent-primary" />
            <label htmlFor="promo_active" className="text-sm font-label text-on-surface">Active</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="admin-btn-primary flex-1">{saving ? 'Saving…' : editing ? 'Update' : 'Create Code'}</button>
            <button onClick={() => setDrawerOpen(false)} className="admin-btn-secondary">Cancel</button>
          </div>
        </div>
      </AdminDrawer>
    </div>
  )
}
