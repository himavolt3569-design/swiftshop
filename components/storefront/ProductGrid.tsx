'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { ShoppingBag, ChevronLeft, ChevronRight, Heart, Flame, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import { supabase }           from '@/lib/supabase'
import { Product }            from '@/lib/types'
import { ProductCard }        from './ProductCard'
import { ProductDetailModal } from './ProductDetailModal'
import { useWishlistStore }   from '@/store/wishlistStore'
import { useCartStore }       from '@/store/cartStore'
import { useSessionStore }    from '@/store/sessionStore'

interface ProductGridProps {
  activeCategoryId: string | null
  highlightedProductId?: string | null
  initialProduct?: Product | null
}

const PAGE_SIZE = 12

// ── Latest Arrivals card — cinematic with Quick Add ───────────────────────────
function LatestArrivalsCard({
  product,
  onSelect,
}: {
  product: Product
  onSelect: (p: Product) => void
}) {
  const { addItem: addWish, removeItem: removeWish, hasItem } = useWishlistStore()
  const addItem  = useCartStore((s) => s.addItem)
  const addToast = useSessionStore((s) => s.addToast)
  const isWished     = hasItem(product.id)
  const img          = product.images?.[0]?.url ?? ''
  const price        = product.sale_price ?? product.price
  const defaultSize  = product.sizes?.[0]?.size ?? 'OS'
  const defaultStock = product.sizes?.[0]?.stock ?? product.stock ?? 0
  const discount     = product.sale_price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : null

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (defaultStock <= 0) return
    addItem({
      product_id:    product.id,
      product_name:  product.name,
      product_image: img,
      price:         product.price,
      sale_price:    product.sale_price,
      size:          defaultSize,
      quantity:      1,
      max_stock:     defaultStock,
      category_id:   product.category_id ?? null,
      category_name: product.category?.name ?? null,
    })
    addToast('success', `${product.name} added to cart`)
  }

  const toggleWish = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isWished) { removeWish(product.id); addToast('info', 'Removed from wishlist') }
    else { addWish({ product_id: product.id, product_name: product.name, product_image: img, price: product.price, sale_price: product.sale_price }); addToast('success', 'Added to wishlist') }
  }

  return (
    <div
      onClick={() => onSelect(product)}
      className="w-[185px] md:w-[220px] lg:w-[240px] shrink-0 snap-start cursor-pointer group"
    >
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg">
        {/* Image */}
        {img ? (
          <Image
            src={img}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="240px"
          />
        ) : (
          <div className="w-full h-full bg-surface-container flex items-center justify-center text-5xl font-headline text-on-surface-variant/20">
            {product.name.charAt(0)}
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          <span className="bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest shadow">
            New
          </span>
          {discount && (
            <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
              -{discount}%
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={toggleWish}
          className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/40 transition-all z-10"
        >
          <Heart className={`w-3.5 h-3.5 transition-colors ${isWished ? 'fill-red-400 text-red-400' : 'text-white'}`} />
        </button>

        {/* Text overlay — bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5 translate-y-0 group-hover:-translate-y-10 transition-transform duration-300">
          <p className="text-white/60 text-[10px] uppercase tracking-wider font-label mb-0.5">
            {product.category?.name ?? ''}
          </p>
          <p className="text-white text-sm font-bold font-body leading-snug line-clamp-2 mb-1.5">
            {product.name}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-white text-sm font-bold">NPR {price.toLocaleString()}</span>
            {product.sale_price && (
              <span className="text-white/50 text-xs line-through">NPR {product.price.toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Quick Add — slides up on hover */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10">
          <button
            onClick={handleAddToCart}
            disabled={defaultStock <= 0}
            className="w-full py-3 bg-primary/95 backdrop-blur-sm text-white text-xs font-label font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {defaultStock <= 0 ? 'Out of Stock' : 'Quick Add'}
          </button>
        </div>

        {/* Hover shine */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-white/0 via-white/[0.05] to-white/0 pointer-events-none" />
      </div>
    </div>
  )
}

// ── Shared URL helpers ────────────────────────────────────────────────────────
function pushProductUrl(slug: string) {
  window.history.pushState(null, '', '/p/' + slug)
}
function clearProductUrl() {
  if (window.location.pathname.startsWith('/p/')) {
    window.history.pushState(null, '', '/')
  }
}

// ── Latest Arrivals section — exported for placement above category bar ────────
export function LatestArrivalsSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<Product | null>(null)
  const [scrollPct, setScrollPct] = useState(0)
  const rowRef = useRef<HTMLDivElement>(null)

  const selectProduct = (p: Product) => { pushProductUrl(p.slug); setSelected(p) }
  const closeModal    = () => { clearProductUrl(); setSelected(null) }

  useEffect(() => {
    supabase
      .from('products')
      .select('*, category:categories(id, name, slug), images, sizes')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(14)
      .then(({ data }) => { if (data) setProducts(data as Product[]); setLoading(false) })
  }, [])

  useEffect(() => {
    const el = rowRef.current
    if (!el) return
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth
      setScrollPct(max > 0 ? el.scrollLeft / max : 0)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [loading])

  const scroll = (dir: 'left' | 'right') => {
    if (!rowRef.current) return
    rowRef.current.scrollBy({ left: dir === 'right' ? 480 : -480, behavior: 'smooth' })
  }

  const scrollToCheckout = () => {
    const el = document.getElementById('checkout')
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'smooth' })
  }

  return (
    <section className="py-10 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 md:px-8 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Flame className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-label font-bold">Just Dropped</span>
          </div>
          <h3 className="font-headline text-2xl md:text-3xl font-bold text-on-surface leading-tight">
            New Arrivals
          </h3>
        </div>

        {/* Scroll progress track + arrow buttons */}
        <div className="flex items-center gap-3">
          {/* Progress bar */}
          {!loading && products.length > 0 && (
            <div className="hidden sm:block w-28 h-[3px] bg-outline-variant/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-150"
                style={{ width: `${Math.max(8, scrollPct * 100)}%` }}
              />
            </div>
          )}
          <button
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-full border border-outline-variant/30 bg-surface-container flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-full border border-outline-variant/30 bg-surface-container flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-all duration-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scroll row — no snap so clicks always register */}
      {loading ? (
        <div className="flex gap-3 px-6 md:px-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[200px] md:w-[240px] shrink-0 aspect-[3/4] rounded-2xl bg-surface-container animate-pulse" />
          ))}
        </div>
      ) : (
        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth px-6 md:px-8 pb-2"
        >
          {products.map((product) => (
            <LatestArrivalsCard key={product.id} product={product} onSelect={selectProduct} />
          ))}
          <div className="w-4 shrink-0" />
        </div>
      )}

      {/* Product detail modal */}
      <ProductDetailModal
        product={selected}
        onClose={closeModal}
        onBuyNow={scrollToCheckout}
        onSelectProduct={selectProduct}
      />
    </section>
  )
}

// ── Infinite-scroll sentinel ──────────────────────────────────────────────────
function useInfiniteScroll(onLoadMore: () => void, enabled: boolean) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!enabled) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) onLoadMore() },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled, onLoadMore])
  return sentinelRef
}

// ── Main grid ─────────────────────────────────────────────────────────────────
export function ProductGrid({ activeCategoryId, highlightedProductId, initialProduct }: ProductGridProps) {
  const [products,  setProducts]  = useState<Product[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(false)
  const [hasMore,   setHasMore]   = useState(false)
  const [page,      setPage]      = useState(0)
  const [fetching,  setFetching]  = useState(false)
  const [selected,  setSelected]  = useState<Product | null>(initialProduct ?? null)
  const [activeCategory, setActiveCategory] = useState(activeCategoryId)

  const selectProduct = (p: Product) => { pushProductUrl(p.slug); setSelected(p) }
  const closeModal    = () => { clearProductUrl(); setSelected(null) }

  // Open initial product immediately (shared link scenario)
  const initialProductRef = useRef(initialProduct)
  useEffect(() => {
    if (initialProductRef.current) setSelected(initialProductRef.current)
  }, [])

  const fetchProducts = useCallback(async (catId: string | null, pageNum: number, append = false) => {
    if (pageNum === 0) setLoading(true); else setFetching(true)
    setError(false)
    try {
      let query = supabase
        .from('products')
        .select('*, category:categories(id, name, slug), images, sizes')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)
      if (catId) query = query.eq('category_id', catId)
      const { data, error: err } = await query
      if (err) throw err
      const items = (data as Product[]) ?? []
      setProducts((prev) => append ? [...prev, ...items] : items)
      setHasMore(items.length === PAGE_SIZE)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    setPage(0)
    setActiveCategory(activeCategoryId)
    fetchProducts(activeCategoryId, 0, false)
  }, [activeCategoryId, fetchProducts])

  useEffect(() => {
    if (!highlightedProductId) return
    const prod = products.find((p) => p.id === highlightedProductId)
    if (prod) selectProduct(prod)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedProductId, products])

  const loadMore = useCallback(() => {
    if (fetching || loading || !hasMore) return
    const next = page + 1
    setPage(next)
    fetchProducts(activeCategory, next, true)
  }, [fetching, loading, hasMore, page, activeCategory, fetchProducts])

  const sentinelRef = useInfiniteScroll(loadMore, hasMore && !loading && !fetching)

  const scrollToCheckout = () => {
    const el = document.getElementById('checkout')
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'smooth' })
  }

  return (
    <section id="products" className="py-8 px-6 md:px-8 max-w-screen-2xl mx-auto">
      {/* Grid header */}
      <div className="mb-6 flex items-center gap-3 border-b border-outline-variant/20 pb-4">
        <span className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant/40 font-label">Browse</span>
        <h2 className="font-headline text-xl md:text-2xl font-bold text-on-surface">
          {activeCategory ? (products[0]?.category?.name ?? 'All Products') : 'All Products'}
        </h2>
        {products.length > 0 && (
          <span className="ml-auto text-xs text-on-surface-variant/40 font-label">{products.length}+ items</span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="py-12 text-center text-on-surface-variant font-body text-sm">
          Could not load products.{' '}
          <button onClick={() => fetchProducts(activeCategory, 0)} className="text-primary underline">Retry</button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && products.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-surface-container rounded-xl mb-3" />
              <div className="h-3 bg-surface-container rounded mb-2 w-1/2" />
              <div className="h-4 bg-surface-container rounded mb-2 w-3/4" />
              <div className="h-3 bg-surface-container rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && !error && (
        <div className="py-24 text-center">
          <ShoppingBag className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-4" />
          <p className="text-on-surface-variant/60 font-body text-base">No products in this category yet.</p>
        </div>
      )}

      {/* Product grid */}
      {products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onClick={selectProduct} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-px" />

      {/* Loading more */}
      {fetching && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-on-surface-variant/50 font-label">Loading more…</p>
        </div>
      )}

      {/* End of list */}
      {!hasMore && products.length >= PAGE_SIZE && !loading && (
        <p className="text-center text-xs text-on-surface-variant/30 font-label mt-12 tracking-widest uppercase">
          · You've seen it all ·
        </p>
      )}

      {/* Product detail modal */}
      <ProductDetailModal
        product={selected}
        onClose={closeModal}
        onBuyNow={scrollToCheckout}
        onSelectProduct={selectProduct}
      />
    </section>
  )
}
