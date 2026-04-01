'use client'

import { useEffect, useState } from 'react'
import { Plus, GripVertical, Trash2, ToggleLeft, ToggleRight, ChevronRight } from 'lucide-react'
import { supabase }           from '@/lib/supabase'
import { useSessionStore }    from '@/store/sessionStore'
import { Category }           from '@/lib/types'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading,    setLoading]    = useState(true)
  const [newName,    setNewName]    = useState('')
  const [parentId,   setParentId]   = useState<string>('')
  const [adding,     setAdding]     = useState(false)
  const { addToast } = useSessionStore()

  const fetchAll = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')
    if (!data) { setLoading(false); return }

    const withCounts = await Promise.all(
      (data as Category[]).map(async (cat) => {
        const { count } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('category_id', cat.id)
        return { ...cat, product_count: count ?? 0 }
      })
    )

    // Build tree: main categories with nested subcategories
    const mains = withCounts.filter((c) => !c.parent_id)
    const tree = mains.map((main) => ({
      ...main,
      subcategories: withCounts.filter((c) => c.parent_id === main.id),
    }))
    setCategories(tree)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    const base = newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const slug = `${base}-${Date.now()}`
    const { error } = await supabase.from('categories').insert({
      name: newName.trim(),
      slug,
      sort_order: categories.length,
      is_active: true,
      parent_id: parentId || null,
    })
    if (error) addToast('error', `Failed to create category: ${error.message}`)
    else { addToast('success', 'Category created.'); setNewName(''); setParentId('') }
    setAdding(false)
    fetchAll()
  }

  const handleToggle = async (cat: Category) => {
    await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id)
    fetchAll()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id)
    addToast('success', 'Category deleted.')
    fetchAll()
  }

  // Flat list of main categories for the parent selector
  const mainCategories = categories.filter((c) => !c.parent_id)

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-headline text-4xl font-bold text-on-surface tracking-tight mb-1">Categories</h2>
        <p className="text-on-surface-variant font-body text-sm">{categories.length} main categories</p>
      </div>

      {/* Add new */}
      <div className="flex flex-wrap gap-3 mb-8">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Category name…"
          className="admin-input flex-1 min-w-[180px] max-w-xs"
        />
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="admin-input min-w-[180px]"
        >
          <option value="">Main category</option>
          {mainCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button onClick={handleAdd} disabled={adding || !newName.trim()} className="admin-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />{adding ? 'Adding…' : 'Add'}
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 bg-surface-container rounded-lg animate-pulse" />
        ))}

        {!loading && categories.map((cat) => (
          <div key={cat.id}>
            {/* Main category row */}
            <div className="flex items-center gap-4 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 group hover:shadow-float transition-all">
              <GripVertical className="w-4 h-4 text-on-surface-variant/30 cursor-grab" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-on-surface font-body">{cat.name}</p>
                <p className="text-xs text-on-surface-variant font-label">
                  {(cat.product_count as number) ?? 0} products
                  {(cat.subcategories?.length ?? 0) > 0 && ` · ${cat.subcategories!.length} sub-categories`}
                </p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleToggle(cat)}
                  className={`flex items-center gap-1 text-xs font-label font-semibold px-3 py-1.5 rounded-lg transition-colors ${cat.is_active ? 'bg-success/10 text-success hover:bg-success/20' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  {cat.is_active ? <><ToggleRight className="w-3.5 h-3.5" /> Active</> : <><ToggleLeft className="w-3.5 h-3.5" /> Inactive</>}
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-on-surface-variant hover:text-error transition-colors rounded-lg hover:bg-error-container" aria-label="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Sub-category rows */}
            {(cat.subcategories?.length ?? 0) > 0 && (
              <div className="ml-6 mt-1 space-y-1">
                {cat.subcategories!.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-4 bg-surface-container-low border border-outline-variant/10 rounded-lg px-4 py-2.5 group hover:shadow-float transition-all">
                    <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant/30 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-on-surface font-body">{sub.name}</p>
                      <p className="text-xs text-on-surface-variant font-label">{(sub.product_count as number) ?? 0} products</p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleToggle(sub)}
                        className={`flex items-center gap-1 text-xs font-label font-semibold px-3 py-1.5 rounded-lg transition-colors ${sub.is_active ? 'bg-success/10 text-success hover:bg-success/20' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
                      >
                        {sub.is_active ? <><ToggleRight className="w-3.5 h-3.5" /> Active</> : <><ToggleLeft className="w-3.5 h-3.5" /> Inactive</>}
                      </button>
                      <button onClick={() => handleDelete(sub.id)} className="p-1.5 text-on-surface-variant hover:text-error transition-colors rounded-lg hover:bg-error-container" aria-label="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
