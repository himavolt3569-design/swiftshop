'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, Package, Tag, ShoppingCart, Truck,
  Ticket, BarChart2, Settings, LogOut, Zap, Share2
} from 'lucide-react'

const NAV = [
  { href: '/admin',                    label: 'Dashboard',   icon: LayoutDashboard, group: 'main' },
  { href: '/admin/orders',             label: 'Orders',      icon: ShoppingCart,    group: 'main' },
  { href: '/admin/products',           label: 'Products',    icon: Package,         group: 'main' },
  { href: '/admin/categories',         label: 'Categories',  icon: Tag,             group: 'main' },
  { href: '/admin/social-orders',      label: 'Social Sales',icon: Share2,          group: 'main', badge: 'NEW' },
  { href: '/admin/couriers',           label: 'Couriers',    icon: Truck,           group: 'ops'  },
  { href: '/admin/promo-codes',        label: 'Promo Codes', icon: Ticket,          group: 'ops'  },
  { href: '/admin/analytics',          label: 'Analytics',   icon: BarChart2,       group: 'ops'  },
  { href: '/admin/settings',           label: 'Settings',    icon: Settings,        group: 'system' },
]

const GROUPS = [
  { key: 'main',   label: 'Store'      },
  { key: 'ops',    label: 'Operations' },
  { key: 'system', label: 'System'     },
]

export function AdminSidebar() {
  const pathname = usePathname()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    sessionStorage.removeItem('ss_admin_auth')
    window.location.href = '/admin'
  }

  return (
    <aside className="h-screen w-60 fixed left-0 top-0 bg-white flex flex-col z-50 border-r border-black/[0.07]">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-black/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[13px] font-bold text-[#1A1714] tracking-tight font-label">Swift Shop</h1>
            <p className="text-[10px] text-[#1A1714]/40 font-label tracking-wider">ADMIN PANEL</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 no-scrollbar">
        {GROUPS.map(({ key, label }) => {
          const items = NAV.filter((n) => n.group === key)
          return (
            <div key={key}>
              <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#1A1714]/30 font-label px-3 mb-1.5">{label}</p>
              <div className="space-y-0.5">
                {items.map(({ href, label: lbl, icon: Icon, badge }) => {
                  const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                        active
                          ? 'bg-primary/8 text-primary'
                          : 'text-[#1A1714]/50 hover:text-[#1A1714]/80 hover:bg-black/[0.04]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-primary' : 'text-[#1A1714]/30 group-hover:text-[#1A1714]/60'}`} strokeWidth={active ? 2.5 : 1.8} />
                      <span className="flex-1 font-label">{lbl}</span>
                      {badge && (
                        <span className="text-[9px] bg-primary/90 text-white px-1.5 py-0.5 rounded-full font-bold tracking-wide">{badge}</span>
                      )}
                      {active && <div className="w-1 h-1 rounded-full bg-primary" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-black/[0.06]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#1A1714]/40 hover:text-red-500 hover:bg-red-50 transition-all font-label"
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.8} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
