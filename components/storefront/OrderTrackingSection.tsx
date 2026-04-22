'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase }        from '@/lib/supabase'
import { Order }           from '@/lib/types'
import { OrderTimeline }   from './OrderTimeline'
import { gsap, ScrollTrigger } from '@/lib/gsap'

export function OrderTrackingSection() {
  const [query,    setQuery]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [order,    setOrder]    = useState<Order | null>(null)
  const [notFound, setNotFound] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const sectionRef = useRef<HTMLElement>(null)

  // GSAP scroll entrance
  useEffect(() => {
    if (!sectionRef.current) return
    const ctx = gsap.context(() => {
      gsap.from('.tracking-content', {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setLoading(true)
    setNotFound(false)
    setOrder(null)

    const { data } = await supabase
      .from('orders')
      .select('*, courier:couriers(name), events:order_events(*), items:order_items(*)')
      .or(`order_number.eq.${trimmed},customer_phone.eq.${trimmed}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    setLoading(false)
    if (!data) { setNotFound(true); return }
    setOrder(data as unknown as Order)

    if (channelRef.current) supabase.removeChannel(channelRef.current)
    channelRef.current = supabase
      .channel(`order-${data.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_events', filter: `order_id=eq.${data.id}` },
        (payload) => {
          setOrder((prev) => {
            if (!prev) return prev
            return { ...prev, status: payload.new.status as Order['status'], events: [...(prev.events ?? []), payload.new as never] }
          })
        })
      .subscribe()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const orderParam = params.get('order')
    if (orderParam) {
      setQuery(orderParam)
      runSearch(orderParam)
      setTimeout(() => {
        const el = document.getElementById('tracking')
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'smooth' })
      }, 300)
    }
  }, [runSearch])

  useEffect(() => () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }, [])

  return (
    <section ref={sectionRef} id="tracking" className="bg-surface-container-low/30 py-20 px-6">
      <div className="tracking-content max-w-xl mx-auto">
        <h2 className="font-display text-3xl font-bold text-on-surface mb-2">Track Your Order</h2>
        <p className="text-[15px] text-on-surface-variant/60 font-body mb-8">
          Enter your phone number or order ID to see your delivery status.
        </p>

        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch(query)}
            placeholder="Phone number or Order ID"
            className="flex-1 h-13 px-4 glass rounded-xl text-sm font-body text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
          />
          <motion.button
            onClick={() => runSearch(query)}
            disabled={loading || !query.trim()}
            className="h-13 px-6 btn-gradient text-white text-sm font-display font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Searching…' : 'Search'}
          </motion.button>
        </div>

        {notFound && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-8 text-center"
          >
            <p className="text-on-surface-variant/60 font-body">No order found with that phone number or order ID.</p>
          </motion.div>
        )}

        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="glass rounded-2xl p-6 shadow-depth"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[11px] text-on-surface-variant/50 font-display font-semibold uppercase tracking-wider mb-1">Order</p>
                <p className="text-lg font-bold text-on-surface font-display">{order.order_number}</p>
                <p className="text-sm text-on-surface-variant/60 font-body">
                  {new Date(order.created_at).toLocaleDateString('en-NP', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              {order.courier && (
                <div className="text-right">
                  <p className="text-[11px] text-on-surface-variant/50 font-display font-semibold uppercase tracking-wider mb-1">Courier</p>
                  <p className="text-sm font-semibold text-on-surface font-body">{order.courier.name}</p>
                </div>
              )}
            </div>

            <OrderTimeline currentStatus={order.status} events={order.events ?? []} />

            {order.items && order.items.length > 0 && (
              <div className="mt-6 border-t border-outline-variant/15 pt-4">
                <p className="text-[11px] font-semibold text-on-surface font-display uppercase tracking-wider mb-3">Order Items</p>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-on-surface font-body">{item.product_name} x {item.quantity} ({item.size})</span>
                      <span className="font-semibold text-on-surface">NPR {item.line_price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-on-surface mt-3 pt-3 border-t border-outline-variant/15">
                  <span>Total</span>
                  <span>NPR {order.total.toLocaleString()}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  )
}
