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
  const router      = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      setCategories((data as Category[]) ?? [])
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    const cat = searchParams.get('category')
    setActive(cat)
    onCategoryChange?.(cat)
  }, [searchParams, onCategoryChange])

  const select = (id: string | null) => {
    setActive(id)
    onCategoryChange?.(id)
    const params = new URLSearchParams(searchParams.toString())
    if (id) params.set('category', id)
    else params.delete('category')
    router.push('?' + params.toString(), { scroll: false })
  }

  return (
    <div className="sticky top-16 z-40 bg-background/90 backdrop-blur-sm border-b border-on-background/5 px-6 py-3 overflow-x-auto no-scrollbar">
      <div className="max-w-screen-2xl mx-auto flex gap-3 relative">
        {/* Fade right edge on mobile */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background/90 to-transparent md:hidden" />

        <button
          onClick={() => select(null)}
          className={`px-5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-150 ${
            active === null
              ? 'bg-primary text-white scale-105'
              : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
          }`}
        >
          All
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => select(cat.id)}
            className={`px-5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-150 ${
              active === cat.id
                ? 'bg-primary text-white scale-105'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  )
}
