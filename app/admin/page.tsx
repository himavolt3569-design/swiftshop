'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import {
  ShoppingBasket, DollarSign, Truck, PauseCircle, TrendingUp,
  ArrowRight, Clock, ShoppingBag, Activity, Package,
  CheckCircle2, XCircle, AlertCircle, Zap, RefreshCw,
  Users, TrendingDown,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Order, OrderStatus } from '@/lib/types'
import { gsap } from '@/lib/gsap'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────────

interface DashboardStats {
  todayOrders: number
  todayRevenue: number
  pendingDispatch: number
  heldOrders: number
  totalRevenue: number
  totalOrders: number
  weekOrders: number
  weekRevenue: number
}

interface AuditEntry {
  id: string
  type: 'new_order' | 'status_change'
  orderNumber: string
  customerName: string
  status: OrderStatus
  prevStatus?: string
  amount?: number
  district?: string
  ts: string
}

// ── Configs ────────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string; ring: string }> = {
  placed:     { bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400',   ring: 'ring-slate-200'  },
  confirmed:  { bg: 'bg-blue-50',     text: 'text-blue-600',    dot: 'bg-blue-400',    ring: 'ring-blue-100'   },
  picked_up:  { bg: 'bg-violet-50',   text: 'text-violet-600',  dot: 'bg-violet-400',  ring: 'ring-violet-100' },
  on_the_way: { bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-400',   ring: 'ring-amber-100'  },
  delivered:  { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-100'},
  failed:     { bg: 'bg-red-50',      text: 'text-red-600',     dot: 'bg-red-400',     ring: 'ring-red-100'    },
  held:       { bg: 'bg-orange-50',   text: 'text-orange-600',  dot: 'bg-orange-400',  ring: 'ring-orange-100' },
}

const AUDIT_META: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  new_order:     { bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: ShoppingBag   },
  confirmed:     { bg: 'bg-blue-500/10',    text: 'text-blue-500',    icon: CheckCircle2  },
  picked_up:     { bg: 'bg-violet-500/10',  text: 'text-violet-500',  icon: Package       },
  on_the_way:    { bg: 'bg-amber-500/10',   text: 'text-amber-500',   icon: Truck         },
  delivered:     { bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: CheckCircle2  },
  failed:        { bg: 'bg-red-500/10',     text: 'text-red-500',     icon: XCircle       },
  held:          { bg: 'bg-orange-500/10',  text: 'text-orange-500',  icon: AlertCircle   },
  status_change: { bg: 'bg-slate-500/10',   text: 'text-slate-400',   icon: RefreshCw     },
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 10)    return 'just now'
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.placed
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-label uppercase tracking-wide ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function KpiCard({
  icon: Icon, label, value, sub, subUp, accentColor, loading,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  subUp?: boolean
  accentColor?: string
  loading?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] p-5 hover:shadow-md hover:border-black/[0.10] transition-all duration-200">
      <div className="flex items-start justify-between mb-5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accentColor ?? 'bg-[#F4F2EF] text-[#1A1714]/40'}`}>
          <Icon className="w-4 h-4" strokeWidth={1.8} />
        </div>
        {sub && !loading && (
          <span className={`flex items-center gap-1 text-[11px] font-bold font-label ${subUp !== false ? 'text-emerald-600' : 'text-red-500'}`}>
            {subUp !== false ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {sub}
          </span>
        )}
      </div>
      {loading ? (
        <>
          <div className="h-7 w-24 bg-black/[0.04] rounded-lg animate-pulse mb-2" />
          <div className="h-3 w-16 bg-black/[0.03] rounded animate-pulse" />
        </>
      ) : (
        <>
          <p className="text-[22px] font-bold text-[#0F0F0F] font-headline leading-none mb-1.5">{value}</p>
          <p className="text-[11px] text-[#1A1714]/40 font-label">{label}</p>
        </>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [stats,   setStats]   = useState<DashboardStats | null>(null)
  const [orders,  setOrders]  = useState<Order[]>([])
  const [audit,   setAudit]   = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [, setTick] = useState(0)
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pageRef.current || loading) return
    const ctx = gsap.context(() => {
      gsap.from('.dash-item', {
        y: 20, opacity: 0, duration: 0.45, stagger: 0.055, ease: 'power2.out', clearProps: 'all',
      })
    }, pageRef)
    return () => ctx.revert()
  }, [loading])

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const fetchAll = useCallback(async () => {
    const today      = new Date(); today.setHours(0, 0, 0, 0)
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    const weekStart  = new Date(); weekStart.setDate(weekStart.getDate() - 7); weekStart.setHours(0, 0, 0, 0)

    const [{ data: todayData }, { data: recentData }, { data: totalData }, { data: weekData }] = await Promise.all([
      supabase.from('orders').select('total, status').gte('created_at', today.toISOString()),
      supabase.from('orders').select('*, items:order_items(*)').order('created_at', { ascending: false }).limit(12),
      supabase.from('orders').select('total').gte('created_at', monthStart.toISOString()),
      supabase.from('orders').select('total, status').gte('created_at', weekStart.toISOString()),
    ])

    const allOrders     = (recentData as Order[]) ?? []
    const todayIso      = today.toISOString()
    const monthIso      = monthStart.toISOString()
    const weekIso       = weekStart.toISOString()
    const resolvedToday = todayData  ?? allOrders.filter((o) => o.created_at >= todayIso)
    const resolvedMonth = totalData  ?? allOrders.filter((o) => o.created_at >= monthIso)
    const resolvedWeek  = weekData   ?? allOrders.filter((o) => o.created_at >= weekIso)

    setStats({
      todayOrders:     resolvedToday.length,
      todayRevenue:    resolvedToday.reduce((s, o) => s + o.total, 0),
      pendingDispatch: resolvedToday.filter((o) => o.status === 'confirmed').length,
      heldOrders:      allOrders.filter((o) => o.status === 'held').length,
      totalRevenue:    resolvedMonth.reduce((s, o) => s + o.total, 0),
      totalOrders:     resolvedMonth.length,
      weekOrders:      resolvedWeek.length,
      weekRevenue:     resolvedWeek.reduce((s, o) => s + o.total, 0),
    })
    setOrders(allOrders)
    setLoading(false)
  }, [])

  const fetchAudit = useCallback(async () => {
    const entries: AuditEntry[] = []

    const { data: evts } = await supabase
      .from('order_events')
      .select('id, status, created_at, orders(order_number, customer_name, total, district)')
      .order('created_at', { ascending: false })
      .limit(20)

    if (evts) {
      type EvtRow = { id: string; status: string; created_at: string; orders: { order_number: string; customer_name: string; total: number; district: string } | null }
      for (const e of (evts as unknown as EvtRow[])) {
        entries.push({
          id: `evt-${e.id}`, type: 'status_change',
          orderNumber:  e.orders?.order_number ?? '—',
          customerName: e.orders?.customer_name ?? 'Customer',
          status:       e.status as OrderStatus,
          amount:       e.orders?.total,
          district:     e.orders?.district,
          ts:           e.created_at,
        })
      }
    }

    const since = new Date(); since.setHours(since.getHours() - 48)
    const { data: newOrds } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, total, district, created_at')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(20)

    if (newOrds) {
      type OrdRow = { id: string; order_number: string; customer_name: string; total: number; district: string; created_at: string }
      for (const o of (newOrds as OrdRow[])) {
        entries.push({
          id: `ord-${o.id}`, type: 'new_order',
          orderNumber: o.order_number, customerName: o.customer_name,
          status: 'placed', amount: o.total, district: o.district, ts: o.created_at,
        })
      }
    }

    entries.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    const seen = new Set<string>()
    setAudit(entries.filter((e) => { if (seen.has(e.id)) return false; seen.add(e.id); return true }).slice(0, 30))
  }, [])

  useEffect(() => {
    fetchAll()
    fetchAudit()

    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const o = payload.new as { id: string; order_number: string; customer_name: string; total: number; district: string; created_at: string }
        const entry: AuditEntry = {
          id: `ord-${o.id}-${Date.now()}`, type: 'new_order',
          orderNumber: o.order_number ?? '—', customerName: o.customer_name ?? 'Customer',
          status: 'placed', amount: o.total, district: o.district,
          ts: o.created_at ?? new Date().toISOString(),
        }
        setAudit((prev) => [entry, ...prev].slice(0, 30))
        fetchAll()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const o   = payload.new as { id: string; order_number: string; customer_name: string; total: number; district: string; status: string }
        const old = payload.old as { status: string }
        if (o.status !== old.status) {
          const entry: AuditEntry = {
            id: `upd-${o.id}-${Date.now()}`, type: 'status_change',
            orderNumber: o.order_number ?? '—', customerName: o.customer_name ?? 'Customer',
            status: o.status as OrderStatus, prevStatus: old.status,
            amount: o.total, district: o.district, ts: new Date().toISOString(),
          }
          setAudit((prev) => [entry, ...prev].slice(0, 30))
        }
        fetchAll()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchAll, fetchAudit])

  // ── Status breakdown for the mini bar chart ──
  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div ref={pageRef} className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="dash-item flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#1A1714]/30 font-label mb-0.5">Admin</p>
          <h1 className="text-[22px] font-bold text-[#0F0F0F] font-label tracking-tight">Overview</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold font-label text-emerald-700">Live</span>
          </div>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1.5 text-[12px] font-semibold font-label text-[#1A1714]/50 hover:text-primary transition-colors duration-150 bg-white border border-black/[0.07] px-3 py-1.5 rounded-full hover:border-primary/30"
          >
            All Orders <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────── */}
      <div className="dash-item grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={ShoppingBasket} label="Today's Orders"
          value={loading ? '—' : String(stats!.todayOrders)}
          loading={loading}
        />
        <KpiCard
          icon={DollarSign} label="Today's Revenue"
          value={loading ? '—' : `NPR ${(stats?.todayRevenue ?? 0).toLocaleString()}`}
          sub="this month" subUp
          accentColor="bg-primary/[0.08] text-primary"
          loading={loading}
        />
        <KpiCard
          icon={Truck} label="Pending Dispatch"
          value={loading ? '—' : String(stats!.pendingDispatch)}
          loading={loading}
        />
        <KpiCard
          icon={PauseCircle} label="Held Orders"
          value={loading ? '—' : String(stats!.heldOrders)}
          loading={loading}
        />
      </div>

      {/* ── Summary band ────────────────────────────────────────── */}
      <div className="dash-item grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Month Revenue', value: `NPR ${fmt(stats?.totalRevenue ?? 0)}` },
          { label: 'Month Orders',  value: fmt(stats?.totalOrders ?? 0) },
          { label: 'Week Revenue',  value: `NPR ${fmt(stats?.weekRevenue ?? 0)}` },
          { label: 'Week Orders',   value: fmt(stats?.weekOrders ?? 0) },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-black/[0.06] rounded-2xl px-5 py-4 hover:shadow-sm hover:border-black/[0.10] transition-all duration-200">
            <p className="text-[10px] uppercase tracking-wider text-[#1A1714]/35 font-label mb-1.5">{s.label}</p>
            {loading
              ? <div className="h-6 w-20 bg-black/[0.04] rounded-lg animate-pulse" />
              : <p className="text-xl font-bold text-[#0F0F0F] font-headline">{s.value}</p>
            }
          </div>
        ))}
      </div>

      {/* ── Status breakdown ────────────────────────────────────── */}
      {!loading && orders.length > 0 && (
        <div className="dash-item bg-white border border-black/[0.06] rounded-2xl px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] uppercase tracking-[0.15em] text-[#1A1714]/35 font-label">Order Status Breakdown</p>
            <span className="text-[11px] text-[#1A1714]/30 font-label">{orders.length} recent</span>
          </div>
          <div className="flex gap-1 h-2 rounded-full overflow-hidden mb-4">
            {Object.entries(STATUS_COLORS).map(([status, c]) => {
              const count = statusCounts[status] ?? 0
              if (!count) return null
              const pct = (count / orders.length) * 100
              return <div key={status} title={`${status}: ${count}`} className={`${c.dot} rounded-full`} style={{ width: `${pct}%` }} />
            })}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {Object.entries(STATUS_COLORS).map(([status, c]) => {
              const count = statusCounts[status] ?? 0
              if (!count) return null
              return (
                <div key={status} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  <span className="text-[11px] text-[#1A1714]/50 font-label capitalize">{status.replace(/_/g, ' ')}</span>
                  <span className="text-[11px] font-bold text-[#1A1714]/70 font-label">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Main: Recent Orders + Live Audit ────────────────────── */}
      <div className="dash-item grid gap-5 lg:grid-cols-[1fr_360px]">

        {/* Recent Orders */}
        <div className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.05] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#F4F2EF] flex items-center justify-center">
                <ShoppingBasket className="w-3.5 h-3.5 text-[#1A1714]/40" />
              </div>
              <h3 className="text-[13px] font-bold text-[#0F0F0F] font-label">Recent Orders</h3>
            </div>
            <Link
              href="/admin/orders"
              className="text-[11px] text-primary hover:text-primary/70 transition-colors duration-150 font-label font-semibold flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-5 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-1">
                    <div className="w-1 h-10 bg-black/[0.04] rounded-full animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-black/[0.04] rounded w-2/3 animate-pulse" />
                      <div className="h-2.5 bg-black/[0.03] rounded w-1/2 animate-pulse" />
                    </div>
                    <div className="h-3 w-16 bg-black/[0.04] rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-10 h-10 rounded-2xl bg-black/[0.04] flex items-center justify-center mx-auto mb-3">
                  <ShoppingBasket className="w-5 h-5 text-black/15" />
                </div>
                <p className="text-sm text-[#1A1714]/30 font-label">No orders yet</p>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.04]">
                {orders.map((order) => {
                  const c = STATUS_COLORS[order.status] ?? STATUS_COLORS.placed
                  const itemCount = order.items?.length ?? 0
                  return (
                    <Link
                      key={order.id}
                      href={`/admin/orders?q=${encodeURIComponent(order.order_number)}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-black/[0.015] transition-colors duration-150 group"
                    >
                      <div className={`w-[3px] h-9 rounded-full shrink-0 ${c.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[13px] font-bold text-[#0F0F0F] font-label group-hover:text-primary transition-colors duration-150">
                            {order.order_number}
                          </span>
                          <StatusBadge status={order.status} />
                          {itemCount > 0 && (
                            <span className="text-[9px] bg-black/[0.04] text-[#1A1714]/35 px-1.5 py-0.5 rounded-full font-label hidden sm:inline">
                              {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#1A1714]/35 font-label truncate">
                          {order.customer_name} · {order.district}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-bold text-[#1A1714]/70 font-label">
                          NPR {order.total.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1 text-[#1A1714]/20 justify-end mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px] font-label tabular-nums">{timeAgo(order.created_at)}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Live Audit */}
        <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-white/[0.07] flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-white/50" />
              </div>
              <h3 className="text-[13px] font-bold text-white font-label">Live Audit</h3>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold font-label text-emerald-400">Live</span>
            </div>
          </div>

          {/* Feed */}
          <div className="flex-1 overflow-y-auto no-scrollbar" style={{ maxHeight: 520 }}>
            {audit.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center h-full">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-3">
                  <Zap className="w-5 h-5 text-white/15" />
                </div>
                <p className="text-[13px] font-semibold text-white/25 font-label">Waiting for activity</p>
                <p className="text-[11px] text-white/15 font-body mt-1">Events appear here in real-time</p>
              </div>
            ) : (
              <div className="p-3 space-y-px">
                {audit.map((entry, i) => {
                  const metaKey = entry.type === 'new_order' ? 'new_order' : entry.status
                  const meta    = AUDIT_META[metaKey] ?? AUDIT_META.status_change
                  const Icon    = meta.icon
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150 hover:bg-white/[0.04] ${i === 0 ? 'animate-fade-in' : ''}`}
                    >
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${meta.bg} ${meta.text}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-white/75 font-label leading-snug">
                          {entry.type === 'new_order' ? (
                            <>New order · <span className="text-white">{entry.customerName.split(' ')[0]}</span></>
                          ) : (
                            <><span className="text-white">{entry.customerName.split(' ')[0]}</span> → <span className="capitalize text-white/60">{entry.status.replace(/_/g, ' ')}</span></>
                          )}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-white/25 font-label">{entry.orderNumber}</span>
                          {entry.amount != null && (
                            <>
                              <span className="text-white/10">·</span>
                              <span className="text-[10px] text-white/30 font-label">NPR {entry.amount.toLocaleString()}</span>
                            </>
                          )}
                          {entry.district && (
                            <>
                              <span className="text-white/10">·</span>
                              <span className="text-[10px] text-white/20 font-label">{entry.district}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-white/20 font-label shrink-0 mt-0.5 tabular-nums">
                        {timeAgo(entry.ts)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {audit.length > 0 && (
            <div className="px-5 py-3 border-t border-white/[0.05] shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-white/20" />
                  <span className="text-[10px] text-white/20 font-label">{audit.length} events logged</span>
                </div>
                <span className="text-[10px] text-white/15 font-label">auto-updating</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
