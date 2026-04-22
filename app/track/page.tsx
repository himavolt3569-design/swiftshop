'use client'

import { Header } from '@/components/storefront/Header'
import { OrderTrackingSection } from '@/components/storefront/OrderTrackingSection'
import { Footer } from '@/components/storefront/Footer'
import { ToastContainer } from '@/components/shared/Toast'
import { CartDrawer } from '@/components/storefront/CartDrawer'
import { WishlistDrawer } from '@/components/storefront/WishlistDrawer'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useSessionStore } from '@/store/sessionStore'
import { useState, useEffect } from 'react'

export default function TrackPage() {
  const [cartOpen, setCartOpen] = useState(false)
  const [wishlistOpen, setWishlistOpen] = useState(false)

  const hydrateCart     = useCartStore.persist?.rehydrate
  const hydrateWishlist = useWishlistStore.persist?.rehydrate
  const sessionId       = useSessionStore((s) => s.sessionId)

  useEffect(() => {
    hydrateCart?.()
    hydrateWishlist?.()
  }, [hydrateCart, hydrateWishlist])

  useEffect(() => {
    if (!sessionId) return
    useCartStore.setState({ sessionId })
    useWishlistStore.setState({ sessionId })
  }, [sessionId])

  return (
    <>
      <ToastContainer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <WishlistDrawer open={wishlistOpen} onClose={() => setWishlistOpen(false)} />

      <Header
        onCartOpen={() => setCartOpen(true)}
        onWishlistOpen={() => setWishlistOpen(true)}
      />

      <main className="pt-16 min-h-screen">
        <OrderTrackingSection />
      </main>

      <Footer />
    </>
  )
}
