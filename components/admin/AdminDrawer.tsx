'use client'

import { useCallback, useEffect } from 'react'
import { X } from 'lucide-react'

interface AdminDrawerProps {
  open:      boolean
  onClose:   () => void
  title:     string
  children:  React.ReactNode
  width?:    string
}

export function AdminDrawer({ open, onClose, title, children, width = 'w-[520px]' }: AdminDrawerProps) {
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, handleEsc])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-on-background/30 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed top-0 right-0 bottom-0 z-[90] w-full sm:${width} sm:max-w-full bg-admin shadow-[-20px_0_40px_rgba(30,27,24,0.08)] animate-slide-in-right flex flex-col`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-surface-container-lowest">
          <h3 className="font-headline text-lg font-bold text-on-surface">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors">
            <X className="w-4 h-4 text-on-surface" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </>
  )
}
