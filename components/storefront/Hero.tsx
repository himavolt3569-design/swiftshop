"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Product } from "@/lib/types";

const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (el)
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - 60,
      behavior: "smooth",
    });
};

export function Hero() {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, price, sale_price, images, stock")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setFeatured(data as Product[]);
      });
  }, []);

  return (
    <section className="bg-[#FAFAF9] border-b border-stone-100 py-8 px-4 md:px-8">
      {/* Minimal header */}
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-baseline justify-between mb-6">
          <p className="text-[10px] uppercase tracking-[0.4em] text-stone-400 font-medium">
            New Arrivals
          </p>
          <button
            onClick={() => scrollTo("products")}
            className="text-[11px] text-orange-600 hover:text-orange-700 font-medium tracking-wide transition-colors"
          >
            View All →
          </button>
        </div>

        {/* Product strip */}
        {featured.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {featured.map((p) => {
              const img = (p.images as { url: string }[])?.[0]?.url;
              const price = p.sale_price ?? p.price;
              const discount = p.sale_price
                ? Math.round(((p.price - p.sale_price) / p.price) * 100)
                : null;
              return (
                <button
                  key={p.id}
                  onClick={() => scrollTo("products")}
                  className="group text-left"
                >
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-stone-100 relative mb-2">
                    {discount && (
                      <span className="absolute top-1.5 left-1.5 z-10 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded leading-none">
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
                      <div className="w-full h-full flex items-center justify-center text-2xl text-stone-300">
                        {p.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-stone-700 line-clamp-1 leading-snug">
                    {p.name}
                  </p>
                  <p className="text-[11px] text-orange-600 font-semibold mt-0.5">
                    NPR {price.toLocaleString()}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-stone-200 rounded-lg mb-2" />
                <div className="h-2.5 bg-stone-200 rounded w-3/4 mb-1" />
                <div className="h-2.5 bg-stone-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
