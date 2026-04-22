'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Category } from '@/lib/types'

interface CategoryBarProps {
  onCategoryChange?: (categoryId: string | null) => void
}

export function CategoryBar({ onCategoryChange }: CategoryBarProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [active, setActive]         = useState<string | null>(null)
  const [activeMain, setActiveMain] = useState<string | null>(null)
  const router       = useRouter()
  const searchParams = useSearchParams()
  const scrollRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      const all = (data as Category[]) ?? []
      const mains = all.filter((c) => !c.parent_id).map((main) => ({
        ...main,
        subcategories: all.filter((c) => c.parent_id === main.id),
      }))
      setCategories(mains)
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    const cat = searchParams.get('category')
    setActive(cat)
    onCategoryChange?.(cat)
    if (cat) {
      const parent = categories.find(
        (m) => m.id === cat || m.subcategories?.some((s) => s.id === cat)
      )
      setActiveMain(parent?.id ?? null)
    } else {
      setActiveMain(null)
    }
  }, [searchParams, onCategoryChange, categories])

  const select = (id: string | null, mainId?: string | null) => {
    setActive(id)
    setActiveMain(mainId ?? id)
    onCategoryChange?.(id)
    const params = new URLSearchParams(searchParams.toString())
    if (id) params.set('category', id)
    else params.delete('category')
    router.push('?' + params.toString(), { scroll: false })
  }

  const activeSubs = activeMain
    ? categories.find((c) => c.id === activeMain)?.subcategories ?? []
    : []

  const allItems = [{ id: null, name: 'All' }, ...categories]

  return (
    <div className="sticky top-16 z-40 glass border-b border-outline-variant/10">
      {/* Main category row */}
      <div className="px-4 md:px-6 py-3 overflow-x-auto no-scrollbar" ref={scrollRef}>
        <div className="max-w-screen-2xl mx-auto flex gap-2 relative">
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background/80 to-transparent md:hidden z-10" />

          {allItems.map((cat) => {
            const isActive = cat.id === null ? active === null : (activeMain === cat.id || active === cat.id)
            return (
              <button
                key={cat.id ?? 'all'}
                onClick={() => select(cat.id, cat.id)}
                className={`relative px-5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-300 ${
                  isActive
                    ? 'text-white'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="categoryPill"
                    className="absolute inset-0 rounded-full gradient-primary shadow-glow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sub-category row */}
      {activeSubs.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="px-4 md:px-6 pb-2.5 overflow-x-auto no-scrollbar border-t border-outline-variant/[0.06]"
        >
          <div className="max-w-screen-2xl mx-auto flex gap-2 pt-2">
            <button
              onClick={() => select(activeMain, activeMain)}
              className={`relative px-4 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all duration-300 ${
                active === activeMain
                  ? 'bg-on-surface text-background shadow-sm'
                  : 'bg-surface-container-high/60 text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              All {categories.find((c) => c.id === activeMain)?.name}
            </button>
            {activeSubs.map((sub) => (
              <button
                key={sub.id}
                onClick={() => select(sub.id, activeMain)}
                className={`relative px-4 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all duration-300 ${
                  active === sub.id
                    ? 'bg-on-surface text-background shadow-sm'
                    : 'bg-surface-container-high/60 text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
