-- Acesso ao catálogo público e ao painel administrativo.
-- Solicitações públicas serão gravadas por operação server-side validada,
-- não por INSERT aberto nas tabelas de leads/orçamentos.

create schema if not exists private;

create or replace function private.has_staff_role(required_role public.staff_role default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_profiles profile
    where profile.user_id = (select auth.uid())
      and (required_role is null or profile.role = required_role or profile.role = 'admin')
  );
$$;

revoke all on function private.has_staff_role(public.staff_role) from public;
grant usage on schema private to authenticated;
grant execute on function private.has_staff_role(public.staff_role) to authenticated;

alter table public.staff_profiles enable row level security;
alter table public.quote_statuses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_options enable row level security;
alter table public.price_rules enable row level security;
alter table public.leads enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.quote_files enable row level security;
alter table public.quote_status_history enable row level security;

revoke all on public.staff_profiles, public.quote_statuses, public.categories, public.products,
  public.product_images, public.product_options, public.price_rules,
  public.leads, public.quotes, public.quote_items, public.quote_files,
  public.quote_status_history from anon, authenticated;

grant select on public.staff_profiles to authenticated;
grant select on public.quote_statuses to authenticated;
grant insert, update, delete on public.quote_statuses to authenticated;
grant select on public.categories, public.products, public.product_images,
  public.product_options, public.price_rules to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant insert, update, delete on public.products to authenticated;
grant insert, update, delete on public.product_images, public.product_options,
  public.price_rules to authenticated;
grant select on public.leads, public.quotes, public.quote_items,
  public.quote_files, public.quote_status_history to authenticated;
grant update (status_code, internal_notes, updated_at) on public.quotes to authenticated;
grant insert on public.quote_status_history to authenticated;

create policy "Staff can read their own profile and admins can read all"
on public.staff_profiles for select to authenticated
using (user_id = (select auth.uid()) or (select private.has_staff_role('admin')));

create policy "Staff can read quote statuses"
on public.quote_statuses for select to authenticated using ((select private.has_staff_role()));
create policy "Admins can manage quote statuses"
on public.quote_statuses for all to authenticated
using ((select private.has_staff_role('admin')))
with check ((select private.has_staff_role('admin')));

create policy "Public can read active categories"
on public.categories for select to anon, authenticated using (is_active);
create policy "Admins can read all categories"
on public.categories for select to authenticated using ((select private.has_staff_role('admin')));
create policy "Admins can manage categories"
on public.categories for all to authenticated
using ((select private.has_staff_role('admin')))
with check ((select private.has_staff_role('admin')));

create policy "Public can read active products"
on public.products for select to anon, authenticated using (is_active);
create policy "Staff can read all products"
on public.products for select to authenticated using ((select private.has_staff_role()));
create policy "Staff can add products"
on public.products for insert to authenticated
with check ((select private.has_staff_role()) and created_by = (select auth.uid()));
create policy "Admins can manage products"
on public.products for all to authenticated
using ((select private.has_staff_role('admin')))
with check ((select private.has_staff_role('admin')));

create policy "Public can read images for active products"
on public.product_images for select to anon, authenticated
using (exists (select 1 from public.products p where p.id = product_id and p.is_active));
create policy "Staff can add images to products they created"
on public.product_images for insert to authenticated
with check ((select private.has_staff_role()) and exists (
  select 1 from public.products p where p.id = product_id and p.created_by = (select auth.uid())
));
create policy "Admins can manage product images"
on public.product_images for all to authenticated
using ((select private.has_staff_role('admin')))
with check ((select private.has_staff_role('admin')));

create policy "Public can read options for active products"
on public.product_options for select to anon, authenticated
using (exists (select 1 from public.products p where p.id = product_id and p.is_active));
create policy "Staff can add options to products they created"
on public.product_options for insert to authenticated
with check ((select private.has_staff_role()) and exists (
  select 1 from public.products p where p.id = product_id and p.created_by = (select auth.uid())
));
create policy "Admins can manage product options"
on public.product_options for all to authenticated
using ((select private.has_staff_role('admin')))
with check ((select private.has_staff_role('admin')));

create policy "Public can read active prices for active products"
on public.price_rules for select to anon, authenticated
using (is_active and exists (select 1 from public.products p where p.id = product_id and p.is_active));
create policy "Staff can read all prices"
on public.price_rules for select to authenticated using ((select private.has_staff_role()));
create policy "Staff can add prices"
on public.price_rules for insert to authenticated
with check ((select private.has_staff_role()) and created_by = (select auth.uid()));
create policy "Admins can manage prices"
on public.price_rules for all to authenticated
using ((select private.has_staff_role('admin')))
with check ((select private.has_staff_role('admin')));

create policy "Staff can read leads"
on public.leads for select to authenticated using ((select private.has_staff_role()));
create policy "Staff can read quotes"
on public.quotes for select to authenticated using ((select private.has_staff_role()));
create policy "Staff can update quote workflow fields"
on public.quotes for update to authenticated
using ((select private.has_staff_role()))
with check ((select private.has_staff_role()));
create policy "Staff can read quote items"
on public.quote_items for select to authenticated using ((select private.has_staff_role()));
create policy "Staff can read quote files"
on public.quote_files for select to authenticated using ((select private.has_staff_role()));
create policy "Staff can read quote status history"
on public.quote_status_history for select to authenticated using ((select private.has_staff_role()));
create policy "Staff can add quote status history"
on public.quote_status_history for insert to authenticated
with check ((select private.has_staff_role()) and changed_by = (select auth.uid()));
