'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import {
  X, Star, ChevronLeft, ChevronRight, Minus, Plus,
  Heart, ShoppingCart, Zap, Truck, RotateCcw,
  Share2, ZoomIn, Check, ChevronDown,
} from 'lucide-react'
import { Product, Review } from '@/lib/types'
import { supabase }         from '@/lib/supabase'
import { useCartStore }     from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useSessionStore }  from '@/store/sessionStore'

interface ProductDetailModalProps {
  product: Product | null
  onClose: () => void
  onBuyNow?: () => void
  onSelectProduct?: (product: Product) => void
}

// ─── Stars helper ────────────────────────────────────────────
function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${cls} ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-outline-variant fill-outline-variant/20'}`}
        />
      ))}
    </div>
  )
}

// ─── Rating bar ──────────────────────────────────────────────
function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-on-surface-variant font-label w-2">{star}</span>
      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
      <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-on-surface-variant font-label w-4 text-right">{count}</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────
export function ProductDetailModal({ product, onClose, onBuyNow, onSelectProduct }: ProductDetailModalProps) {
  const [activeImage,   setActiveImage]   = useState(0)
  const [selectedSize,  setSelectedSize]  = useState<string | null>(null)
  const [quantity,      setQuantity]      = useState(1)
  const [reviews,       setReviews]       = useState<Review[]>([])
  const [related,       setRelated]       = useState<Product[]>([])
  const [avgRating,     setAvgRating]     = useState(0)
  const [reviewCount,   setReviewCount]   = useState(0)
  const [ratingDist,    setRatingDist]    = useState<Record<number, number>>({})
  const [addedToCart,   setAddedToCart]   = useState(false)
  const [zoomed,        setZoomed]        = useState(false)
  const [zoomPos,       setZoomPos]       = useState({ x: 50, y: 50 })
  const [activeTab,     setActiveTab]     = useState<'description' | 'reviews' | 'shipping' | null>(null)
  const [reviewForm,    setReviewForm]    = useState({ name: '', rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [hasPurchased,  setHasPurchased]  = useState(false)

  const imgRef     = useRef<HTMLDivElement>(null)
  const addItem    = useCartStore((s) => s.addItem)
  const { addItem: addWish, removeItem: removeWish, hasItem } = useWishlistStore()
  const addToast   = useSessionStore((s) => s.addToast)
  const sessionId  = useSessionStore((s) => s.sessionId)
  const isWished   = product ? hasItem(product.id) : false

  // Reset on product change
  useEffect(() => {
    if (!product) return
    setActiveImage(0)
    // If product has no sizes, use sentinel 'ONE_SIZE' to bypass size requirement
    setSelectedSize(product.sizes?.length ? (product.sizes[0]?.size ?? null) : 'ONE_SIZE')
    setQuantity(1)
    setAddedToCart(false)
    setActiveTab(null)
    setZoomed(false)
    setReviewForm({ name: '', rating: 5, comment: '' })
  }, [product?.id])

  // Fetch reviews + related + purchase check
  useEffect(() => {
    if (!product) return
    const run = async () => {
      // Check if this session has ever ordered this product
      const { data: orders } = await supabase
        .from('orders')
        .select('items')
        .eq('session_id', sessionId)
      const purchased = (orders ?? []).some((o) =>
        (o.items as { product_id?: string }[])?.some((i) => i.product_id === product.id)
      )
      setHasPurchased(purchased)

      const { data: revs } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
        .limit(20)

      const r = (revs as Review[]) ?? []
      setReviews(r)
      if (r.length > 0) {
        setAvgRating(r.reduce((s, x) => s + x.rating, 0) / r.length)
        setReviewCount(r.length)
        const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        r.forEach((x) => { dist[x.rating] = (dist[x.rating] ?? 0) + 1 })
        setRatingDist(dist)
      }

      let { data: rel } = await supabase
        .from('products')
        .select('*, category:categories(name), images, sizes')
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .eq('is_active', true)
        .limit(10)
      if (!rel || rel.length === 0) {
        const { data: fb } = await supabase
          .from('products')
          .select('*, category:categories(name), images, sizes')
          .neq('id', product.id)
          .eq('is_active', true)
          .limit(10)
        rel = fb
      }
      setRelated((rel as Product[]) ?? [])
    }
    run()
  }, [product?.id, product?.category_id])

  // ESC / scroll lock
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { if (zoomed) setZoomed(false); else onClose() }
    if (e.key === 'ArrowLeft') setActiveImage((v) => Math.max(0, v - 1))
    if (e.key === 'ArrowRight') setActiveImage((v) => Math.min((product?.images?.length ?? 1) - 1, v + 1))
  }, [onClose, zoomed, product?.images?.length])

  useEffect(() => {
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = product ? 'hidden' : ''
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [handleEsc, product])

  if (!product) return null

  const hasSizes      = (product.sizes?.length ?? 0) > 0
  const images        = product.images ?? []
  const selectedObj   = product.sizes?.find((s) => s.size === selectedSize)
  // If no sizes configured, use product.stock directly
  const maxQty        = hasSizes ? (selectedObj?.stock ?? 0) : (product.stock ?? 0)
  const displayPrice  = product.sale_price ?? product.price
  const discountPct   = product.sale_price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0

  const handleAddToCart = () => {
    if (maxQty <= 0) return
    addItem({
      product_id:    product.id,
      product_name:  product.name,
      product_image: images[0]?.url ?? '',
      price:         product.price,
      sale_price:    product.sale_price,
      size:          selectedSize === 'ONE_SIZE' ? '' : (selectedSize ?? ''),
      quantity,
      max_stock:     maxQty,
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
    addToast('success', `${product.name} added to cart`)
  }

  const handleBuyNow = () => {
    handleAddToCart()
    onBuyNow?.()
    onClose()
  }

  const toggleWish = () => {
    if (isWished) {
      removeWish(product.id)
      addToast('info', 'Removed from wishlist')
    } else {
      addWish({
        product_id: product.id, product_name: product.name,
        product_image: images[0]?.url ?? '', price: product.price, sale_price: product.sale_price,
      })
      addToast('success', 'Added to wishlist')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: product.name, text: product.description, url: window.location.href })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      addToast('success', 'Link copied to clipboard')
    }
  }

  const handleSubmitReview = async () => {
    if (!reviewForm.name.trim() || !reviewForm.comment.trim()) {
      addToast('error', 'Please fill in your name and comment.')
      return
    }
    setSubmittingReview(true)
    const { error } = await supabase.from('reviews').insert({
      product_id:    product.id,
      customer_name: reviewForm.name.trim(),
      rating:        reviewForm.rating,
      comment:       reviewForm.comment.trim(),
    })
    setSubmittingReview(false)
    if (error) { addToast('error', 'Failed to submit review.'); return }
    addToast('success', 'Review submitted!')
    setReviewForm({ name: '', rating: 5, comment: '' })
    // Refresh reviews
    const { data: revs } = await supabase.from('reviews').select('*').eq('product_id', product.id).order('created_at', { ascending: false }).limit(20)
    const r = (revs as Review[]) ?? []
    setReviews(r)
    if (r.length > 0) {
      setAvgRating(r.reduce((s, x) => s + x.rating, 0) / r.length)
      setReviewCount(r.length)
      const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      r.forEach((x) => { dist[x.rating] = (dist[x.rating] ?? 0) + 1 })
      setRatingDist(dist)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed || !imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[70] bg-on-background/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-6"
        onClick={onClose}
      >
        <div
          className="relative w-full sm:max-w-5xl bg-background rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96dvh] sm:max-h-[90vh] animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 z-20 w-9 h-9 bg-surface-container-lowest/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-float hover:bg-surface-container transition-colors border border-outline-variant/20"
          >
            <X className="w-4 h-4 text-on-surface" />
          </button>

          {/* Drag handle (mobile) */}
          <div className="sm:hidden w-10 h-1 bg-outline-variant/40 rounded-full mx-auto mt-3 shrink-0" />

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1">
            <div className="flex flex-col lg:flex-row">

              {/* ── LEFT: Image gallery ── */}
              <div className="lg:w-[52%] lg:sticky lg:top-0 lg:max-h-[90vh] bg-surface-container-low flex flex-col">

                {/* Main image */}
                <div
                  ref={imgRef}
                  className={`relative aspect-[4/3] lg:aspect-auto lg:flex-1 overflow-hidden select-none ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                  onClick={() => setZoomed(!zoomed)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => { if (zoomed) setZoomed(false) }}
                >
                  {images[activeImage]?.url ? (
                    <Image
                      src={images[activeImage].url}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700"
                      style={zoomed ? {
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                        transform: 'scale(2)',
                      } : {}}
                      priority
                      sizes="(max-width: 1024px) 100vw, 52vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-8xl font-headline text-on-surface-variant/15">
                      {product.name.charAt(0)}
                    </div>
                  )}

                  {/* Overlays */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {product.stock <= 0 && (
                        <span className="bg-inverse-surface text-inverse-on-surface text-[11px] px-2.5 py-1 rounded-full font-label font-semibold">
                          Out of Stock
                        </span>
                      )}
                      {discountPct > 0 && (
                        <span className="bg-error text-white text-[11px] px-2.5 py-1 rounded-full font-label font-bold">
                          -{discountPct}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Zoom hint */}
                  {!zoomed && images[activeImage]?.url && (
                    <div className="absolute bottom-3 right-3 bg-background/70 backdrop-blur-sm rounded-full px-2.5 py-1.5 flex items-center gap-1.5 pointer-events-none">
                      <ZoomIn className="w-3 h-3 text-on-surface-variant" />
                      <span className="text-[10px] text-on-surface-variant font-label">Click to zoom</span>
                    </div>
                  )}

                  {/* Prev/Next arrows */}
                  {images.length > 1 && !zoomed && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveImage((v) => (v - 1 + images.length) % images.length) }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-float hover:bg-background transition-colors pointer-events-auto"
                        aria-label="Previous"
                      >
                        <ChevronLeft className="w-4 h-4 text-on-surface" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveImage((v) => (v + 1) % images.length) }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-float hover:bg-background transition-colors pointer-events-auto"
                        aria-label="Next"
                      >
                        <ChevronRight className="w-4 h-4 text-on-surface" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 p-3 bg-surface-container-lowest overflow-x-auto no-scrollbar border-t border-outline-variant/15">
                    {images.map((img, i) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImage(i)}
                        className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                          i === activeImage
                            ? 'border-primary shadow-sm scale-105'
                            : 'border-transparent opacity-60 hover:opacity-100 hover:border-outline-variant/50'
                        }`}
                      >
                        <Image src={img.url} alt="" width={64} height={64} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Dot indicators (mobile only) */}
                {images.length > 1 && (
                  <div className="lg:hidden flex justify-center gap-1.5 py-2">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={`rounded-full transition-all ${i === activeImage ? 'w-4 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-outline-variant'}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* ── RIGHT: Product info ── */}
              <div className="lg:w-[48%] flex flex-col">
                <div className="p-6 lg:p-8 space-y-5 flex-1">

                  {/* Category + actions */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/70 font-label bg-surface-container px-2.5 py-1 rounded-full">
                      {product.category?.name ?? 'Product'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={toggleWish}
                        aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
                        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors"
                      >
                        <Heart className={`w-4.5 h-4.5 transition-colors ${isWished ? 'fill-primary text-primary' : 'text-on-surface-variant'}`} />
                      </button>
                      <button
                        onClick={handleShare}
                        aria-label="Share"
                        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors"
                      >
                        <Share2 className="w-4 h-4 text-on-surface-variant" />
                      </button>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <h2 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface leading-tight">
                      {product.name}
                    </h2>

                    {/* Rating row */}
                    {reviewCount > 0 && (
                      <div className="flex items-center gap-2.5 mt-2">
                        <Stars rating={avgRating} size="md" />
                        <span className="text-sm font-bold text-on-surface">{avgRating.toFixed(1)}</span>
                        <button
                          onClick={() => setActiveTab((t) => t === 'reviews' ? null : 'reviews')}
                          className="text-sm text-primary hover:underline font-label"
                        >
                          {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-on-surface font-headline">
                      NPR {displayPrice.toLocaleString()}
                    </span>
                    {product.sale_price && (
                      <>
                        <span className="text-base text-on-surface-variant line-through font-body">
                          NPR {product.price.toLocaleString()}
                        </span>
                        <span className="text-sm font-bold text-error bg-error-container/40 px-2 py-0.5 rounded-full font-label">
                          Save {discountPct}%
                        </span>
                      </>
                    )}
                  </div>

                  {/* Stock status */}
                  <div className="flex items-center gap-2">
                    {maxQty <= 0 ? (
                      <span className="flex items-center gap-1.5 text-sm text-error font-label">
                        <span className="w-2 h-2 rounded-full bg-error" /> Out of stock
                      </span>
                    ) : maxQty <= 5 ? (
                      <span className="flex items-center gap-1.5 text-sm text-amber-600 font-label">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Only {maxQty} left
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm text-success font-label">
                        <span className="w-2 h-2 rounded-full bg-success" /> In stock
                      </span>
                    )}
                  </div>

                  {/* Size selector */}
                  {product.sizes && product.sizes.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="text-xs font-bold text-on-surface font-label uppercase tracking-wider">Size</p>
                        {selectedSize && (
                          <span className="text-xs text-on-surface-variant font-label">
                            Selected: <span className="text-primary font-semibold">{selectedSize}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((s) => (
                          <button
                            key={s.size}
                            disabled={s.stock === 0}
                            onClick={() => { setSelectedSize(s.size); setQuantity(1) }}
                            className={`relative px-4 py-2 rounded-xl text-sm font-label font-semibold transition-all duration-150 border ${
                              selectedSize === s.size
                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/25'
                                : s.stock === 0
                                ? 'bg-surface-container/50 text-on-surface-variant/40 border-outline-variant/20 cursor-not-allowed line-through'
                                : 'bg-background text-on-surface border-outline-variant/40 hover:border-primary/50 hover:bg-primary/5'
                            }`}
                          >
                            {s.size}
                            {selectedSize === s.size && (
                              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center">
                                <Check className="w-2 h-2 text-white" strokeWidth={3} />
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <p className="text-xs font-bold text-on-surface font-label uppercase tracking-wider mb-2.5">Quantity</p>
                    <div className="flex items-center gap-0">
                      <button
                        onClick={() => setQuantity((v) => Math.max(1, v - 1))}
                        className="w-10 h-10 rounded-l-xl border border-outline-variant/40 flex items-center justify-center hover:bg-surface-container transition-colors text-on-surface"
                        aria-label="Decrease"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-14 h-10 border-t border-b border-outline-variant/40 flex items-center justify-center text-sm font-bold text-on-surface font-label">
                        {quantity}
                      </div>
                      <button
                        onClick={() => setQuantity((v) => Math.min(maxQty, v + 1))}
                        disabled={quantity >= maxQty}
                        className="w-10 h-10 rounded-r-xl border border-outline-variant/40 flex items-center justify-center hover:bg-surface-container transition-colors text-on-surface disabled:opacity-30"
                        aria-label="Increase"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* CTA buttons */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={handleAddToCart}
                      disabled={maxQty <= 0 || (hasSizes && !selectedSize)}
                      className={`flex-1 h-12 rounded-xl font-label font-bold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 border ${
                        addedToCart
                          ? 'bg-success text-white border-success'
                          : 'bg-background text-on-surface border-outline-variant/50 hover:bg-surface-container hover:border-primary/40'
                      }`}
                    >
                      {addedToCart ? (
                        <><Check className="w-4 h-4" /> Added!</>
                      ) : (
                        <><ShoppingCart className="w-4 h-4" /> Add to Cart</>
                      )}
                    </button>
                    <button
                      onClick={handleBuyNow}
                      disabled={maxQty <= 0 || (hasSizes && !selectedSize)}
                      className="flex-1 h-12 bg-primary hover:bg-primary-container text-white rounded-xl font-label font-bold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                    >
                      <Zap className="w-4 h-4" /> Buy Now
                    </button>
                  </div>

                  {/* Accordion: Description / Reviews / Shipping */}
                  <div className="pt-2 border-t border-outline-variant/15 space-y-0">

                    {/* Description */}
                    <div className="border-b border-outline-variant/15">
                      <button
                        onClick={() => setActiveTab((t) => t === 'description' ? null : 'description')}
                        className="w-full flex items-center justify-between py-3 text-xs font-bold text-on-surface font-label uppercase tracking-wider"
                      >
                        Description
                        <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform duration-200 ${activeTab === 'description' ? 'rotate-180' : ''}`} />
                      </button>
                      {activeTab === 'description' && (
                        <p className="pb-4 text-sm text-on-surface-variant leading-relaxed font-body">
                          {product.description || 'No description available for this product.'}
                        </p>
                      )}
                    </div>

                    {/* Reviews */}
                    <div className="border-b border-outline-variant/15">
                      <button
                        onClick={() => setActiveTab((t) => t === 'reviews' ? null : 'reviews')}
                        className="w-full flex items-center justify-between py-3 text-xs font-bold text-on-surface font-label uppercase tracking-wider"
                      >
                        Reviews{reviewCount > 0 ? ` (${reviewCount})` : ''}
                        <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform duration-200 ${activeTab === 'reviews' ? 'rotate-180' : ''}`} />
                      </button>
                      {activeTab === 'reviews' && (
                        <div className="pb-4 space-y-4">
                          {reviewCount > 0 && (
                            <div className="flex gap-6 p-4 bg-surface-container rounded-xl">
                              <div className="text-center shrink-0">
                                <p className="text-4xl font-bold text-on-surface font-headline">{avgRating.toFixed(1)}</p>
                                <Stars rating={avgRating} size="sm" />
                                <p className="text-xs text-on-surface-variant mt-1 font-label">{reviewCount} reviews</p>
                              </div>
                              <div className="flex-1 space-y-1.5">
                                {[5, 4, 3, 2, 1].map((s) => (
                                  <RatingBar key={s} star={s} count={ratingDist[s] ?? 0} total={reviewCount} />
                                ))}
                              </div>
                            </div>
                          )}

                          {hasPurchased ? (
                            <div className="border border-outline-variant/30 rounded-xl p-4 space-y-3">
                              <p className="text-xs font-bold text-on-surface font-label uppercase tracking-wider">Write a Review</p>
                              <input
                                className="w-full h-9 px-3 rounded-lg border border-outline-variant/40 bg-background text-sm text-on-surface font-body placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60"
                                placeholder="Your name"
                                value={reviewForm.name}
                                onChange={(e) => setReviewForm((f) => ({ ...f, name: e.target.value }))}
                              />
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <button key={s} type="button" onClick={() => setReviewForm((f) => ({ ...f, rating: s }))} className="p-0.5">
                                    <Star className={`w-5 h-5 transition-colors ${s <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-outline-variant fill-outline-variant/20'}`} />
                                  </button>
                                ))}
                                <span className="text-xs text-on-surface-variant font-label ml-1">{reviewForm.rating}/5</span>
                              </div>
                              <textarea
                                className="w-full h-20 px-3 py-2 rounded-lg border border-outline-variant/40 bg-background text-sm text-on-surface font-body placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 resize-none"
                                placeholder="Share your experience..."
                                value={reviewForm.comment}
                                onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                              />
                              <button
                                onClick={handleSubmitReview}
                                disabled={submittingReview}
                                className="h-9 px-5 bg-primary text-white text-sm font-label font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                              >
                                {submittingReview ? 'Submitting…' : 'Submit Review'}
                              </button>
                            </div>
                          ) : (
                            <div className="border border-outline-variant/20 rounded-xl p-4 text-center bg-surface-container-low">
                              <p className="text-sm font-semibold text-on-surface font-label mb-1">Verified purchases only</p>
                              <p className="text-xs text-on-surface-variant font-body">Buy this product to leave a review.</p>
                            </div>
                          )}

                          {reviews.length === 0 && (
                            <p className="text-sm text-on-surface-variant font-body py-1">No reviews yet — be the first!</p>
                          )}

                          <div className="space-y-4">
                            {reviews.map((r) => (
                              <div key={r.id} className="border-b border-outline-variant/20 pb-4 last:border-0">
                                <div className="flex items-start justify-between mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary font-label">
                                      {r.customer_name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-semibold text-on-surface font-label">
                                      {r.customer_name.split(' ')[0]}
                                    </span>
                                  </div>
                                  <span className="text-xs text-on-surface-variant font-body">
                                    {new Date(r.created_at).toLocaleDateString('en-NP', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                                <Stars rating={r.rating} />
                                <p className="text-sm text-on-surface-variant font-body leading-relaxed mt-1.5">{r.comment}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Shipping */}
                    <div className="border-b border-outline-variant/15">
                      <button
                        onClick={() => setActiveTab((t) => t === 'shipping' ? null : 'shipping')}
                        className="w-full flex items-center justify-between py-3 text-xs font-bold text-on-surface font-label uppercase tracking-wider"
                      >
                        Shipping & Returns
                        <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform duration-200 ${activeTab === 'shipping' ? 'rotate-180' : ''}`} />
                      </button>
                      {activeTab === 'shipping' && (
                        <div className="pb-4 space-y-3 text-sm text-on-surface-variant font-body">
                          <div className="flex items-start gap-3 py-2 border-b border-outline-variant/20">
                            <Truck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <div>
                              <p className="font-semibold text-on-surface">Standard Delivery</p>
                              <p>2–4 business days across Nepal. Free on orders above NPR 500.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 py-2 border-b border-outline-variant/20">
                            <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <div>
                              <p className="font-semibold text-on-surface">Express Delivery</p>
                              <p>Same-day delivery available in Kathmandu Valley.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 py-2">
                            <RotateCcw className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <div>
                              <p className="font-semibold text-on-surface">Returns & Exchanges</p>
                              <p>7-day hassle-free returns on unused items in original packaging.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Related products */}
                {related.length > 0 && (
                  <div className="px-6 lg:px-8 pb-6 border-t border-outline-variant/15 pt-5">
                    <p className="text-xs font-bold text-on-surface font-label uppercase tracking-wider mb-3">You may also like</p>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                      {related.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => onSelectProduct ? onSelectProduct(r) : undefined}
                          className="shrink-0 w-28 text-left group"
                        >
                          <div className="aspect-[3/4] rounded-xl overflow-hidden bg-surface-container border border-outline-variant/20 mb-2 group-hover:shadow-float transition-shadow">
                            {r.images?.[0]?.url ? (
                              <Image
                                src={r.images[0].url}
                                alt={r.name}
                                width={112} height={150}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl font-headline text-on-surface-variant/30">
                                {r.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-medium text-on-surface line-clamp-2 font-body leading-snug">{r.name}</p>
                          <p className="text-xs font-bold text-primary mt-0.5 font-label">NPR {(r.sale_price ?? r.price).toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
