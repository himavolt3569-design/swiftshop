'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import {
  X, Star, ChevronLeft, ChevronRight, Minus, Plus,
  Heart, ShoppingCart, Zap, Truck, RotateCcw,
  Share2, ZoomIn, Check, ChevronDown, Package,
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

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${cls} ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-stone-200 text-stone-200'}`} />
      ))}
    </div>
  )
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-on-surface-variant font-label w-2 shrink-0">{star}</span>
      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
      <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-on-surface-variant font-label w-5 text-right shrink-0">{count}</span>
    </div>
  )
}

export function ProductDetailModal({ product, onClose, onBuyNow, onSelectProduct }: ProductDetailModalProps) {
  const [activeImage,      setActiveImage]      = useState(0)
  const [selectedSize,     setSelectedSize]     = useState<string | null>(null)
  const [quantity,         setQuantity]         = useState(1)
  const [reviews,          setReviews]          = useState<Review[]>([])
  const [related,          setRelated]          = useState<Product[]>([])
  const [avgRating,        setAvgRating]        = useState(0)
  const [reviewCount,      setReviewCount]      = useState(0)
  const [ratingDist,       setRatingDist]       = useState<Record<number, number>>({})
  const [addedToCart,      setAddedToCart]      = useState(false)
  const [zoomed,           setZoomed]           = useState(false)
  const [zoomPos,          setZoomPos]          = useState({ x: 50, y: 50 })
  const [activeTab,        setActiveTab]        = useState<'description' | 'reviews' | 'shipping' | null>(null)
  const [reviewForm,       setReviewForm]       = useState({ name: '', rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [hasPurchased,     setHasPurchased]     = useState(false)

  const imgRef    = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const addItem   = useCartStore((s) => s.addItem)
  const { addItem: addWish, removeItem: removeWish, hasItem } = useWishlistStore()
  const addToast  = useSessionStore((s) => s.addToast)
  const sessionId = useSessionStore((s) => s.sessionId)
  const isWished  = product ? hasItem(product.id) : false

  useEffect(() => {
    if (!product) return
    setActiveImage(0)
    setSelectedSize(product.sizes?.length ? (product.sizes[0]?.size ?? null) : 'ONE_SIZE')
    setQuantity(1)
    setAddedToCart(false)
    setActiveTab(null)
    setZoomed(false)
    setReviewForm({ name: '', rating: 5, comment: '' })
  }, [product?.id])

  useEffect(() => {
    if (!product) return
    const run = async () => {
      const { data: orders } = await supabase.from('orders').select('items').eq('session_id', sessionId)
      setHasPurchased((orders ?? []).some((o) =>
        (o.items as { product_id?: string }[])?.some((i) => i.product_id === product.id)
      ))
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
      let { data: rel } = await supabase.from('products').select('*, category:categories(name), images, sizes').eq('category_id', product.category_id).neq('id', product.id).eq('is_active', true).limit(10)
      if (!rel?.length) {
        const { data: fb } = await supabase.from('products').select('*, category:categories(name), images, sizes').neq('id', product.id).eq('is_active', true).limit(10)
        rel = fb
      }
      setRelated((rel as Product[]) ?? [])
    }
    run()
  }, [product?.id, product?.category_id, sessionId])

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { if (zoomed) setZoomed(false); else onClose() }
    if (e.key === 'ArrowLeft') setActiveImage((v) => Math.max(0, v - 1))
    if (e.key === 'ArrowRight') setActiveImage((v) => Math.min((product?.images?.length ?? 1) - 1, v + 1))
  }, [onClose, zoomed, product?.images?.length])

  useEffect(() => {
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = product ? 'hidden' : ''
    return () => { document.removeEventListener('keydown', handleEsc); document.body.style.overflow = '' }
  }, [handleEsc, product])

  if (!product) return null

  const hasSizes     = (product.sizes?.length ?? 0) > 0
  const images       = product.images ?? []
  const selectedObj  = product.sizes?.find((s) => s.size === selectedSize)
  const maxQty       = hasSizes ? (selectedObj?.stock ?? 0) : (product.stock ?? 0)
  const displayPrice = product.sale_price ?? product.price
  const discountPct  = product.sale_price ? Math.round(((product.price - product.sale_price) / product.price) * 100) : 0
  const canBuy       = maxQty > 0 && (!hasSizes || !!selectedSize)

  const handleAddToCart = () => {
    if (!canBuy) return
    addItem({ product_id: product.id, product_name: product.name, product_image: images[0]?.url ?? '', price: product.price, sale_price: product.sale_price, size: selectedSize === 'ONE_SIZE' ? '' : (selectedSize ?? ''), quantity, max_stock: maxQty })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
    addToast('success', `${product.name} added to cart`)
  }

  const handleBuyNow = () => {
    handleAddToCart()
    onClose()
    // Scroll after the modal closes and body.overflow is restored
    setTimeout(() => onBuyNow?.(), 50)
  }

  const toggleWish = () => {
    if (isWished) { removeWish(product.id); addToast('info', 'Removed from wishlist') }
    else { addWish({ product_id: product.id, product_name: product.name, product_image: images[0]?.url ?? '', price: product.price, sale_price: product.sale_price }); addToast('success', 'Added to wishlist') }
  }

  const handleShare = async () => {
    if (navigator.share) await navigator.share({ title: product.name, text: product.description, url: window.location.href })
    else { await navigator.clipboard.writeText(window.location.href); addToast('success', 'Link copied!') }
  }

  const handleSubmitReview = async () => {
    if (!reviewForm.name.trim() || !reviewForm.comment.trim()) { addToast('error', 'Please fill in your name and comment.'); return }
    setSubmittingReview(true)
    const { error } = await supabase.from('reviews').insert({ product_id: product.id, customer_name: reviewForm.name.trim(), rating: reviewForm.rating, comment: reviewForm.comment.trim() })
    setSubmittingReview(false)
    if (error) { addToast('error', 'Failed to submit review.'); return }
    addToast('success', 'Review submitted!')
    setReviewForm({ name: '', rating: 5, comment: '' })
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
    setZoomPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 })
  }

  const nextImg = () => setActiveImage((v) => (v + 1) % images.length)
  const prevImg = () => setActiveImage((v) => (v - 1 + images.length) % images.length)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Modal wrapper */}
      <div
        role="dialog" aria-modal="true" aria-label={product.name}
        className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-8"
        onClick={onClose}
      >
        <div
          className="relative w-full sm:max-w-5xl lg:max-w-6xl bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94dvh] sm:max-h-[92vh] animate-sheet-up sm:animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Drag handle (mobile) */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-outline-variant/50 rounded-full" />
          </div>

          {/* ── Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 w-9 h-9 bg-background/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-surface-container transition-all border border-outline-variant/20 hover:rotate-90 duration-200"
          >
            <X className="w-4 h-4 text-on-surface" />
          </button>

          {/* ── BODY (scrollable on mobile, flex-row on desktop) */}
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

            {/* ════ LEFT — Image gallery ════ */}
            <div className="lg:w-[48%] bg-stone-50 flex flex-col lg:sticky lg:top-0 shrink-0">

              {/* Main image */}
              <div
                ref={imgRef}
                className={`relative flex-1 aspect-[4/3] lg:aspect-auto lg:min-h-[60vh] overflow-hidden select-none ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                onClick={() => images[activeImage]?.url && setZoomed(!zoomed)}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => zoomed && setZoomed(false)}
                onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
                onTouchEnd={(e) => {
                  if (touchStartX.current === null) return
                  const dx = e.changedTouches[0].clientX - touchStartX.current
                  if (Math.abs(dx) > 40) { dx < 0 ? nextImg() : prevImg() }
                  touchStartX.current = null
                }}
              >
                {images[activeImage]?.url ? (
                  <Image
                    src={images[activeImage].url}
                    alt={product.name}
                    fill
                    className="object-cover transition-all duration-500"
                    style={zoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`, transform: 'scale(2.2)' } : {}}
                    priority
                    sizes="(max-width: 1024px) 100vw, 48vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-8xl font-headline text-stone-200">
                    {product.name.charAt(0)}
                  </div>
                )}

                {/* Gradient vignette bottom */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-50/80 to-transparent pointer-events-none" />

                {/* Top badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                  {product.stock <= 0 && (
                    <span className="bg-black/80 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full font-label font-semibold">Sold Out</span>
                  )}
                  {discountPct > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-2.5 py-1 rounded-full font-label font-bold shadow-sm">-{discountPct}% OFF</span>
                  )}
                </div>

                {/* Image counter */}
                {images.length > 1 && !zoomed && (
                  <div className="absolute top-3 right-12 bg-black/50 backdrop-blur-sm text-white text-[11px] font-label px-2.5 py-1 rounded-full">
                    {activeImage + 1} / {images.length}
                  </div>
                )}

                {/* Zoom hint */}
                {!zoomed && images[activeImage]?.url && (
                  <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 pointer-events-none">
                    <ZoomIn className="w-3 h-3 text-stone-500" />
                    <span className="text-[10px] text-stone-500 font-label">Zoom</span>
                  </div>
                )}

                {/* Prev/Next arrows */}
                {images.length > 1 && !zoomed && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); prevImg() }} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white hover:scale-110 transition-all pointer-events-auto">
                      <ChevronLeft className="w-4 h-4 text-stone-700" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); nextImg() }} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white hover:scale-110 transition-all pointer-events-auto">
                      <ChevronRight className="w-4 h-4 text-stone-700" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div className="flex gap-2 px-4 py-3 bg-white border-t border-stone-100 overflow-x-auto no-scrollbar">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImage(i)}
                      className={`w-14 h-14 shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-150 ${
                        i === activeImage ? 'border-primary shadow-md scale-105' : 'border-transparent opacity-50 hover:opacity-80 hover:border-stone-300'
                      }`}
                    >
                      <Image src={img.url} alt="" width={56} height={56} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

            </div>

            {/* ════ RIGHT — Product info ════ */}
            <div className="lg:w-[52%] flex flex-col overflow-y-auto">
              <div className="flex-1 overflow-y-auto">

                {/* Info content */}
                <div className="p-5 md:p-7 lg:p-8 space-y-6">

                  {/* Category chip + action buttons */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60 font-label bg-surface-container px-3 py-1 rounded-full border border-outline-variant/20">
                      {product.category?.name ?? 'Product'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={toggleWish} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors">
                        <Heart className={`w-5 h-5 transition-all ${isWished ? 'fill-red-500 text-red-500 scale-110' : 'text-on-surface-variant'}`} />
                      </button>
                      <button onClick={handleShare} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors">
                        <Share2 className="w-4 h-4 text-on-surface-variant" />
                      </button>
                    </div>
                  </div>

                  {/* Product name */}
                  <div>
                    <h2 className="font-headline text-xl md:text-2xl lg:text-3xl font-bold text-on-surface leading-tight mb-2">
                      {product.name}
                    </h2>
                    {reviewCount > 0 && (
                      <div className="flex items-center gap-2">
                        <Stars rating={avgRating} size="sm" />
                        <span className="text-sm font-bold text-on-surface">{avgRating.toFixed(1)}</span>
                        <button onClick={() => setActiveTab((t) => t === 'reviews' ? null : 'reviews')} className="text-sm text-primary hover:underline font-label">
                          ({reviewCount} reviews)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Price block */}
                  <div className="flex items-end gap-3 flex-wrap">
                    <span className="text-3xl md:text-4xl font-bold text-on-surface font-headline leading-none">
                      NPR {displayPrice.toLocaleString()}
                    </span>
                    {product.sale_price && (
                      <div className="flex items-center gap-2 pb-0.5">
                        <span className="text-base text-on-surface-variant/50 line-through font-body">
                          NPR {product.price.toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full font-label">
                          Save {discountPct}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stock status */}
                  <div className="flex items-center gap-2 -mt-2">
                    {maxQty <= 0 ? (
                      <span className="flex items-center gap-1.5 text-sm text-error font-label font-semibold">
                        <span className="w-2 h-2 rounded-full bg-error inline-block" /> Out of Stock
                      </span>
                    ) : maxQty <= 5 ? (
                      <span className="flex items-center gap-1.5 text-sm text-amber-600 font-label font-semibold">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" /> Only {maxQty} left
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-label font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> In Stock
                      </span>
                    )}
                  </div>

                  {/* Size selector */}
                  {hasSizes && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-on-surface font-label uppercase tracking-widest">Size</p>
                        {selectedSize && (
                          <span className="text-xs text-primary font-semibold font-label bg-primary/8 px-2 py-0.5 rounded-full">
                            {selectedSize}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes!.map((s) => (
                          <button
                            key={s.size}
                            disabled={s.stock === 0}
                            onClick={() => { setSelectedSize(s.size); setQuantity(1) }}
                            className={`relative h-10 px-4 rounded-xl text-sm font-label font-semibold transition-all duration-150 border-2 ${
                              selectedSize === s.size
                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                : s.stock === 0
                                ? 'bg-transparent text-on-surface-variant/30 border-outline-variant/20 cursor-not-allowed line-through'
                                : 'bg-background text-on-surface border-outline-variant/40 hover:border-primary/60 hover:bg-primary/5'
                            }`}
                          >
                            {s.size}
                            {selectedSize === s.size && (
                              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                                <Check className="w-2 h-2 text-white" strokeWidth={3} />
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity stepper */}
                  <div>
                    <p className="text-xs font-bold text-on-surface font-label uppercase tracking-widest mb-3">Quantity</p>
                    <div className="inline-flex items-center bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/30">
                      <button
                        onClick={() => setQuantity((v) => Math.max(1, v - 1))}
                        className="w-11 h-11 flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface active:scale-90 duration-100"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-12 text-center text-base font-bold text-on-surface font-label select-none">{quantity}</span>
                      <button
                        onClick={() => setQuantity((v) => Math.min(maxQty, v + 1))}
                        disabled={quantity >= maxQty}
                        className="w-11 h-11 flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface disabled:opacity-30 active:scale-90 duration-100"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* CTA buttons — desktop inline */}
                  <div className="hidden sm:flex gap-3">
                    <button
                      onClick={handleAddToCart}
                      disabled={!canBuy}
                      className={`flex-1 h-13 py-3.5 rounded-2xl font-label font-bold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 border-2 ${
                        addedToCart
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-background text-on-surface border-outline-variant/50 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {addedToCart ? <><Check className="w-4 h-4" /> Added to Cart!</> : <><ShoppingCart className="w-4 h-4" /> Add to Cart</>}
                    </button>
                    <button
                      onClick={handleBuyNow}
                      disabled={!canBuy}
                      className="flex-1 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-label font-bold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 shadow-xl shadow-primary/30"
                    >
                      <Zap className="w-4 h-4" /> Buy Now
                    </button>
                  </div>

                  {/* Trust bar */}
                  <div className="hidden sm:grid grid-cols-3 gap-2 pt-1">
                    {[
                      { icon: <Truck className="w-3.5 h-3.5" />, text: 'Free above NPR 500' },
                      { icon: <RotateCcw className="w-3.5 h-3.5" />, text: '7-day returns' },
                      { icon: <Package className="w-3.5 h-3.5" />, text: 'Secure packaging' },
                    ].map((t) => (
                      <div key={t.text} className="flex items-center gap-1.5 text-on-surface-variant/60 bg-surface-container rounded-xl px-3 py-2">
                        {t.icon}
                        <span className="text-[11px] font-label">{t.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Accordions */}
                  <div className="pt-2 border-t border-outline-variant/15 space-y-0">
                    {[
                      { id: 'description' as const, label: 'Description', content: (
                        <p className="pb-4 text-sm text-on-surface-variant leading-relaxed font-body">
                          {product.description || 'No description available for this product.'}
                        </p>
                      )},
                      { id: 'shipping' as const, label: 'Shipping & Returns', content: (
                        <div className="pb-4 space-y-3">
                          {[
                            { icon: <Truck className="w-4 h-4 text-primary shrink-0" />, title: 'Standard Delivery', desc: '2–4 business days. Free on orders above NPR 500.' },
                            { icon: <Zap className="w-4 h-4 text-primary shrink-0" />,   title: 'Express (Valley)', desc: 'Same-day delivery in Kathmandu Valley.' },
                            { icon: <RotateCcw className="w-4 h-4 text-primary shrink-0" />, title: 'Easy Returns', desc: '7-day hassle-free returns on unused items.' },
                          ].map((item) => (
                            <div key={item.title} className="flex gap-3 py-2 border-b border-outline-variant/10 last:border-0">
                              {item.icon}
                              <div>
                                <p className="text-sm font-semibold text-on-surface font-label">{item.title}</p>
                                <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )},
                    ].map(({ id, label, content }) => (
                      <div key={id} className="border-b border-outline-variant/15">
                        <button
                          onClick={() => setActiveTab((t) => t === id ? null : id)}
                          className="w-full flex items-center justify-between py-3.5 text-[11px] font-bold text-on-surface font-label uppercase tracking-widest"
                        >
                          {label}
                          <ChevronDown className={`w-4 h-4 text-on-surface-variant/50 transition-transform duration-200 ${activeTab === id ? 'rotate-180' : ''}`} />
                        </button>
                        {activeTab === id && content}
                      </div>
                    ))}

                    {/* Reviews accordion */}
                    <div className="border-b border-outline-variant/15">
                      <button
                        onClick={() => setActiveTab((t) => t === 'reviews' ? null : 'reviews')}
                        className="w-full flex items-center justify-between py-3.5 text-[11px] font-bold text-on-surface font-label uppercase tracking-widest"
                      >
                        Reviews {reviewCount > 0 && <span className="text-primary ml-1">({reviewCount})</span>}
                        <ChevronDown className={`w-4 h-4 text-on-surface-variant/50 transition-transform duration-200 ${activeTab === 'reviews' ? 'rotate-180' : ''}`} />
                      </button>
                      {activeTab === 'reviews' && (
                        <div className="pb-4 space-y-4">
                          {reviewCount > 0 && (
                            <div className="flex gap-5 p-4 bg-surface-container rounded-2xl">
                              <div className="text-center shrink-0">
                                <p className="text-4xl font-bold text-on-surface font-headline">{avgRating.toFixed(1)}</p>
                                <Stars rating={avgRating} />
                                <p className="text-[11px] text-on-surface-variant mt-1 font-label">{reviewCount} reviews</p>
                              </div>
                              <div className="flex-1 space-y-1.5 justify-center flex flex-col">
                                {[5,4,3,2,1].map((s) => <RatingBar key={s} star={s} count={ratingDist[s] ?? 0} total={reviewCount} />)}
                              </div>
                            </div>
                          )}

                          {hasPurchased ? (
                            <div className="border border-outline-variant/30 rounded-2xl p-4 space-y-3">
                              <p className="text-xs font-bold text-on-surface font-label uppercase tracking-wider">Write a Review</p>
                              <input className="w-full h-10 px-3 rounded-xl border border-outline-variant/40 bg-background text-sm text-on-surface font-body placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 transition-colors" placeholder="Your name" value={reviewForm.name} onChange={(e) => setReviewForm((f) => ({ ...f, name: e.target.value }))} />
                              <div className="flex items-center gap-1">
                                {[1,2,3,4,5].map((s) => (
                                  <button key={s} type="button" onClick={() => setReviewForm((f) => ({ ...f, rating: s }))}>
                                    <Star className={`w-6 h-6 transition-all ${s <= reviewForm.rating ? 'fill-amber-400 text-amber-400 scale-110' : 'fill-stone-200 text-stone-200'}`} />
                                  </button>
                                ))}
                              </div>
                              <textarea className="w-full h-20 px-3 py-2.5 rounded-xl border border-outline-variant/40 bg-background text-sm text-on-surface font-body placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 transition-colors resize-none" placeholder="Share your experience…" value={reviewForm.comment} onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))} />
                              <button onClick={handleSubmitReview} disabled={submittingReview} className="h-10 px-6 bg-primary text-white text-sm font-label font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 active:scale-95">
                                {submittingReview ? 'Submitting…' : 'Submit Review'}
                              </button>
                            </div>
                          ) : (
                            <div className="border border-outline-variant/20 rounded-2xl p-4 text-center bg-surface-container/50">
                              <p className="text-sm font-semibold text-on-surface font-label mb-1">Verified purchases only</p>
                              <p className="text-xs text-on-surface-variant font-body">Buy this product to leave a review.</p>
                            </div>
                          )}

                          {reviews.length === 0 && <p className="text-sm text-on-surface-variant/60 font-body py-1">No reviews yet — be the first!</p>}

                          <div className="space-y-4">
                            {reviews.map((r) => (
                              <div key={r.id} className="border-b border-outline-variant/15 pb-4 last:border-0">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary font-label">
                                      {r.customer_name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-semibold text-on-surface font-label">{r.customer_name.split(' ')[0]}</span>
                                  </div>
                                  <span className="text-xs text-on-surface-variant/50 font-body">
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
                  </div>

                  {/* You may also like */}
                  {related.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[11px] font-bold text-on-surface font-label uppercase tracking-widest mb-3">You May Also Like</p>
                      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                        {related.map((r) => (
                          <button key={r.id} onClick={() => onSelectProduct?.(r)} className="shrink-0 w-28 text-left group">
                            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/20 mb-2 group-hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                              {r.images?.[0]?.url ? (
                                <Image src={r.images[0].url} alt={r.name} width={112} height={150} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl font-headline text-on-surface-variant/20">{r.name.charAt(0)}</div>
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

          {/* ════ STICKY CTA — mobile only ════ */}
          <div className="sm:hidden shrink-0 border-t border-outline-variant/20 bg-background/95 backdrop-blur-md px-4 py-3 flex gap-3 safe-area-inset-bottom">
            <button
              onClick={handleAddToCart}
              disabled={!canBuy}
              className={`flex-1 h-12 rounded-2xl font-label font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-40 flex items-center justify-center gap-2 border-2 ${
                addedToCart
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'border-primary text-primary bg-primary/5 hover:bg-primary/10'
              }`}
            >
              {addedToCart ? <><Check className="w-4 h-4" /> Added!</> : <><ShoppingCart className="w-4 h-4" /> Add to Cart</>}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!canBuy}
              className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white rounded-2xl font-label font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-40 flex items-center justify-center gap-2 shadow-xl shadow-primary/30"
            >
              <Zap className="w-4 h-4" /> Buy Now
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
