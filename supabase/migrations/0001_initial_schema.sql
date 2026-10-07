-- VG Multiservice: modelo inicial para revisão.
-- Arquivos binários ficam no Storage privado, nunca nesta migração/tabelas.

create extension if not exists pgcrypto;

create type public.staff_role as enum ('admin', 'staff');
create type public.pricing_mode as enum ('manual', 'fixed', 'per_unit', 'per_area_m2', 'per_linear_m');

create table public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.staff_role not null default 'staff',
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.quote_statuses (
  code text primary key,
  label text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_terminal boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.quote_statuses (code, label, sort_order, is_terminal) values
  ('new', 'Novo', 1, false),
  ('in_review', 'Em análise', 2, false),
  ('quote_sent', 'Orçamento enviado', 3, false),
  ('approved', 'Aprovado', 4, false),
  ('in_production', 'Em produção', 5, false),
  ('completed', 'Concluído', 6, true),
  ('cancelled', 'Cancelado', 7, true);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  sale_unit text,
  estimated_lead_time text,
  requires_measurements boolean not null default false,
  measurement_unit text,
  requires_file boolean not null default false,
  allowed_file_extensions text[] not null default '{}',
  pricing_mode public.pricing_mode not null default 'manual',
  is_active boolean not null default true,
  created_by uuid references public.staff_profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, storage_path)
);

create table public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  option_type text not null check (option_type in ('text', 'select', 'boolean', 'number')),
  is_required boolean not null default false,
  choices jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.price_rules (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  option_key text,
  option_value text,
  pricing_mode public.pricing_mode not null,
  unit_price numeric(12,2),
  minimum_price numeric(12,2),
  currency char(3) not null default 'BRL',
  is_active boolean not null default true,
  valid_from timestamptz,
  valid_until timestamptz,
  created_by uuid references public.staff_profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  check (unit_price is null or unit_price >= 0),
  check (minimum_price is null or minimum_price >= 0)
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  whatsapp text not null,
  whatsapp_normalized text not null,
  email text,
  city text,
  state_code char(2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique default upper(encode(gen_random_bytes(6), 'hex')),
  lead_id uuid not null references public.leads(id) on delete restrict,
  status_code text not null default 'new' references public.quote_statuses(code),
  customer_notes text,
  internal_notes text,
  whatsapp_handed_off_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  quantity numeric(12,3) not null check (quantity > 0),
  width_cm numeric(12,3),
  height_cm numeric(12,3),
  unit_label text,
  configuration jsonb not null default '{}'::jsonb,
  calculation_snapshot jsonb,
  estimated_total numeric(12,2),
  created_at timestamptz not null default now(),
  check (width_cm is null or width_cm > 0),
  check (height_cm is null or height_cm > 0),
  check (estimated_total is null or estimated_total >= 0)
);

create table public.quote_files (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  quote_item_id uuid references public.quote_items(id) on delete set null,
  bucket_name text not null,
  storage_path text not null unique,
  original_filename text not null,
  detected_mime_type text not null,
  byte_size bigint not null check (byte_size > 0),
  retention_until timestamptz,
  created_at timestamptz not null default now()
);

create table public.quote_status_history (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  old_status text references public.quote_statuses(code),
  new_status text not null references public.quote_statuses(code),
  changed_by uuid references public.staff_profiles(user_id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index products_category_active_idx on public.products(category_id, is_active);
create index products_active_name_idx on public.products(is_active, name);
create index product_options_product_idx on public.product_options(product_id, sort_order);
create index price_rules_product_active_idx on public.price_rules(product_id, is_active);
create index leads_whatsapp_normalized_idx on public.leads(whatsapp_normalized);
create index quotes_status_created_idx on public.quotes(status_code, created_at desc);
create index quotes_lead_created_idx on public.quotes(lead_id, created_at desc);
create index quote_items_quote_idx on public.quote_items(quote_id);
create index quote_files_quote_idx on public.quote_files(quote_id);
create index quote_history_quote_created_idx on public.quote_status_history(quote_id, created_at desc);

-- A migração 0002 adiciona RLS, grants e políticas por perfil.
