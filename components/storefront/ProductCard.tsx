'use client'

import Image from 'next/image'
import { Heart } from 'lucide-react'
import { Product } from '@/lib/types'
import { useCartStore }     from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useSessionStore }  from '@/store/sessionStore'

interface ProductCardProps {
  product: Product
  onClick: (product: Product) => void
}

function StockDot({ stock }: { stock: number }) {
  if (stock <= 0)
    return <span className="flex items-center gap-1.5 text-[11px] text-error font-label"><span className="w-1.5 h-1.5 rounded-full bg-error inline-block" />Out of Stock</span>
  if (stock < 5)
    return <span className="flex items-center gap-1.5 text-[11px] text-amber-600 font-label"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />Low Stock</span>
  return <span className="flex items-center gap-1.5 text-[11px] text-success font-label"><span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />In Stock</span>
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
    <div
      className="group cursor-pointer"
      onClick={() => onClick(product)}
    >
      {/* Image */}
      <div className="aspect-[3/4] bg-surface-container-lowest border border-outline-variant/40 rounded-lg overflow-hidden relative transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lift">
        {product.stock <= 0 ? (
          <span className="absolute top-2 left-2 z-10 bg-inverse-surface text-inverse-on-surface text-[10px] px-1.5 py-0.5 rounded font-label">
            Out of Stock
          </span>
        ) : product.sale_price ? (
          <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded font-label">
            -{Math.round(((product.price - product.sale_price) / product.price) * 100)}%
          </span>
        ) : null}

        {firstImage ? (
          <Image
            src={firstImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container text-4xl font-headline text-on-surface-variant/30">
            {product.name.charAt(0)}
          </div>
        )}

        {/* Wishlist btn */}
        <button
          onClick={toggleWish}
          aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-float hover:bg-background transition-colors"
        >
          <Heart className={`w-4 h-4 transition-colors ${isWished ? 'fill-primary text-primary' : 'text-on-surface-variant'}`} />
        </button>
      </div>

      {/* Info */}
      <div className="mt-4 px-0.5">
        <p className="text-[10px] uppercase tracking-wide text-on-surface-variant mb-1 font-label">
          {product.category?.name ?? ''}
        </p>
        <h3 className="text-[13px] font-semibold text-on-surface leading-snug line-clamp-1 font-body mb-1">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-base font-semibold text-primary">
            NPR {displayPrice.toLocaleString()}
          </span>
          {product.sale_price && (
            <span className="text-[13px] text-on-surface-variant line-through">
              NPR {product.price.toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <StockDot stock={product.stock} />
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="h-8 px-3 bg-primary text-white text-[11px] font-label font-semibold rounded-lg hover:bg-primary-container transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}
