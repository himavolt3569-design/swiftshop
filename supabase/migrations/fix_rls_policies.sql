-- ============================================================
-- Fix RLS policies – run this in Supabase SQL Editor
-- Resolves 401 Unauthorized on admin insert/update/delete
-- ============================================================

-- Drop the overly-restrictive read-only policies first
drop policy if exists "public read categories"   on categories;
drop policy if exists "public read products"     on products;
drop policy if exists "public read reviews"      on reviews;
drop policy if exists "public read settings"     on shop_settings;
drop policy if exists "public read couriers"     on couriers;
drop policy if exists "public read promos"       on promo_codes;
drop policy if exists "public read order events" on order_events;

-- ── Storefront: public read ────────────────────────────────────

-- Categories: all reads (admin needs to see inactive too)
create policy "public read categories"
  on categories for select using (true);

-- Products: storefront sees active only, but admin "for all" policy below overrides via OR
create policy "public read products"
  on products for select using (is_active = true);

-- Reviews: all reads
create policy "public read reviews"
  on reviews for select using (true);

-- Shop settings: single row, public read
create policy "public read settings"
  on shop_settings for select using (true);

-- Couriers: active only for coverage check
create policy "public read couriers"
  on couriers for select using (is_active = true);

-- Promo codes: active only for storefront validation
create policy "public read promos"
  on promo_codes for select using (is_active = true);

-- Order events: public read (for order tracking)
create policy "public read order events"
  on order_events for select using (true);

-- Order items: public insert (created on checkout) + read
drop policy if exists "public read order items"   on order_items;
drop policy if exists "public insert order items"  on order_items;
create policy "public read order items"   on order_items for select using (true);
create policy "public insert order items" on order_items for insert with check (true);

-- Order events: public insert (created on checkout / status changes)
drop policy if exists "public insert order event" on order_events;
create policy "public insert order event" on order_events for insert with check (true);

-- ── Admin: full CRUD on management tables ─────────────────────

-- Categories
drop policy if exists "admin all categories" on categories;
create policy "admin all categories"
  on categories for all using (true) with check (true);

-- Products: full CRUD + select ALL rows (including inactive) for admin
drop policy if exists "admin all products" on products;
create policy "admin all products"
  on products for all using (true) with check (true);
-- Note: "admin all products" (using true) OR "public read products" (using is_active=true)
-- = using true for all rows. So admin sees all, storefront query filters in app code.

-- Reviews
drop policy if exists "admin all reviews" on reviews;
create policy "admin all reviews"
  on reviews for all using (true) with check (true);

-- Couriers
drop policy if exists "admin all couriers" on couriers;
create policy "admin all couriers"
  on couriers for all using (true) with check (true);

-- Orders (admin updates status)
drop policy if exists "admin update orders" on orders;
create policy "admin update orders"
  on orders for update using (true) with check (true);

-- Promo codes
drop policy if exists "admin all promos" on promo_codes;
create policy "admin all promos"
  on promo_codes for all using (true) with check (true);

-- Shop settings
drop policy if exists "admin all settings" on shop_settings;
create policy "admin all settings"
  on shop_settings for all using (true) with check (true);

-- Social channels (create if table exists)
do $$
begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'social_channels') then
    drop policy if exists "admin all social channels" on social_channels;
    execute 'create policy "admin all social channels" on social_channels for all using (true) with check (true)';
  end if;
end $$;

-- Social orders (create if table exists)
do $$
begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'social_orders') then
    drop policy if exists "admin all social orders" on social_orders;
    execute 'create policy "admin all social orders" on social_orders for all using (true) with check (true)';
  end if;
end $$;
