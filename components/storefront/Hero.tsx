"use client";

import { useEffect, useRef } from "react";

const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (el)
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - 60,
      behavior: "smooth",
    });
};

const stats = [
  { value: "2,400+", label: "Happy Customers" },
  { value: "150+", label: "Artisan Products" },
  { value: "24hr", label: "Fast Delivery" },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
      section.style.setProperty("--mx", `${x}px`);
      section.style.setProperty("--my", `${y}px`);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[92vh] bg-[#FAFAF9] overflow-hidden flex items-center font-sans selection:bg-orange-200"
      style={{ "--mx": "0px", "--my": "0px" } as React.CSSProperties}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large warm gradient orb */}
        <div
          className="absolute -top-32 -right-32 w-[800px] h-[800px] rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #fed7aa 0%, #ffedd5 50%, transparent 100%)",
            transform:
              "translate(calc(var(--mx) * 1.5), calc(var(--my) * 1.5))",
            transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
        {/* Secondary accent orb */}
        <div
          className="absolute bottom-0 -left-32 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
          style={{
            background: "radial-gradient(circle, #fdba74 0%, transparent 70%)",
            transform:
              "translate(calc(var(--mx) * -0.8), calc(var(--my) * -0.8))",
            transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
        {/* Subtle noise/grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(#431407 1px, transparent 1px), linear-gradient(90deg, #431407 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Decorative geometric shapes */}
      <div className="absolute top-24 right-[12%] w-16 h-16 border border-orange-900/10 rounded-full animate-pulse pointer-events-none" />
      <div
        className="absolute bottom-40 left-[8%] w-2 h-2 bg-orange-600/30 rounded-full animate-ping pointer-events-none"
        style={{ animationDuration: "3s" }}
      />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
          {/* Left - Copy */}
          <div className="w-full lg:w-[55%] pt-12 lg:pt-0">
            {/* Headline */}
            <h1 className="mt-8 font-bold text-stone-900 text-5xl sm:text-6xl lg:text-[4.25rem] leading-[1.1] tracking-tight">
              Discover the Art of <br className="hidden sm:block" />
              <span className="relative inline-block mt-2">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 font-serif italic pr-2">
                  Curated Living
                </span>
                <span className="absolute bottom-2 left-0 right-0 h-4 bg-orange-100/60 -z-10 rounded-sm transform -rotate-1" />
              </span>
            </h1>

            {/* Subtext */}
            <p className="mt-6 text-stone-500 text-lg sm:text-xl max-w-lg leading-relaxed font-light">
              Handpicked essentials from Nepal's finest artisans. Where timeless
              tradition meets modern elegance - every piece tells a story.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <button
                onClick={() => scrollTo("products")}
                className="group relative bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-full font-medium text-sm transition-all duration-300 active:scale-[0.98] shadow-[0_0_20px_rgba(234,88,12,0.25)] hover:shadow-[0_0_25px_rgba(234,88,12,0.4)]"
              >
                <span className="flex items-center gap-2">
                  Explore Collection
                  <svg
                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              </button>
              <button
                onClick={() => scrollTo("tracking")}
                className="group flex items-center gap-2 text-stone-600 hover:text-orange-600 px-6 py-4 rounded-full font-medium text-sm transition-all duration-300 border border-stone-200 hover:border-orange-200 hover:bg-orange-50/50"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4"
                  />
                </svg>
                Track Order
              </button>
            </div>

            {/* Stats row */}
            <div className="mt-16 flex items-center gap-10 sm:gap-14 border-t border-stone-200/60 pt-8">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-stone-900 font-bold text-2xl sm:text-3xl tracking-tight">
                    {stat.value}
                  </span>
                  <span className="text-stone-500 text-xs sm:text-sm mt-1 font-medium">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Visual composition */}
          <div className="w-full lg:w-[45%] flex items-center justify-center mt-12 lg:mt-0">
            <div className="relative w-full max-w-md aspect-[4/5] sm:aspect-square lg:aspect-[4/5]">
              {/* Background decorative rings */}
              <div className="absolute -inset-4 rounded-full border border-orange-900/5" />
              <div
                className="absolute inset-8 rounded-full border border-dashed border-orange-900/10 animate-spin-slow"
                style={{ animationDuration: "40s" }}
              />

              {/* Main feature card */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-72 rounded-2xl overflow-hidden shadow-2xl z-20 bg-white border border-white/40 transition-transform duration-700 hover:scale-[1.02]"
                style={{
                  transform:
                    "translate(calc(-50% + var(--mx) * 0.4), calc(-50% + var(--my) * 0.4))",
                  transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {/* Replaced gradient with an actual image */}
                <div className="w-full h-56 relative overflow-hidden group">
                  <img
                    src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800&auto=format&fit=crop"
                    alt="Handcrafted ceramics"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />

                  <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-orange-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                    Featured
                  </span>
                </div>

                <div className="p-5 bg-white">
                  <p className="text-orange-600 text-[10px] font-bold uppercase tracking-widest">
                    Handcrafted
                  </p>
                  <p className="text-stone-900 text-lg font-bold mt-1 leading-snug">
                    Terracotta Artisan Vase
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100">
                    <p className="text-stone-900 font-semibold text-sm">
                      NPR 1,200
                    </p>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className="w-3.5 h-3.5 text-amber-400 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating card - Top Right (Glassmorphism) */}
              <div
                className="absolute top-10 -right-4 sm:-right-8 w-44 rounded-xl overflow-hidden shadow-xl z-30 bg-white/80 backdrop-blur-md border border-white transition-transform duration-500"
                style={{
                  transform:
                    "translate(calc(var(--mx) * 0.7), calc(var(--my) * 0.7)) rotate(5deg)",
                  transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div className="h-20 bg-stone-900 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-orange-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    />
                  </svg>
                </div>
                <div className="p-3 bg-white/60">
                  <p className="text-stone-900 font-semibold text-xs">
                    Premium Quality
                  </p>
                  <p className="text-stone-500 text-[10px] mt-0.5">
                    100% Ethically sourced
                  </p>
                </div>
              </div>

              {/* Floating card - Bottom Left */}
              <div
                className="absolute bottom-16 -left-6 sm:-left-10 w-48 rounded-xl overflow-hidden shadow-xl z-30 bg-white/90 backdrop-blur-md border border-white transition-transform duration-500"
                style={{
                  transform:
                    "translate(calc(var(--mx) * -0.5), calc(var(--my) * -0.5)) rotate(-4deg)",
                  transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div className="p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-orange-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H6.375c-.621 0-1.125-.504-1.125-1.125V14.25m17.25 0V6.375c0-.621-.504-1.125-1.125-1.125H14.25m0 0V3.375c0-.621-.504-1.125-1.125-1.125H8.625c-.621 0-1.125.504-1.125 1.125v3.75m6.75 0H7.5"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-stone-900 font-semibold text-xs">
                      Free Delivery
                    </p>
                    <p className="text-stone-500 text-[10px]">
                      On orders over NPR 500
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust badge - Bottom Right */}
              <div className="absolute z-30 bottom-8 right-4 bg-white border border-stone-100 shadow-lg rounded-full px-4 py-2 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg
                    className="w-3.5 h-3.5 text-emerald-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-stone-800 font-semibold text-[11px] uppercase tracking-wide">
                  Verified Artisan
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom separator line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
    </section>
  );
}
