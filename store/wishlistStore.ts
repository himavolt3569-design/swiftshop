"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WishlistItem } from "@/lib/types";
import { supabase } from "@/lib/supabase";

interface WishlistState {
  items: WishlistItem[];
  sessionId: string | null;
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  hasItem: (productId: string) => boolean;
  getCount: () => number;
  syncToSupabase: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      sessionId: null,

      addItem: (item) => {
        if (get().hasItem(item.product_id)) return;
        set((state) => ({ items: [...state.items, item] }));
        get().syncToSupabase();
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product_id !== productId),
        }));
        get().syncToSupabase();
      },

      hasItem: (productId) =>
        get().items.some((i) => i.product_id === productId),

      getCount: () => get().items.length,

      syncToSupabase: async () => {
        const { items, sessionId } = get();
        if (!sessionId) {
          setTimeout(() => get().syncToSupabase(), 500);
          return;
        }
        await supabase
          .from("wishlists")
          .upsert(
            {
              session_id: sessionId,
              items: JSON.stringify(items),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "session_id" },
          );
      },
    }),
    {
      name: "swiftshop-wishlist",
      skipHydration: true,
    },
  ),
);
