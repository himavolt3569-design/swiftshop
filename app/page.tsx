'use client'

import { Suspense, useState, useEffect } from 'react'
import { Header }               from '@/components/storefront/Header'
import { Hero }                 from '@/components/storefront/Hero'
import { CategoryBar }          from '@/components/storefront/CategoryBar'
import { ProductGrid }          from '@/components/storefront/ProductGrid'
import { LiveFeedTicker }       from '@/components/storefront/LiveFeedTicker'
import { CheckoutSection }      from '@/components/storefront/CheckoutSection'
import { OrderTrackingSection } from '@/components/storefront/OrderTrackingSection'
import { Footer }               from '@/components/storefront/Footer'
import { CartDrawer }           from '@/components/storefront/CartDrawer'
import { WishlistDrawer }       from '@/components/storefront/WishlistDrawer'
import { CustomCursor }         from '@/components/shared/CustomCursor'
import { ToastContainer }       from '@/components/shared/Toast'
import { useCartStore }         from '@/store/cartStore'
import { useWishlistStore }     from '@/store/wishlistStore'
import { useSessionStore }      from '@/store/sessionStore'
import { Product }              from '@/lib/types'

// Error banner for Supabase unavailability
function OfflineBanner({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-error text-white px-6 py-3 rounded-lg text-sm font-label shadow-lift">
      We are having trouble loading the shop. Please try again in a moment.
    </div>
  )
}

export default function StorefrontPage() {
  const [activeCategoryId,   setActiveCategoryId]   = useState<string | null>(null)
  const [highlightedProduct, setHighlightedProduct] = useState<string | null>(null)
  const [offline,            setOffline]            = useState(false)
  const [cartOpen,           setCartOpen]           = useState(false)
  const [wishlistOpen,       setWishlistOpen]       = useState(false)

  // Hydrate stores from localStorage (client only, avoids hydration mismatch)
  const hydrateCart     = useCartStore.persist?.rehydrate
  const hydrateWishlist = useWishlistStore.persist?.rehydrate
  const sessionId       = useSessionStore((s) => s.sessionId)

  useEffect(() => {
    hydrateCart?.()
    hydrateWishlist?.()
  }, [hydrateCart, hydrateWishlist])

  // Sync session ID to stores
  useEffect(() => {
    if (!sessionId) return
    useCartStore.setState({ sessionId })
    useWishlistStore.setState({ sessionId })
  }, [sessionId])

  const handleProductSelect = (product: Product) => {
    setHighlightedProduct(product.id)
    const el = document.getElementById('products')
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' })
  }

  return (
    <>
      <CustomCursor />
      <ToastContainer />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false)
          const el = document.getElementById('checkout')
          if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'smooth' })
        }}
      />
      <WishlistDrawer open={wishlistOpen} onClose={() => setWishlistOpen(false)} />
      <OfflineBanner show={offline} />

      <Header
        onProductSelect={handleProductSelect}
        onCartOpen={() => setCartOpen(true)}
        onWishlistOpen={() => setWishlistOpen(true)}
      />

      <main className="pt-16">
        <Hero />

        <Suspense>
          <CategoryBar onCategoryChange={setActiveCategoryId} />
        </Suspense>

        <ProductGrid
          activeCategoryId={activeCategoryId}
          highlightedProductId={highlightedProduct}
        />

        <LiveFeedTicker />

        <CheckoutSection />

        <OrderTrackingSection />
      </main>

      <Footer />
    </>
  )
}
