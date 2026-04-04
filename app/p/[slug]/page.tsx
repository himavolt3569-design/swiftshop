import { createClient } from '@supabase/supabase-js'
import { StorefrontPage } from '@/app/page'
import { Product } from '@/lib/types'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data } = await sb
    .from('products')
    .select('*, category:categories(id, name, slug), images, sizes')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  return <StorefrontPage initialProduct={(data as Product) ?? null} />
}
