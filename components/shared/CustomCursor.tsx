'use client'

import { useEffect, useRef } from 'react'

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor) return

    const move = (e: MouseEvent) => {
      cursor.style.transform = `translate(${e.clientX - 5}px, ${e.clientY - 5}px)`
    }

    const show = () => { cursor.style.opacity = '1' }
    const hide = () => { cursor.style.opacity = '0' }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseenter', show)
    document.addEventListener('mouseleave', hide)

    return () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseenter', show)
      document.removeEventListener('mouseleave', hide)
    }
  }, [])

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[9999] w-[10px] h-[10px] rounded-full bg-primary opacity-0 transition-opacity duration-200 hidden md:block"
      style={{ willChange: 'transform' }}
    />
  )
}
