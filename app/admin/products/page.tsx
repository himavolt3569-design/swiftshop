'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import {
  Plus, Pencil, Trash2, Upload, X, Minus, ImageIcon,
  Tag, DollarSign, Package, Layers,
} from 'lucide-react'
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
  { key: 'images', label: 'Image', render: (r: ProductRow) => (
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
const EMPTY_FORM = {
  name: '', description: '', price: '', sale_price: '', stock: '',
  category_id: '', sizeStocks: {} as Record<string, string>, hasSizes: false, is_active: true, tags: [] as string[],
}

/* ─── Tiny helpers ─── */
function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-outline-variant/30 bg-surface-container-low/60">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-[13px] font-semibold text-on-surface font-label tracking-wide">{title}</span>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[12px] font-semibold text-on-surface-variant/80 uppercase tracking-wider mb-2 font-label">
      {children}{required && <span className="text-primary ml-0.5">*</span>}
    </label>
  )
}

function StepInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const num = parseInt(value || '0')
  const dec = () => onChange(String(Math.max(0, num - 1)))
  const inc = () => onChange(String(num + 1))
  return (
    <div className="flex items-center h-11 rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
      <button
        type="button"
        onClick={dec}
        className="w-11 h-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors shrink-0 border-r border-outline-variant/40"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '0'}
        min="0"
        className="flex-1 h-full px-3 bg-transparent text-sm font-semibold text-center text-on-surface font-label focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={inc}
        className="w-11 h-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors shrink-0 border-l border-outline-variant/40"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

/* ─── Main Page ─── */
export default function ProductsPage() {
  const [products,   setProducts]   = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading,    setLoading]    = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing,    setEditing]    = useState<Product | null>(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [imageFiles,    setImageFiles]    = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [keptImages,    setKeptImages]    = useState<{ url: string }[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const MAX_IMAGES = 5
  const { addToast } = useSessionStore()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*, category:categories(name), images, sizes').order('created_at', { ascending: false })
    const { data: cats } = await supabase.from('categories').select('*').order('sort_order')
    setProducts((data ?? []).map((p: Product) => ({ ...p, category_name: p.category?.name ?? '' } as unknown as ProductRow)))
    setCategories((cats as Category[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openNew = () => {
    setEditing(null); setForm(EMPTY_FORM); setImageFiles([]); setImagePreviews([]); setKeptImages([]); setDrawerOpen(true)
  }
  const openEdit = (p: ProductRow) => {
    const prod = p as unknown as Product
    setEditing(prod)
    const hasSizes = (prod.sizes ?? []).length > 0
    const sizeStocks: Record<string, string> = {}
    if (hasSizes) { (prod.sizes ?? []).forEach((s) => { sizeStocks[s.size] = String(s.stock) }) }
    setForm({ name: prod.name, description: prod.description, price: String(prod.price), sale_price: String(prod.sale_price ?? ''), stock: String(prod.stock), category_id: prod.category_id, sizeStocks, hasSizes, is_active: prod.is_active, tags: prod.tags ?? [] })
    setImageFiles([]); setImagePreviews([])
    setKeptImages((prod.images ?? []).map((img) => ({ url: img.url })))
    setDrawerOpen(true)
  }

  const handleFileChange = (files: FileList | null) => {
    if (!files) return
    const remaining = MAX_IMAGES - keptImages.length - imageFiles.length
    if (remaining <= 0) return
    const arr = Array.from(files).slice(0, remaining)
    setImageFiles((prev) => [...prev, ...arr])
    setImagePreviews((prev) => [...prev, ...arr.map((f) => URL.createObjectURL(f))])
  }

  const removeNewImage = (i: number) => {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== i))
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== i))
  }

  const removeKeptImage = (i: number) => {
    setKeptImages((prev) => prev.filter((_, idx) => idx !== i))
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
    const combinedImages = [
      ...keptImages.map((img, i) => ({ url: img.url, sort_order: i })),
      ...imageUrls.map((url, i) => ({ url, sort_order: keptImages.length + i })),
    ]
    const payload = {
      name: form.name, description: form.description, price: parseFloat(form.price),
      sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
      stock: totalStock, category_id: form.category_id || null,
      sizes, is_active: form.is_active, tags: form.tags,
      images: combinedImages,
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
    setSaving(false); setDrawerOpen(false); fetchAll()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('products').delete().eq('id', id)
    addToast('success', 'Product deleted.')
    setDeleteConfirm(null); fetchAll()
  }

  /* ─── total stock badge (sizes mode) ─── */
  const totalSizeStock = Object.values(form.sizeStocks).reduce((a, v) => a + (parseInt(v || '0')), 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-headline text-4xl font-bold text-on-surface tracking-tight mb-1">Products</h2>
          <p className="text-on-surface-variant font-body text-sm">{products.length} total products</p>
        </div>
        <button onClick={openNew} className="admin-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <AdminTable
        columns={COLS as never}
        data={products as never[]}
        keyField="id"
        loading={loading}
        onRowClick={(r) => openEdit(r as unknown as ProductRow)}
        emptyMessage="No products yet. Add your first product."
      />

      {/* ═══ Drawer ═══ */}
      <AdminDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Product' : 'Add Product'} width="max-w-[500px]">
        <div className="space-y-4 pb-2">


          {/* ── 1. Basic Info ── */}
          <SectionCard icon={Tag} title="Basic Information">
            <div>
              <FieldLabel required>Product Name</FieldLabel>
              <input
                className="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm font-body text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Classic Oxford Shirt"
              />
            </div>
            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm font-body text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all resize-none h-24"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short product description…"
              />
            </div>
            <div>
              <FieldLabel>Category</FieldLabel>
              <select
                className="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm font-body text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                value={form.category_id}
                onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              >
                <option value="">Select a category…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </SectionCard>

          {/* ── 2. Pricing ── */}
          <SectionCard icon={DollarSign} title="Pricing">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Price (NPR)</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant/60 font-label">NPR</span>
                  <input
                    type="number"
                    className="w-full h-11 pl-12 pr-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm font-semibold text-on-surface font-label focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Sale Price (NPR)</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant/60 font-label">NPR</span>
                  <input
                    type="number"
                    className="w-full h-11 pl-12 pr-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm font-semibold text-on-surface font-label focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    value={form.sale_price}
                    onChange={(e) => setForm((f) => ({ ...f, sale_price: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                {form.sale_price && form.price && parseFloat(form.sale_price) > parseFloat(form.price) && (
                  <p className="text-[11px] text-error mt-1.5 font-label">Sale price is higher than price</p>
                )}
              </div>
            </div>
            {form.sale_price && form.price && parseFloat(form.sale_price) < parseFloat(form.price) && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-success/8 border border-success/20">
                <span className="text-[11px] font-semibold text-success font-label">
                  {Math.round((1 - parseFloat(form.sale_price) / parseFloat(form.price)) * 100)}% OFF
                </span>
                <span className="text-[11px] text-success/70 font-label">· customers save NPR {(parseFloat(form.price) - parseFloat(form.sale_price)).toLocaleString()}</span>
              </div>
            )}
          </SectionCard>

          {/* ── 3. Stock ── */}
          <SectionCard icon={Package} title="Stock">
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-on-surface-variant/80 uppercase tracking-wider font-label">
                {form.hasSizes ? `By size · Total: ${totalSizeStock} units` : 'Simple quantity'}
              </span>
              <button
                type="button"
                onClick={() => setForm((f) => ({
                  ...f,
                  hasSizes: !f.hasSizes,
                  sizeStocks: !f.hasSizes ? Object.fromEntries(DEFAULT_SIZES.map((s) => [s, ''])) : {},
                  stock: '',
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${form.hasSizes ? 'bg-primary' : 'bg-outline-variant'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${form.hasSizes ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {form.hasSizes ? (
              <div className="space-y-3">
                {DEFAULT_SIZES.map((sz) => (
                  <div key={sz} className="flex items-center gap-3">
                    <div className="w-12 h-11 rounded-xl bg-surface-container border border-outline-variant/40 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-on-surface font-label">{sz}</span>
                    </div>
                    <div className="flex-1">
                      <StepInput
                        value={form.sizeStocks[sz] ?? ''}
                        onChange={(v) => setForm((f) => ({ ...f, sizeStocks: { ...f.sizeStocks, [sz]: v } }))}
                        placeholder="0"
                      />
                    </div>
                    {parseInt(form.sizeStocks[sz] || '0') > 0 && (
                      <span className="text-[10px] font-semibold text-success font-label whitespace-nowrap">
                        {form.sizeStocks[sz]} in stock
                      </span>
                    )}
                  </div>
                ))}
                {totalSizeStock > 0 && (
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-primary/6 border border-primary/20 mt-2">
                    <span className="text-[12px] font-semibold text-primary font-label">Total Stock</span>
                    <span className="text-[13px] font-bold text-primary font-label">{totalSizeStock} units</span>
                  </div>
                )}
              </div>
            ) : (
              <StepInput
                value={form.stock}
                onChange={(v) => setForm((f) => ({ ...f, stock: v }))}
                placeholder="e.g. 50"
              />
            )}
          </SectionCard>

          {/* ── 4. Images ── */}
          <SectionCard icon={ImageIcon} title={`Product Images (${keptImages.length + imagePreviews.length} / ${MAX_IMAGES})`}>
            {/* Image grid — existing kept + new previews + add slot */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Kept existing images */}
              {keptImages.map((img, i) => (
                <div key={`kept-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-outline-variant/40 group">
                  <Image src={img.url} alt="" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                  <button
                    type="button"
                    onClick={() => removeKeptImage(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/90"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold font-label bg-black/60 text-white px-1.5 py-0.5 rounded-full">MAIN</span>
                  )}
                </div>
              ))}

              {/* New image previews */}
              {imagePreviews.map((src, i) => (
                <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-primary/40 group">
                  <Image src={src} alt="" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/90"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold font-label bg-primary/80 text-white px-1.5 py-0.5 rounded-full">NEW</span>
                </div>
              ))}

              {/* Add slot — only show if under max */}
              {keptImages.length + imagePreviews.length < MAX_IMAGES && (
                <div
                  className="aspect-square rounded-xl border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleFileChange(e.dataTransfer.files) }}
                >
                  <Upload className="w-5 h-5 text-on-surface-variant/40 group-hover:text-primary transition-colors mb-1" />
                  <span className="text-[10px] font-label text-on-surface-variant/40 group-hover:text-primary transition-colors">Add photo</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-on-surface-variant/50 font-label">
              First image is the main thumbnail · PNG, JPG, WebP up to 10 MB
            </p>
            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => { handleFileChange(e.target.files); if(fileRef.current) fileRef.current.value = '' }} />
          </SectionCard>

          {/* ── 5. Tags ── */}
          <SectionCard icon={Tag} title="Tags & Labels">
            <div className="flex gap-3">
              {['best_seller', 'express'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setForm((f) => ({
                    ...f,
                    tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag]
                  }))}
                  className={`px-4 py-2 rounded-xl text-[12px] font-bold tracking-wide uppercase transition-all ${
                    form.tags.includes(tag) ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {tag.replace('_', ' ')}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-on-surface-variant/50 font-label mt-3">These tags will display as visual badges on the product card.</p>
          </SectionCard>

          {/* ── 6. Visibility ── */}
          <div
            className={`flex items-center justify-between px-5 py-4 rounded-2xl border cursor-pointer transition-all ${form.is_active ? 'border-success/30 bg-success/5' : 'border-outline-variant/40 bg-surface-container-lowest'}`}
            onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full transition-colors ${form.is_active ? 'bg-success' : 'bg-outline-variant'}`} />
              <div>
                <p className="text-sm font-semibold text-on-surface font-label">{form.is_active ? 'Active' : 'Hidden'}</p>
                <p className="text-xs text-on-surface-variant/70 font-label">{form.is_active ? 'Visible in store' : 'Not visible to customers'}</p>
              </div>
            </div>
            <button
              type="button"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${form.is_active ? 'bg-success' : 'bg-outline-variant'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-11 bg-primary text-white text-sm font-semibold rounded-xl font-label hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                : editing ? 'Update Product' : 'Create Product'
              }
            </button>
            <button
              onClick={() => setDrawerOpen(false)}
              className="px-5 h-11 border border-outline-variant text-on-surface text-sm font-label font-medium rounded-xl hover:bg-surface-container transition-all"
            >
              Cancel
            </button>
          </div>

          {editing && (
            <div className="space-y-2">
              <button
                onClick={async () => {
                  const res = await fetch('/api/admin/seed-reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product_id: editing.id, count: 8 }),
                  })
                  const json = await res.json()
                  if (res.ok) alert(`${json.inserted} demo reviews added!`)
                  else alert(json.error ?? 'Failed to seed reviews')
                }}
                className="w-full h-10 text-sm text-primary font-label font-medium hover:bg-primary/8 rounded-xl transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-primary/20"
              >
                Generate Demo Reviews
              </button>
              <button
                onClick={() => setDeleteConfirm(editing.id)}
                className="w-full h-10 text-sm text-error font-label font-medium hover:bg-error/8 rounded-xl transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-error/20"
              >
                <Trash2 className="w-4 h-4" /> Delete Product
              </button>
            </div>
          )}
        </div>
      </AdminDrawer>

      {/* ═══ Delete Confirm Dialog ═══ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-on-background/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl p-7 max-w-sm w-full shadow-lift border border-outline-variant/20 animate-slide-up">
            <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center mb-4">
              <Trash2 className="w-5 h-5 text-error" />
            </div>
            <h4 className="font-headline text-xl font-bold text-on-surface mb-2">Delete Product?</h4>
            <p className="text-sm text-on-surface-variant font-body mb-6 leading-relaxed">This action cannot be undone. The product will be permanently removed from your store.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 h-11 bg-error text-white text-sm font-label font-semibold rounded-xl hover:bg-error/90 active:scale-[0.98] transition-all"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 h-11 border border-outline-variant text-on-surface text-sm font-label font-medium rounded-xl hover:bg-surface-container transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
