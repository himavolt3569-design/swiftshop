'use client'

import { useEffect, useState, useCallback } from 'react'
import { ShoppingBag } from 'lucide-react'
import { supabase }      from '@/lib/supabase'
import { Product }       from '@/lib/types'
import { ProductCard }         from './ProductCard'
import { ProductDetailModal } from './ProductDetailModal'

interface ProductGridProps {
  activeCategoryId: string | null
  highlightedProductId?: string | null
}

const PAGE_SIZE = 12

export function ProductGrid({ activeCategoryId, highlightedProductId }: ProductGridProps) {
  const [products,  setProducts]  = useState<Product[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(false)
  const [hasMore,   setHasMore]   = useState(false)
  const [page,      setPage]      = useState(0)
  const [selected,  setSelected]  = useState<Product | null>(null)
  const [activeCategory, setActiveCategory] = useState(activeCategoryId)

  const fetchProducts = useCallback(async (catId: string | null, pageNum: number, append = false) => {
    setLoading(true)
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
    if (prod) setSelected(prod)
  }, [highlightedProductId, products])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchProducts(activeCategory, next, true)
  }

  const scrollToCheckout = () => {
    const el = document.getElementById('checkout')
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'smooth' })
  }

  return (
    <section id="products" className="py-16 px-6 md:px-8 max-w-screen-2xl mx-auto">
      <div className="mb-10 flex items-baseline gap-3">
        <span className="text-[11px] uppercase tracking-[0.3em] text-on-surface-variant/60 font-label">Products</span>
        <h2 className="font-headline text-3xl font-bold text-on-surface">
          {products[0]?.category?.name ?? 'All Selections'}
        </h2>
      </div>

      {/* Error */}
      {error && (
        <div className="py-12 text-center text-on-surface-variant font-body">
          Could not load products. <button onClick={() => fetchProducts(activeCategory, 0)} className="text-primary underline">Retry</button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && products.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-surface-container rounded-lg mb-4" />
              <div className="h-3 bg-surface-container rounded mb-2 w-1/2" />
              <div className="h-4 bg-surface-container rounded mb-2 w-3/4" />
              <div className="h-4 bg-surface-container rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && !error && (
        <div className="py-24 text-center">
          <ShoppingBag className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
          <p className="text-on-surface-variant font-body">No products in this category yet.</p>
        </div>
      )}

      {/* Grid */}
      {products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onClick={setSelected} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <div className="mt-14 text-center">
          <button
            onClick={loadMore}
            className="px-10 py-3 border border-outline-variant text-on-surface text-sm font-label font-medium rounded-lg hover:bg-surface-container transition-colors"
          >
            Load More
          </button>
        </div>
      )}

      {loading && products.length > 0 && (
        <div className="mt-8 text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}

      {/* Product detail modal */}
      <ProductDetailModal product={selected} onClose={() => setSelected(null)} onBuyNow={scrollToCheckout} />
    </section>
  )
}
