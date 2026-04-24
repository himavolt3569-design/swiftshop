'use client'

import Image from 'next/image'
import { Heart, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
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

  // Mock rating for visual parity with the reference image
  const mockRating = 4.7;
  const mockReviews = 35;

  return (
    <div
      className="group cursor-pointer bg-white border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-200 relative"
      onClick={() => onClick(product)}
    >
      {/* Image container */}
      <div className="relative w-full aspect-[4/5] bg-white p-4 flex items-center justify-center">
        {/* Top Badges */}
        <div className="absolute top-0 left-0 z-10 flex flex-col">
          {product.tags?.includes('best_seller') && (
           <span className="bg-[#117C46] text-white text-[10px] px-2 py-0.5 font-semibold rounded-br mb-1">
             Best Seller
           </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={toggleWish}
          aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2 right-2 z-10 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.15)] hover:bg-gray-50 transition-all duration-200"
        >
          <Heart className={`w-[14px] h-[14px] transition-colors ${isWished ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-gray-600'}`} strokeWidth={1.5} />
        </button>

        {/* Product image */}
        {firstImage ? (
          <div className="relative w-full h-full mix-blend-multiply">
            <Image
              src={firstImage}
              alt={product.name}
              fill
              className="object-contain p-2"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-3xl font-display text-gray-300">
            {product.name.charAt(0)}
          </div>
        )}

        {/* Add to Cart button (Circular Plus) */}
        <button
          onClick={handleAddToCart}
          disabled={defaultStock <= 0}
          className="absolute -bottom-3 right-3 z-20 w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:shadow-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Plus className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
        </button>
      </div>

      {/* Info Section */}
      <div className="px-3 pb-3 pt-4 flex flex-col flex-1 border-t border-gray-50 relative">
        {/* Title */}
        <h3 className="text-[13px] text-gray-800 leading-[1.3] line-clamp-2 font-body mb-1">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center text-[#117C46] bg-green-50 px-1 py-[1px] rounded-sm">
            <span className="text-[10px]">★</span>
            <span className="text-[11px] font-bold ml-0.5">{mockRating}</span>
          </div>
          <span className="text-[11px] text-gray-400">({mockReviews})</span>
        </div>

        {/* Price Section */}
        <div className="flex items-baseline gap-1.5 flex-wrap mb-1 mt-auto">
          <span className="text-[15px] font-bold text-[#1A1A1A] whitespace-nowrap leading-none">
            <span className="text-[12px] font-medium mr-0.5">NPR</span>
            {displayPrice.toLocaleString()}
          </span>
          {product.sale_price && (
            <>
              <span className="text-[12px] text-gray-400 line-through leading-none decoration-gray-300">
                {product.price.toLocaleString()}
              </span>
              <span className="text-[12px] text-[#117C46] font-bold leading-none ml-1">
                {discount}% Off
              </span>
            </>
          )}
        </div>

        {/* Subtitle / Unit info */}
        <p className="text-[11px] text-gray-400 mb-2 truncate">
          {product.category?.name ?? 'Standard Size'}
        </p>

        {/* Badges / Delivery Info */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="text-blue-500 font-bold">🚚</span> Free Delivery
          </div>
          {product.tags?.includes('express') && (
            <div className="bg-[#FFED00] text-black text-[10px] font-bold italic px-2 py-0.5 rounded-[2px] flex items-center leading-none tracking-tight">
              express
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
