'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Upload } from 'lucide-react'
import { AdminTable }  from '@/components/admin/AdminTable'
import { AdminDrawer } from '@/components/admin/AdminDrawer'
import { supabase }    from '@/lib/supabase'
import { useSessionStore } from '@/store/sessionStore'
import { Product, Category } from '@/lib/types'

interface ProductRow extends Record<string, unknown> {
  id: string; name: string; category_name: string; price: number; sale_price: number | null
  stock: number; is_active: boolean; images: Product['images']
}

const COLS = [
  { key: 'images',        label: 'Image',    render: (r: ProductRow) => (
    <div className="w-10 h-12 bg-surface-container rounded overflow-hidden">
      {r.images?.[0]?.url
        ? <Image src={r.images[0].url} alt={r.name} width={40} height={48} className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center text-lg font-headline text-on-surface-variant/30">{r.name?.charAt(0)}</div>}
    </div>
  )},
  { key: 'name',          label: 'Product',  sortable: true },
  { key: 'category_name', label: 'Category', sortable: true, mobileHide: true },
  { key: 'price',         label: 'Price',    sortable: true, render: (r: ProductRow) => `NPR ${r.price.toLocaleString()}` },
  { key: 'stock',         label: 'Stock',    sortable: true, mobileHide: true },
  { key: 'is_active',     label: 'Status',   render: (r: ProductRow) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-label ${r.is_active ? 'bg-success/10 text-success' : 'bg-surface-container text-on-surface-variant'}`}>
      {r.is_active ? 'Active' : 'Inactive'}
    </span>
  )},
]

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL']
const EMPTY_FORM = { name: '', description: '', price: '', sale_price: '', stock: '', category_id: '', sizeStocks: {} as Record<string, string>, hasSizes: false, is_active: true }

export default function ProductsPage() {
  const [products,   setProducts]   = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading,    setLoading]    = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing,    setEditing]    = useState<Product | null>(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [imageFiles,  setImageFiles] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const { addToast } = useSessionStore()

  const fetchAll = async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*, category:categories(name), images, sizes').order('created_at', { ascending: false })
    const { data: cats } = await supabase.from('categories').select('*').order('sort_order')
    setProducts((data ?? []).map((p: Product) => ({ ...p, category_name: p.category?.name ?? '' } as unknown as ProductRow)))
    setCategories((cats as Category[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const openNew  = () => { setEditing(null); setForm(EMPTY_FORM); setImageFiles([]); setDrawerOpen(true) }
  const openEdit = (p: ProductRow) => {
    const prod = p as unknown as Product
    setEditing(prod)
    const hasSizes = (prod.sizes ?? []).length > 0
    const sizeStocks: Record<string, string> = {}
    if (hasSizes) { (prod.sizes ?? []).forEach((s) => { sizeStocks[s.size] = String(s.stock) }) }
    setForm({ name: prod.name, description: prod.description, price: String(prod.price), sale_price: String(prod.sale_price ?? ''), stock: String(prod.stock), category_id: prod.category_id, sizeStocks, hasSizes, is_active: prod.is_active })
    setImageFiles([])
    setDrawerOpen(true)
  }

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = []
    for (const file of imageFiles) {
      const path = `products/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('product-images').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('product-images').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    return urls
  }

  const handleSave = async () => {
    if (!form.name || !form.price) { addToast('error', 'Name and price are required.'); return }
    setSaving(true)
    const imageUrls = await uploadImages()
    const sizes = form.hasSizes
      ? Object.entries(form.sizeStocks).filter(([, qty]) => qty !== '').map(([size, qty]) => ({ size, stock: parseInt(qty || '0') }))
      : []
    const totalStock = form.hasSizes
      ? sizes.reduce((acc: number, s: { size: string; stock: number }) => acc + s.stock, 0)
      : parseInt(form.stock || '0')
    const slug = form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()
    const payload = {
      name: form.name, description: form.description, price: parseFloat(form.price),
      sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
      stock: totalStock, category_id: form.category_id || null,
      sizes, is_active: form.is_active,
      ...(imageUrls.length ? { images: imageUrls.map((url, i) => ({ url, sort_order: i })) } : {}),
    }
    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id)
      if (error) { addToast('error', `Update failed: ${error.message}`); setSaving(false); return }
      addToast('success', 'Product updated.')
    } else {
      const { error } = await supabase.from('products').insert({ ...payload, slug })
      if (error) { addToast('error', `Create failed: ${error.message}`); setSaving(false); return }
      addToast('success', 'Product created.')
    }
    setSaving(false)
    setDrawerOpen(false)
    fetchAll()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('products').delete().eq('id', id)
    addToast('success', 'Product deleted.')
    setDeleteConfirm(null)
    fetchAll()
  }

  const handleToggle = async (row: ProductRow) => {
    await supabase.from('products').update({ is_active: !row.is_active }).eq('id', row.id)
    fetchAll()
  }

  const inputCls = 'admin-input'
  const labelCls = 'admin-label'

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-headline text-4xl font-bold text-on-surface tracking-tight mb-1">Products</h2>
          <p className="text-on-surface-variant font-body text-sm">{products.length} total products</p>
        </div>
        <button onClick={openNew} className="admin-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <AdminTable columns={COLS as never} data={products as never[]} keyField="id" loading={loading}
        onRowClick={(r) => openEdit(r as unknown as ProductRow)}
        emptyMessage="No products yet. Add your first product."
      />

      {/* Drawer */}
      <AdminDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Product' : 'Add Product'}>
        <div className="space-y-5">
          <div><label className={labelCls}>Product Name *</label><input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div><label className={labelCls}>Description</label><textarea className={inputCls + ' h-24 py-2 resize-none'} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Price (NPR) *</label><input type="number" className={inputCls} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} /></div>
            <div><label className={labelCls}>Sale Price (NPR)</label><input type="number" className={inputCls} value={form.sale_price} onChange={(e) => setForm((f) => ({ ...f, sale_price: e.target.value }))} /></div>
          </div>
          <div><label className={labelCls}>Category</label>
            <select className={inputCls} value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}>
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Stock — either single quantity or per-size */}
          <div className="rounded-xl border border-black/[0.08] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className={labelCls + ' mb-0'}>Stock</p>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs font-label text-[#1A1714]/60">Has sizes?</span>
                <input type="checkbox" checked={form.hasSizes} onChange={(e) => setForm((f) => ({ ...f, hasSizes: e.target.checked, sizeStocks: e.target.checked ? Object.fromEntries(DEFAULT_SIZES.map((s) => [s, ''])) : {}, stock: '' }))} className="accent-primary" />
              </label>
            </div>
            {form.hasSizes ? (
              <div className="space-y-2">
                {DEFAULT_SIZES.map((sz) => (
                  <div key={sz} className="flex items-center gap-3">
                    <span className="w-10 h-9 rounded-lg bg-[#1A1714]/[0.06] flex items-center justify-center text-sm font-bold font-label text-[#1A1714] shrink-0">{sz}</span>
                    <input
                      type="number"
                      className={inputCls + ' flex-1'}
                      value={form.sizeStocks[sz] ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, sizeStocks: { ...f.sizeStocks, [sz]: e.target.value } }))}
                      placeholder="qty"
                      min="0"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <input type="number" className={inputCls} value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} placeholder="e.g. 50" />
            )}
          </div>
          <div>
            <label className={labelCls}>Product Images</label>
            <div className="border-2 border-dashed border-outline-variant rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors" onClick={() => fileRef.current?.click()}>
              <Upload className="w-6 h-6 text-on-surface-variant mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant font-body">Click to upload images</p>
              <p className="text-xs text-on-surface-variant/50 font-label mt-1">PNG, JPG up to 10MB each</p>
              <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))} />
            </div>
            {imageFiles.length > 0 && <p className="text-xs text-success mt-1 font-label">{imageFiles.length} file(s) selected</p>}
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="accent-primary" />
            <label htmlFor="is_active" className="text-sm font-label text-on-surface">Active (visible in store)</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="admin-btn-primary flex-1">
              {saving ? 'Saving…' : editing ? 'Update Product' : 'Create Product'}
            </button>
            <button onClick={() => setDrawerOpen(false)} className="admin-btn-secondary">Cancel</button>
          </div>

          {editing && (
            <button onClick={() => setDeleteConfirm(editing.id)} className="w-full h-10 text-sm text-error font-label hover:bg-error-container rounded-lg transition-colors flex items-center justify-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete Product
            </button>
          )}
        </div>
      </AdminDrawer>

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-on-background/40 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl p-6 max-w-sm w-full shadow-lift">
            <h4 className="font-headline text-lg font-bold text-on-surface mb-2">Delete Product?</h4>
            <p className="text-sm text-on-surface-variant font-body mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 h-10 bg-error text-white text-sm font-label font-semibold rounded-lg">Delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-10 admin-btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
