'use client'

import { useEffect, useState } from 'react'
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
    // Check if admin has disabled live feed
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

    // Listen on the real 'orders' table (views don't fire realtime events)
    const channel = supabase
      .channel('live-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        // Re-fetch the view so we always get the formatted data
        fetchRecent()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (!visible || entries.length === 0) return null

  const repeated = [...entries, ...entries] // duplicate for seamless loop

  return (
    <div className="w-full bg-dark-surface h-11 flex items-center overflow-hidden">
      {/* Label */}
      <div className="shrink-0 px-4 border-r border-white/10">
        <span className="text-[10px] uppercase tracking-widest text-white/60 font-label">Live Orders</span>
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
            <span key={`${entry.id}-${i}`} className="inline-flex items-center gap-3 px-4">
              <span className="text-[13px] text-white font-body">
                <span className="font-medium">{entry.customer_first_name}</span>
                {' ordered '}
                <span className="font-medium">{entry.product_name}</span>
                {entry.size ? ` (${entry.size})` : ''}
              </span>
              <span className="text-[13px] text-white/40 font-body">- {timeAgo(entry.created_at)}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container inline-block" />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
