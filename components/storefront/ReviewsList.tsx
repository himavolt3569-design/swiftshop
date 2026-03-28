'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Review }   from '@/lib/types'

const PAGE = 5

interface ReviewsListProps {
  productId: string
}

export function ReviewsList({ productId }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data, count } = await supabase
        .from('reviews')
        .select('*', { count: 'exact' })
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .range(0, PAGE - 1)
      setReviews((data as Review[]) ?? [])
      setTotal(count ?? 0)
      setLoading(false)
    }
    fetch()
  }, [productId])

  const loadMore = async () => {
    const from = page * PAGE
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1)
    setReviews((prev) => [...prev, ...((data as Review[]) ?? [])])
    setPage((p) => p + 1)
  }

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <p className="text-xs font-semibold text-on-surface font-label uppercase tracking-wide">Reviews</p>
        {total > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className={`w-3 h-3 ${s <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-outline-variant'}`} />
              ))}
            </div>
            <span className="text-xs text-on-surface-variant font-label">{avg.toFixed(1)} ({total})</span>
          </div>
        )}
      </div>

      {loading && <div className="py-4 text-xs text-on-surface-variant font-label">Loading reviews…</div>}

      {!loading && reviews.length === 0 && (
        <p className="text-xs text-on-surface-variant font-body py-2">No reviews yet. Be the first to review after delivery.</p>
      )}

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="border-b border-outline-variant/20 pb-4 last:border-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-outline-variant'}`} />
                ))}
              </div>
              <span className="text-xs font-semibold text-on-surface font-label">{r.customer_name.split(' ')[0]}</span>
              <span className="text-xs text-on-surface-variant font-body">
                {new Date(r.created_at).toLocaleDateString('en-NP', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <p className="text-sm text-on-surface-variant font-body leading-relaxed">{r.comment}</p>
          </div>
        ))}
      </div>

      {reviews.length < total && (
        <button onClick={loadMore} className="mt-4 text-sm text-primary hover:underline font-label">
          Load More Reviews ({total - reviews.length} remaining)
        </button>
      )}
    </div>
  )
}
