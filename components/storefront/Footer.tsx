'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ShopSettings } from '@/lib/types'

const scrollTo = (id: string) => {
  const el = document.getElementById(id)
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'smooth' })
}

export function Footer() {
  const [activeProvinces, setActiveProvinces] = useState<string[]>([])
  const [settings, setSettings] = useState<ShopSettings | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: provinces }, { data: shopSettings }] = await Promise.all([
        supabase.rpc('get_active_delivery_provinces'),
        supabase.from('shop_settings').select('*').single(),
      ])
      setActiveProvinces((provinces as string[]) ?? [])
      if (shopSettings) setSettings(shopSettings as ShopSettings)
    }
    fetchData()
  }, [])

  const year = new Date().getFullYear()
  const contactEmail = settings?.contact_email

  const socialLinks = [
    { label: 'Instagram', url: settings?.instagram_url, icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
    { label: 'Facebook', url: settings?.facebook_url, icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg> },
    { label: 'TikTok', url: settings?.tiktok_url, icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M9 12a4 4 0 104 4V4a5 5 0 005 5"/></svg> },
  ].filter((s) => s.url)

  return (
    <footer className="bg-dark-surface pt-12 pb-6 px-8">
      <div className="max-w-screen-2xl mx-auto">
        {/* Three columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <h3 className="font-headline font-black italic text-[22px] text-white mb-3 tracking-tighter">Swift Shop</h3>
            <p className="text-[13px] text-white/60 font-body leading-relaxed max-w-[240px]">
              Curated essentials from the finest artisans across Nepal. Fast delivery, real tracking.
            </p>
            {socialLinks.length > 0 && (
              <div className="flex gap-4 mt-5">
                {socialLinks.map((s) => (
                  <a key={s.label} href={s.url!} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="text-white/50 hover:text-primary-container transition-colors">
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div>
            <p className="text-[13px] uppercase tracking-[0.2em] text-white/40 font-label font-medium mb-4">Shop</p>
            <ul className="space-y-2">
              {[
                { label: 'All Products', action: () => scrollTo('products') },
                { label: 'Categories',  action: () => scrollTo('products') },
                { label: 'Track Order', action: () => scrollTo('tracking') },
                ...(contactEmail
                  ? [{ label: 'Contact Us', action: () => { window.location.href = `mailto:${contactEmail}` } }]
                  : []),
              ].map((link) => (
                <li key={link.label}>
                  <button
                    onClick={link.action}
                    className="text-[13px] text-white/70 hover:text-primary-container hover:underline underline-offset-2 transition-colors font-body"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Delivery areas */}
          <div>
            <p className="text-[13px] uppercase tracking-[0.2em] text-white/40 font-label font-medium mb-4">We Deliver To</p>
            {activeProvinces.length > 0 ? (
              <ul className="space-y-1.5">
                {activeProvinces.map((p) => (
                  <li key={p} className="text-[13px] text-white/60 font-body">{p}</li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-1.5">
                {['Province 3 - Bagmati', 'Province 4 - Gandaki', 'Province 5 - Lumbini'].map((p) => (
                  <li key={p} className="text-[13px] text-white/60 font-body">{p}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-white/40 font-body">&copy; {year} Swift Shop. All rights reserved.</p>
          <p className="text-[11px] text-white/40 font-body">Built with care in Nepal</p>
        </div>
      </div>
    </footer>
  )
}
