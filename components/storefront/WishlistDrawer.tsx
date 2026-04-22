'use client'

import { X, Heart, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
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
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] bg-on-background/40 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            role="dialog"
            aria-modal="true"
            aria-label="Wishlist"
            className="fixed top-0 right-0 bottom-0 z-[80] w-full md:w-[420px] glass shadow-depth-lg flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/15">
              <h2 className="font-display text-lg font-bold text-on-surface">Your Wishlist</h2>
              <button onClick={onClose} aria-label="Close wishlist" className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-container/60 transition-colors active:scale-95">
                <X className="w-4 h-4 text-on-surface" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-7 h-7 text-on-surface-variant/25" />
                  </div>
                  <p className="text-on-surface-variant/60 font-body text-sm">Your wishlist is empty.</p>
                  <button onClick={onClose} className="mt-4 text-primary text-sm font-display font-semibold hover:underline">Continue Shopping</button>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map((item, i) => (
                    <motion.div
                      key={item.product_id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.05 }}
                      className="flex gap-4"
                    >
                      <div className="w-16 h-20 bg-surface-container rounded-xl overflow-hidden shrink-0 shadow-float">
                        {item.product_image ? (
                          <Image src={item.product_image} alt={item.product_name} width={64} height={80} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-display text-on-surface-variant/25">{item.product_name.charAt(0)}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface font-body line-clamp-2">{item.product_name}</p>
                        <p className="text-sm font-bold text-primary mt-1">
                          NPR {((item.sale_price ?? item.price)).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2 mt-2.5">
                          <motion.button
                            onClick={() => handleAddToCart(item)}
                            className="flex items-center gap-1.5 h-8 px-3.5 btn-gradient text-white text-[11px] font-label font-semibold rounded-xl"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Add to Cart
                          </motion.button>
                          <button
                            onClick={() => { removeItem(item.product_id); addToast('info', 'Removed from wishlist') }}
                            className="text-[11px] text-on-surface-variant/50 hover:text-error font-label transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
