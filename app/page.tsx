'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header }               from '@/components/storefront/Header'
import { Hero }                 from '@/components/storefront/Hero'
import { ProductGrid, LatestArrivalsSection } from '@/components/storefront/ProductGrid'
import { ProductFilters, DEFAULT_FILTERS } from '@/components/storefront/ProductFilters'
import type { FilterState }     from '@/components/storefront/ProductFilters'
import { LiveFeedTicker }       from '@/components/storefront/LiveFeedTicker'
import { Footer }               from '@/components/storefront/Footer'
import { CartDrawer }           from '@/components/storefront/CartDrawer'
import { WishlistDrawer }       from '@/components/storefront/WishlistDrawer'
import { AddToCartPopup }       from '@/components/storefront/AddToCartPopup'
import { MobileCheckoutBar }    from '@/components/storefront/MobileCheckoutBar'

import { ToastContainer }       from '@/components/shared/Toast'
import { useCartStore }         from '@/store/cartStore'
import { useWishlistStore }     from '@/store/wishlistStore'
import { useSessionStore }      from '@/store/sessionStore'
import { Product }              from '@/lib/types'

function OfflineBanner({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-error text-white px-6 py-3 rounded-lg text-sm font-label shadow-lift">
      We are having trouble loading the shop. Please try again in a moment.
    </div>
  )
}

export function StorefrontPage({ initialProduct = null }: { initialProduct?: Product | null }) {
  const router = useRouter()
  const [activeCategoryId,   setActiveCategoryId]   = useState<string | null>(null)
  const [highlightedProduct, setHighlightedProduct] = useState<string | null>(null)
  const [offline,            setOffline]            = useState(false)
  const [cartOpen,           setCartOpen]           = useState(false)
  const [wishlistOpen,       setWishlistOpen]       = useState(false)
  const [filters,            setFilters]            = useState<FilterState>(DEFAULT_FILTERS)
  const [cartPopup, setCartPopup] = useState<{ name: string; image?: string; price: number; category_id?: string | null; category_name?: string | null } | null>(null)
  const lastAdded = useCartStore((s) => s.lastAdded)

  const hydrateCart     = useCartStore.persist?.rehydrate
  const hydrateWishlist = useWishlistStore.persist?.rehydrate
  const sessionId       = useSessionStore((s) => s.sessionId)

  useEffect(() => {
    hydrateCart?.()
    hydrateWishlist?.()
  }, [hydrateCart, hydrateWishlist])

  useEffect(() => {
    if (!lastAdded) return
    setCartPopup({
      name:          lastAdded.product_name,
      image:         lastAdded.product_image,
      price:         lastAdded.sale_price ?? lastAdded.price,
      category_id:   lastAdded.category_id ?? null,
      category_name: lastAdded.category_name ?? null,
    })
  }, [lastAdded])

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
      <ToastContainer />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false)
          router.push('/checkout')
        }}
      />
      <WishlistDrawer open={wishlistOpen} onClose={() => setWishlistOpen(false)} />
      <AddToCartPopup
        item={cartPopup}
        onDismiss={() => setCartPopup(null)}
        onViewCart={() => setCartOpen(true)}
        onContinueShopping={(categoryId) => {
          setCartPopup(null)
          setActiveCategoryId(categoryId)
          const params = new URLSearchParams()
          if (categoryId) params.set('category', categoryId)
          router.push(params.toString() ? '?' + params.toString() : '/', { scroll: false })
          setTimeout(() => {
            const el = document.getElementById('products')
            if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' })
          }, 50)
        }}
      />
      <MobileCheckoutBar
        onCheckout={() => {
          router.push('/checkout')
        }}
      />
      <OfflineBanner show={offline} />

      <Header
        onProductSelect={handleProductSelect}
        onCartOpen={() => setCartOpen(true)}
        onWishlistOpen={() => setWishlistOpen(true)}
      />

      <main className="pt-[124px] md:pt-[92px]">
        <Hero onCategoryChange={setActiveCategoryId} />

        <LatestArrivalsSection />

        <ProductFilters filters={filters} onChange={setFilters} />

        <ProductGrid
          activeCategoryId={activeCategoryId}
          highlightedProductId={highlightedProduct}
          initialProduct={initialProduct}
          filters={filters}
        />

        <LiveFeedTicker />
      </main>

      <Footer />
    </>
  )
}

export default StorefrontPage
