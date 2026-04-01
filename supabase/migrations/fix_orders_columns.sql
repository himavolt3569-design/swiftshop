-- Fix: make customer_email nullable (email field removed from checkout form)
alter table orders alter column customer_email drop not null;

-- Fix: add city column if missing
alter table orders add column if not exists city text;

-- Fix: add covered_districts to couriers
alter table couriers add column if not exists covered_districts text[] default null;
