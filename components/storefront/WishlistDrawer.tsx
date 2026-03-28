'use client'

import { X, Heart, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCartStore }     from '@/store/cartStore'
import { useSessionStore }  from '@/store/sessionStore'

interface WishlistDrawerProps {
  open: boolean
  onClose: () => void
}

export function WishlistDrawer({ open, onClose }: WishlistDrawerProps) {
  const { items, removeItem } = useWishlistStore()
  const addToCart = useCartStore((s) => s.addItem)
  const addToast  = useSessionStore((s) => s.addToast)

  if (!open) return null

  const handleAddToCart = (item: typeof items[number]) => {
    addToCart({
      product_id:    item.product_id,
      product_name:  item.product_name,
      product_image: item.product_image,
      price:         item.price,
      sale_price:    item.sale_price,
      size:          'OS',
      quantity:      1,
      max_stock:     99,
    })
    addToast('success', `${item.product_name} added to cart`)
  }

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-on-background/40 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Wishlist"
        className="fixed top-0 right-0 bottom-0 z-[80] w-full md:w-[420px] bg-background shadow-[−20px_0_40px_rgba(30,27,24,0.1)] animate-slide-in-right flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <h2 className="font-headline text-lg font-bold text-on-surface">Your Wishlist</h2>
          <button onClick={onClose} aria-label="Close wishlist" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors">
            <X className="w-4 h-4 text-on-surface" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="py-24 text-center">
              <Heart className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
              <p className="text-on-surface-variant font-body text-sm">Your wishlist is empty.</p>
              <button onClick={onClose} className="mt-4 text-primary text-sm font-label hover:underline">Continue Shopping</button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product_id} className="flex gap-4">
                <div className="w-16 h-20 bg-surface-container rounded-lg overflow-hidden shrink-0">
                  {item.product_image ? (
                    <Image src={item.product_image} alt={item.product_name} width={64} height={80} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-headline text-on-surface-variant/30">{item.product_name.charAt(0)}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface font-body line-clamp-2">{item.product_name}</p>
                  <p className="text-sm font-semibold text-primary mt-1">
                    NPR {((item.sale_price ?? item.price)).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="flex items-center gap-1.5 h-7 px-3 bg-primary text-white text-[11px] font-label font-semibold rounded-lg hover:bg-primary-container transition-all active:scale-95"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => { removeItem(item.product_id); addToast('info', 'Removed from wishlist') }}
                      className="text-[11px] text-on-surface-variant hover:text-error font-label transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
