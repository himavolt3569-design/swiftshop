'use client'

import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useSessionStore } from '@/store/sessionStore'
import { ToastMessage } from '@/lib/types'

const icons: Record<ToastMessage['type'], React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-success shrink-0" />,
  error:   <XCircle    className="w-4 h-4 text-error shrink-0" />,
  info:    <Info       className="w-4 h-4 text-primary shrink-0" />,
}

export function ToastContainer() {
  const { toasts, removeToast } = useSessionStore()

  return (
    <div className="fixed top-4 right-4 z-[9998] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 bg-surface-container-lowest border border-outline-variant shadow-lift rounded-lg px-4 py-3 min-w-[280px] max-w-[360px] animate-slide-up"
        >
          {icons[toast.type]}
          <span className="text-sm text-on-surface flex-1 font-body">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
