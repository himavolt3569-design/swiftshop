'use client'

import { useCartStore } from '@/store/cartStore'
import { ShoppingBag } from 'lucide-react'

interface MobileCheckoutBarProps {
  onCheckout: () => void
}

export function MobileCheckoutBar({ onCheckout }: MobileCheckoutBarProps) {
  const count    = useCartStore((s) => s.getCount())
  const subtotal = useCartStore((s) => s.getSubtotal())

  if (count === 0) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[60] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-3 mb-3 bg-primary rounded-2xl shadow-2xl overflow-hidden">
        <button
          onClick={onCheckout}
          className="w-full flex items-center justify-between px-5 py-4 text-white active:opacity-90 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-bold">
              {count}
            </div>
            <span className="text-sm font-bold font-label">Proceed to Checkout</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold font-label">NPR {subtotal.toLocaleString()}</span>
            <ShoppingBag className="w-4 h-4 opacity-80" />
          </div>
        </button>
      </div>
    </div>
  )
}
