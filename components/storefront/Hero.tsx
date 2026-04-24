"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/lib/types";
import {
  TrendingUp, Smartphone, Shirt, Home, Coffee, Monitor,
  Watch, Gift, Box, Sparkles, Heart, ShoppingBag, Gem,
  Palette, Baby, Dumbbell, Wrench, Leaf, Laptop, Headphones, Camera,
} from "lucide-react";
import { ProductDetailModal } from "./ProductDetailModal";
import { SearchBar } from "@/components/shared/SearchBar";
import { gsap } from "@/lib/gsap";

function pushProductUrl(slug: string) {
  window.history.pushState(null, "", "/p/" + slug);
}
function clearProductUrl() {
  if (window.location.pathname.startsWith("/p/")) {
    window.history.pushState(null, "", "/");
  }
}

const ICON_MAP: Record<string, React.ElementType> = {
  electronics: Monitor, smartphones: Smartphone, phone: Smartphone,
  fashion: Shirt, clothing: Shirt, home: Home, kitchen: Coffee,
  accessories: Watch, watch: Watch, jewelry: Gem, gifts: Gift,
  beauty: Sparkles, health: Heart, cosmetics: Palette, baby: Baby,
  kids: Baby, sports: Dumbbell, fitness: Dumbbell, tools: Wrench,
  garden: Leaf, outdoor: Leaf, computer: Laptop, laptop: Laptop,
  office: Laptop, audio: Headphones, camera: Camera, bags: ShoppingBag,
  appliances: Home,
};

function getIcon(slug: string, name: string): React.ElementType {
  if (ICON_MAP[slug]) return ICON_MAP[slug];
  for (const [k, v] of Object.entries(ICON_MAP)) {
    if (slug.includes(k) || name.toLowerCase().includes(k)) return v;
  }
  return Box;
}

interface HeroProps {
  activeCategoryId?: string | null;
  onCategoryChange?: (categoryId: string | null) => void;
}

export function Hero({ activeCategoryId, onCategoryChange }: HeroProps) {
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const selectProduct = (p: Product) => { pushProductUrl(p.slug); setSelected(p); };
  const closeModal = () => { clearProductUrl(); setSelected(null); };

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => { if (data) setCategories(data); });
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-stagger", { y: 20, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" });
    }, sectionRef);
    return () => ctx.revert();
  }, [categories]);

  const handleCategoryClick = (catId: string) => {
    const isCurrentlyActive = activeCategoryId === catId;
    const newCatId = isCurrentlyActive ? null : catId;
    
    onCategoryChange?.(newCatId);
    const params = new URLSearchParams(window.location.search);
    if (newCatId) {
      params.set("category", newCatId);
    } else {
      params.delete("category");
    }
    window.history.pushState(null, "", params.toString() ? "?" + params.toString() : "/");
  };

  return (
    <section ref={sectionRef} className="relative pt-6 pb-2 md:pt-8 md:pb-4 bg-surface overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />
      <div className="relative max-w-screen-2xl mx-auto">
        {/* Explore Categories — scrollable on mobile */}
        <div className="hero-stagger">
          <div className="flex items-center justify-between mb-4 px-4 md:px-8">
            <h3 className="text-sm font-display font-bold text-on-surface flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Explore Categories
            </h3>
            <button
              onClick={() => {
                onCategoryChange?.(null);
                const params = new URLSearchParams(window.location.search);
                params.delete("category");
                window.history.pushState(null, "", params.toString() ? "?" + params.toString() : "/");
              }}
              className="text-xs font-display font-semibold text-primary hover:text-primary/70 transition-colors"
            >
              See All
            </button>
          </div>
          <div className="flex overflow-x-auto no-scrollbar gap-2.5 pb-2 px-4 md:px-8 snap-x snap-mandatory scroll-smooth">
            {categories.length > 0
              ? categories.map((cat) => {
                  const Icon = getIcon(cat.slug, cat.name);
                  const isActive = activeCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all duration-200 shrink-0 group snap-start cursor-pointer active:scale-[0.97] ${
                        isActive
                          ? "bg-primary border-primary shadow-glow-sm"
                          : "bg-white border-black/5 hover:border-primary/30 hover:shadow-md"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-sm font-display font-semibold whitespace-nowrap ${
                          isActive ? "text-white" : "text-on-surface"
                        }`}
                      >
                        {cat.name}
                      </span>
                    </button>
                  );
                })
              : Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-36 h-12 rounded-2xl skeleton-shimmer shrink-0" />
                ))}
          </div>
        </div>
      </div>

      <ProductDetailModal
        product={selected}
        onClose={closeModal}
        onBuyNow={() => { closeModal(); window.location.href = "/checkout"; }}
        onSelectProduct={selectProduct}
      />
    </section>
  );
}
