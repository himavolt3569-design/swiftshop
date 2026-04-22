'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { ShopSettings } from '@/lib/types'
import { gsap, ScrollTrigger } from '@/lib/gsap'

const scrollTo = (id: string) => {
  const el = document.getElementById(id)
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'smooth' })
}

export function Footer() {
  const [activeProvinces, setActiveProvinces] = useState<string[]>([])
  const [settings, setSettings] = useState<ShopSettings | null>(null)
  const footerRef = useRef<HTMLElement>(null)

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

  // GSAP entrance
  useEffect(() => {
    if (!footerRef.current) return
    const ctx = gsap.context(() => {
      gsap.from('.footer-col', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 90%',
          once: true,
        },
      })
    }, footerRef)
    return () => ctx.revert()
  }, [])

  const year = new Date().getFullYear()
  const contactEmail = settings?.contact_email

  const socialLinks = [
    { label: 'Instagram', url: settings?.instagram_url, icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
    { label: 'Facebook', url: settings?.facebook_url, icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg> },
    { label: 'TikTok', url: settings?.tiktok_url, icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M9 12a4 4 0 104 4V4a5 5 0 005 5"/></svg> },
  ].filter((s) => s.url)

  return (
    <footer ref={footerRef} className="gradient-dark pt-14 pb-6 px-8">
      <div className="max-w-screen-2xl mx-auto">
        {/* Three columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {/* Brand */}
          <div className="footer-col">
            <h3 className="font-logo font-black italic text-[22px] text-white mb-3 tracking-tighter">Goreto.store</h3>
            <p className="text-[13px] text-white/50 font-body leading-relaxed max-w-[260px]">
              Curated essentials from the finest artisans across Nepal. Fast delivery, real tracking.
            </p>
            {socialLinks.length > 0 && (
              <div className="flex gap-4 mt-6">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="text-white/40 hover:text-accent transition-colors duration-300"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="footer-col">
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/30 font-display font-semibold mb-5">Shop</p>
            <ul className="space-y-2.5">
              {[
                { label: 'All Products', action: () => scrollTo('products') },
                { label: 'Categories',  action: () => scrollTo('products') },
                { label: 'Track Order', action: () => { window.location.href = '/track' } },
                ...(contactEmail
                  ? [{ label: 'Contact Us', action: () => { window.location.href = `mailto:${contactEmail}` } }]
                  : []),
              ].map((link) => (
                <li key={link.label}>
                  <button
                    onClick={link.action}
                    className="text-[13px] text-white/60 hover:text-accent transition-colors duration-300 font-body relative group"
                  >
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-accent transition-all duration-300 group-hover:w-full" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Delivery areas */}
          <div className="footer-col">
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/30 font-display font-semibold mb-5">We Deliver To</p>
            {activeProvinces.length > 0 ? (
              <ul className="space-y-2">
                {activeProvinces.map((p) => (
                  <li key={p} className="text-[13px] text-white/50 font-body">{p}</li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2">
                {['Province 3 - Bagmati', 'Province 4 - Gandaki', 'Province 5 - Lumbini'].map((p) => (
                  <li key={p} className="text-[13px] text-white/50 font-body">{p}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-white/30 font-body">&copy; {year} Goreto.store. All rights reserved.</p>
          <p className="text-[11px] text-white/30 font-body">Built with care in Nepal</p>
        </div>
      </div>
    </footer>
  )
}
