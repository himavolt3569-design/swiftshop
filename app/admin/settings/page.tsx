'use client'

import { useEffect, useState, useRef } from 'react'
import { Save, Upload, Globe, AtSign, Music2, Zap, Store, ChevronRight, Image as ImageIcon } from 'lucide-react'
import { supabase }     from '@/lib/supabase'
import { useSessionStore } from '@/store/sessionStore'
import { ShopSettings } from '@/lib/types'
import { gsap }         from '@/lib/gsap'

function Section({ title, description, icon, children }: { title: string; description: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="settings-card bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-black/[0.06]">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">{icon}</div>
        <div>
          <p className="text-sm font-bold text-[#1A1714] font-label">{title}</p>
          <p className="text-xs text-[#1A1714]/40 font-label">{description}</p>
        </div>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1714]/35 font-label mb-2">{label}</label>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-black/[0.02] rounded-xl border border-black/[0.06]">
      <div>
        <p className="text-sm font-semibold text-[#1A1714]/80 font-label">{label}</p>
        <p className="text-xs text-[#1A1714]/40 font-body mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${checked ? 'bg-primary' : 'bg-white/10'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<ShopSettings>>({})
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const { addToast } = useSessionStore()

  const inp = 'w-full bg-white border border-black/[0.1] rounded-xl px-3.5 py-2.5 text-sm text-[#1A1714]/80 font-label focus:outline-none focus:border-primary/40 transition-all placeholder:text-[#1A1714]/25'

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('shop_settings').select('*').single()
      if (data) setSettings(data as ShopSettings)
      setLoading(false)
    }
    fetch()
  }, [])

  useEffect(() => {
    if (!pageRef.current || loading) return
    const ctx = gsap.context(() => {
      gsap.from('.settings-card', { y: 24, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' })
    }, pageRef)
    return () => ctx.revert()
  }, [loading])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setSaving(true)
    let logoUrl = settings.logo_url
    if (logoFile) {
      const path = `logos/${Date.now()}-${logoFile.name}`
      const { error } = await supabase.storage.from('shop-assets').upload(path, logoFile)
      if (!error) {
        const { data } = supabase.storage.from('shop-assets').getPublicUrl(path)
        logoUrl = data.publicUrl
      }
    }
    const { error } = await supabase.from('shop_settings').upsert({ ...settings, logo_url: logoUrl })
    setSaving(false)
    if (error) addToast('error', 'Failed to save settings.')
    else addToast('success', 'Settings saved!')
  }

  const update = (key: keyof ShopSettings, value: unknown) => setSettings((s) => ({ ...s, [key]: value }))

  if (loading) return (
    <div className="space-y-4 max-w-2xl">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 bg-black/[0.04] rounded-2xl animate-pulse" />)}
    </div>
  )

  return (
    <div ref={pageRef}>
      {/* Header */}
      <div className="settings-card flex items-center justify-between mb-7">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#1A1714]/30 font-label mb-1">Configuration</p>
          <h1 className="text-2xl font-bold text-[#1A1714] font-label">Settings</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white text-sm font-label font-bold px-5 py-2.5 rounded-xl hover:bg-primary-container transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          {saving ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Store Identity */}
        <Section title="Store Identity" description="Brand name, tagline and logo" icon={<Store className="w-4 h-4" />}>
          <Field label="Shop Name">
            <input className={inp} value={settings.shop_name ?? ''} onChange={(e) => update('shop_name', e.target.value)} placeholder="Swift Shop" />
          </Field>
          <Field label="Tagline">
            <input className={inp} value={settings.shop_tagline ?? ''} onChange={(e) => update('shop_tagline', e.target.value)} placeholder="Curated essentials, delivered fast" />
          </Field>
          <Field label="Logo">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-black/[0.04] border border-black/[0.08] overflow-hidden flex items-center justify-center">
                {logoPreview || settings.logo_url
                  ? <img src={logoPreview ?? settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  : <ImageIcon className="w-6 h-6 text-[#1A1714]/20" />
                }
              </div>
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 bg-white border border-black/[0.1] rounded-xl px-4 py-2.5 text-sm text-[#1A1714]/50 font-label hover:bg-black/[0.04] hover:text-[#1A1714]/80 transition-all">
                <Upload className="w-4 h-4" /> Upload Logo
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              {logoFile && <span className="text-xs text-emerald-400 font-label">{logoFile.name}</span>}
            </div>
          </Field>
        </Section>

        {/* Contact */}
        <Section title="Contact Details" description="Visible to customers and used for notifications" icon={<Globe className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact Email">
              <input type="email" className={inp} value={settings.contact_email ?? ''} onChange={(e) => update('contact_email', e.target.value)} placeholder="hello@swiftshop.com" />
            </Field>
            <Field label="Contact Phone">
              <input type="tel" className={inp} value={settings.contact_phone ?? ''} onChange={(e) => update('contact_phone', e.target.value)} placeholder="98XXXXXXXX" />
            </Field>
          </div>
        </Section>

        {/* Social Media */}
        <Section title="Social Media" description="Links shown in your storefront footer" icon={<AtSign className="w-4 h-4" />}>
          <Field label="Instagram">
            <div className="flex items-center gap-2.5 bg-white border border-black/[0.1] rounded-xl px-3.5 py-2.5 focus-within:border-primary/40 transition-all">
              <AtSign className="w-4 h-4 text-[#1A1714]/25 shrink-0" />
              <input type="url" value={settings.instagram_url ?? ''} onChange={(e) => update('instagram_url', e.target.value)} placeholder="https://instagram.com/yourpage" className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-[#1A1714]/70 placeholder:text-[#1A1714]/25 flex-1 font-label" style={{ outline: 'none' }} />
            </div>
          </Field>
          <Field label="Facebook">
            <div className="flex items-center gap-2.5 bg-white border border-black/[0.1] rounded-xl px-3.5 py-2.5 focus-within:border-primary/40 transition-all">
              <Globe className="w-4 h-4 text-[#1A1714]/25 shrink-0" />
              <input type="url" value={settings.facebook_url ?? ''} onChange={(e) => update('facebook_url', e.target.value)} placeholder="https://facebook.com/yourpage" className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-[#1A1714]/70 placeholder:text-[#1A1714]/25 flex-1 font-label" style={{ outline: 'none' }} />
            </div>
          </Field>
          <Field label="TikTok">
            <div className="flex items-center gap-2.5 bg-white border border-black/[0.1] rounded-xl px-3.5 py-2.5 focus-within:border-primary/40 transition-all">
              <Music2 className="w-4 h-4 text-[#1A1714]/25 shrink-0" />
              <input type="url" value={settings.tiktok_url ?? ''} onChange={(e) => update('tiktok_url', e.target.value)} placeholder="https://tiktok.com/@yourpage" className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-[#1A1714]/70 placeholder:text-[#1A1714]/25 flex-1 font-label" style={{ outline: 'none' }} />
            </div>
          </Field>
        </Section>

        {/* Features */}
        <Section title="Features" description="Toggle storefront features on or off" icon={<Zap className="w-4 h-4" />}>
          <Toggle
            checked={settings.live_feed_enabled ?? true}
            onChange={(v) => update('live_feed_enabled', v)}
            label="Live Order Feed"
            description="Show the scrolling ticker on the storefront"
          />
        </Section>

        {/* Save bar */}
        <div className="settings-card flex items-center justify-between p-4 bg-white border border-black/[0.07] rounded-2xl">
          <p className="text-sm text-[#1A1714]/35 font-label">All changes are saved to your Supabase database.</p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 text-sm font-label font-bold text-primary hover:text-primary/80 transition-colors"
          >
            Save <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
