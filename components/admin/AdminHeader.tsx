'use client'

import { useEffect, useState } from 'react'
import { Bell, Search, ExternalLink, Menu } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface AdminHeaderProps {
  onMenuOpen?: () => void
}

export function AdminHeader({ onMenuOpen }: AdminHeaderProps) {
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
    <header className="fixed top-0 left-0 right-0 lg:left-60 h-14 bg-[#F7F5F2]/95 backdrop-blur-xl border-b border-[#1E1C1A]/[0.06] z-40 flex items-center px-4 lg:px-6 gap-3">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuOpen}
        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#1E1C1A]/[0.05] text-[#3A3530]/50 transition-all duration-150 active:scale-[0.93] shrink-0"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex items-center gap-2.5 bg-[#1E1C1A]/[0.03] border border-[#1E1C1A]/[0.06] rounded-xl px-3.5 py-2 flex-1 max-w-xs group focus-within:border-primary/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/8 transition-all duration-150">
        <Search className="w-3.5 h-3.5 text-[#3A3530]/30 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          placeholder="Search orders…"
          className="bg-transparent border-none focus:ring-0 focus:outline-none text-xs text-[#3A3530]/70 placeholder:text-[#3A3530]/30 w-full"
          style={{ outline: 'none' }}
        />
      </div>

      <div className="ml-auto flex items-center gap-2 lg:gap-3">
        <span className="text-xs text-[#3A3530]/30 tabular-nums hidden lg:block">{time}</span>

        <a
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 text-xs text-[#3A3530]/40 hover:text-primary transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden md:inline">View Store</span>
        </a>

        <div className="hidden sm:block w-px h-4 bg-[#1E1C1A]/10" />

        <button className="relative w-8 h-8 rounded-xl flex items-center justify-center text-[#3A3530]/30 hover:text-[#3A3530]/70 hover:bg-[#1E1C1A]/[0.05] transition-all duration-150 active:scale-[0.93]">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-xs font-bold text-primary shrink-0">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-[#3A3530]/50 hidden lg:block">{adminName}</span>
        </div>
      </div>
    </header>
  )
}
