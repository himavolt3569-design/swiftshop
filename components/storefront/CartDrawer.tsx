'use client'

import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import { useCartStore } from '@/store/cartStore'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
  onCheckout?: () => void
}

export function CartDrawer({ open, onClose, onCheckout }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore()

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-on-background/40 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="fixed top-0 right-0 bottom-0 z-[80] w-full md:w-[420px] bg-background shadow-[−20px_0_40px_rgba(30,27,24,0.1)] animate-slide-in-right flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <h2 className="font-headline text-lg font-bold text-on-surface">Your Cart</h2>
          <button onClick={onClose} aria-label="Close cart" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors">
            <X className="w-4 h-4 text-on-surface" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="py-24 text-center">
              <ShoppingBag className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
              <p className="text-on-surface-variant font-body text-sm">Your cart is empty.</p>
              <button onClick={onClose} className="mt-4 text-primary text-sm font-label hover:underline">Continue Shopping</button>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.product_id}-${item.size}`} className="flex gap-4">
                <div className="w-16 h-20 bg-surface-container rounded-lg overflow-hidden shrink-0">
                  {item.product_image ? (
                    <Image src={item.product_image} alt={item.product_name} width={64} height={80} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-headline text-on-surface-variant/30">{item.product_name.charAt(0)}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface font-body line-clamp-2">{item.product_name}</p>
                  <p className="text-xs text-on-surface-variant font-label mt-0.5">Size: {item.size}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 border border-outline-variant rounded-lg">
                      <button onClick={() => updateQuantity(item.product_id, item.size, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-surface-container transition-colors" aria-label="Decrease"><Minus className="w-3 h-3" /></button>
                      <span className="text-sm w-6 text-center font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product_id, item.size, item.quantity + 1)} disabled={item.quantity >= item.max_stock} className="w-7 h-7 flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-40" aria-label="Increase"><Plus className="w-3 h-3" /></button>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      NPR {((item.sale_price ?? item.price) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
                <button onClick={() => removeItem(item.product_id, item.size)} aria-label="Remove item" className="text-on-surface-variant hover:text-error transition-colors mt-0.5">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-outline-variant/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-on-surface-variant font-label">Subtotal</span>
              <span className="text-base font-bold text-on-surface">NPR {getSubtotal().toLocaleString()}</span>
            </div>
            <button
              onClick={() => { onClose(); onCheckout?.() }}
              className="w-full h-12 bg-primary text-white font-headline font-semibold rounded-lg hover:bg-primary-container transition-all active:scale-[0.99]"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  )
}
