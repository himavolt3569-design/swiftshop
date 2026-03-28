'use client'

import { useEffect, useState, useRef } from 'react'
import { RefreshCcw, Search, Filter, X, Package, Phone, Mail, MapPin, CreditCard, ChevronDown, CheckCircle, Truck, Clock, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { supabase }    from '@/lib/supabase'
import { useSessionStore } from '@/store/sessionStore'
import { Order, OrderStatus } from '@/lib/types'
import { gsap }        from '@/lib/gsap'

const STATUS_META: Record<OrderStatus, { label: string; bg: string; text: string; dot: string }> = {
  placed:     { label: 'Placed',      bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400'   },
  confirmed:  { label: 'Confirmed',   bg: 'bg-blue-50',     text: 'text-blue-600',    dot: 'bg-blue-400'    },
  picked_up:  { label: 'Picked Up',   bg: 'bg-violet-50',   text: 'text-violet-600',  dot: 'bg-violet-400'  },
  on_the_way: { label: 'On the Way',  bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-400'   },
  delivered:  { label: 'Delivered',   bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500' },
  failed:     { label: 'Failed',      bg: 'bg-red-50',      text: 'text-red-600',     dot: 'bg-red-400'     },
  held:       { label: 'Held',        bg: 'bg-orange-50',   text: 'text-orange-600',  dot: 'bg-orange-400'  },
}

const STATUSES = Object.keys(STATUS_META) as OrderStatus[]

const STATUS_FLOW: OrderStatus[] = ['placed', 'confirmed', 'picked_up', 'on_the_way', 'delivered']

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status as OrderStatus] ?? STATUS_META.placed
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-label uppercase tracking-wide ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-black/[0.04] flex items-center justify-center shrink-0 text-[#1A1714]/30 mt-0.5">{icon}</div>
      <div>
        <p className="text-[10px] text-[#1A1714]/35 font-label uppercase tracking-wider">{label}</p>
        <p className="text-sm text-[#1A1714]/80 font-label mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export default function OrdersPage() {
  const [orders,       setOrders]      = useState<Order[]>([])
  const [loading,      setLoading]     = useState(true)
  const [selected,     setSelected]    = useState<Order | null>(null)
  const [statusFilter, setFilter]      = useState<string>('')
  const [search,       setSearch]      = useState('')
  const [updating,     setUpdating]    = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const { addToast } = useSessionStore()

  const fetchAll = async () => {
    setLoading(true)
    let q = supabase
      .from('orders')
      .select('*, courier:couriers(name), items:order_items(*), events:order_events(*)')
      .order('created_at', { ascending: false })
    if (statusFilter) q = q.eq('status', statusFilter)
    if (search.trim()) q = q.ilike('customer_name', `%${search}%`)
    const { data } = await q
    setOrders((data as unknown as Order[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [statusFilter, search])

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchAll)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Drawer GSAP slide-in
  useEffect(() => {
    if (selected && drawerRef.current) {
      gsap.from(drawerRef.current, { x: '100%', duration: 0.35, ease: 'power3.out' })
    }
  }, [selected?.id])

  const updateStatus = async (id: string, status: OrderStatus) => {
    setUpdating(true)
    await supabase.from('orders').update({ status }).eq('id', id)
    await supabase.from('order_events').insert({ order_id: id, status })
    addToast('success', `Status updated to ${status.replace(/_/g, ' ')}`)
    setUpdating(false)
    fetchAll()
    setSelected((prev) => prev ? { ...prev, status } : prev)
  }

  const redispatch = async (id: string) => {
    await supabase.functions.invoke('assign-courier', { body: { order_id: id } })
    addToast('success', 'Re-dispatch triggered.')
  }

  const filtered = orders.filter((o) =>
    !search.trim() ||
    o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_phone?.includes(search)
  )

  return (
    <div className="flex gap-6 h-[calc(100vh-6rem)] overflow-hidden">
      {/* ── Order list ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-[#1A1714] font-label">Orders</h1>
            <p className="text-xs text-[#1A1714]/40 font-label">{filtered.length} orders</p>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-black/[0.1] rounded-xl px-3.5 py-2.5 w-56 focus-within:border-primary/40 transition-all">
              <Search className="w-3.5 h-3.5 text-[#1A1714]/30 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders…"
                className="bg-transparent border-none focus:ring-0 focus:outline-none text-xs text-[#1A1714]/70 placeholder:text-[#1A1714]/30 w-full font-label"
                style={{ outline: 'none' }}
              />
            </div>
            {/* Status filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1A1714]/30 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-white border border-black/[0.1] rounded-xl pl-9 pr-8 py-2.5 text-xs text-[#1A1714]/70 font-label appearance-none focus:outline-none focus:border-primary/40"
              >
                <option value="">All Statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1A1714]/30 pointer-events-none" />
            </div>
            <button onClick={fetchAll} className="w-9 h-9 rounded-xl bg-white border border-black/[0.1] flex items-center justify-center text-[#1A1714]/40 hover:text-[#1A1714]/80 hover:bg-black/[0.04] transition-all">
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Order table */}
        <div className="flex-1 bg-white border border-black/[0.07] rounded-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_80px_100px_90px_72px] gap-4 px-5 py-3 border-b border-black/[0.06] shrink-0">
            {['Order', 'Customer', 'Total', 'Payment', 'Status', 'Date'].map((h) => (
              <p key={h} className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1714]/30 font-label">{h}</p>
            ))}
          </div>
          {/* Rows */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-5 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-14 bg-black/[0.04] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <Package className="w-8 h-8 text-black/[0.1] mx-auto mb-2" />
                <p className="text-sm text-[#1A1714]/30 font-label">No orders found</p>
              </div>
            ) : (
              filtered.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelected(order)}
                  className={`w-full grid grid-cols-[1fr_1fr_80px_100px_90px_72px] gap-4 px-5 py-3.5 text-left transition-all border-b border-black/[0.04] hover:bg-black/[0.02] ${
                    selected?.id === order.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-[#1A1714] font-label">{order.order_number}</p>
                    <p className="text-[11px] text-[#1A1714]/40 font-label">{order.district}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#1A1714]/70 font-label truncate">{order.customer_name}</p>
                    <p className="text-[11px] text-[#1A1714]/40 font-label">{order.customer_phone}</p>
                  </div>
                  <p className="text-sm font-bold text-[#1A1714]/80 font-label self-center">NPR {order.total.toLocaleString()}</p>
                  <p className="text-xs text-[#1A1714]/50 font-label self-center capitalize">{order.payment_method.replace(/_/g, ' ')}</p>
                  <div className="self-center"><StatusBadge status={order.status} /></div>
                  <p className="text-[11px] text-[#1A1714]/35 font-label self-center">
                    {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Order detail panel ── */}
      {selected && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/20 lg:hidden" onClick={() => setSelected(null)} />
          <div
            ref={drawerRef}
            className="w-[400px] shrink-0 bg-white border border-black/[0.07] rounded-2xl overflow-y-auto flex flex-col shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.07] shrink-0">
              <div>
                <p className="text-xs text-[#1A1714]/35 font-label uppercase tracking-wider">Order Details</p>
                <p className="text-base font-bold text-[#1A1714] font-label mt-0.5">{selected.order_number}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selected.status} />
                <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-lg bg-black/[0.04] flex items-center justify-center text-[#1A1714]/30 hover:text-[#1A1714]/80 hover:bg-black/[0.08] transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Customer info */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1714]/30 font-label">Customer</p>
                <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Name" value={selected.customer_name} />
                <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={selected.customer_phone} />
                <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={selected.customer_email} />
                <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Address" value={`${selected.area}, ${selected.district}, ${selected.province}`} />
                {selected.landmark && <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Landmark" value={selected.landmark} />}
                <InfoRow icon={<CreditCard className="w-3.5 h-3.5" />} label="Payment" value={selected.payment_method.replace(/_/g, ' ')} />
                {selected.notes && <InfoRow icon={<AlertCircle className="w-3.5 h-3.5" />} label="Notes" value={selected.notes} />}
              </div>

              {/* Items */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1714]/30 font-label mb-3">Items</p>
                <div className="space-y-2">
                  {selected.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-black/[0.03] rounded-xl">
                      <div className="w-10 h-12 rounded-lg bg-black/[0.05] overflow-hidden shrink-0">
                        {item.product_image
                          ? <Image src={item.product_image} alt={item.product_name} width={40} height={48} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-[#1A1714]/25 font-headline text-base">{item.product_name.charAt(0)}</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1A1714]/80 font-label truncate">{item.product_name}</p>
                        <p className="text-[10px] text-[#1A1714]/40 font-label">{item.size} × {item.quantity}</p>
                      </div>
                      <span className="text-xs font-bold text-[#1A1714]/70 font-label shrink-0">NPR {item.line_price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-black/[0.07] mt-3 pt-3 flex justify-between text-sm font-bold text-[#1A1714] font-label">
                  <span>Total</span>
                  <span>NPR {selected.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Status flow */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1714]/30 font-label mb-3">Status Pipeline</p>
                <div className="flex items-center gap-1 mb-4">
                  {STATUS_FLOW.map((s, i) => {
                    const idx = STATUS_FLOW.indexOf(selected.status as OrderStatus)
                    const done = i <= idx
                    return (
                      <div key={s} className="flex items-center flex-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${done ? 'bg-emerald-500 border-emerald-500' : 'bg-transparent border-black/[0.1]'}`}>
                          {done ? <CheckCircle className="w-3.5 h-3.5 text-white" /> : <span className="w-1.5 h-1.5 rounded-full bg-black/[0.15]" />}
                        </div>
                        {i < STATUS_FLOW.length - 1 && <div className={`flex-1 h-0.5 transition-all ${done && i < idx ? 'bg-emerald-500' : 'bg-black/[0.08]'}`} />}
                      </div>
                    )
                  })}
                </div>
                <p className="text-[10px] text-[#1A1714]/30 font-label text-center">Current: <span className="text-[#1A1714]/60">{selected.status.replace(/_/g, ' ')}</span></p>
              </div>

              {/* Update status */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1714]/30 font-label mb-3">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => {
                    const m = STATUS_META[s]
                    return (
                      <button
                        key={s}
                        onClick={() => updateStatus(selected.id, s)}
                        disabled={updating || selected.status === s}
                        className={(
                          selected.status === s
                            ? m.bg + ' ' + m.text + ' border border-current/20 px-3 py-1.5 rounded-lg text-xs font-label font-bold transition-all disabled:opacity-50'
                            : 'bg-black/[0.04] text-[#1A1714]/50 hover:bg-black/[0.08] hover:text-[#1A1714]/80 border border-transparent px-3 py-1.5 rounded-lg text-xs font-label font-bold transition-all disabled:opacity-50'
                        )}
                      >
                        {m.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Courier info */}
              {selected.courier && (
                <div className="flex items-center gap-3 p-3 bg-black/[0.03] rounded-xl border border-black/[0.07]">
                  <Truck className="w-4 h-4 text-[#1A1714]/30 shrink-0" />
                  <div>
                    <p className="text-[10px] text-[#1A1714]/35 font-label">Assigned Courier</p>
                    <p className="text-sm text-[#1A1714]/70 font-label font-semibold">{selected.courier.name}</p>
                  </div>
                </div>
              )}

              {/* Timeline */}
              {selected.events && selected.events.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1714]/30 font-label mb-3">Timeline</p>
                  <div className="space-y-2">
                    {[...selected.events].reverse().map((ev) => (
                      <div key={ev.id} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        <div>
                          <p className="text-xs text-[#1A1714]/70 font-label capitalize">{ev.status.replace(/_/g, ' ')}</p>
                          {ev.note && <p className="text-[11px] text-[#1A1714]/40 font-body">{ev.note}</p>}
                          <p className="text-[10px] text-[#1A1714]/30 font-label flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(ev.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Redispatch */}
              {(selected.status === 'held' || selected.status === 'failed') && (
                <button
                  onClick={() => redispatch(selected.id)}
                  className="w-full py-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-label font-bold rounded-xl hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCcw className="w-4 h-4" /> Re-dispatch to Courier
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
