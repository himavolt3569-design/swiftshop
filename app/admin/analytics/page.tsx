'use client'

import { useEffect, useState, useRef } from 'react'
import { Download, TrendingUp, ShoppingBag, DollarSign, Users, BarChart2 } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { gsap }     from '@/lib/gsap'

interface DailyOrder { date: string; count: number; revenue: number }
interface TopProduct { product_name: string; order_count: number }
interface StatusDist { status: string; count: number }

const CHART_COLORS = ['#942e02', '#b5451b', '#d4652a', '#e8a080', '#f5cfc5']

const TOOLTIP_STYLE = {
  background: '#ffffff',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 12,
  fontFamily: 'Plus Jakarta Sans',
  fontSize: 12,
  color: '#1A1714',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
}

function KPICard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`analytics-card rounded-2xl p-5 border ${accent ? 'bg-primary/5 border-primary/20' : 'bg-white border-black/[0.07]'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${accent ? 'bg-primary/15 text-primary' : 'bg-black/[0.04] text-[#1A1714]/35'}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-[#1A1714] font-headline mb-0.5">{value}</p>
      <p className="text-xs text-[#1A1714]/40 font-label">{label}</p>
      {sub && <p className="text-[11px] text-emerald-600 font-label mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{sub}</p>}
    </div>
  )
}

export default function AnalyticsPage() {
  const [daily,       setDaily]       = useState<DailyOrder[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [statusDist,  setStatusDist]  = useState<StatusDist[]>([])
  const [kpi,         setKpi]         = useState({ revenue: 0, orders: 0, avgOrder: 0, customers: 0 })
  const [loading,     setLoading]     = useState(true)
  const [dateFrom,    setDateFrom]    = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().substring(0, 10) })
  const [dateTo,      setDateTo]      = useState(() => new Date().toISOString().substring(0, 10))
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      const [{ data: ordersData }, { data: itemsData }] = await Promise.all([
        supabase.from('orders').select('created_at, total, status, customer_email')
          .gte('created_at', dateFrom).lte('created_at', dateTo + 'T23:59:59').order('created_at'),
        supabase.from('order_items').select('product_name').gte('created_at', dateFrom),
      ])

      type OrderRow = { created_at: string; total: number; status: string; customer_email: string }
      const rows = (ordersData as OrderRow[] | null) ?? []

      // Daily aggregation
      const byDate: Record<string, { count: number; revenue: number }> = {}
      rows.forEach((o) => {
        const d = o.created_at.substring(0, 10)
        if (!byDate[d]) byDate[d] = { count: 0, revenue: 0 }
        byDate[d].count += 1
        byDate[d].revenue += o.total
      })
      setDaily(Object.entries(byDate).map(([date, v]) => ({ date: date.substring(5), ...v })))

      // KPIs
      const totalRevenue = rows.reduce((s, o) => s + o.total, 0)
      const uniqueEmails = new Set(rows.map((o) => o.customer_email)).size
      setKpi({
        revenue:  totalRevenue,
        orders:   rows.length,
        avgOrder: rows.length > 0 ? Math.round(totalRevenue / rows.length) : 0,
        customers: uniqueEmails,
      })

      // Top products
      const productCounts: Record<string, number> = {}
      ;(itemsData as { product_name: string }[] | null)?.forEach((item) => {
        productCounts[item.product_name] = (productCounts[item.product_name] ?? 0) + 1
      })
      setTopProducts(
        Object.entries(productCounts).sort(([, a], [, b]) => b - a).slice(0, 8)
          .map(([product_name, order_count]) => ({ product_name: product_name.length > 20 ? product_name.substring(0, 20) + '…' : product_name, order_count }))
      )

      // Status distribution
      const statusCounts: Record<string, number> = {}
      rows.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1 })
      setStatusDist(Object.entries(statusCounts).map(([status, count]) => ({ status, count })))

      setLoading(false)
    }
    fetchAll()
  }, [dateFrom, dateTo])

  useEffect(() => {
    if (!pageRef.current || loading) return
    const ctx = gsap.context(() => {
      gsap.from('.analytics-card', {
        y: 20, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out',
      })
    }, pageRef)
    return () => ctx.revert()
  }, [loading])

  const exportCSV = async () => {
    const { data } = await supabase
      .from('orders')
      .select('order_number, customer_name, customer_phone, province, district, total, status, payment_method, created_at')
      .gte('created_at', dateFrom).lte('created_at', dateTo + 'T23:59:59')
    if (!data) return
    type Row = { order_number: string; customer_name: string; customer_phone: string; province: string; district: string; total: number; status: string; payment_method: string; created_at: string }
    const header = 'Order Number,Customer,Phone,Province,District,Total,Status,Payment,Date'
    const rows = (data as Row[]).map((o) =>
      [o.order_number, o.customer_name, o.customer_phone, o.province, o.district, o.total, o.status, o.payment_method, o.created_at.substring(0, 10)].join(',')
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `orders-${dateFrom}-${dateTo}.csv`; a.click()
  }

  return (
    <div ref={pageRef}>
      {/* Header */}
      <div className="analytics-card flex items-center justify-between mb-7">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#1A1714]/30 font-label mb-1">Insights</p>
          <h1 className="text-2xl font-bold text-[#1A1714] font-label">Analytics</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="bg-white border border-black/[0.1] rounded-xl px-3 py-2 text-xs text-[#1A1714]/60 font-label focus:outline-none focus:border-primary/40 w-36" />
          <span className="text-[#1A1714]/30 text-xs font-label">→</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="bg-white border border-black/[0.1] rounded-xl px-3 py-2 text-xs text-[#1A1714]/60 font-label focus:outline-none focus:border-primary/40 w-36" />
          <button onClick={exportCSV}
            className="flex items-center gap-2 bg-white border border-black/[0.1] rounded-xl px-4 py-2 text-xs text-[#1A1714]/50 font-label hover:bg-black/[0.04] hover:text-[#1A1714]/80 transition-all">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KPICard accent icon={<DollarSign className="w-4 h-4" />}   label="Total Revenue"   value={`NPR ${kpi.revenue.toLocaleString()}`} />
        <KPICard       icon={<ShoppingBag className="w-4 h-4" />}   label="Total Orders"    value={String(kpi.orders)} />
        <KPICard       icon={<BarChart2 className="w-4 h-4" />}     label="Avg Order Value" value={`NPR ${kpi.avgOrder.toLocaleString()}`} />
        <KPICard       icon={<Users className="w-4 h-4" />}         label="Unique Customers" value={String(kpi.customers)} />
      </div>

      {/* Revenue area chart */}
      <div className="analytics-card bg-white border border-black/[0.07] rounded-2xl p-6 mb-5">
        <h3 className="text-sm font-bold text-[#1A1714] font-label mb-5">Revenue Over Time</h3>
        {loading ? (
          <div className="h-52 bg-black/[0.04] rounded-xl animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#942e02" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#942e02" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(26,23,20,0.35)', fontFamily: 'Plus Jakarta Sans' }} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(26,23,20,0.35)', fontFamily: 'Plus Jakarta Sans' }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`NPR ${v.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#942e02" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Orders per day + status donut */}
      <div className="grid grid-cols-3 gap-5 mb-5">
        <div className="analytics-card col-span-2 bg-white border border-black/[0.07] rounded-2xl p-6">
          <h3 className="text-sm font-bold text-[#1A1714] font-label mb-5">Orders Per Day</h3>
          {loading ? (
            <div className="h-44 bg-black/[0.04] rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={daily}>
                <defs>
                  <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#b5451b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#b5451b" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(26,23,20,0.35)', fontFamily: 'Plus Jakarta Sans' }} />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(26,23,20,0.35)', fontFamily: 'Plus Jakarta Sans' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="count" stroke="#b5451b" strokeWidth={2} fill="url(#ordGrad)" name="Orders" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="analytics-card bg-white border border-black/[0.07] rounded-2xl p-6">
          <h3 className="text-sm font-bold text-[#1A1714] font-label mb-5">Order Status</h3>
          {loading || statusDist.length === 0 ? (
            <div className="h-44 bg-black/[0.04] rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={statusDist} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={45} outerRadius={65}>
                  {statusDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: 'rgba(26,23,20,0.45)', fontFamily: 'Plus Jakarta Sans' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top products */}
      <div className="analytics-card bg-white border border-black/[0.07] rounded-2xl p-6">
        <h3 className="text-sm font-bold text-[#1A1714] font-label mb-5">Top Products by Orders</h3>
        {loading ? (
          <div className="h-56 bg-black/[0.04] rounded-xl animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'rgba(26,23,20,0.35)', fontFamily: 'Plus Jakarta Sans' }} />
              <YAxis type="category" dataKey="product_name" width={150} tick={{ fontSize: 10, fill: 'rgba(26,23,20,0.5)', fontFamily: 'Plus Jakarta Sans' }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="order_count" fill="#b5451b" radius={[0, 4, 4, 0]} name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
