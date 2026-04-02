'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
    // Determine which main category this belongs to
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

  return (
    <div className="sticky top-16 z-40 bg-background/90 backdrop-blur-sm border-b border-on-background/5">
      {/* Main category row */}
      <div className="px-6 py-3 overflow-x-auto no-scrollbar">
        <div className="max-w-screen-2xl mx-auto flex gap-3 relative">
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background/90 to-transparent md:hidden" />

          <button
            onClick={() => select(null, null)}
            className={`px-5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-200 ${
              active === null
                ? 'bg-primary text-white shadow-sm shadow-primary/30'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            All
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => select(cat.id, cat.id)}
              className={`px-5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-200 ${
                activeMain === cat.id || active === cat.id
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-category row — only shown when a main with subs is active */}
      {activeSubs.length > 0 && (
        <div className="px-6 pb-2.5 overflow-x-auto no-scrollbar border-t border-on-background/[0.04]">
          <div className="max-w-screen-2xl mx-auto flex gap-2 pt-2">
            <button
              onClick={() => select(activeMain, activeMain)}
              className={`px-4 py-1 rounded-full text-[12px] font-medium whitespace-nowrap transition-all duration-200 ${
                active === activeMain
                  ? 'bg-on-surface text-background shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              All {categories.find((c) => c.id === activeMain)?.name}
            </button>
            {activeSubs.map((sub) => (
              <button
                key={sub.id}
                onClick={() => select(sub.id, activeMain)}
                className={`px-4 py-1 rounded-full text-[12px] font-medium whitespace-nowrap transition-all duration-200 ${
                  active === sub.id
                    ? 'bg-on-surface text-background shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
