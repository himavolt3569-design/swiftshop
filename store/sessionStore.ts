'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { ToastMessage } from '@/lib/types'

interface SessionState {
  sessionId: string
  toasts: ToastMessage[]
  addToast: (type: ToastMessage['type'], message: string) => void
  removeToast: (id: string) => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessionId: uuidv4(),
      toasts: [],

      addToast: (type, message) => {
        const id = uuidv4()
        set((state) => ({ toasts: [...state.toasts, { id, type, message }] }))
        const duration = type === 'error' ? 6000 : type === 'info' ? 4000 : 3000
        setTimeout(() => get().removeToast(id), duration)
      },

      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'goreto-session',
      partialize: (state) => ({ sessionId: state.sessionId }),
    }
  )
)
