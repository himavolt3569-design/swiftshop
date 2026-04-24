'use client'

import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { useCartStore } from '@/store/cartStore'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
  onCheckout?: () => void
}

export function CartDrawer({ open, onClose, onCheckout }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore()

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [open])

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
            aria-label="Shopping cart"
            className="fixed top-0 right-0 bottom-0 z-[80] w-full md:w-[420px] glass shadow-depth-lg flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/15">
              <h2 className="font-display text-lg font-bold text-on-surface">Your Cart</h2>
              <button onClick={onClose} aria-label="Close cart" className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-container/60 transition-colors active:scale-95">
                <X className="w-4 h-4 text-on-surface" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-7 h-7 text-on-surface-variant/25" />
                  </div>
                  <p className="text-on-surface-variant/60 font-body text-sm">Your cart is empty.</p>
                  <button onClick={onClose} className="mt-4 text-primary text-sm font-display font-semibold hover:underline">Continue Shopping</button>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map((item, i) => (
                    <motion.div
                      key={`${item.product_id}-${item.size}`}
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
                        <p className="text-xs text-on-surface-variant/50 font-label mt-0.5">Size: {item.size}</p>
                        <div className="flex items-center justify-between mt-2.5">
                          <div className="flex items-center gap-0 border border-outline-variant/25 rounded-xl overflow-hidden">
                            <button onClick={() => updateQuantity(item.product_id, item.size, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-surface-container transition-colors" aria-label="Decrease"><Minus className="w-3 h-3" /></button>
                            <span className="text-sm w-7 text-center font-semibold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product_id, item.size, item.quantity + 1)} disabled={item.quantity >= item.max_stock} className="w-8 h-8 flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-30" aria-label="Increase"><Plus className="w-3 h-3" /></button>
                          </div>
                          <span className="text-sm font-bold text-primary">
                            NPR {((item.sale_price ?? item.price) * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => removeItem(item.product_id, item.size)} aria-label="Remove item" className="text-on-surface-variant/40 hover:text-error transition-colors mt-0.5 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-outline-variant/15 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant/60 font-label">Subtotal</span>
                  <span className="text-base font-bold text-on-surface">NPR {getSubtotal().toLocaleString()}</span>
                </div>
                <motion.button
                  onClick={() => { onClose(); onCheckout?.() }}
                  className="w-full h-13 btn-gradient text-white text-sm"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Proceed to Checkout
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
