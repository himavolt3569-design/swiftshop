'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Package, Tag, ShoppingCart, Truck,
  Ticket, BarChart2, Settings, LogOut, Zap, Share2, X,
} from 'lucide-react'

const NAV = [
  { href: '/admin',               label: 'Dashboard',   icon: LayoutDashboard, group: 'main' },
  { href: '/admin/orders',        label: 'Orders',      icon: ShoppingCart,    group: 'main' },
  { href: '/admin/products',      label: 'Products',    icon: Package,         group: 'main' },
  { href: '/admin/categories',    label: 'Categories',  icon: Tag,             group: 'main' },
  { href: '/admin/social-orders', label: 'Social Sales',icon: Share2,          group: 'main', badge: 'NEW' },
  { href: '/admin/couriers',      label: 'Couriers',    icon: Truck,           group: 'ops'  },
  { href: '/admin/promo-codes',   label: 'Promo Codes', icon: Ticket,          group: 'ops'  },
  { href: '/admin/analytics',     label: 'Analytics',   icon: BarChart2,       group: 'ops'  },
  { href: '/admin/settings',      label: 'Settings',    icon: Settings,        group: 'system' },
]

const GROUPS = [
  { key: 'main',   label: 'Store'      },
  { key: 'ops',    label: 'Operations' },
  { key: 'system', label: 'System'     },
]

interface AdminSidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    sessionStorage.removeItem('ss_admin_auth')
    window.location.href = '/admin'
  }

  const sidebarContent = (
    <div className="h-full flex flex-col bg-[#0F0F0F]">

      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[13px] font-bold text-white tracking-tight font-label">Goreto.store</h1>
            <p className="text-[10px] text-white/30 font-label tracking-[0.15em] uppercase">Admin</p>
          </div>
        </div>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 no-scrollbar">
        {GROUPS.map(({ key, label }) => {
          const items = NAV.filter((n) => n.group === key)
          return (
            <div key={key}>
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20 font-label px-3 mb-2">
                {label}
              </p>
              <div className="space-y-0.5">
                {items.map(({ href, label: lbl, icon: Icon, badge }) => {
                  const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onMobileClose}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ease-out group ${
                        active
                          ? 'bg-white/[0.10] text-white'
                          : 'text-white/40 hover:text-white/75 hover:bg-white/[0.05]'
                      }`}
                    >
                      {/* Active left bar */}
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                      )}
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
                          active ? 'text-white' : 'text-white/25 group-hover:text-white/60'
                        }`}
                        strokeWidth={active ? 2.2 : 1.7}
                      />
                      <span className="flex-1 font-label">{lbl}</span>
                      {badge && (
                        <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold tracking-wide shadow-sm shadow-primary/40">
                          {badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-white/30 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200 font-label active:scale-[0.98] group"
        >
          <LogOut className="w-4 h-4 shrink-0 group-hover:text-red-400 transition-colors duration-200" strokeWidth={1.7} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex h-screen w-60 fixed left-0 top-0 flex-col z-50 border-r border-white/[0.05]">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
            />
            <motion.aside
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] z-[90] shadow-2xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.8 }}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
