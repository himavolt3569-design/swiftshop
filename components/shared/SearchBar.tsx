'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, Clock, ArrowRight, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'

const RECENT_KEY = 'goreto-recent-searches'
const MAX_RECENT = 5

interface SearchBarProps {
  onSelect?: (product: Product) => void
  mobile?: boolean
  variant?: 'default' | 'hero'
}

export function SearchBar({ onSelect, mobile = false, variant = 'default' }: SearchBarProps) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState<Product[]>([])
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [active,   setActive]   = useState(-1)
  const [recents,  setRecents]  = useState<string[]>([])

  const inputRef    = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY)
      if (stored) setRecents(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  const saveRecent = (term: string) => {
    const next = [term, ...recents.filter((r) => r !== term)].slice(0, MAX_RECENT)
    setRecents(next)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  }

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, sale_price, images, stock, category:categories(name)')
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      .eq('is_active', true)
      .limit(8)
    setResults((data as unknown as Product[]) ?? [])
    setActive(-1)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 220)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, search])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const total = results.length
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((v) => (v + 1) % total) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive((v) => (v - 1 + total) % total) }
    if (e.key === 'Escape')    { setOpen(false); inputRef.current?.blur() }
    if (e.key === 'Enter' && active >= 0 && results[active]) {
      handleSelect(results[active])
    }
  }

  const handleSelect = (product: Product) => {
    saveRecent(product.name)
    onSelect?.(product)
    setQuery('')
    setOpen(false)
  }

  const handleRecentClick = (term: string) => {
    setQuery(term)
    inputRef.current?.focus()
  }

  const clearRecent = (term: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = recents.filter((r) => r !== term)
    setRecents(next)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  }

  const showDropdown = open && (query.trim() ? true : recents.length > 0)
  const firstImage   = (p: Product) => p.images?.[0]?.url ?? ''
  const displayPrice = (p: Product) => (p.sale_price ?? p.price).toLocaleString()

  // Group results by category
  const grouped = results.reduce<Record<string, Product[]>>((acc, p) => {
    const cat = p.category?.name ?? 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  return (
    <div className={`relative ${mobile ? 'w-full' : 'w-full'} ${variant === 'hero' ? 'max-w-3xl mx-auto' : 'max-w-sm'}`}>
      {/* Input */}
      <div className={`flex items-center transition-all duration-300
        ${variant === 'hero' 
          ? `bg-white shadow-ambient rounded-full p-1.5 pl-6 ${open ? 'shadow-lift ring-2 ring-primary/20' : ''}`
          : `gap-2.5 bg-surface-container-low border rounded-full px-4 py-2.5 ${open ? 'border-primary/40 ring-2 ring-primary/10 bg-background' : 'border-outline-variant/30 hover:border-outline-variant/60'}`
        }`}
      >
        {variant !== 'hero' && (
          loading
            ? <Loader2 className="w-4 h-4 text-primary shrink-0 animate-spin" />
            : <Search className="w-4 h-4 text-on-surface-variant shrink-0" />
        )}
        
        {variant === 'hero' && !loading && <Search className="w-5 h-5 text-on-surface-variant/40 shrink-0 mr-2" />}
        {variant === 'hero' && loading && <Loader2 className="w-5 h-5 text-primary shrink-0 animate-spin mr-2" />}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={variant === 'hero' ? "What are you looking for?" : "Search products…"}
          autoComplete="off"
          className={`search-input flex-1 bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant/40 font-display ${variant === 'hero' ? 'text-base md:text-lg px-2 py-3' : 'text-sm'}`}
          aria-label="Search products"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />
        
        {query && variant !== 'hero' && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
            aria-label="Clear"
            className="shrink-0 text-on-surface-variant hover:text-on-surface transition-colors ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {variant === 'hero' && (
          <button 
            type="button"
            onClick={() => {
               if (results.length > 0) handleSelect(results[0])
            }}
            className="w-12 h-12 rounded-full bg-primary hover:bg-primary-container text-white flex items-center justify-center transition-transform duration-200 active:scale-95 shrink-0 shadow-depth-sm ml-2"
            aria-label="Submit search"
          >
            {query && !loading ? <ArrowRight className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Click-away */}
          <div className="fixed inset-0 z-40" onMouseDown={() => setOpen(false)} />

          <div className={`absolute left-0 right-0 mt-3 bg-background border border-outline-variant/25 rounded-3xl shadow-lift z-50 overflow-hidden max-h-[480px] flex flex-col ${variant === 'hero' ? 'top-full' : 'top-full'}`}>

            {/* No query — show recents */}
            {!query.trim() && recents.length > 0 && (
              <div className="p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60 font-label px-2 pb-2">Recent searches</p>
                {recents.map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRecentClick(r)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container-low transition-colors text-left group"
                  >
                    <Clock className="w-3.5 h-3.5 text-on-surface-variant/50 shrink-0" />
                    <span className="flex-1 text-sm text-on-surface font-body">{r}</span>
                    <button
                      onClick={(e) => clearRecent(r, e)}
                      className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-on-surface transition-all"
                      aria-label="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </button>
                ))}
              </div>
            )}

            {/* Has query — show results */}
            {query.trim() && (
              <div className="overflow-y-auto flex-1">
                {loading && (
                  <div className="px-5 py-4 flex items-center gap-2 text-sm text-on-surface-variant font-label">
                    <Loader2 className="w-4 h-4 animate-spin" /> Searching…
                  </div>
                )}

                {!loading && results.length === 0 && (
                  <div className="px-5 py-8 text-center">
                    <Search className="w-8 h-8 text-on-surface-variant/25 mx-auto mb-2" />
                    <p className="text-sm text-on-surface-variant font-body">No results for &ldquo;{query}&rdquo;</p>
                    <p className="text-xs text-on-surface-variant/60 mt-1">Try a different search term</p>
                  </div>
                )}

                {!loading && Object.entries(grouped).map(([cat, items]) => (
                  <div key={cat}>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-label px-4 pt-3 pb-1.5">{cat}</p>
                    {items.map((p) => {
                      const globalIdx = results.indexOf(p)
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleSelect(p)}
                          className={`w-full flex items-center gap-3.5 px-4 py-2.5 transition-colors text-left ${
                            active === globalIdx ? 'bg-surface-container-low' : 'hover:bg-surface-container-low/60'
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="w-11 h-11 rounded-xl bg-surface-container shrink-0 overflow-hidden border border-outline-variant/20">
                            {firstImage(p) ? (
                              <Image src={firstImage(p)} alt={p.name} width={44} height={44} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-base font-headline text-on-surface-variant/30">
                                {p.name.charAt(0)}
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-on-surface truncate font-body leading-tight">
                              {highlightMatch(p.name, query)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {p.stock <= 0 && (
                                <span className="text-[10px] text-error font-label">Out of stock</span>
                              )}
                              {p.sale_price && (
                                <span className="text-[10px] text-success font-label bg-success/10 px-1.5 py-0.5 rounded-full">Sale</span>
                              )}
                            </div>
                          </div>

                          {/* Price + arrow */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-bold text-primary font-label">NPR {displayPrice(p)}</p>
                              {p.sale_price && (
                                <p className="text-[10px] text-on-surface-variant line-through">NPR {p.price.toLocaleString()}</p>
                              )}
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-on-surface-variant/40" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* Footer hint */}
            {query.trim() && results.length > 0 && (
              <div className="border-t border-outline-variant/15 px-4 py-2 flex items-center gap-3">
                <span className="text-[10px] text-on-surface-variant/50 font-label flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-surface-container rounded text-[9px] font-mono">↑↓</kbd> navigate
                </span>
                <span className="text-[10px] text-on-surface-variant/50 font-label flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-surface-container rounded text-[9px] font-mono">↵</kbd> select
                </span>
                <span className="text-[10px] text-on-surface-variant/50 font-label flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-surface-container rounded text-[9px] font-mono">esc</kbd> close
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Highlight the matched portion of text
function highlightMatch(text: string, query: string) {
  if (!query.trim()) return <>{text}</>
  const i = text.toLowerCase().indexOf(query.toLowerCase())
  if (i === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-primary/15 text-primary font-semibold rounded-sm not-italic">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  )
}
