"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Product } from "@/lib/types";
import { Search, ChevronRight, TrendingUp, Sparkles, Smartphone, Shirt, Home, Coffee, Monitor, Watch, Gift, Box } from "lucide-react";
import { ProductDetailModal } from "./ProductDetailModal";
import { SearchBar } from "@/components/shared/SearchBar";
import { gsap } from "@/lib/gsap";

const AUTO_PLAY_INTERVAL = 5000;

function pushProductUrl(slug: string) {
  window.history.pushState(null, '', '/p/' + slug)
}
function clearProductUrl() {
  if (window.location.pathname.startsWith('/p/')) {
    window.history.pushState(null, '', '/')
  }
}

// Map some common category slugs to icons for the Zomato feel
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'electronics': Monitor,
  'smartphones': Smartphone,
  'fashion': Shirt,
  'clothing': Shirt,
  'home': Home,
  'kitchen': Coffee,
  'accessories': Watch,
  'gifts': Gift,
};

export function Hero() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string, slug: string}[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selected, setSelected] = useState<Product | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const selectProduct = (p: Product) => { pushProductUrl(p.slug); setSelected(p) }
  const closeModal    = () => { clearProductUrl(); setSelected(null) }

  // Fetch initial data
  const fetchData = useCallback(async () => {
    const [prodRes, catRes] = await Promise.all([
      supabase
        .from("products")
        .select("*, category:categories(id, name, slug), images, sizes")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("categories")
        .select("id, name, slug")
        .order("name", { ascending: true })
        .limit(8)
    ]);
    if (prodRes.data) setFeatured(prodRes.data as Product[]);
    if (catRes.data) setCategories(catRes.data);
  }, []);

  useEffect(() => {
    fetchData();

    // Listen for new products to keep promos fresh
    const channel = supabase
      .channel('hero-super-app')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, () => {
        fetchData();
        setActiveIndex(0);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel) };
  }, [fetchData]);

  // Auto-play for the promo banners
  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % (featured.length || 1));
  }, [featured.length]);

  useEffect(() => {
    if (featured.length <= 1) return;
    timerRef.current = setInterval(nextSlide, AUTO_PLAY_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [featured.length, nextSlide, activeIndex]);

  // GSAP scroll entrance
  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.stagger-fade', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [categories, featured]);

  return (
    <section ref={sectionRef} className="relative pt-24 pb-8 md:pt-32 md:pb-12 bg-surface overflow-hidden">
      {/* Subtle background texture/gradient */}
      <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />
      
      <div className="relative max-w-screen-2xl mx-auto px-4 md:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COL: Search & Utility (Zomato/Uber style) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-center">
            
            <h1 className="stagger-fade text-4xl md:text-5xl lg:text-6xl font-display font-black text-on-surface tracking-tight leading-[1.1] mb-6">
              Get exactly what <br className="hidden md:block"/> you're looking for.
            </h1>

            {/* Premium Smart Search Bar */}
            <div className="stagger-fade mb-10 w-full relative z-50">
              <SearchBar variant="hero" onSelect={selectProduct} />
            </div>

            {/* Quick Categories (Daraz style pills) */}
            <div className="stagger-fade">
              <div className="flex items-center justify-between mb-4 pr-2">
                <h3 className="text-sm font-display font-bold text-on-surface flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Explore Categories
                </h3>
                <button className="text-xs font-display font-semibold text-primary hover:text-primary/70">
                  See All
                </button>
              </div>
              
              <div className="flex overflow-x-auto no-scrollbar gap-3 pb-4 -mx-4 px-4 md:mx-0 md:px-0 mask-edges">
                {categories.length > 0 ? categories.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.slug] || Box;
                  return (
                    <button 
                      key={cat.id}
                      onClick={() => window.location.href = `/?category=${cat.slug}`}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white border border-black/5 hover:border-primary/30 hover:shadow-md transition-all duration-200 shrink-0 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white text-primary transition-colors duration-200">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-display font-semibold text-on-surface whitespace-nowrap">
                        {cat.name}
                      </span>
                    </button>
                  )
                }) : (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="w-32 h-14 rounded-2xl skeleton-shimmer shrink-0" />
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COL: Promo Banners (Uber/Daraz hybrid) */}
          <div className="lg:col-span-5 xl:col-span-4 relative">
            <div className="stagger-fade relative w-full aspect-[4/5] md:aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-white shadow-2xl border border-black/[0.03]">
              
              {featured.length > 0 ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="absolute inset-0 flex flex-col"
                    >
                      {/* Banner Image Half */}
                      <div className="relative h-3/5 w-full bg-surface-container overflow-hidden group cursor-pointer" onClick={() => selectProduct(featured[activeIndex])}>
                        {featured[activeIndex]?.images?.[0] ? (
                          <Image 
                            src={(featured[activeIndex].images as any)[0].url} 
                            alt={featured[activeIndex].name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-6xl text-on-surface-variant/20 font-display">
                            {featured[activeIndex]?.name.charAt(0)}
                          </div>
                        )}
                        <div className="absolute top-4 left-4 bg-accent/90 backdrop-blur-md text-on-accent text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">
                          Hot Deal
                        </div>
                      </div>

                      {/* Banner Details Half */}
                      <div className="relative h-2/5 w-full bg-white p-6 flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-display font-bold text-primary uppercase tracking-wider mb-2">
                            {featured[activeIndex]?.category?.name || "Featured"}
                          </p>
                          <h4 className="text-xl md:text-2xl font-display font-bold text-on-surface line-clamp-2 leading-snug cursor-pointer hover:text-primary transition-colors" onClick={() => selectProduct(featured[activeIndex])}>
                            {featured[activeIndex]?.name}
                          </h4>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex flex-col">
                            <span className="text-lg font-display font-black text-on-surface">
                              NPR {(featured[activeIndex]?.sale_price ?? featured[activeIndex]?.price)?.toLocaleString()}
                            </span>
                            {featured[activeIndex]?.sale_price && (
                              <span className="text-xs text-on-surface-variant/50 line-through font-display font-medium">
                                NPR {featured[activeIndex]?.price.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={() => selectProduct(featured[activeIndex])}
                            className="w-10 h-10 rounded-full bg-on-surface hover:bg-primary text-surface flex items-center justify-center transition-colors shadow-depth-sm"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Banner Controls */}
                  <div className="absolute bottom-6 left-6 right-6 flex items-center justify-center gap-2 z-10">
                    {featured.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveIndex(idx);
                          if (timerRef.current) clearInterval(timerRef.current);
                        }}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          activeIndex === idx ? "w-8 bg-primary" : "w-2 bg-on-surface-variant/20 hover:bg-primary/50"
                        }`}
                        aria-label={`Promo ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col">
                  <div className="h-3/5 skeleton-shimmer" />
                  <div className="h-2/5 p-6 space-y-4">
                    <div className="w-20 h-4 skeleton-shimmer rounded" />
                    <div className="w-3/4 h-6 skeleton-shimmer rounded" />
                    <div className="w-1/2 h-8 skeleton-shimmer rounded mt-auto" />
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      <ProductDetailModal
        product={selected}
        onClose={closeModal}
        onBuyNow={() => {
          closeModal();
          window.location.href = '/checkout';
        }}
        onSelectProduct={selectProduct}
      />
    </section>
  );
}
