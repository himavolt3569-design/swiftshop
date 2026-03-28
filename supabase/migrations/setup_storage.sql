-- ============================================================
-- Supabase Storage buckets – run in Supabase SQL Editor
-- ============================================================

-- Product images bucket (public read)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760,  -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Shop assets bucket (logo, banners – public read)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shop-assets',
  'shop-assets',
  true,
  5242880,   -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

-- Storage RLS policies: allow anon uploads + public reads

-- product-images: anyone can upload (admin only in practice), public read
drop policy if exists "product images public read"  on storage.objects;
drop policy if exists "product images admin upload" on storage.objects;

create policy "product images public read"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product images admin upload"
  on storage.objects for insert
  with check (bucket_id = 'product-images');

create policy "product images admin update"
  on storage.objects for update
  using (bucket_id = 'product-images');

create policy "product images admin delete"
  on storage.objects for delete
  using (bucket_id = 'product-images');

-- shop-assets: same
drop policy if exists "shop assets public read"  on storage.objects;
drop policy if exists "shop assets admin upload" on storage.objects;

create policy "shop assets public read"
  on storage.objects for select
  using (bucket_id = 'shop-assets');

create policy "shop assets admin upload"
  on storage.objects for insert
  with check (bucket_id = 'shop-assets');

create policy "shop assets admin update"
  on storage.objects for update
  using (bucket_id = 'shop-assets');

create policy "shop assets admin delete"
  on storage.objects for delete
  using (bucket_id = 'shop-assets');
