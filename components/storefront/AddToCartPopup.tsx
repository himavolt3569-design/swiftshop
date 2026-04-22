'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingCart, Check } from 'lucide-react'

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
  useEffect(() => {
    if (!item) return
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [item, onDismiss])

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="fixed bottom-0 left-0 right-0 z-[90] md:hidden"
        >
          <div className="m-3 mb-4 glass border border-outline-variant/20 rounded-2xl shadow-depth-lg overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <div className="w-14 h-16 rounded-xl overflow-hidden bg-surface-container shrink-0 border border-outline-variant/15 shadow-float">
                {item.image ? (
                  <Image src={item.image} alt={item.name} width={56} height={64} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl text-on-surface-variant/25">
                    {item.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
                    className="w-4 h-4 rounded-full bg-accent/15 flex items-center justify-center"
                  >
                    <Check className="w-2.5 h-2.5 text-accent" />
                  </motion.div>
                  <p className="text-[11px] text-accent font-display font-bold uppercase tracking-wide">Added to cart</p>
                </div>
                <p className="text-sm font-bold text-on-surface font-body line-clamp-1">{item.name}</p>
                <p className="text-xs text-primary font-semibold mt-0.5">NPR {item.price.toLocaleString()}</p>
              </div>
              <button
                onClick={onDismiss}
                className="w-7 h-7 rounded-full bg-surface-container/60 flex items-center justify-center shrink-0"
              >
                <X className="w-3.5 h-3.5 text-on-surface-variant" />
              </button>
            </div>
            <div className="flex gap-2 px-4 pb-4">
              <button
                onClick={() => { onDismiss(); onContinueShopping(item?.category_id ?? null) }}
                className="flex-1 h-10 btn-glass text-on-surface text-sm rounded-xl"
              >
                {item?.category_name ? `See ${item.category_name}` : 'Continue Shopping'}
              </button>
              <motion.button
                onClick={() => { onDismiss(); onViewCart() }}
                className="flex-1 h-10 btn-gradient text-white text-sm rounded-xl flex items-center justify-center gap-1.5"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ShoppingCart className="w-3.5 h-3.5" /> View Cart
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
