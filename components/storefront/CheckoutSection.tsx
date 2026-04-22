"use client";

import { useState, useRef, useEffect } from "react";
import {
  Tag,
  Loader2,
  CheckCircle2,
  Minus,
  Plus,
  X,
  ShoppingBag,
  MapPin,
  CreditCard,
  FileText,
  ChevronRight,
  Truck,
  Zap,
  Shield,
  RotateCcw,
  BadgeCheck,
} from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useCartStore } from "@/store/cartStore";
import { useSessionStore } from "@/store/sessionStore";
import { supabase } from "@/lib/supabase";
import { AddressForm } from "./AddressForm";
import { OrderFormData, PaymentMethod, Courier } from "@/lib/types";
import { DISTRICT_COORDS, haversineKm } from "@/lib/constants/districtCoords";

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "cash_on_delivery",
    label: "Cash on Delivery",
    description: "Pay when your order arrives",
    icon: "💵",
  },
];

interface FormErrors {
  [key: string]: string;
}

function validate(data: Partial<OrderFormData>, items: unknown[]): FormErrors {
  const e: FormErrors = {};
  if (!data.full_name?.trim()) e.full_name = "Full name is required";
  if (!data.phone?.match(/^(98|97)\d{8}$/))
    e.phone = "Enter a valid Nepal phone (98/97XXXXXXXX)";
  if (!data.province) e.province = "Select a province";
  if (!data.district) e.district = "Select a district";
  if (!data.area?.trim()) e.area = "Area/Street is required";
  if (!data.payment_method) e.payment = "Select a payment method";
  if (!items.length) e.cart = "Your cart is empty";
  return e;
}

function StepIndicator({
  active,
  completed,
  step,
  label,
}: {
  active: boolean;
  completed?: boolean;
  step: number;
  label: string;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 text-sm font-display font-semibold transition-all duration-300 ${active ? "text-primary" : completed ? "text-accent" : "text-on-surface-variant/35"}`}
    >
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${
          active
            ? "gradient-primary text-white shadow-glow-sm"
            : completed
              ? "bg-accent/15 text-accent"
              : "bg-surface-container text-on-surface-variant/35"
        }`}
      >
        {completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : step}
      </div>
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}

export function CheckoutSection() {
  const { items, getSubtotal, removeItem, updateQuantity, clearCart } =
    useCartStore();
  const { sessionId, addToast } = useSessionStore();
  const sectionRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<Partial<OrderFormData>>({
    payment_method: "cash_on_delivery",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [promoInput, setPromoInput] = useState("");
  const [promoResult, setPromoResult] = useState<{
    discount: number;
    message: string;
  } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [orderComplete, setOrderComplete] = useState<{
    order_number: string;
  } | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [recommendedCourierId, setRecommendedCourierId] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const discount = promoResult?.discount ?? 0;
  const total = Math.max(0, subtotal - discount);
  const deliveryFree = total >= 500;

  // Fetch couriers (full data for distance-based recommendation)
  useEffect(() => {
    supabase
      .from("couriers")
      .select("*")
      .eq("is_active", true)
      .order("priority")
      .then(({ data }) => { if (data) setCouriers(data as Courier[]) })
  }, [])

  // Auto-recommend courier when district changes
  useEffect(() => {
    if (!form.district || !couriers.length) return
    const coords = DISTRICT_COORDS[form.district]

    const scored = couriers.map((c) => {
      // Tier 1: courier explicitly covers this district
      const coversDistrict = c.covered_districts?.includes(form.district!) ?? false
      // Tier 2: fallback — HQ radius
      const dist = coords ? haversineKm(coords.lat, coords.lng, c.hq_lat, c.hq_lng) : null
      const inRadius = dist !== null ? dist <= c.coverage_radius_km : false
      return { courier: c, coversDistrict, inRadius, dist }
    })

    // Sort: explicit district coverage > radius coverage > nearest > priority
    scored.sort((a, b) => {
      if (a.coversDistrict !== b.coversDistrict) return a.coversDistrict ? -1 : 1
      if (a.inRadius !== b.inRadius) return a.inRadius ? -1 : 1
      if (a.dist !== null && b.dist !== null && Math.abs(a.dist - b.dist) > 5) return a.dist - b.dist
      return a.courier.priority - b.courier.priority
    })

    const best = scored[0]?.courier
    if (best) {
      setRecommendedCourierId(best.id)
      setForm((f) => ({ ...f, courier_id: best.id }))
    }
  }, [form.district, couriers])

  // GSAP entry animation with ScrollTrigger
  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".checkout-card", {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out",
        immediateRender: false,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          once: true,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const applyPromo = async () => {
    setPromoError("");
    if (!promoInput.trim()) return;
    const { data } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", promoInput.trim().toUpperCase())
      .eq("is_active", true)
      .single();
    if (!data) {
      setPromoError("Invalid or expired promo code.");
      return;
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setPromoError("This promo code has expired.");
      return;
    }
    if (data.usage_count >= data.usage_limit) {
      setPromoError("This promo code has reached its usage limit.");
      return;
    }
    if (subtotal < data.min_order_amount) {
      setPromoError(
        `Minimum order of NPR ${data.min_order_amount.toLocaleString()} required.`,
      );
      return;
    }
    const disc =
      data.type === "percent" ? subtotal * (data.value / 100) : data.value;
    setPromoResult({
      discount: disc,
      message: `${data.type === "percent" ? `${data.value}%` : `NPR ${data.value}`} discount applied!`,
    });
    setForm((f) => ({ ...f, promo_code: data.code }));
  };

  const handleSubmit = async () => {
    const errs = validate(form, items);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setActiveStep(2);
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const orderItems = items.map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name,
        product_image: i.product_image,
        size: i.size,
        quantity: i.quantity,
        unit_price: i.sale_price ?? i.price,
        line_price: (i.sale_price ?? i.price) * i.quantity,
      }));

      const { data, error } = await supabase
        .from("orders")
        .insert({
          session_id: sessionId,
          customer_name: form.full_name,
          customer_phone: form.phone,
          province: form.province,
          district: form.district,
          city: form.city ?? null,
          area: form.area,
          landmark: form.landmark ?? null,
          payment_method: form.payment_method,
          courier_id: form.courier_id ?? null,
          notes: form.notes ?? null,
          promo_code: form.promo_code ?? null,
          subtotal,
          discount,
          total,
          items: orderItems,
          status: "placed",
        })
        .select("order_number")
        .single();

      if (error) throw error;

      if (form.promo_code) {
        const { data: promo } = await supabase
          .from("promo_codes")
          .select("usage_count")
          .eq("code", form.promo_code)
          .single();
        if (promo)
          await supabase
            .from("promo_codes")
            .update({ usage_count: promo.usage_count + 1 })
            .eq("code", form.promo_code);
      }

      clearCart();
      setOrderComplete(data);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToTracking = () => {
    if (orderComplete?.order_number) {
      window.location.href = `/track?order=${orderComplete.order_number}`
    } else {
      window.location.href = '/track'
    }
  };

  // ── Order success screen ──────────────────────────────────────
  if (orderComplete) {
    return (
      <section id="checkout" className="bg-surface-container-low/30 py-24 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="max-w-lg mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
            className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-accent" />
          </motion.div>
          <h2 className="font-display text-3xl font-bold text-on-surface mb-3">
            Order Confirmed!
          </h2>
          <p className="text-on-surface-variant/60 font-body mb-2">
            Thank you for shopping with Goreto.store. Your order number is:
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-block glass-primary rounded-2xl px-8 py-4 mb-8"
          >
            <p className="text-4xl font-display font-bold text-primary tracking-wider">
              {orderComplete.order_number}
            </p>
          </motion.div>
          <p className="text-sm text-on-surface-variant/60 font-body mb-8">
            Expected delivery in 2–4 business days.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              onClick={scrollToTracking}
              className="px-8 py-3.5 btn-gradient text-white font-display font-semibold rounded-xl flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Truck className="w-4 h-4" /> Track My Order
            </motion.button>
            <button
              onClick={() =>
                document
                  .getElementById("products")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="px-8 py-3.5 btn-glass text-on-surface rounded-xl flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" /> Continue Shopping
            </button>
          </div>
        </motion.div>
      </section>
    );
  }

  // ── Main checkout ─────────────────────────────────────────────
  return (
    <section
      ref={sectionRef}
      id="checkout"
      className="bg-surface-container-low/30 py-20 px-6"
    >
      <div className="max-w-screen-xl mx-auto">
        {/* Section header */}
        <div className="mb-10">
          <p className="text-[11px] uppercase tracking-[0.3em] text-on-surface-variant/50 font-display font-semibold mb-2">
            Checkout
          </p>
          <h2 className="font-display text-3xl font-bold text-on-surface">
            Complete Your Order
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
          {/* ── LEFT: Delivery form ─── */}
          <div ref={formRef} className="space-y-5">
            {/* Step indicators */}
            <div className="checkout-card flex items-center gap-4 sm:gap-6 pb-5 border-b border-outline-variant/15">
              <StepIndicator active={activeStep === 1} completed={activeStep > 1} step={1} label="Cart" />
              <div className={`flex-1 h-[2px] rounded-full max-w-[60px] transition-colors duration-500 ${activeStep > 1 ? 'bg-accent' : 'bg-outline-variant/15'}`} />
              <StepIndicator active={activeStep === 2} completed={activeStep > 2} step={2} label="Delivery" />
              <div className={`flex-1 h-[2px] rounded-full max-w-[60px] transition-colors duration-500 ${activeStep > 2 ? 'bg-accent' : 'bg-outline-variant/15'}`} />
              <StepIndicator active={activeStep === 3} step={3} label="Payment" />
            </div>

            {/* Step 1: Cart review */}
            <div className="checkout-card glass rounded-2xl overflow-hidden shadow-float">
              <button
                className="w-full flex items-center justify-between p-5 hover:bg-surface-container/30 transition-colors"
                onClick={() => setActiveStep(activeStep === 1 ? 0 : 1)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-on-surface font-label">
                      Cart Review
                    </p>
                    <p className="text-xs text-on-surface-variant font-body">
                      {items.length} item{items.length !== 1 ? "s" : ""} · NPR{" "}
                      {subtotal.toLocaleString()}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-on-surface-variant transition-transform ${activeStep === 1 ? "rotate-90" : ""}`}
                />
              </button>

              {activeStep === 1 && (
                <div className="px-5 pb-5 border-t border-outline-variant/10">
                  {errors.cart && (
                    <p className="text-sm text-error mt-4 mb-2 font-label">
                      {errors.cart}
                    </p>
                  )}

                  {items.length === 0 ? (
                    <div className="py-10 text-center">
                      <ShoppingBag className="w-10 h-10 text-on-surface-variant/25 mx-auto mb-3" />
                      <p className="text-on-surface-variant font-body text-sm mb-3">
                        Your cart is empty.
                      </p>
                      <button
                        onClick={() =>
                          document
                            .getElementById("products")
                            ?.scrollIntoView({ behavior: "smooth" })
                        }
                        className="text-primary text-sm font-label font-semibold hover:underline"
                      >
                        Browse Products →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-4">
                      {items.map((item) => (
                        <div
                          key={`${item.product_id}-${item.size}`}
                          className="flex gap-3 p-3 bg-surface-container-low rounded-xl"
                        >
                          <div className="w-14 h-16 bg-surface-container rounded-lg overflow-hidden shrink-0">
                            {item.product_image ? (
                              <Image
                                src={item.product_image}
                                alt={item.product_name}
                                width={56}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl font-headline text-on-surface-variant/30">
                                {item.product_name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-on-surface font-body line-clamp-1 mb-0.5">
                              {item.product_name}
                            </p>
                            <p className="text-xs text-on-surface-variant font-label mb-2">
                              Size: {item.size}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center bg-background border border-outline-variant/40 rounded-lg overflow-hidden">
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.product_id,
                                      item.size,
                                      item.quantity - 1,
                                    )
                                  }
                                  className="w-7 h-7 flex items-center justify-center hover:bg-surface-container transition-colors text-on-surface-variant"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs w-7 text-center font-bold text-on-surface">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.product_id,
                                      item.size,
                                      item.quantity + 1,
                                    )
                                  }
                                  disabled={item.quantity >= item.max_stock}
                                  className="w-7 h-7 flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-40 text-on-surface-variant"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="text-sm font-bold text-primary ml-auto">
                                NPR{" "}
                                {(
                                  (item.sale_price ?? item.price) *
                                  item.quantity
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              removeItem(item.product_id, item.size)
                            }
                            className="text-on-surface-variant/50 hover:text-error transition-colors self-start mt-0.5 p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Promo code */}
                      <div className="pt-2">
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
                            <input
                              type="text"
                              value={promoInput}
                              onChange={(e) => {
                                setPromoInput(e.target.value.toUpperCase());
                                setPromoError("");
                                setPromoResult(null);
                              }}
                              placeholder="PROMO CODE"
                              className="search-input w-full h-10 pl-9 pr-3 text-xs font-label bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:border-primary uppercase tracking-wider"
                            />
                          </div>
                          <button
                            onClick={applyPromo}
                            className="px-4 h-10 bg-on-background text-white text-xs font-label font-semibold rounded-xl hover:opacity-80 transition-all"
                          >
                            Apply
                          </button>
                        </div>
                        {promoError && (
                          <p className="text-xs text-error mt-1 font-label">
                            {promoError}
                          </p>
                        )}
                        {promoResult && (
                          <p className="text-xs text-success mt-1 font-label">
                            ✓ {promoResult.message}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => setActiveStep(2)}
                        disabled={items.length === 0}
                        className="w-full py-3 bg-primary text-white font-label font-bold text-sm rounded-xl hover:bg-primary-container transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-40"
                      >
                        Continue to Delivery{" "}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Delivery details */}
            <div className="checkout-card glass rounded-2xl overflow-hidden shadow-float">
              <button
                className="w-full flex items-center justify-between p-5 hover:bg-surface-container/30 transition-colors"
                onClick={() => setActiveStep(activeStep === 2 ? 0 : 2)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-on-surface font-label">
                      Delivery Details
                    </p>
                    <p className="text-xs text-on-surface-variant font-body">
                      Name, address & contact
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-on-surface-variant transition-transform ${activeStep === 2 ? "rotate-90" : ""}`}
                />
              </button>

              {activeStep === 2 && (
                <div className="px-5 pb-5 border-t border-outline-variant/10">
                  <div className="space-y-4 mt-4">
                    <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 font-label">
                        Full Name <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.full_name ?? ""}
                        placeholder="Your full name"
                        onChange={(e) =>
                          setForm((f) => ({ ...f, full_name: e.target.value }))
                        }
                        className={`search-input w-full h-11 px-3 bg-surface-container-lowest border rounded-xl text-sm font-body transition-colors ${errors.full_name ? "border-error" : "border-outline-variant/40 focus:border-primary"}`}
                      />
                      {errors.full_name && (
                        <p className="text-xs text-error mt-1 font-label">
                          {errors.full_name}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 font-label">
                        Phone Number <span className="text-error">*</span>
                      </label>
                      <input
                        type="tel"
                        value={form.phone ?? ""}
                        placeholder="98XXXXXXXX"
                        maxLength={10}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))
                        }
                        className={`search-input w-full h-11 px-3 bg-surface-container-lowest border rounded-xl text-sm font-body transition-colors ${errors.phone ? "border-error" : "border-outline-variant/40 focus:border-primary"}`}
                      />
                      {errors.phone && (
                        <p className="text-xs text-error mt-1 font-label">
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    <AddressForm
                      value={{
                        province: form.province ?? "",
                        district: form.district ?? "",
                        city: form.city ?? "",
                        area: form.area ?? "",
                        landmark: form.landmark,
                      }}
                      onChange={(u) => setForm((f) => ({ ...f, ...u }))}
                      errors={errors}
                    />

                    {/* Courier selection — temporarily disabled */}
                    {false && couriers.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-label">
                            <Truck className="w-3.5 h-3.5 inline mr-1" />
                            Select Courier
                          </label>
                          {form.district && DISTRICT_COORDS[form.district as string] && (
                            <span className="text-[10px] text-on-surface-variant/60 font-label">
                              Sorted by distance from {form.district}
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {(() => {
                            const coords = form.district ? DISTRICT_COORDS[form.district as string] : null
                            const withDist = couriers.map((c) => {
                              const dist = coords
                                ? haversineKm(coords.lat, coords.lng, c.hq_lat, c.hq_lng)
                                : null
                              const inCoverage = dist !== null ? dist <= c.coverage_radius_km : true
                              return { courier: c, dist, inCoverage }
                            })
                            withDist.sort((a, b) => {
                              const aCovers = a.courier.covered_districts?.includes(form.district ?? '') ?? false
                              const bCovers = b.courier.covered_districts?.includes(form.district ?? '') ?? false
                              if (aCovers !== bCovers) return aCovers ? -1 : 1
                              if (a.inCoverage !== b.inCoverage) return a.inCoverage ? -1 : 1
                              if (a.dist !== null && b.dist !== null && Math.abs(a.dist - b.dist) > 5) return a.dist - b.dist
                              return a.courier.priority - b.courier.priority
                            })
                            return withDist.map(({ courier: c, dist, inCoverage }) => {
                              const isRecommended = c.id === recommendedCourierId
                              const coversDistrict = c.covered_districts?.includes(form.district ?? '') ?? false
                              return (
                                <label
                                  key={c.id}
                                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.courier_id === c.id ? "border-primary bg-primary/5" : "border-outline-variant/30 hover:border-outline-variant"}`}
                                >
                                  <input
                                    type="radio"
                                    name="courier"
                                    value={c.id}
                                    checked={form.courier_id === c.id}
                                    onChange={() => setForm((f) => ({ ...f, courier_id: c.id }))}
                                    className="sr-only"
                                  />
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${form.courier_id === c.id ? "border-primary" : "border-outline-variant"}`}>
                                    {form.courier_id === c.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-semibold text-on-surface font-label">{c.name}</span>
                                      {isRecommended && (
                                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold font-label rounded-full">
                                          Recommended
                                        </span>
                                      )}
                                      {coversDistrict && (
                                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold font-label rounded-full">
                                          Serves {form.district}
                                        </span>
                                      )}
                                      {!coversDistrict && !inCoverage && dist !== null && (
                                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold font-label rounded-full">
                                          Limited Coverage
                                        </span>
                                      )}
                                    </div>
                                    {!coversDistrict && dist !== null && (
                                      <p className="text-[11px] text-on-surface-variant font-label mt-0.5">
                                        ~{Math.round(dist)} km from your district
                                        {inCoverage ? " · In radius zone" : ""}
                                      </p>
                                    )}
                                  </div>
                                </label>
                              )
                            })
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Order items summary in delivery step */}
                    {items.length > 0 && (
                      <div className="bg-surface-container-low rounded-xl p-3 space-y-2">
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-label">Ordering</p>
                        {items.map((item) => (
                          <div key={`${item.product_id}-${item.size}`} className="flex items-center gap-2">
                            <div className="w-8 h-10 rounded-lg overflow-hidden bg-surface-container shrink-0">
                              {item.product_image ? (
                                <Image src={item.product_image} alt={item.product_name} width={32} height={40} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-on-surface-variant/30">{item.product_name.charAt(0)}</div>
                              )}
                            </div>
                            <p className="flex-1 text-xs text-on-surface font-body line-clamp-1">{item.product_name} ×{item.quantity}</p>
                            <span className="text-xs font-bold text-primary shrink-0">NPR {((item.sale_price ?? item.price) * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setActiveStep(3)}
                      className="w-full py-3 bg-primary text-white font-label font-bold text-sm rounded-xl hover:bg-primary-container transition-all flex items-center justify-center gap-2 mt-2"
                    >
                      Continue to Payment <ChevronRight className="w-4 h-4" />
                    </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Payment */}
            <div className="checkout-card glass rounded-2xl overflow-hidden shadow-float">
              <button
                className="w-full flex items-center justify-between p-5 hover:bg-surface-container/30 transition-colors"
                onClick={() => setActiveStep(activeStep === 3 ? 0 : 3)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-on-surface font-label">
                      Payment Method
                    </p>
                    <p className="text-xs text-on-surface-variant font-body">
                      How would you like to pay?
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-on-surface-variant transition-transform ${activeStep === 3 ? "rotate-90" : ""}`}
                />
              </button>

              {activeStep === 3 && (
                <div className="px-5 pb-5 border-t border-outline-variant/10">
                  <div className="space-y-3 mt-4">
                    {PAYMENT_METHODS.map((pm) => (
                      <label
                        key={pm.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${form.payment_method === pm.id ? "border-primary bg-primary/5 shadow-sm" : "border-outline-variant/30 hover:border-outline-variant"}`}
                      >
                        <span className="text-xl">{pm.icon}</span>
                        <input
                          type="radio"
                          name="payment_method"
                          value={pm.id}
                          checked={form.payment_method === pm.id}
                          onChange={() =>
                            setForm((f) => ({ ...f, payment_method: pm.id }))
                          }
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-on-surface font-label">
                            {pm.label}
                          </p>
                          <p className="text-xs text-on-surface-variant font-body">
                            {pm.description}
                          </p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${form.payment_method === pm.id ? "border-primary" : "border-outline-variant"}`}
                        >
                          {form.payment_method === pm.id && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                      </label>
                    ))}

                    {/* Notes */}
                    <div className="pt-1">
                      <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 font-label">
                        <FileText className="w-3.5 h-3.5 inline mr-1" />
                        Order Notes{" "}
                        <span className="font-normal text-on-surface-variant/50">
                          (optional)
                        </span>
                      </label>
                      <textarea
                        value={form.notes ?? ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, notes: e.target.value }))
                        }
                        rows={2}
                        placeholder="Any special instructions for the courier"
                        className="search-input w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm font-body focus:border-primary transition-colors resize-none"
                      />
                    </div>

                    {submitError && (
                      <div className="px-4 py-3 bg-error-container/30 border border-error/20 rounded-xl">
                        <p className="text-sm text-on-error-container font-label">
                          {submitError}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Order summary ─── */}
          <div className="checkout-card lg:sticky lg:top-20 space-y-4">
            <div className="glass rounded-2xl overflow-hidden shadow-depth">
              <div className="p-5 border-b border-outline-variant/10">
                <h3 className="font-display text-lg font-bold text-on-surface">
                  Order Summary
                </h3>
              </div>
              <div className="p-5 space-y-3">
                {items.map((item) => (
                  <div
                    key={`${item.product_id}-${item.size}`}
                    className="flex items-center gap-3"
                  >
                    <div className="relative">
                      <div className="w-12 h-14 rounded-lg overflow-hidden bg-surface-container shrink-0">
                        {item.product_image ? (
                          <Image
                            src={item.product_image}
                            alt={item.product_name}
                            width={48}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg font-headline text-on-surface-variant/30">
                            {item.product_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-on-background text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-on-surface font-body line-clamp-1">
                        {item.product_name}
                      </p>
                      <p className="text-[11px] text-on-surface-variant font-label">
                        Size: {item.size}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-on-surface shrink-0">
                      NPR{" "}
                      {(
                        (item.sale_price ?? item.price) * item.quantity
                      ).toLocaleString()}
                    </span>
                  </div>
                ))}

                {items.length === 0 && (
                  <p className="text-xs text-on-surface-variant font-body text-center py-4">
                    No items in cart
                  </p>
                )}

                <div className="border-t border-outline-variant/20 pt-3 space-y-2">
                  <div className="flex justify-between text-sm text-on-surface-variant font-body">
                    <span>Subtotal</span>
                    <span>NPR {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span
                      className={
                        deliveryFree
                          ? "text-success"
                          : "text-on-surface-variant"
                      }
                    >
                      <Truck className="w-3.5 h-3.5 inline mr-1" />
                      Delivery
                    </span>
                    <span
                      className={
                        deliveryFree
                          ? "text-success font-semibold"
                          : "text-on-surface-variant"
                      }
                    >
                      {deliveryFree ? "FREE" : "NPR 100"}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-success font-body">
                      <span>Discount</span>
                      <span>−NPR {discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-on-surface font-headline pt-2 border-t border-outline-variant/20">
                    <span>Total</span>
                    <span>NPR {total.toLocaleString()}</span>
                  </div>
                </div>

                {!deliveryFree && (
                  <div className="bg-primary/5 border border-primary/15 rounded-xl px-3 py-2.5 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                    <p className="text-xs text-primary font-label">
                      Add NPR {(500 - subtotal).toLocaleString()} more for free
                      delivery!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <Shield className="w-4 h-4 text-accent" />, text: "Secure Checkout" },
                { icon: <RotateCcw className="w-4 h-4 text-primary" />, text: "7-day Returns" },
                { icon: <BadgeCheck className="w-4 h-4 text-accent" />, text: "Verified Store" },
              ].map((b) => (
                <div
                  key={b.text}
                  className="glass rounded-xl p-3 text-center hover:shadow-float transition-shadow duration-300"
                >
                  <div className="flex justify-center mb-1.5">{b.icon}</div>
                  <p className="text-[10px] text-on-surface-variant/60 font-label leading-tight">
                    {b.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Final place order button */}
            <motion.button
              onClick={handleSubmit}
              disabled={submitting || items.length === 0}
              className="w-full py-4 btn-gradient text-white font-display font-bold text-base rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" /> Place Order · NPR{" "}
                  {total.toLocaleString()}
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}
