'use client'

import { useEffect, useState, useRef } from 'react'
import {
  Plus, X, RefreshCcw, Facebook, Instagram, Link2, Loader2,
  ChevronDown, ShoppingCart, ExternalLink, Zap, CheckCircle, Clock,
} from 'lucide-react'
import { supabase }    from '@/lib/supabase'
import { useSessionStore } from '@/store/sessionStore'
import { gsap }        from '@/lib/gsap'
import { OrderStatus } from '@/lib/types'

// ─── Types ───────────────────────────────────────────────────
interface SocialChannel {
  id:        string
  platform:  'facebook' | 'instagram' | 'whatsapp' | 'tiktok'
  name:      string
  page_url?: string
  webhook_url?: string
  is_active: boolean
  created_at: string
}

interface SocialOrder {
  id:           string
  channel_id:   string
  channel?:     SocialChannel
  platform:     string
  external_id:  string
  customer_name: string
  customer_phone?: string
  items_text:   string
  total?:       number
  status:       'new' | 'converted' | 'ignored'
  message_url?: string
  notes?:       string
  created_at:   string
  courier_dispatched: boolean
}

const PLATFORM_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  facebook:  { label: 'Facebook',  color: 'text-blue-600',  bg: 'bg-blue-50',   icon: <Facebook  className="w-4 h-4" /> },
  instagram: { label: 'Instagram', color: 'text-pink-600',  bg: 'bg-pink-50',   icon: <Instagram className="w-4 h-4" /> },
  whatsapp:  { label: 'WhatsApp',  color: 'text-green-600', bg: 'bg-green-50',  icon: <Link2     className="w-4 h-4" /> },
  tiktok:    { label: 'TikTok',    color: 'text-[#1A1714]/60', bg: 'bg-black/[0.04]', icon: <Zap  className="w-4 h-4" /> },
}

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  new:       { label: 'New',       bg: 'bg-amber-50',    text: 'text-amber-700'   },
  converted: { label: 'Converted', bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  ignored:   { label: 'Ignored',   bg: 'bg-black/[0.04]', text: 'text-[#1A1714]/30' },
}

// ─── Convert to store order modal ───────────────────────────
function ConvertModal({ order, onClose, onConverted }: {
  order: SocialOrder
  onClose: () => void
  onConverted: () => void
}) {
  const [form, setForm] = useState({
    customer_name:  order.customer_name,
    customer_phone: order.customer_phone ?? '',
    customer_email: '',
    area:           '',
    district:       '',
    province:       'Bagmati',
    total:          order.total ?? 0,
    notes:          order.items_text,
  })
  const [loading, setLoading] = useState(false)
  const { addToast } = useSessionStore()

  const handleConvert = async () => {
    setLoading(true)
    try {
      // Create a store order from the social order
      const { data, error } = await supabase.from('orders').insert({
        customer_name:  form.customer_name,
        customer_phone: form.customer_phone,
        customer_email: form.customer_email || `social-${order.id}@goreto.store`,
        province:       form.province,
        district:       form.district,
        area:           form.area,
        payment_method: 'cash_on_delivery',
        notes:          `[Social Order] ${form.notes}`,
        subtotal:       form.total,
        discount:       0,
        total:          form.total,
        items:          [],
        status:         'confirmed' as OrderStatus,
      }).select('order_number').single()

      if (error) throw error

      // Mark social order as converted
      await supabase.from('social_orders').update({ status: 'converted' }).eq('id', order.id)

      // Trigger courier assignment
      if (data) {
        await supabase.functions.invoke('assign-courier', { body: { order_id: data.order_number } })
      }

      addToast('success', `Order converted → ${data?.order_number}`)
      onConverted()
      onClose()
    } catch {
      addToast('error', 'Failed to convert order.')
    } finally {
      setLoading(false)
    }
  }

  const inp = 'bg-white border border-black/[0.1] rounded-xl px-3 py-2.5 text-sm text-[#1A1714]/80 font-label w-full focus:outline-none focus:border-primary/40 transition-all placeholder:text-[#1A1714]/25'
  const lbl = 'text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1714]/35 font-label mb-1.5 block'

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-white border border-black/[0.08] rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.07]">
          <div>
            <p className="text-xs text-[#1A1714]/35 font-label uppercase tracking-wider">Convert Social Order</p>
            <p className="text-base font-bold text-[#1A1714] font-label mt-0.5">Create Store Order</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-black/[0.04] flex items-center justify-center text-[#1A1714]/30 hover:text-[#1A1714]/70 hover:bg-black/[0.08] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Original message */}
          <div className="p-3 bg-black/[0.03] rounded-xl border border-black/[0.06]">
            <p className="text-[10px] text-[#1A1714]/35 font-label uppercase tracking-wider mb-1">Original Message</p>
            <p className="text-xs text-[#1A1714]/60 font-body">{order.items_text}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Customer Name</label>
              <input value={form.customer_name} onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>Phone</label>
              <input value={form.customer_phone} onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))} placeholder="98XXXXXXXX" className={inp} />
            </div>
            <div>
              <label className={lbl}>District</label>
              <input value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} placeholder="Kathmandu" className={inp} />
            </div>
            <div>
              <label className={lbl}>Area / Street</label>
              <input value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} placeholder="Thamel, Ward 26" className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>Order Total (NPR)</label>
            <input type="number" value={form.total} onChange={(e) => setForm((f) => ({ ...f, total: Number(e.target.value) }))} className={inp} />
          </div>
          <div>
            <label className={lbl}>Items / Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className={`${inp} resize-none`} />
          </div>

          <button
            onClick={handleConvert}
            disabled={loading}
            className="w-full py-3.5 bg-primary text-white font-label font-bold text-sm rounded-xl hover:bg-primary-container transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Converting…</> : <><ShoppingCart className="w-4 h-4" /> Convert & Dispatch Courier</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add channel modal ───────────────────────────────────────
function AddChannelModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ platform: 'facebook' as SocialChannel['platform'], name: '', page_url: '' })
  const [loading, setLoading] = useState(false)
  const { addToast } = useSessionStore()

  const handleAdd = async () => {
    if (!form.name.trim()) return
    setLoading(true)
    const webhookUrl = `${window.location.origin}/api/webhooks/social/${form.platform}`
    const { error } = await supabase.from('social_channels').insert({ ...form, webhook_url: webhookUrl, is_active: true })
    setLoading(false)
    if (error) { addToast('error', 'Failed to add channel.'); return }
    addToast('success', `${form.name} channel connected!`)
    onAdded(); onClose()
  }

  const inp = 'bg-white border border-black/[0.1] rounded-xl px-3 py-2.5 text-sm text-[#1A1714]/80 font-label w-full focus:outline-none focus:border-primary/40 transition-all placeholder:text-[#1A1714]/25'

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white border border-black/[0.08] rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.07]">
          <p className="text-base font-bold text-[#1A1714] font-label">Connect Channel</p>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-black/[0.04] flex items-center justify-center text-[#1A1714]/30 hover:text-[#1A1714]/70 transition-all"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1714]/35 font-label mb-2 block">Platform</label>
            <div className="relative">
              <select
                value={form.platform}
                onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value as SocialChannel['platform'] }))}
                className={`${inp} appearance-none pr-8`}
              >
                {Object.entries(PLATFORM_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1714]/30 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1714]/35 font-label mb-2 block">Channel Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Goreto.store Facebook Page" className={inp} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1714]/35 font-label mb-2 block">Page URL (optional)</label>
            <input value={form.page_url} onChange={(e) => setForm((f) => ({ ...f, page_url: e.target.value }))} placeholder="https://facebook.com/yourpage" className={inp} />
          </div>

          {/* Webhook info */}
          <div className="p-3 bg-primary/5 border border-primary/15 rounded-xl">
            <p className="text-[11px] text-primary font-label font-semibold mb-1">Webhook URL (after saving)</p>
            <p className="text-[11px] text-[#1A1714]/50 font-label break-all">
              {typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/social/{form.platform}
            </p>
            <p className="text-[10px] text-[#1A1714]/35 font-label mt-2">Add this URL to your platform's webhook settings. Orders sent to your page will appear here in real-time.</p>
          </div>

          <button
            onClick={handleAdd}
            disabled={loading || !form.name.trim()}
            className="w-full py-3 bg-primary text-white font-label font-bold text-sm rounded-xl hover:bg-primary-container transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Connect Channel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────
export default function SocialOrdersPage() {
  const [channels,       setChannels]      = useState<SocialChannel[]>([])
  const [orders,         setOrders]        = useState<SocialOrder[]>([])
  const [loading,        setLoading]       = useState(true)
  const [activeTab,      setActiveTab]     = useState<'new' | 'converted' | 'all'>('new')
  const [addChannelOpen, setAddChannel]    = useState(false)
  const [converting,     setConverting]    = useState<SocialOrder | null>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const { addToast } = useSessionStore()

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: ch }, { data: so }] = await Promise.all([
      supabase.from('social_channels').select('*').order('created_at', { ascending: false }),
      supabase.from('social_orders').select('*, channel:social_channels(*)').order('created_at', { ascending: false }).limit(100),
    ])
    setChannels((ch as SocialChannel[]) ?? [])
    setOrders((so as unknown as SocialOrder[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
    // Realtime subscription for new social orders
    const ch = supabase.channel('social-orders-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'social_orders' }, (payload) => {
        setOrders((prev) => [payload.new as SocialOrder, ...prev])
        addToast('info', 'New social order received!')
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  useEffect(() => {
    if (!pageRef.current || loading) return
    const ctx = gsap.context(() => {
      gsap.from('.social-card', { y: 20, opacity: 0, duration: 0.45, stagger: 0.06, ease: 'power2.out' })
    }, pageRef)
    return () => ctx.revert()
  }, [loading])

  const toggleChannel = async (id: string, val: boolean) => {
    await supabase.from('social_channels').update({ is_active: val }).eq('id', id)
    setChannels((prev) => prev.map((c) => c.id === id ? { ...c, is_active: val } : c))
  }

  const ignoreOrder = async (id: string) => {
    await supabase.from('social_orders').update({ status: 'ignored' }).eq('id', id)
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: 'ignored' } : o))
  }

  const tabOrders = orders.filter((o) =>
    activeTab === 'all' ? true :
    activeTab === 'new' ? o.status === 'new' :
    o.status === 'converted'
  )

  return (
    <div ref={pageRef}>
      {/* Header */}
      <div className="social-card flex items-center justify-between mb-7">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#1A1714]/30 font-label mb-1">Marketplace</p>
          <h1 className="text-2xl font-bold text-[#1A1714] font-label">Social Orders</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={fetchAll} className="w-9 h-9 rounded-xl bg-white border border-black/[0.1] flex items-center justify-center text-[#1A1714]/40 hover:text-[#1A1714]/80 hover:bg-black/[0.04] transition-all">
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setAddChannel(true)}
            className="flex items-center gap-2 bg-primary text-white text-xs font-label font-bold px-4 py-2.5 rounded-xl hover:bg-primary-container transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-3.5 h-3.5" /> Connect Channel
          </button>
        </div>
      </div>

      {/* Connected channels */}
      <div className="social-card mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1714]/30 font-label mb-3">Connected Channels</p>
        {channels.length === 0 ? (
          <div className="bg-white border border-black/[0.07] border-dashed rounded-2xl py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-black/[0.04] flex items-center justify-center mx-auto mb-3">
              <Link2 className="w-5 h-5 text-[#1A1714]/20" />
            </div>
            <p className="text-sm text-[#1A1714]/30 font-label mb-1">No channels connected yet</p>
            <p className="text-xs text-[#1A1714]/20 font-body">Connect Facebook, Instagram, or WhatsApp to receive orders</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {channels.map((ch) => {
              const meta = PLATFORM_META[ch.platform] ?? PLATFORM_META.facebook
              return (
                <div key={ch.id} className={`rounded-2xl p-4 border ${meta.bg} border-black/[0.06] flex items-center gap-3`}>
                  <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center shrink-0 ${meta.color}`}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1A1714] font-label truncate">{ch.name}</p>
                    <p className={`text-[11px] font-label ${meta.color}`}>{meta.label}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {ch.page_url && (
                      <a href={ch.page_url} target="_blank" rel="noreferrer" className="text-white/20 hover:text-white/60 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {/* Toggle */}
                    <button
                      onClick={() => toggleChannel(ch.id, !ch.is_active)}
                      className={`w-9 h-5 rounded-full transition-all relative ${ch.is_active ? 'bg-primary' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${ch.is_active ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Orders */}
      <div className="social-card bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-4 pb-0 border-b border-black/[0.06]">
          {(['new', 'converted', 'all'] as const).map((t) => {
            const cnt = orders.filter((o) => t === 'all' ? true : t === 'new' ? o.status === 'new' : o.status === 'converted').length
            return (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-2.5 text-xs font-label font-bold capitalize border-b-2 transition-all ${
                  activeTab === t ? 'border-primary text-primary' : 'border-transparent text-[#1A1714]/30 hover:text-[#1A1714]/60'
                }`}
              >
                {t} <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === t ? 'bg-primary/15 text-primary' : 'bg-black/[0.05] text-[#1A1714]/30'}`}>{cnt}</span>
              </button>
            )
          })}
          <div className="ml-auto flex items-center gap-1.5 pb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-[#1A1714]/30 font-label">Live</span>
          </div>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-black/[0.04] rounded-xl animate-pulse" />)}
          </div>
        ) : tabOrders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart className="w-8 h-8 text-black/[0.1] mx-auto mb-2" />
            <p className="text-sm text-[#1A1714]/30 font-label">No {activeTab === 'all' ? '' : activeTab} orders</p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.05]">
            {tabOrders.map((order) => {
              const pm = PLATFORM_META[order.platform] ?? PLATFORM_META.facebook
              const sm = STATUS_META[order.status] ?? STATUS_META.new
              return (
                <div key={order.id} className="px-5 py-4 hover:bg-black/[0.02] transition-colors flex items-start gap-4">
                  {/* Platform icon */}
                  <div className={`w-9 h-9 rounded-xl ${pm.bg} flex items-center justify-center shrink-0 ${pm.color} mt-0.5`}>
                    {pm.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-[#1A1714] font-label">{order.customer_name}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-label ${sm.bg} ${sm.text}`}>{sm.label}</span>
                      {order.courier_dispatched && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-label">
                          <CheckCircle className="w-3 h-3" /> Dispatched
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#1A1714]/50 font-body line-clamp-2 mb-1.5">{order.items_text}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[#1A1714]/35 font-label flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {order.customer_phone && <span className="text-[11px] text-[#1A1714]/35 font-label">{order.customer_phone}</span>}
                      {order.total && <span className="text-[11px] font-bold text-[#1A1714]/60 font-label">NPR {order.total.toLocaleString()}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  {order.status === 'new' && (
                    <div className="flex items-center gap-2 shrink-0">
                      {order.message_url && (
                        <a href={order.message_url} target="_blank" rel="noreferrer"
                          className="w-8 h-8 rounded-xl bg-white border border-black/[0.1] flex items-center justify-center text-[#1A1714]/30 hover:text-[#1A1714]/70 hover:bg-black/[0.04] transition-all">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => ignoreOrder(order.id)}
                        className="w-8 h-8 rounded-xl bg-white border border-black/[0.1] flex items-center justify-center text-[#1A1714]/25 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConverting(order)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-xs font-label font-bold rounded-xl hover:bg-primary-container transition-all shadow-md shadow-primary/20"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Convert
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {addChannelOpen && <AddChannelModal onClose={() => setAddChannel(false)} onAdded={fetchAll} />}
      {converting && <ConvertModal order={converting} onClose={() => setConverting(null)} onConverted={fetchAll} />}
    </div>
  )
}
