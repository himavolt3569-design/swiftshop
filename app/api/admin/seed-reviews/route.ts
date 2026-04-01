import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateDemoReviews } from '@/lib/utils/demoReviews'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { product_id, count = 8 } = await req.json()
    if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 })

    const reviews = generateDemoReviews(product_id, count)
    const { error } = await supabase.from('reviews').insert(reviews)
    if (error) throw error

    return NextResponse.json({ inserted: reviews.length })
  } catch (err) {
    console.error('[seed-reviews]', err)
    return NextResponse.json({ error: 'Failed to seed reviews' }, { status: 500 })
  }
}
