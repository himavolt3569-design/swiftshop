'use client'

import { useCartStore } from '@/store/cartStore'
import { ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface MobileCheckoutBarProps {
  onCheckout: () => void
}

export function MobileCheckoutBar({ onCheckout }: MobileCheckoutBarProps) {
  const count    = useCartStore((s) => s.getCount())
  const subtotal = useCartStore((s) => s.getSubtotal())

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed bottom-0 left-0 right-0 z-[60] md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="mx-3 mb-3 rounded-2xl shadow-depth-lg overflow-hidden">
            <motion.button
              onClick={onCheckout}
              className="w-full flex items-center justify-between px-5 py-4 btn-gradient text-white"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-[11px] font-bold">
                  {count}
                </div>
                <span className="text-sm font-bold font-display">Proceed to Checkout</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold font-display">NPR {subtotal.toLocaleString()}</span>
                <ShoppingBag className="w-4 h-4 opacity-70" />
              </div>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
