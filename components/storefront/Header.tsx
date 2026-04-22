'use client'

import { useState, useEffect, useRef } from 'react'
import { Heart, ShoppingCart, Search, X, LogOut, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

  useEffect(() => { setHydrated(true) }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ease-spring h-16 ${
        scrolled
          ? 'glass shadow-depth border-b border-outline-variant/10'
          : 'bg-transparent border-b border-transparent'
      }`}>
        <div className="flex items-center justify-between px-4 md:px-10 h-full max-w-screen-2xl mx-auto gap-2 md:gap-4">

          {/* Logo */}
          <a
            href="/"
            className="font-logo font-black italic text-xl text-on-surface tracking-tighter shrink-0 hover:text-primary transition-colors duration-300 group"
          >
            <span className="inline-block group-hover:scale-105 transition-transform duration-300">
              Goreto.store
            </span>
          </a>

          {/* Desktop search — glassmorphic */}
          <div className="hidden md:flex flex-1 max-w-sm mx-4">
            <SearchBar onSelect={onProductSelect} />
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <a
              href="/track"
              className="text-[13px] text-on-surface-variant hover:text-primary font-display font-medium px-3 py-1.5 rounded-xl hover:bg-surface-container/50 transition-all duration-200"
            >
              Track Order
            </a>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
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
              <motion.div
                animate={bouncing ? { scale: [1, 1.3, 0.9, 1] } : {}}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <ShoppingCart className="w-[18px] h-[18px]" />
              </motion.div>
              {hydrated && cartCount > 0 && (
                <Badge primary>{cartCount}</Badge>
              )}
            </IconButton>

            {/* Divider */}
            <div className="hidden sm:block w-px h-5 bg-outline-variant/30 mx-1.5" />

            {hydrated && (
              user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-8 h-8 rounded-full bg-primary text-white text-xs font-label font-bold flex items-center justify-center hover:bg-primary-container transition-all duration-300 shadow-sm hover:shadow-glow-sm"
                    aria-label="User menu"
                  >
                    {initials}
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="absolute right-0 top-full mt-2 w-56 glass rounded-2xl shadow-depth overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-outline-variant/15">
                          <p className="text-[11px] text-on-surface-variant/60 font-label uppercase tracking-wider">Signed in as</p>
                          <p className="text-sm font-semibold text-on-surface font-label truncate mt-0.5">
                            {displayName ?? user.email}
                          </p>
                        </div>
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setAuthOpen(true)}
                    className="hidden sm:block text-on-surface-variant hover:text-on-surface text-sm font-label font-medium px-3 py-1.5 rounded-xl hover:bg-surface-container/60 transition-all duration-200 active:scale-[0.97]"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => setAuthOpen(true)}
                    className="btn-gradient text-white text-xs px-3 py-1.5 sm:text-sm sm:px-4 sm:py-2"
                  >
                    Sign up
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Mobile search — full overlay */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-on-background/50 backdrop-blur-md md:hidden"
            onClick={() => setMobileSearchOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute bottom-0 left-0 right-0 glass rounded-t-3xl p-6 shadow-depth-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-outline-variant/30 rounded-full mx-auto mb-5" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-on-surface font-display">Search Products</span>
                <button onClick={() => setMobileSearchOpen(false)} aria-label="Close search" className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
                  <X className="w-4 h-4 text-on-surface-variant" />
                </button>
              </div>
              <SearchBar
                mobile
                onSelect={(p) => {
                  onProductSelect?.(p)
                  setMobileSearchOpen(false)
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
      className={`relative p-2.5 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container/60 transition-all duration-200 active:scale-[0.93] ${className}`}
    >
      {children}
    </button>
  )
}

function Badge({ children, primary }: { children: React.ReactNode; primary?: boolean }) {
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={`absolute -top-0.5 -right-0.5 text-white text-[9px] w-[18px] h-[18px] flex items-center justify-center rounded-full font-bold leading-none shadow-sm ${
        primary ? 'bg-primary shadow-primary/30' : 'bg-primary-container'
      }`}
    >
      {children}
    </motion.span>
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
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-label font-medium transition-all duration-200 active:scale-[0.98] ${
        danger
          ? 'text-error hover:bg-error-container/20'
          : 'text-on-surface hover:bg-surface-container/60'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
