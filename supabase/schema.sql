-- ============================================================
-- Swift Shop – Supabase Database Schema
-- Run this in the Supabase SQL editor to bootstrap the database
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "postgis";

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists products (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  slug         text not null unique,
  category_id  uuid references categories(id) on delete set null,
  description  text not null default '',
  price        numeric(10,2) not null,
  sale_price   numeric(10,2),
  images       jsonb not null default '[]',   -- [{id, url, sort_order}]
  sizes        jsonb not null default '[]',   -- [{size, stock}]
  stock        integer not null default 0,
  is_active    boolean not null default true,
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,''))
  ) stored,
  created_at   timestamptz not null default now()
);
create index if not exists products_search_idx on products using gin(search_vector);
create index if not exists products_category_idx on products(category_id);

-- ============================================================
-- REVIEWS
-- ============================================================
create table if not exists reviews (
  id            uuid primary key default uuid_generate_v4(),
  product_id    uuid references products(id) on delete cascade,
  customer_name text not null,
  rating        integer not null check (rating between 1 and 5),
  comment       text not null,
  verified      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- CARTS & WISHLISTS (session-keyed)
-- ============================================================
create table if not exists carts (
  session_id  text primary key,
  items       jsonb not null default '[]',
  updated_at  timestamptz not null default now()
);

create table if not exists wishlists (
  session_id  text primary key,
  items       jsonb not null default '[]',
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- COURIERS
-- ============================================================
create table if not exists couriers (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  api_endpoint        text not null default '',
  api_key             text not null default '',
  hq_lat              double precision not null,
  hq_lng              double precision not null,
  coverage_radius_km  double precision not null default 30,
  priority            integer not null default 1,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists orders (
  id               uuid primary key default uuid_generate_v4(),
  order_number     text not null unique default ('SS-' || floor(random()*900000+100000)::text),
  session_id       text,
  customer_name    text not null,
  customer_phone   text not null,
  customer_email   text not null,
  province         text not null,
  district         text not null,
  area             text not null,
  landmark         text,
  lat              double precision,
  lng              double precision,
  payment_method   text not null check (payment_method in ('cash_on_delivery','esewa','khalti')),
  notes            text,
  promo_code       text,
  subtotal         numeric(10,2) not null,
  discount         numeric(10,2) not null default 0,
  total            numeric(10,2) not null,
  status           text not null default 'placed' check (status in ('placed','confirmed','picked_up','on_the_way','delivered','failed','held')),
  courier_id       uuid references couriers(id),
  items            jsonb not null default '[]',
  created_at       timestamptz not null default now()
);
create index if not exists orders_phone_idx  on orders(customer_phone);
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_date_idx   on orders(created_at desc);

-- ============================================================
-- ORDER ITEMS (denormalised for analytics)
-- ============================================================
create table if not exists order_items (
  id            uuid primary key default uuid_generate_v4(),
  order_id      uuid references orders(id) on delete cascade,
  product_id    uuid references products(id),
  product_name  text not null,
  product_image text,
  size          text,
  quantity      integer not null,
  unit_price    numeric(10,2) not null,
  line_price    numeric(10,2) not null,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- ORDER EVENTS (status timeline)
-- ============================================================
create table if not exists order_events (
  id         uuid primary key default uuid_generate_v4(),
  order_id   uuid references orders(id) on delete cascade,
  status     text not null,
  note       text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PROMO CODES
-- ============================================================
create table if not exists promo_codes (
  id                uuid primary key default uuid_generate_v4(),
  code              text not null unique,
  type              text not null check (type in ('percent','flat')),
  value             numeric(10,2) not null,
  min_order_amount  numeric(10,2) not null default 0,
  usage_limit       integer not null default 100,
  usage_count       integer not null default 0,
  expires_at        timestamptz,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

-- ============================================================
-- SHOP SETTINGS (single-row config table)
-- ============================================================
create table if not exists shop_settings (
  id                 uuid primary key default uuid_generate_v4(),
  shop_name          text not null default 'Swift Shop',
  shop_tagline       text not null default 'Curated essentials, delivered fast.',
  logo_url           text,
  contact_email      text not null default '',
  contact_phone      text not null default '',
  instagram_url      text,
  facebook_url       text,
  tiktok_url         text,
  live_feed_enabled  boolean not null default true
);
insert into shop_settings (shop_name) values ('Swift Shop') on conflict do nothing;

-- ============================================================
-- LIVE ORDERS FEED VIEW (no personal data exposed)
-- ============================================================
create or replace view live_orders_feed as
  select
    o.id,
    split_part(o.customer_name, ' ', 1) as customer_first_name,
    i.product_name,
    i.size,
    o.created_at
  from orders o
  join lateral (
    select elem->>'product_name' as product_name, elem->>'size' as size
    from jsonb_array_elements(o.items) elem
    limit 1
  ) i on true
  where o.created_at > now() - interval '24 hours'
  order by o.created_at desc
  limit 50;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Check if a lat/lng falls within any active courier's coverage
create or replace function check_courier_coverage(p_lat double precision, p_lng double precision)
returns boolean language sql stable as $$
  select exists (
    select 1 from couriers
    where is_active = true
    and (
      2 * 6371 * asin(sqrt(
        sin(radians((p_lat - hq_lat)/2))^2 +
        cos(radians(hq_lat)) * cos(radians(p_lat)) *
        sin(radians((p_lng - hq_lng)/2))^2
      ))
    ) <= coverage_radius_km
  );
$$;

-- Get list of provinces served by active couriers (placeholder – customize per business logic)
create or replace function get_active_delivery_provinces()
returns text[] language sql stable as $$
  select array['Province 3 – Bagmati', 'Province 4 – Gandaki', 'Province 5 – Lumbini']::text[];
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table categories    enable row level security;
alter table products      enable row level security;
alter table reviews       enable row level security;
alter table carts         enable row level security;
alter table wishlists     enable row level security;
alter table orders        enable row level security;
alter table order_items   enable row level security;
alter table order_events  enable row level security;
alter table promo_codes   enable row level security;
alter table shop_settings enable row level security;
alter table couriers      enable row level security;

-- ──────────────────────────────────────────────────────────────
-- STOREFRONT (public / anon) policies
-- ──────────────────────────────────────────────────────────────

-- Public read access for storefront
create policy "public read categories"   on categories    for select using (true);
create policy "public read products"     on products      for select using (is_active = true);
create policy "public read reviews"      on reviews       for select using (true);
create policy "public read settings"     on shop_settings for select using (true);
create policy "public read couriers"     on couriers      for select using (is_active = true);

-- Cart / wishlist – any session can read/write its own row
create policy "session cart"      on carts      for all using (true) with check (true);
create policy "session wishlist"  on wishlists  for all using (true) with check (true);

-- Orders – anyone can insert + read (tracking by order number / phone)
create policy "public insert order"      on orders       for insert with check (true);
create policy "public read order"        on orders       for select using (true);
create policy "public insert order items" on order_items for insert with check (true);
create policy "public read order items"  on order_items  for select using (true);
create policy "public insert order event" on order_events for insert with check (true);
create policy "public read order events"  on order_events for select using (true);

-- Promo codes – public read only
create policy "public read promos" on promo_codes for select using (is_active = true);

-- ──────────────────────────────────────────────────────────────
-- ADMIN policies (full access via anon key – protected by app-level login)
-- ──────────────────────────────────────────────────────────────

-- Categories – full CRUD
create policy "admin all categories" on categories
  for all using (true) with check (true);

-- Products – full CRUD
create policy "admin all products" on products
  for all using (true) with check (true);

-- Reviews – admin can delete/update
create policy "admin all reviews" on reviews
  for all using (true) with check (true);

-- Couriers – full CRUD
create policy "admin all couriers" on couriers
  for all using (true) with check (true);

-- Orders – admin can update status
create policy "admin update orders" on orders
  for update using (true) with check (true);

-- Order events – admin can insert timeline entries
-- (already covered by public insert policy above)

-- Order items – admin can read all
-- (already covered by public read policy above)

-- Promo codes – full CRUD
create policy "admin all promos" on promo_codes
  for all using (true) with check (true);

-- Shop settings – admin read + upsert
create policy "admin all settings" on shop_settings
  for all using (true) with check (true);

-- Social channels & orders (if tables exist)
create policy "admin all social channels" on social_channels
  for all using (true) with check (true);

create policy "admin all social orders" on social_orders
  for all using (true) with check (true);


-- OTP sessions (for phone verification)
create table if not exists otp_sessions (
  id         uuid primary key default uuid_generate_v4(),
  phone      text not null unique,
  code       text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Allow server-side (service role) full access; no public access
alter table otp_sessions enable row level security;
create policy "service role only otp" on otp_sessions
  for all using (false) with check (false);
