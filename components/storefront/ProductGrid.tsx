'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { ShoppingBag, ChevronLeft, ChevronRight, Heart, Flame, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { supabase }           from '@/lib/supabase'
import { Product }            from '@/lib/types'
import { ProductCard }        from './ProductCard'
import { ProductDetailModal } from './ProductDetailModal'
import { useWishlistStore }   from '@/store/wishlistStore'
import { useCartStore }       from '@/store/cartStore'
import { useSessionStore }    from '@/store/sessionStore'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import type { FilterState }   from './ProductFilters'

interface ProductGridProps {
  activeCategoryId: string | null
  highlightedProductId?: string | null
  initialProduct?: Product | null
  filters?: FilterState
}

const PAGE_SIZE = 48

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
    <motion.div
      onClick={() => onSelect(product)}
      className="w-[200px] md:w-[260px] lg:w-[280px] shrink-0 snap-start cursor-pointer group"
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-depth">
        {/* Image */}
        {img ? (
          <Image
            src={img}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-110"
            sizes="240px"
          />
        ) : (
          <div className="w-full h-full bg-surface-container flex items-center justify-center text-5xl font-display text-on-surface-variant/15">
            {product.name.charAt(0)}
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          <span className="bg-primary/90 backdrop-blur-sm text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-lg">
            New
          </span>
          {discount && (
            <span className="bg-accent-warm/90 backdrop-blur-sm text-on-accent-warm text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-lg">
              -{discount}%
            </span>
          )}
        </div>

        {/* Wishlist */}
        <motion.button
          onClick={toggleWish}
          className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center hover:bg-white/40 transition-all z-10"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          <Heart className={`w-3.5 h-3.5 transition-all duration-300 ${isWished ? 'fill-red-400 text-red-400' : 'text-white'}`} />
        </motion.button>

        {/* Text overlay — bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5 translate-y-0 group-hover:-translate-y-11 transition-transform duration-400 ease-spring">
          <p className="text-white/50 text-[10px] uppercase tracking-wider font-label mb-0.5">
            {product.category?.name ?? ''}
          </p>
          <p className="text-white text-sm font-bold font-display leading-snug line-clamp-2 mb-1.5">
            {product.name}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-white text-sm font-bold">NPR {price.toLocaleString()}</span>
            {product.sale_price && (
              <span className="text-white/40 text-xs line-through">NPR {product.price.toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Quick Add — slides up on hover */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-spring z-10">
          <button
            onClick={handleAddToCart}
            disabled={defaultStock <= 0}
            className="w-full py-3 bg-primary/90 backdrop-blur-md text-white text-xs font-label font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-primary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {defaultStock <= 0 ? 'Out of Stock' : 'Quick Add'}
          </button>
        </div>

        {/* Hover shine */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-tr from-white/0 via-white/[0.05] to-white/0 pointer-events-none" />
      </div>
    </motion.div>
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
  const sectionRef = useRef<HTMLElement>(null)

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

  // GSAP scroll-triggered entrance
  useEffect(() => {
    if (!sectionRef.current || loading) return
    const ctx = gsap.context(() => {
      gsap.from('.arrivals-header', {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [loading])

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
    window.location.href = '/checkout'
  }

  return (
    <section ref={sectionRef} className="py-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="arrivals-header flex items-center justify-between px-4 md:px-8 mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <Flame className="w-3 h-3 text-primary" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-display font-bold">Just Dropped</span>
          </div>
          <h3 className="font-display text-2xl md:text-3xl font-bold text-on-surface leading-tight">
            New Arrivals
          </h3>
        </div>

        {/* Scroll progress track + arrow buttons */}
        <div className="flex items-center gap-3">
          {!loading && products.length > 0 && (
            <div className="hidden sm:block w-28 h-[3px] bg-outline-variant/15 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${Math.max(8, scrollPct * 100)}%` }}
                transition={{ duration: 0.15 }}
              />
            </div>
          )}
          <button
            onClick={() => scroll('left')}
            className="w-10 h-10 rounded-full border border-outline-variant/20 bg-surface-container-lowest flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-all duration-300 shadow-float hover:shadow-glow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-10 h-10 rounded-full border border-outline-variant/20 bg-surface-container-lowest flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-all duration-300 shadow-float hover:shadow-glow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scroll row */}
      {loading ? (
        <div className="flex gap-4 px-4 md:px-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[200px] md:w-[260px] lg:w-[280px] shrink-0 aspect-[3/4] skeleton-shimmer rounded-2xl" />
          ))}
        </div>
      ) : (
        <div
          ref={rowRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth px-4 md:px-8 pb-2"
        >
          {products.map((product) => (
            <LatestArrivalsCard key={product.id} product={product} onSelect={selectProduct} />
          ))}
          <div className="w-6 shrink-0" />
        </div>
      )}

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
      { rootMargin: '800px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled, onLoadMore])
  return sentinelRef
}

// ── Main grid ─────────────────────────────────────────────────────────────────
export function ProductGrid({ activeCategoryId, highlightedProductId, initialProduct, filters }: ProductGridProps) {
  const [products,  setProducts]  = useState<Product[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(false)
  const [hasMore,   setHasMore]   = useState(false)
  const [page,      setPage]      = useState(0)
  const [fetching,  setFetching]  = useState(false)
  const [selected,  setSelected]  = useState<Product | null>(initialProduct ?? null)
  const [activeCategory, setActiveCategory] = useState(activeCategoryId)
  const sectionRef = useRef<HTMLElement>(null)

  const selectProduct = (p: Product) => { pushProductUrl(p.slug); setSelected(p) }
  const closeModal    = () => { clearProductUrl(); setSelected(null) }

  const initialProductRef = useRef(initialProduct)
  useEffect(() => {
    if (initialProductRef.current) setSelected(initialProductRef.current)
  }, [])

  const fetchProducts = useCallback(async (catId: string | null, pageNum: number, append = false, f?: FilterState) => {
    if (pageNum === 0) setLoading(true); else setFetching(true)
    setError(false)
    try {
      // Determine sort
      const sortBy = f?.sortBy ?? 'newest'
      let orderCol = 'created_at'
      let orderAsc = false
      if (sortBy === 'price_asc') { orderCol = 'price'; orderAsc = true }
      else if (sortBy === 'price_desc') { orderCol = 'price'; orderAsc = false }
      else if (sortBy === 'on_sale') { orderCol = 'sale_price'; orderAsc = true }

      let query = supabase
        .from('products')
        .select('*, category:categories(id, name, slug), images, sizes')
        .eq('is_active', true)
        .order(orderCol, { ascending: orderAsc })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

      if (catId) query = query.eq('category_id', catId)
      if (f?.priceMin != null) query = query.gte('price', f.priceMin)
      if (f?.priceMax != null) query = query.lte('price', f.priceMax)
      if (f?.onSaleOnly) query = query.not('sale_price', 'is', null)

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

  // Refetch when category or filters change
  useEffect(() => {
    setPage(0)
    setActiveCategory(activeCategoryId)
    fetchProducts(activeCategoryId, 0, false, filters)
  }, [activeCategoryId, filters, fetchProducts])

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
    fetchProducts(activeCategory, next, true, filters)
  }, [fetching, loading, hasMore, page, activeCategory, fetchProducts, filters])

  const sentinelRef = useInfiniteScroll(loadMore, hasMore && !loading && !fetching)

  // Client-side size filter (sizes is JSONB)
  const displayed = useMemo(() => {
    if (!filters?.sizes?.length) return products
    return products.filter((p) =>
      p.sizes?.some((s) => filters.sizes.includes(s.size))
    )
  }, [products, filters?.sizes])

  const scrollToCheckout = () => {
    window.location.href = '/checkout'
  }

  return (
    <section ref={sectionRef} id="products" className="py-6 px-4 md:px-8 max-w-screen-2xl mx-auto">

      {/* Error */}
      {error && (
        <div className="py-12 text-center text-on-surface-variant font-body text-sm">
          Could not load products.{' '}
          <button onClick={() => fetchProducts(activeCategory, 0)} className="text-primary underline font-semibold">Retry</button>
        </div>
      )}

      {/* Loading skeletons — shimmer */}
      {loading && products.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[3/4] skeleton-shimmer mb-4 rounded-2xl" />
              <div className="h-3 skeleton-shimmer mb-2 w-1/2 rounded-full" />
              <div className="h-4 skeleton-shimmer mb-2 w-3/4 rounded-full" />
              <div className="h-3 skeleton-shimmer w-1/3 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && !error && (
        <div className="py-32 text-center">
          <div className="w-20 h-20 rounded-3xl bg-surface-container flex items-center justify-center mx-auto mb-6 shadow-sm">
            <ShoppingBag className="w-10 h-10 text-on-surface-variant/30" />
          </div>
          <p className="text-on-surface-variant/60 font-body text-lg">No products in this category yet.</p>
        </div>
      )}

      {/* Product grid */}
      {displayed.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
          {displayed.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: Math.min(i * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductCard product={product} onClick={selectProduct} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-px" />

      {/* Loading more */}
      {fetching && (
        <div className="mt-12 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-on-surface-variant/40 font-label">Loading more…</p>
        </div>
      )}

      {/* End of list */}
      {!hasMore && products.length >= PAGE_SIZE && !loading && (
        <p className="text-center text-xs text-on-surface-variant/25 font-display font-medium mt-14 tracking-widest uppercase">
          · You've seen it all ·
        </p>
      )}

      <ProductDetailModal
        product={selected}
        onClose={closeModal}
        onBuyNow={scrollToCheckout}
        onSelectProduct={selectProduct}
      />
    </section>
  )
}
