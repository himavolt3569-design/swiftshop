'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { SlidersHorizontal, X, ChevronDown, Flame, ArrowUpDown, Tag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export interface FilterState {
  priceMin: number | null
  priceMax: number | null
  sizes: string[]
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'on_sale'
  onSaleOnly: boolean
}

const DEFAULT_FILTERS: FilterState = {
  priceMin: null,
  priceMax: null,
  sizes: [],
  sortBy: 'newest',
  onSaleOnly: false,
}

const SORT_OPTIONS = [
  { value: 'newest' as const, label: 'Newest' },
  { value: 'price_asc' as const, label: 'Price: Low → High' },
  { value: 'price_desc' as const, label: 'Price: High → Low' },
  { value: 'on_sale' as const, label: 'On Sale First' },
]

interface ProductFiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

export function ProductFilters({ filters, onChange }: ProductFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [availableSizes, setAvailableSizes] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 })
  const [localMin, setLocalMin] = useState<number>(0)
  const [localMax, setLocalMax] = useState<number>(10000)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  // Fetch available sizes and price range on mount
  useEffect(() => {
    const fetchMeta = async () => {
      // Get all distinct sizes
      const { data: sizeData } = await supabase
        .from('products')
        .select('sizes')
        .eq('is_active', true)
      if (sizeData) {
        const allSizes = new Set<string>()
        sizeData.forEach((p: { sizes: { size: string }[] | null }) => {
          if (p.sizes) p.sizes.forEach((s) => allSizes.add(s.size))
        })
        setAvailableSizes(Array.from(allSizes).sort())
      }

      // Get price range
      const [{ data: minData }, { data: maxData }] = await Promise.all([
        supabase.from('products').select('price').eq('is_active', true).order('price', { ascending: true }).limit(1),
        supabase.from('products').select('price').eq('is_active', true).order('price', { ascending: false }).limit(1),
      ])
      const min = minData?.[0]?.price ?? 0
      const max = maxData?.[0]?.price ?? 10000
      setPriceRange({ min, max })
      setLocalMin(filters.priceMin ?? min)
      setLocalMax(filters.priceMax ?? max)
    }
    fetchMeta()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Close sort dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const activeCount = (
    (filters.priceMin !== null && filters.priceMin > priceRange.min ? 1 : 0) +
    (filters.priceMax !== null && filters.priceMax < priceRange.max ? 1 : 0) +
    (filters.sizes.length > 0 ? 1 : 0) +
    (filters.onSaleOnly ? 1 : 0) +
    (filters.sortBy !== 'newest' ? 1 : 0)
  )

  const clearAll = () => {
    onChange(DEFAULT_FILTERS)
    setLocalMin(priceRange.min)
    setLocalMax(priceRange.max)
  }

  const toggleSize = (size: string) => {
    const next = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size]
    onChange({ ...filters, sizes: next })
  }

  const handlePriceChange = useCallback(
    (min: number, max: number) => {
      setLocalMin(min)
      setLocalMax(max)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onChange({
          ...filters,
          priceMin: min <= priceRange.min ? null : min,
          priceMax: max >= priceRange.max ? null : max,
        })
      }, 300)
    },
    [filters, onChange, priceRange],
  )

  // Filter content (shared between mobile & desktop)
  const filterContent = (
    <div className="space-y-5">
      {/* Price Range */}
      <div>
        <p className="text-[11px] font-bold text-on-surface font-label uppercase tracking-widest mb-3">
          Price Range
        </p>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant/50 font-label">NPR</span>
            <input
              type="number"
              value={localMin}
              onChange={(e) => handlePriceChange(Number(e.target.value), localMax)}
              className="w-full h-10 pl-11 pr-3 rounded-xl border border-outline-variant/30 bg-background text-sm text-on-surface font-body focus:outline-none focus:border-primary/50 transition-colors"
              min={priceRange.min}
              max={localMax}
            />
          </div>
          <span className="text-on-surface-variant/30 text-sm">—</span>
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant/50 font-label">NPR</span>
            <input
              type="number"
              value={localMax}
              onChange={(e) => handlePriceChange(localMin, Number(e.target.value))}
              className="w-full h-10 pl-11 pr-3 rounded-xl border border-outline-variant/30 bg-background text-sm text-on-surface font-body focus:outline-none focus:border-primary/50 transition-colors"
              min={localMin}
              max={priceRange.max}
            />
          </div>
        </div>
        {/* Dual range slider */}
        <div className="relative h-6 flex items-center px-1">
          <div className="absolute left-1 right-1 h-1.5 bg-surface-container rounded-full" />
          <div
            className="absolute h-1.5 bg-primary rounded-full"
            style={{
              left: `${((localMin - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`,
              right: `${100 - ((localMax - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`,
            }}
          />
          <input
            type="range"
            min={priceRange.min}
            max={priceRange.max}
            step={10}
            value={localMin}
            onChange={(e) => handlePriceChange(Math.min(Number(e.target.value), localMax - 10), localMax)}
            className="absolute left-0 right-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10"
          />
          <input
            type="range"
            min={priceRange.min}
            max={priceRange.max}
            step={10}
            value={localMax}
            onChange={(e) => handlePriceChange(localMin, Math.max(Number(e.target.value), localMin + 10))}
            className="absolute left-0 right-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10"
          />
        </div>
      </div>

      {/* Sizes */}
      {availableSizes.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-on-surface font-label uppercase tracking-widest mb-3">
            Size
          </p>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className={`h-9 px-4 rounded-xl text-sm font-label font-semibold transition-all duration-150 border-2 cursor-pointer ${
                  filters.sizes.includes(size)
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-background text-on-surface border-outline-variant/30 hover:border-primary/50'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* On Sale Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-accent-warm" />
          <span className="text-sm font-label font-semibold text-on-surface">On Sale Only</span>
        </div>
        <button
          onClick={() => onChange({ ...filters, onSaleOnly: !filters.onSaleOnly })}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
            filters.onSaleOnly ? 'bg-primary' : 'bg-surface-container-high'
          }`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              filters.onSaleOnly ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  )

  return (
    <div className="sticky top-16 z-40">
      <div className="glass border-b border-outline-variant/10">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-3 py-3">
            {/* Mobile filter trigger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant/30 bg-background text-sm font-label font-semibold text-on-surface hover:border-primary/40 transition-colors cursor-pointer active:scale-[0.97]"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>

            {/* Desktop: inline filter summary chips */}
            <div className="hidden md:flex items-center gap-2 flex-1 overflow-x-auto no-scrollbar">
              <SlidersHorizontal className="w-4 h-4 text-on-surface-variant/50 shrink-0" />

              {/* Price chip */}
              {(filters.priceMin !== null || filters.priceMax !== null) && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-label font-semibold shrink-0">
                  NPR {filters.priceMin ?? priceRange.min} – {filters.priceMax ?? priceRange.max}
                  <button onClick={() => { onChange({ ...filters, priceMin: null, priceMax: null }); setLocalMin(priceRange.min); setLocalMax(priceRange.max); }} className="hover:text-primary/70 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Size chips */}
              {filters.sizes.map((s) => (
                <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-label font-semibold shrink-0">
                  {s}
                  <button onClick={() => toggleSize(s)} className="hover:text-primary/70 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {/* On sale chip */}
              {filters.onSaleOnly && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-warm/10 text-accent-warm-dim text-xs font-label font-semibold shrink-0">
                  <Flame className="w-3 h-3" /> On Sale
                  <button onClick={() => onChange({ ...filters, onSaleOnly: false })} className="hover:opacity-70 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {activeCount > 0 && (
                <button onClick={clearAll} className="text-xs text-on-surface-variant/60 hover:text-primary font-label font-semibold ml-1 shrink-0 cursor-pointer">
                  Clear All
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="relative ml-auto" ref={sortRef}>
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant/30 bg-background text-sm font-label font-semibold text-on-surface hover:border-primary/40 transition-colors cursor-pointer active:scale-[0.97]"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label ?? 'Sort'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-background border border-outline-variant/20 rounded-2xl shadow-lift z-50 overflow-hidden"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { onChange({ ...filters, sortBy: opt.value }); setSortOpen(false); }}
                        className={`w-full text-left px-4 py-3 text-sm font-label transition-colors cursor-pointer ${
                          filters.sortBy === opt.value
                            ? 'bg-primary/8 text-primary font-bold'
                            : 'text-on-surface hover:bg-surface-container-low'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-background rounded-t-3xl shadow-2xl md:hidden max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-outline-variant/50 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/15">
                <h3 className="text-base font-display font-bold text-on-surface">Filters</h3>
                <div className="flex items-center gap-3">
                  {activeCount > 0 && (
                    <button onClick={clearAll} className="text-xs text-primary font-label font-semibold cursor-pointer">
                      Clear All
                    </button>
                  )}
                  <button onClick={() => setMobileOpen(false)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center cursor-pointer">
                    <X className="w-4 h-4 text-on-surface-variant" />
                  </button>
                </div>
              </div>
              <div className="px-5 py-5 pb-8 safe-area-inset-bottom">
                {filterContent}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop expandable filter panel */}
      <AnimatePresence>
        {!mobileOpen && activeCount === 0 && (
          <div className="hidden md:block" />
        )}
      </AnimatePresence>
    </div>
  )
}

export { DEFAULT_FILTERS }
