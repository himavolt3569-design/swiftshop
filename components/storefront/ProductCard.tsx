'use client'

import Image from 'next/image'
import { Heart, ShoppingCart } from 'lucide-react'
import { Product } from '@/lib/types'
import { useCartStore }     from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useSessionStore }  from '@/store/sessionStore'

interface ProductCardProps {
  product: Product
  onClick: (product: Product) => void
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const addItem       = useCartStore((s) => s.addItem)
  const { addItem: addWish, removeItem: removeWish, hasItem } = useWishlistStore()
  const addToast      = useSessionStore((s) => s.addToast)
  const isWished      = hasItem(product.id)
  const firstImage    = product.images?.[0]?.url ?? ''
  const defaultSize   = product.sizes?.[0]?.size ?? 'OS'
  const defaultStock  = product.sizes?.[0]?.stock ?? product.stock ?? 0
  const displayPrice  = product.sale_price ?? product.price
  const discount      = product.sale_price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : null

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (defaultStock <= 0) return
    addItem({
      product_id:    product.id,
      product_name:  product.name,
      product_image: firstImage,
      price:         product.price,
      sale_price:    product.sale_price,
      size:          defaultSize,
      quantity:      1,
      max_stock:     defaultStock,
    })
    addToast('success', `${product.name} added to cart`)
  }

  const toggleWish = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isWished) {
      removeWish(product.id)
      addToast('info', 'Removed from wishlist')
    } else {
      addWish({ product_id: product.id, product_name: product.name, product_image: firstImage, price: product.price, sale_price: product.sale_price })
      addToast('success', 'Added to wishlist')
    }
  }

  return (
    <div className="group cursor-pointer" onClick={() => onClick(product)}>
      {/* Image container */}
      <div className="aspect-[3/4] bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden relative transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl">
        {/* Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {product.stock <= 0 ? (
            <span className="bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full font-label backdrop-blur-sm">
              Sold Out
            </span>
          ) : discount ? (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-label shadow-sm">
              -{discount}%
            </span>
          ) : null}
        </div>

        {/* Wishlist */}
        <button
          onClick={toggleWish}
          aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-all hover:scale-110 active:scale-95"
        >
          <Heart className={`w-4 h-4 transition-all ${isWished ? 'fill-red-500 text-red-500' : 'text-on-surface-variant'}`} />
        </button>

        {/* Product image */}
        {firstImage ? (
          <Image
            src={firstImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container text-5xl font-headline text-on-surface-variant/20">
            {product.name.charAt(0)}
          </div>
        )}

        {/* Quick add — slides up on hover */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <button
            onClick={handleAddToCart}
            disabled={defaultStock <= 0}
            className="w-full py-3 bg-primary/95 backdrop-blur-sm text-white text-xs font-label font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {defaultStock <= 0 ? 'Out of Stock' : 'Quick Add'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="mt-2.5 px-0.5">
        {product.category?.name && (
          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/50 mb-0.5 font-label truncate">
            {product.category.name}
          </p>
        )}
        <h3 className="text-[13px] md:text-sm font-semibold text-on-surface leading-snug line-clamp-1 font-body mb-1.5">
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-sm md:text-[15px] font-bold text-primary whitespace-nowrap">
              NPR {displayPrice.toLocaleString()}
            </span>
            {product.sale_price && (
              <span className="text-[11px] text-on-surface-variant/40 line-through hidden sm:inline">
                {product.price.toLocaleString()}
              </span>
            )}
          </div>
          {defaultStock > 0 && defaultStock < 5 && (
            <span className="text-[10px] text-amber-600 font-label whitespace-nowrap shrink-0">
              {defaultStock} left
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
