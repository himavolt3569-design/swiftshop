'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingCart } from 'lucide-react'

interface AddToCartPopupProps {
  item: {
    name: string
    image?: string
    price: number
    category_id?: string | null
    category_name?: string | null
  } | null
  onDismiss: () => void
  onViewCart: () => void
  onContinueShopping: (categoryId: string | null) => void
}

export function AddToCartPopup({ item, onDismiss, onViewCart, onContinueShopping }: AddToCartPopupProps) {
  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!item) return
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [item, onDismiss])

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[90] md:hidden"
        >
          <div className="m-3 mb-4 bg-background border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <div className="w-14 h-16 rounded-xl overflow-hidden bg-surface-container shrink-0 border border-outline-variant/20">
                {item.image ? (
                  <Image src={item.image} alt={item.name} width={56} height={64} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl text-on-surface-variant/30">
                    {item.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-success font-label font-semibold uppercase tracking-wide mb-0.5">Added to cart</p>
                <p className="text-sm font-bold text-on-surface font-body line-clamp-1">{item.name}</p>
                <p className="text-xs text-primary font-semibold mt-0.5">NPR {item.price.toLocaleString()}</p>
              </div>
              <button
                onClick={onDismiss}
                className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center shrink-0"
              >
                <X className="w-3.5 h-3.5 text-on-surface-variant" />
              </button>
            </div>
            <div className="flex gap-2 px-4 pb-4">
              <button
                onClick={() => { onDismiss(); onContinueShopping(item?.category_id ?? null) }}
                className="flex-1 h-10 border border-outline-variant/40 text-on-surface text-sm font-label font-semibold rounded-xl hover:bg-surface-container transition-colors"
              >
                {item?.category_name ? `See ${item.category_name}` : 'Continue Shopping'}
              </button>
              <button
                onClick={() => { onDismiss(); onViewCart() }}
                className="flex-1 h-10 bg-primary text-white text-sm font-label font-semibold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5" /> View Cart
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
