'use client'

import Image from 'next/image'
import { Heart, ShoppingCart } from 'lucide-react'
import { motion } from 'framer-motion'
import { Product } from '@/lib/types'
import { useCartStore }     from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useSessionStore }  from '@/store/sessionStore'
import { useRef, useState } from 'react'

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

  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: y * -8, y: x * 8 })
  }

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 })

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
      category_id:   product.category_id ?? null,
      category_name: product.category?.name ?? null,
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
      ref={cardRef}
      className="group cursor-pointer"
      onClick={() => onClick(product)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '800px',
      }}
    >
      {/* Image container — 3D tilt */}
      <motion.div
        className="aspect-[3/4] bg-surface-container-lowest border border-outline-variant/15 rounded-2xl overflow-hidden relative shadow-float"
        animate={{
          rotateX: tilt.x,
          rotateY: tilt.y,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(26, 23, 20, 0.12)' }}
      >
        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
          {product.stock <= 0 ? (
            <span className="bg-on-surface/80 backdrop-blur-sm text-white text-[10px] px-2.5 py-0.5 rounded-full font-label font-semibold">
              Sold Out
            </span>
          ) : discount ? (
            <span className="bg-accent-warm/90 backdrop-blur-sm text-on-accent-warm text-[10px] font-bold px-2.5 py-0.5 rounded-full font-label shadow-sm">
              -{discount}%
            </span>
          ) : null}
        </div>

        {/* Wishlist */}
        <motion.button
          onClick={toggleWish}
          aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2.5 right-2.5 z-10 w-9 h-9 bg-white/70 backdrop-blur-lg rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-all duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Heart className={`w-4 h-4 transition-all duration-300 ${isWished ? 'fill-red-500 text-red-500 scale-110' : 'text-on-surface-variant'}`} />
        </motion.button>

        {/* Product image */}
        {firstImage ? (
          <Image
            src={firstImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-108"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container text-5xl font-display text-on-surface-variant/15">
            {product.name.charAt(0)}
          </div>
        )}

        {/* Quick add — slides up on hover (glassmorphic) */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-spring">
          <button
            onClick={handleAddToCart}
            disabled={defaultStock <= 0}
            className="w-full py-3.5 bg-primary/90 backdrop-blur-md text-white text-xs font-label font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-primary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {defaultStock <= 0 ? 'Out of Stock' : 'Quick Add'}
          </button>
        </div>

        {/* Hover shine sweep */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-white/0 via-white/[0.05] to-white/0 pointer-events-none" />
      </motion.div>

      {/* Info */}
      <div className="mt-3 px-0.5">
        {product.category?.name && (
          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/40 mb-0.5 font-label truncate">
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
              <span className="text-[11px] text-on-surface-variant/35 line-through hidden sm:inline">
                {product.price.toLocaleString()}
              </span>
            )}
          </div>
          {defaultStock > 0 && defaultStock < 5 && (
            <span className="flex items-center gap-1 text-[10px] text-accent-warm font-label whitespace-nowrap shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-warm animate-breathe" />
              {defaultStock} left
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
