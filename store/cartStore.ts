'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem } from '@/lib/types'
import { supabase } from '@/lib/supabase'

interface CartState {
  items: CartItem[]
  sessionId: string | null
  bouncing: boolean
  lastAdded: CartItem | null
  addItem: (item: CartItem) => void
  removeItem: (productId: string, size: string) => void
  updateQuantity: (productId: string, size: string, qty: number) => void
  clearCart: () => void
  getTotal: () => number
  getSubtotal: () => number
  getCount: () => number
  syncToSupabase: () => Promise<void>
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      sessionId: null,
      bouncing: false,
      lastAdded: null,

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.product_id === newItem.product_id && i.size === newItem.size
          )
          const items = existing
            ? state.items.map((i) =>
                i.product_id === newItem.product_id && i.size === newItem.size
                  ? { ...i, quantity: Math.min(i.quantity + newItem.quantity, i.max_stock) }
                  : i
              )
            : [...state.items, newItem]
          return { items, bouncing: true, lastAdded: newItem }
        })
        setTimeout(() => set({ bouncing: false }), 500)
        get().syncToSupabase()
      },

      removeItem: (productId, size) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.product_id === productId && i.size === size)
          ),
        }))
        get().syncToSupabase()
      },

      updateQuantity: (productId, size, qty) => {
        if (qty < 1) { get().removeItem(productId, size); return }
        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === productId && i.size === size
              ? { ...i, quantity: Math.min(qty, i.max_stock) }
              : i
          ),
        }))
        get().syncToSupabase()
      },

      clearCart: () => {
        set({ items: [] })
        get().syncToSupabase()
      },

      getSubtotal: () =>
        get().items.reduce((sum, i) => {
          const price = i.sale_price ?? i.price
          return sum + price * i.quantity
        }, 0),

      getTotal: () => get().getSubtotal(),

      getCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      syncToSupabase: async () => {
        const { items, sessionId } = get()
        if (!sessionId) {
          setTimeout(() => get().syncToSupabase(), 500)
          return
        }
        await supabase.from('carts').upsert(
          { session_id: sessionId, items: JSON.stringify(items), updated_at: new Date().toISOString() },
          { onConflict: 'session_id' }
        )
      },
    }),
    {
      name: 'goreto-cart',
      skipHydration: true,
    }
  )
)
