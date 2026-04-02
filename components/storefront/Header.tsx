'use client'

import { useState, useEffect, useRef } from 'react'
import { Heart, ShoppingCart, Search, X, LogOut, User } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { SearchBar } from '@/components/shared/SearchBar'
import { AuthModal } from '@/components/storefront/AuthModal'
import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'

interface HeaderProps {
  onProductSelect?: (product: Product) => void
  onCartOpen?: () => void
  onWishlistOpen?: () => void
}

export function Header({ onProductSelect, onCartOpen, onWishlistOpen }: HeaderProps) {
  const cartCount     = useCartStore((s) => s.getCount())
  const wishlistCount = useWishlistStore((s) => s.getCount())
  const bouncing      = useCartStore((s) => s.bouncing)
  const { user, setSession, setLoading } = useAuthStore()

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [authOpen,         setAuthOpen]          = useState(false)
  const [userMenuOpen,     setUserMenuOpen]       = useState(false)
  const [hydrated,         setHydrated]           = useState(false)
  const [scrolled,         setScrolled]           = useState(false)

  const userMenuRef = useRef<HTMLDivElement>(null)

  // Hydration
  useEffect(() => { setHydrated(true) }, [])

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Supabase auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [setSession, setLoading])

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const displayName = user?.user_metadata?.full_name as string | undefined
  const initials = displayName
    ? displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 bg-background/92 backdrop-blur-xl border-b transition-all duration-300 ${scrolled ? 'border-outline-variant/20 shadow-ambient' : 'border-transparent'} h-16`}>
        <div className="flex items-center justify-between px-5 md:px-10 h-full max-w-screen-2xl mx-auto gap-4">

          {/* Logo */}
          <a href="/" className="font-headline font-black italic text-xl text-on-surface tracking-tighter shrink-0 hover:text-primary transition-colors duration-200">
            Goreto.store
          </a>

          {/* Desktop search — centered, command-palette style */}
          <div className="hidden md:flex flex-1 max-w-sm mx-4">
            <SearchBar onSelect={onProductSelect} />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mobile search */}
            <IconButton onClick={() => setMobileSearchOpen(true)} label="Search" className="md:hidden">
              <Search className="w-[18px] h-[18px]" />
            </IconButton>

            {/* Wishlist */}
            <IconButton onClick={() => onWishlistOpen?.()} label={`Wishlist (${hydrated ? wishlistCount : 0})`}>
              <Heart className="w-[18px] h-[18px]" />
              {hydrated && wishlistCount > 0 && (
                <Badge>{wishlistCount}</Badge>
              )}
            </IconButton>

            {/* Cart */}
            <IconButton onClick={() => onCartOpen?.()} label={`Cart (${hydrated ? cartCount : 0})`}>
              <ShoppingCart className={`w-[18px] h-[18px] ${bouncing ? 'animate-cart-bounce' : ''}`} />
              {hydrated && cartCount > 0 && (
                <Badge primary>{cartCount}</Badge>
              )}
            </IconButton>

            {/* Auth — divider then user actions */}
            <div className="w-px h-5 bg-outline-variant/40 mx-1.5" />

            {hydrated && (
              user ? (
                /* User avatar + dropdown */
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-8 h-8 rounded-full bg-primary text-white text-xs font-label font-bold flex items-center justify-center hover:bg-primary-container transition-colors shadow-sm"
                    aria-label="User menu"
                  >
                    {initials}
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-background/98 backdrop-blur-xl border border-outline-variant/20 rounded-2xl shadow-lift overflow-hidden animate-slide-up z-50">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-outline-variant/20">
                        <p className="text-xs text-on-surface-variant font-label">Signed in as</p>
                        <p className="text-sm font-semibold text-on-surface font-label truncate mt-0.5">
                          {displayName ?? user.email}
                        </p>
                      </div>
                      {/* Menu items */}
                      <div className="p-1.5">
                        <DropdownItem icon={<User className="w-4 h-4" />} label="My Account" />
                        <DropdownItem
                          icon={<LogOut className="w-4 h-4" />}
                          label="Sign Out"
                          danger
                          onClick={async () => {
                            await supabase.auth.signOut()
                            setUserMenuOpen(false)
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Login + Sign up */
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAuthOpen(true)}
                    className="text-on-surface-variant hover:text-on-surface text-sm font-label font-medium px-3 py-1.5 rounded-xl hover:bg-surface-container transition-all duration-200 active:scale-[0.97]"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => setAuthOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-white text-sm font-label font-semibold px-4 py-1.5 rounded-xl transition-all duration-200 shadow-sm shadow-primary/25 active:scale-[0.97]"
                  >
                    Sign up
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Mobile search bottom sheet */}
      {mobileSearchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-on-background/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSearchOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-surface-container-highest rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-on-surface font-label">Search Products</span>
              <button onClick={() => setMobileSearchOpen(false)} aria-label="Close search">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
            <SearchBar
              mobile
              onSelect={(p) => {
                onProductSelect?.(p)
                setMobileSearchOpen(false)
              }}
            />
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}

/* ── Small helpers ─────────────────────────────────────────── */

function IconButton({
  children,
  onClick,
  label,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  label: string
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`relative p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all duration-200 active:scale-[0.93] ${className}`}
    >
      {children}
    </button>
  )
}

function Badge({ children, primary }: { children: React.ReactNode; primary?: boolean }) {
  return (
    <span
      className={`absolute -top-1 -right-1 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold leading-none ${primary ? 'bg-primary' : 'bg-primary-container'}`}
    >
      {children}
    </span>
  )
}

function DropdownItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-label font-medium transition-all duration-150 active:scale-[0.98] ${
        danger
          ? 'text-error hover:bg-error-container/20'
          : 'text-on-surface hover:bg-surface-container'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
