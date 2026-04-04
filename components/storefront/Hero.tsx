"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Product } from "@/lib/types";
import { ArrowRight, Sparkles } from "lucide-react";
import { ProductDetailModal } from "./ProductDetailModal";

const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (el)
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - 60,
      behavior: "smooth",
    });
};

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
  const [selected, setSelected] = useState<Product | null>(null);

  const selectProduct = (p: Product) => { pushProductUrl(p.slug); setSelected(p) }
  const closeModal    = () => { clearProductUrl(); setSelected(null) }

  useEffect(() => {
    supabase
      .from("products")
      .select("*, category:categories(id, name, slug), images, sizes")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setFeatured(data as Product[]);
      });
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#FAFAF8] border-b border-stone-100">
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.015] bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_0)] [background-size:24px_24px]" />

      <div className="relative max-w-screen-2xl mx-auto px-4 md:px-8 py-8 md:py-10">
        {/* Top strip */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] md:text-[11px] uppercase tracking-[0.4em] text-stone-400 font-medium">
              New Arrivals
            </span>
          </div>
          <button
            onClick={() => scrollTo("products")}
            className="group flex items-center gap-1.5 text-[11px] md:text-xs text-primary hover:text-primary/80 font-semibold tracking-wide transition-colors"
          >
            Shop All
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Product strip */}
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-6 gap-2.5 md:gap-4">
            {featured.map((p, i) => {
              const img = (p.images as { url: string }[])?.[0]?.url;
              const price = p.sale_price ?? p.price;
              const discount = p.sale_price
                ? Math.round(((p.price - p.sale_price) / p.price) * 100)
                : null;

              return (
                <button
                  key={p.id}
                  onClick={() => selectProduct(p)}
                  className="group text-left"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-stone-100 relative mb-2.5 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
                    {/* Discount badge */}
                    {discount && (
                      <span className="absolute top-1.5 left-1.5 z-10 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                        -{discount}%
                      </span>
                    )}
                    {img ? (
                      <Image
                        src={img}
                        alt={p.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 33vw, 16vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-stone-300 font-bold">
                        {p.name.charAt(0)}
                      </div>
                    )}
                    {/* Hover gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <p className="text-xs md:text-[13px] font-semibold text-stone-700 line-clamp-1 leading-snug mb-0.5">
                    {p.name}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-xs md:text-sm text-primary font-bold">
                      NPR {price.toLocaleString()}
                    </p>
                    {p.sale_price && (
                      <p className="text-[10px] text-stone-400 line-through">
                        {p.price.toLocaleString()}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-6 gap-2.5 md:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-stone-200 rounded-xl mb-2.5" />
                <div className="h-3 bg-stone-200 rounded w-3/4 mb-1.5" />
                <div className="h-3 bg-stone-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

      </div>

      <ProductDetailModal
        product={selected}
        onClose={closeModal}
        onBuyNow={() => {
          closeModal();
          scrollTo("checkout");
        }}
        onSelectProduct={selectProduct}
      />
    </section>
  );
}
