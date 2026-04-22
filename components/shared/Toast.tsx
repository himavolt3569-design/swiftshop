'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, AlertCircle, Info, X } from 'lucide-react'
import { useSessionStore } from '@/store/sessionStore'

const icons = {
  success: <Check className="w-3.5 h-3.5" />,
  error: <AlertCircle className="w-3.5 h-3.5" />,
  info: <Info className="w-3.5 h-3.5" />,
}

const iconColors = {
  success: 'bg-accent/15 text-accent',
  error: 'bg-error/15 text-error',
  info: 'bg-primary/10 text-primary',
}

const barColors = {
  success: 'bg-accent',
  error: 'bg-error',
  info: 'bg-primary',
}

export function ToastContainer() {
  const { toasts, removeToast } = useSessionStore()

  return (
    <div className="fixed top-20 right-4 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="pointer-events-auto"
          >
            <Toast
              type={toast.type}
              message={toast.message}
              onDismiss={() => removeToast(toast.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function Toast({
  type,
  message,
  onDismiss,
}: {
  type: 'success' | 'error' | 'info'
  message: string
  onDismiss: () => void
}) {
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="glass rounded-xl shadow-depth overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${iconColors[type]}`}>
          {icons[type]}
        </div>
        <p className="text-sm text-on-surface font-body flex-1">{message}</p>
        <button onClick={onDismiss} className="text-on-surface-variant/40 hover:text-on-surface-variant transition-colors shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-[2px] bg-surface-container">
        <div
          ref={progressRef}
          className={`h-full ${barColors[type]} rounded-full`}
          style={{
            animation: 'counter-roll 3s linear forwards',
            transformOrigin: 'left',
            width: '100%',
          }}
        />
      </div>
    </div>
  )
}
