'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function AdminHeader() {
  const [adminName,   setAdminName]   = useState('Admin')
  const [searchQuery, setSearchQuery] = useState('')
  const [time,        setTime]        = useState('')
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.name) setAdminName(user.user_metadata.name)
    }
    getUser()
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/admin/orders?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-15rem)] h-14 bg-white/90 backdrop-blur-xl border-b border-black/[0.07] z-40 flex items-center px-6 gap-4">
      {/* Search */}
      <div className="flex items-center gap-2.5 bg-black/[0.04] border border-black/[0.07] rounded-xl px-3.5 py-2 flex-1 max-w-xs group focus-within:border-primary/40 transition-all">
        <Search className="w-3.5 h-3.5 text-[#1A1714]/30 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          placeholder="Search orders, customers…"
          className="bg-transparent border-none focus:ring-0 focus:outline-none text-xs text-[#1A1714]/70 placeholder:text-[#1A1714]/30 w-full font-label"
          style={{ outline: 'none' }}
        />
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {/* Time */}
        <span className="text-xs text-[#1A1714]/30 font-label tabular-nums hidden lg:block">{time}</span>

        {/* View store */}
        <a
          href="/"
          target="_blank"
          className="flex items-center gap-1.5 text-xs text-[#1A1714]/40 hover:text-primary transition-colors font-label"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Store
        </a>

        <div className="w-px h-4 bg-black/10" />

        {/* Bell */}
        <button className="relative w-8 h-8 rounded-xl flex items-center justify-center text-[#1A1714]/30 hover:text-[#1A1714]/70 hover:bg-black/[0.04] transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-xs font-bold text-primary font-label">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-[#1A1714]/50 font-label hidden lg:block">{adminName}</span>
        </div>
      </div>
    </header>
  )
}
