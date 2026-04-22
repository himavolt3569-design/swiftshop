"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Product } from "@/lib/types";
import { ArrowRight, Sparkles, ShoppingBag } from "lucide-react";
import { ProductDetailModal } from "./ProductDetailModal";
import { gsap } from "@/lib/gsap";

const AUTO_PLAY_INTERVAL = 6000;

function pushProductUrl(slug: string) {
  window.history.pushState(null, '', '/p/' + slug)
}
function clearProductUrl() {
  if (window.location.pathname.startsWith('/p/')) {
    window.history.pushState(null, '', '/')
  }
}

export function Hero() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selected, setSelected] = useState<Product | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const selectProduct = (p: Product) => { pushProductUrl(p.slug); setSelected(p) }
  const closeModal    = () => { clearProductUrl(); setSelected(null) }

  useEffect(() => {
    supabase
      .from("products")
      .select("*, category:categories(id, name, slug), images, sizes")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setFeatured(data as Product[]);
      });
  }, []);

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % featured.length);
  }, [featured.length]);

  useEffect(() => {
    if (featured.length <= 1 || isPaused) return;
    timerRef.current = setInterval(nextSlide, AUTO_PLAY_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [featured.length, isPaused, nextSlide, activeIndex]); // activeIndex in deps to reset timer on manual switch

  // GSAP scroll entrance
  useEffect(() => {
    if (!sectionRef.current || featured.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.from('.hero-content', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.1,
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [featured.length]);

  if (featured.length === 0) {
    return (
      <section className="relative min-h-[70vh] md:min-h-[85vh] flex items-center justify-center overflow-hidden gradient-mesh">
        <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-8 py-12 flex flex-col md:flex-row gap-8 items-center">
          <div className="w-full md:w-1/2 space-y-6">
            <div className="h-4 w-32 skeleton-shimmer rounded-full" />
            <div className="h-16 md:h-24 w-full max-w-lg skeleton-shimmer rounded-2xl" />
            <div className="h-6 w-48 skeleton-shimmer rounded-lg" />
            <div className="h-14 w-40 skeleton-shimmer rounded-xl mt-8" />
          </div>
          <div className="w-full md:w-1/2 aspect-square md:aspect-[4/3] skeleton-shimmer rounded-3xl" />
        </div>
      </section>
    );
  }

  const activeProduct = featured[activeIndex];
  const price = activeProduct?.sale_price ?? activeProduct?.price;
  const imgUrl = (activeProduct?.images as { url: string }[])?.[0]?.url;

  return (
    <section 
      ref={sectionRef} 
      className="relative min-h-[75vh] md:min-h-[85vh] flex items-center overflow-hidden bg-surface"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background ambient glow that changes based on slide index */}
      <motion.div 
        key={`glow-${activeIndex}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none opacity-30 mix-blend-multiply"
        style={{
          background: `radial-gradient(circle, ${activeIndex % 2 === 0 ? 'var(--color-primary)' : 'var(--color-accent)'} 0%, transparent 70%)`,
          transform: 'translate(20%, -20%)'
        }}
      />
      
      {/* Mesh base layer */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      <div className="hero-content relative w-full max-w-screen-2xl mx-auto px-4 md:px-8 py-12 md:py-20 z-10 flex flex-col md:flex-row items-center gap-10 md:gap-16">
        
        {/* LEFT: Text & CTA */}
        <div className="w-full md:w-1/2 flex flex-col items-start justify-center pt-8 md:pt-0 order-2 md:order-1">
          <div className="flex items-center gap-2 mb-6 md:mb-8 glass px-3 py-1.5 rounded-full shadow-float">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-on-surface font-display font-bold">
              Featured Pick
            </span>
          </div>

          <div className="min-h-[160px] md:min-h-[220px] w-full relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeProduct.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                {activeProduct.category?.name && (
                  <p className="text-primary font-display font-semibold tracking-widest uppercase text-xs mb-3">
                    {activeProduct.category.name}
                  </p>
                )}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-display font-black text-on-surface leading-[1.05] tracking-tight mb-6">
                  {activeProduct.name}
                </h1>
                
                <div className="flex items-baseline gap-3 mb-8">
                  <span className="text-2xl md:text-3xl font-display font-bold text-on-surface">
                    NPR {price.toLocaleString()}
                  </span>
                  {activeProduct.sale_price && (
                    <span className="text-sm md:text-base text-on-surface-variant/40 line-through font-display font-medium">
                      NPR {activeProduct.price.toLocaleString()}
                    </span>
                  )}
                </div>

                <motion.button
                  onClick={() => selectProduct(activeProduct)}
                  className="btn-gradient px-8 py-4 text-white text-sm md:text-base font-display font-bold rounded-2xl flex items-center gap-2 shadow-depth-lg group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Shop Now
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                </motion.button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT: Image Display */}
        <div className="w-full md:w-1/2 relative aspect-square md:aspect-[4/3] order-1 md:order-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeProduct.id}
              initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              <div className="relative w-full h-full rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl glass border border-white/20">
                {imgUrl ? (
                  <Image
                    src={imgUrl}
                    alt={activeProduct.name}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-surface-container text-8xl font-display text-on-surface-variant/10">
                    {activeProduct.name.charAt(0)}
                  </div>
                )}
                {/* Inner shadow overlay */}
                <div className="absolute inset-0 border border-black/5 rounded-[2rem] md:rounded-[3rem] pointer-events-none mix-blend-overlay" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* BOTTOM: Carousel Controls */}
      <div className="absolute bottom-6 md:bottom-10 left-0 right-0 px-4 md:px-8 z-20">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-3">
          {featured.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveIndex(idx);
                if (timerRef.current) clearInterval(timerRef.current);
              }}
              className="group relative h-1.5 flex-1 max-w-[4rem] rounded-full overflow-hidden bg-on-surface-variant/20 transition-all hover:h-2"
              aria-label={`Go to slide ${idx + 1}`}
            >
              {activeIndex === idx && (
                <motion.div
                  className="absolute inset-0 bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ 
                    duration: AUTO_PLAY_INTERVAL / 1000, 
                    ease: "linear",
                  }}
                  key={`progress-${activeIndex}`}
                />
              )}
            </button>
          ))}
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
