'use client'

import { useEffect, useState, useRef } from 'react'
import { ShoppingBasket, DollarSign, Truck, PauseCircle, TrendingUp, ArrowRight, Clock } from 'lucide-react'
import { supabase }  from '@/lib/supabase'
import { Order }     from '@/lib/types'
import { gsap }      from '@/lib/gsap'
import Link          from 'next/link'

interface DashboardStats {
  todayOrders:     number
  todayRevenue:    number
  pendingDispatch: number
  heldOrders:      number
  totalRevenue:    number
  totalOrders:     number
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  placed:     { bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400'   },
  confirmed:  { bg: 'bg-blue-50',     text: 'text-blue-600',    dot: 'bg-blue-400'    },
  picked_up:  { bg: 'bg-violet-50',   text: 'text-violet-600',  dot: 'bg-violet-400'  },
  on_the_way: { bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-400'   },
  delivered:  { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-400' },
  failed:     { bg: 'bg-red-50',      text: 'text-red-600',     dot: 'bg-red-400'     },
  held:       { bg: 'bg-orange-50',   text: 'text-orange-600',  dot: 'bg-orange-400'  },
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.placed
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-label uppercase tracking-wide ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function StatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 border transition-all hover:scale-[1.01] ${
      accent
        ? 'bg-primary/5 border-primary/20'
        : 'bg-white border-black/[0.07]'
    }`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${accent ? 'bg-primary/15 text-primary' : 'bg-black/[0.04] text-[#1A1714]/40'}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-[#1A1714] font-headline mb-0.5">{value}</p>
      <p className="text-xs text-[#1A1714]/40 font-label">{label}</p>
      {sub && <p className="text-[11px] text-emerald-600 font-label mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{sub}</p>}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats,   setStats]   = useState<DashboardStats | null>(null)
  const [orders,  setOrders]  = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pageRef.current) return
    const ctx = gsap.context(() => {
      gsap.from('.dash-card', {
        y: 24, opacity: 0, duration: 0.5, stagger: 0.07, ease: 'power2.out',
      })
    }, pageRef)
    return () => ctx.revert()
  }, [loading])

  const fetchAll = async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

    const [
      { data: todayData,  error: e1 },
      { data: recentData, error: e2 },
      { data: totalData,  error: e3 },
    ] = await Promise.all([
      supabase.from('orders').select('total, status').gte('created_at', today.toISOString()),
      supabase.from('orders').select('*, items:order_items(*)').order('created_at', { ascending: false }).limit(10),
      supabase.from('orders').select('total').gte('created_at', monthStart.toISOString()),
    ])

    if (e1) console.error('[dashboard] todayData error:', e1)
    if (e2) console.error('[dashboard] recentData error:', e2)
    if (e3) console.error('[dashboard] totalData error:', e3)

    // Fallback: derive month/today stats from recentData if date-filtered queries fail
    const allOrders = (recentData as Order[]) ?? []
    const todayIso = today.toISOString()
    const monthIso = monthStart.toISOString()

    const resolvedToday = todayData ?? allOrders.filter(o => o.created_at >= todayIso)
    const resolvedMonth = totalData ?? allOrders.filter(o => o.created_at >= monthIso)

    setStats({
      todayOrders:     resolvedToday.length,
      todayRevenue:    resolvedToday.reduce((s, o) => s + o.total, 0),
      pendingDispatch: resolvedToday.filter((o) => o.status === 'confirmed').length,
      heldOrders:      allOrders.filter((o) => o.status === 'held').length,
      totalRevenue:    resolvedMonth.reduce((s, o) => s + o.total, 0),
      totalOrders:     resolvedMonth.length,
    })
    setOrders(allOrders)
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchAll)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div ref={pageRef}>
      {/* Header */}
      <div className="dash-card flex items-center justify-between mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#1A1714]/30 font-label mb-1">Overview</p>
          <h1 className="text-2xl font-bold text-[#1A1714] font-label tracking-tight">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#1A1714]/40 font-label">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Live
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Today's Orders"   value={loading ? '—' : stats!.todayOrders}  icon={<ShoppingBasket className="w-4 h-4" />} />
        <StatCard label="Today's Revenue"  value={loading ? '—' : `NPR ${(stats?.todayRevenue ?? 0).toLocaleString()}`} icon={<DollarSign className="w-4 h-4" />} accent sub="+this month" />
        <StatCard label="Pending Dispatch" value={loading ? '—' : stats!.pendingDispatch} icon={<Truck className="w-4 h-4" />} />
        <StatCard label="Held Orders"      value={loading ? '—' : stats!.heldOrders}    icon={<PauseCircle className="w-4 h-4" />} />
      </div>

      {/* Month totals */}
      <div className="dash-card grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-black/[0.07] rounded-2xl p-5">
          <p className="text-xs text-[#1A1714]/40 font-label mb-2">This Month Revenue</p>
          <p className="text-3xl font-bold text-[#1A1714] font-headline">NPR {(stats?.totalRevenue ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-black/[0.07] rounded-2xl p-5">
          <p className="text-xs text-[#1A1714]/40 font-label mb-2">This Month Orders</p>
          <p className="text-3xl font-bold text-[#1A1714] font-headline">{stats?.totalOrders ?? 0}</p>
        </div>
      </div>

      {/* Recent orders */}
      <div className="dash-card bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
          <h3 className="text-sm font-bold text-[#1A1714] font-label">Recent Orders</h3>
          <Link href="/admin/orders" className="text-xs text-primary hover:text-primary/70 transition-colors font-label flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-black/[0.04] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBasket className="w-8 h-8 text-black/10 mx-auto mb-2" />
            <p className="text-sm text-[#1A1714]/30 font-label">No orders yet</p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.05]">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-black/[0.02] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1A1714] font-label">{order.order_number}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-[#1A1714]/40 font-label mt-0.5">{order.customer_name} · {order.district}</p>
                </div>
                <span className="text-sm font-bold text-[#1A1714]/70 font-label shrink-0">NPR {order.total.toLocaleString()}</span>
                <div className="flex items-center gap-1 text-[#1A1714]/30 shrink-0">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] font-label">
                    {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
