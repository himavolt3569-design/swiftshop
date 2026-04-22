'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase }         from '@/lib/supabase'
import { LiveFeedEntry }    from '@/lib/types'

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff} min ago`
  return `${Math.floor(diff / 60)}h ago`
}

export function LiveFeedTicker() {
  const [entries, setEntries] = useState<LiveFeedEntry[]>([])
  const [paused,  setPaused]  = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const checkSettings = async () => {
      const { data } = await supabase
        .from('shop_settings')
        .select('live_feed_enabled')
        .single()
      if (data && !data.live_feed_enabled) setVisible(false)
    }

    const fetchRecent = async () => {
      const { data } = await supabase
        .from('live_orders_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      setEntries(((data as LiveFeedEntry[]) ?? []).reverse())
    }

    checkSettings()
    fetchRecent()

    const channel = supabase
      .channel('live-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        fetchRecent()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (!visible || entries.length === 0) return null

  const repeated = [...entries, ...entries]

  return (
    <div className="w-full glass-dark h-12 flex items-center overflow-hidden">
      {/* Label */}
      <div className="shrink-0 px-5 border-r border-white/8 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent animate-breathe" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-display font-semibold">Live</span>
      </div>

      {/* Ticker */}
      <div
        className="flex-1 overflow-hidden relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex items-center gap-0 whitespace-nowrap"
          style={{
            animation: `ticker 40s linear infinite`,
            animationPlayState: paused ? 'paused' : 'running',
            display: 'inline-flex',
          }}
        >
          {repeated.map((entry, i) => (
            <span key={`${entry.id}-${i}`} className="inline-flex items-center gap-3 px-5">
              <span className="text-[13px] text-white/90 font-body">
                <span className="font-semibold">{entry.customer_first_name}</span>
                {' ordered '}
                <span className="font-semibold text-primary-fixed-dim">{entry.product_name}</span>
                {entry.size ? ` (${entry.size})` : ''}
              </span>
              <span className="text-[12px] text-white/30 font-body">• {timeAgo(entry.created_at)}</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant/30 inline-block" />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
