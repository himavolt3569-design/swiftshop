'use client'

import React from 'react'

const ADS = [
  "FLASH SALE: 50% OFF ON ALL BEAUTY PRODUCTS",
  "FREE SHIPPING ON ORDERS OVER Rs. 2000",
  "NEW ARRIVALS: PREMIUM NEPALESE HANDICRAFTS",
  "FAST DELIVERY WITHIN KATHMANDU VALLEY",
  "GET A MYSTERY GIFT WITH EVERY PURCHASE",
]

export function AdsMarquee() {
  const repeatedAds = [...ADS, ...ADS, ...ADS, ...ADS] // Repeat to ensure smooth infinite scroll

  return (
    <div className="w-full bg-primary text-white text-[11px] font-bold tracking-wider font-label py-1.5 overflow-hidden z-[60] relative">
      <div
        className="flex whitespace-nowrap"
        style={{
          animation: 'ticker 30s linear infinite',
          display: 'inline-flex',
        }}
      >
        {repeatedAds.map((ad, i) => (
          <span key={i} className="inline-flex items-center px-6">
            {ad}
            <span className="w-1.5 h-1.5 rounded-full bg-white/30 ml-12" />
          </span>
        ))}
      </div>
    </div>
  )
}
