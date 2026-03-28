'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, Star, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'
import { Product, Review } from '@/lib/types'
import { supabase }         from '@/lib/supabase'
import { useCartStore }     from '@/store/cartStore'
import { useSessionStore }  from '@/store/sessionStore'
import { ReviewsList }      from './ReviewsList'

interface ProductDrawerProps {
  product: Product | null
  onClose: () => void
  onBuyNow?: () => void
}

export function ProductDrawer({ product, onClose, onBuyNow }: ProductDrawerProps) {
  const [activeImage, setActiveImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [avgRating, setAvgRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [related, setRelated] = useState<Product[]>([])
  const addItem    = useCartStore((s) => s.addItem)
  const addToast   = useSessionStore((s) => s.addToast)

  // Reset state on product change
  useEffect(() => {
    if (!product) return
    setActiveImage(0)
    setSelectedSize(product.sizes?.[0]?.size ?? null)
    setQuantity(1)
  }, [product?.id])

  useEffect(() => {
    if (!product) return

    const fetchMeta = async () => {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', product.id)
      if (reviews && reviews.length > 0) {
        setAvgRating(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)
        setReviewCount(reviews.length)
      }
      let { data: rel } = await supabase
        .from('products')
        .select('*, category:categories(name), images, sizes')
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .eq('is_active', true)
        .limit(4)
      // Fallback to random products if no related in same category
      if (!rel || rel.length === 0) {
        const { data: fallback } = await supabase
          .from('products')
          .select('*, category:categories(name), images, sizes')
          .neq('id', product.id)
          .eq('is_active', true)
          .limit(4)
        rel = fallback
      }
      setRelated((rel as Product[]) ?? [])
    }
    fetchMeta()
  }, [product?.id, product?.category_id])

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [handleEsc])

  if (!product) return null

  const selectedSizeObj = product.sizes?.find((s) => s.size === selectedSize)
  const maxQty          = selectedSizeObj?.stock ?? product.stock ?? 0
  const displayPrice    = product.sale_price ?? product.price
  const images          = product.images ?? []

  const handleAddToCart = () => {
    if (!selectedSize || maxQty <= 0) return
    addItem({
      product_id:    product.id,
      product_name:  product.name,
      product_image: images[0]?.url ?? '',
      price:         product.price,
      sale_price:    product.sale_price,
      size:          selectedSize,
      quantity,
      max_stock:     maxQty,
    })
    addToast('success', `${product.name} added to cart`)
  }

  const handleBuyNow = () => {
    handleAddToCart()
    onBuyNow?.()
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[70] bg-on-background/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="fixed top-0 right-0 bottom-0 z-[80] w-full md:w-[480px] bg-background shadow-[−20px_0_40px_rgba(30,27,24,0.1)] animate-slide-in-right overflow-y-auto"
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close product details"
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-surface-container-lowest rounded-full flex items-center justify-center hover:bg-surface-container shadow-float transition-colors"
        >
          <X className="w-4 h-4 text-on-surface" />
        </button>

        {/* Main image */}
        <div className="relative aspect-[4/3] bg-surface-container overflow-hidden">
          {images[activeImage]?.url ? (
            <Image
              src={images[activeImage].url}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl font-headline text-on-surface-variant/20">
              {product.name.charAt(0)}
            </div>
          )}

          {images.length > 1 && (
            <>
              <button onClick={() => setActiveImage((v) => (v - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 rounded-full flex items-center justify-center" aria-label="Previous image"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setActiveImage((v) => (v + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 rounded-full flex items-center justify-center" aria-label="Next image"><ChevronRight className="w-4 h-4" /></button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 px-6 py-3 bg-surface-container-low overflow-x-auto no-scrollbar">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(i)}
                className={`w-14 h-14 shrink-0 rounded overflow-hidden border-2 transition-colors ${i === activeImage ? 'border-primary' : 'border-transparent'}`}
              >
                <Image src={img.url} alt={`View ${i + 1}`} width={56} height={56} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-6 space-y-5">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-on-surface-variant mb-1 font-label">{product.category?.name}</p>
            <h2 className="font-headline text-2xl font-bold text-on-surface leading-tight mb-2">{product.name}</h2>

            {/* Rating */}
            {reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-outline-variant'}`} />
                  ))}
                </div>
                <span className="text-sm font-medium text-on-surface">{avgRating.toFixed(1)}</span>
                <a href="#reviews" className="text-sm text-primary hover:underline">({reviewCount} reviews)</a>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-semibold text-primary">NPR {displayPrice.toLocaleString()}</span>
              {product.sale_price && (
                <span className="text-[13px] text-on-surface-variant line-through">NPR {product.price.toLocaleString()}</span>
              )}
            </div>
          </div>

          {/* Size selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-on-surface mb-2 font-label uppercase tracking-wide">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s.size}
                    disabled={s.stock === 0}
                    onClick={() => { setSelectedSize(s.size); setQuantity(1) }}
                    className={`px-3 py-1.5 rounded-md text-sm font-label font-medium transition-all ${
                      selectedSize === s.size
                        ? 'bg-primary text-white'
                        : s.stock === 0
                        ? 'bg-surface-container text-on-surface-variant line-through cursor-not-allowed'
                        : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <p className="text-xs font-semibold text-on-surface mb-2 font-label uppercase tracking-wide">Quantity</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((v) => Math.max(1, v - 1))}
                className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-8 text-center text-sm font-semibold text-on-surface">{quantity}</span>
              <button
                onClick={() => setQuantity((v) => Math.min(maxQty, v + 1))}
                disabled={quantity >= maxQty}
                className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <button
              onClick={handleAddToCart}
              disabled={!selectedSize || maxQty <= 0}
              className="w-full h-12 bg-primary text-white font-label font-semibold rounded-lg hover:bg-primary-container transition-all active:scale-[0.99] disabled:opacity-40"
            >
              Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!selectedSize || maxQty <= 0}
              className="w-full h-12 bg-on-background text-white font-label font-semibold rounded-lg hover:opacity-90 transition-all active:scale-[0.99] disabled:opacity-40"
            >
              Buy Now
            </button>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-on-surface mb-2 font-label uppercase tracking-wide">Description</p>
            <p className="text-sm text-on-surface-variant leading-relaxed font-body">{product.description}</p>
          </div>

          {/* Reviews */}
          <div id="reviews">
            <ReviewsList productId={product.id} />
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-on-surface mb-3 font-label uppercase tracking-wide">Related Products</p>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {related.map((r) => (
                  <div key={r.id} className="shrink-0 w-32">
                    <div className="aspect-[3/4] bg-surface-container rounded-lg overflow-hidden mb-2">
                      {r.images?.[0]?.url ? (
                        <Image src={r.images[0].url} alt={r.name} width={128} height={170} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-headline text-on-surface-variant/30">{r.name.charAt(0)}</div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-on-surface line-clamp-2 font-body">{r.name}</p>
                    <p className="text-xs text-primary font-semibold">NPR {(r.sale_price ?? r.price).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
