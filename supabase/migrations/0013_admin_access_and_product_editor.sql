-- Papéis, ativação de contas e permissões necessárias ao editor do catálogo.
alter type public.staff_role add value if not exists 'client';

alter table public.staff_profiles
  add column if not exists is_active boolean not null default true,
  add column if not exists force_password_change boolean not null default false;

grant update (force_password_change) on public.staff_profiles to authenticated;
drop policy if exists "Staff can clear own password change flag" on public.staff_profiles;
create policy "Staff can clear own password change flag" on public.staff_profiles for update to authenticated
using (user_id = (select auth.uid()) and is_active and role in ('admin', 'staff'))
with check (user_id = (select auth.uid()) and is_active and role in ('admin', 'staff'));

-- A função também bloqueia sessões de perfis desativados.
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
      and profile.is_active
      and profile.role in ('admin', 'staff')
      and (required_role is null or profile.role = required_role or profile.role = 'admin')
  );
$$;

drop policy if exists "Staff can add products" on public.products;
drop policy if exists "Staff can update products" on public.products;
drop policy if exists "Admins can manage products" on public.products;
create policy "Staff can add products" on public.products for insert to authenticated
with check ((select private.has_staff_role()) and created_by = (select auth.uid()));
create policy "Staff can update products" on public.products for update to authenticated
using ((select private.has_staff_role())) with check ((select private.has_staff_role()));
create policy "Admins can manage products" on public.products for all to authenticated
using ((select private.has_staff_role('admin')))
with check ((select private.has_staff_role('admin')));

drop policy if exists "Staff can add images to products they created" on public.product_images;
drop policy if exists "Admins can manage product images" on public.product_images;
drop policy if exists "Staff can manage product images" on public.product_images;
create policy "Staff can manage product images" on public.product_images for all to authenticated
using ((select private.has_staff_role()))
with check ((select private.has_staff_role()));

drop policy if exists "Staff can add options to products they created" on public.product_options;
drop policy if exists "Admins can manage product options" on public.product_options;
drop policy if exists "Staff can manage product options" on public.product_options;
create policy "Staff can manage product options" on public.product_options for all to authenticated
using ((select private.has_staff_role()))
with check ((select private.has_staff_role()));

drop policy if exists "Staff can add prices" on public.price_rules;
drop policy if exists "Admins can manage prices" on public.price_rules;
drop policy if exists "Staff can manage prices" on public.price_rules;
create policy "Staff can manage prices" on public.price_rules for all to authenticated
using ((select private.has_staff_role()))
with check ((select private.has_staff_role()));

grant insert, update, delete on public.products, public.product_images,
  public.product_options, public.price_rules to authenticated;

drop policy if exists "Staff can read all categories" on public.categories;
create policy "Staff can read all categories" on public.categories for select to authenticated
using ((select private.has_staff_role()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Staff can upload product images" on storage.objects;
create policy "Staff can upload product images" on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and (select private.has_staff_role()));

drop policy if exists "Staff can update product images" on storage.objects;
create policy "Staff can update product images" on storage.objects for update to authenticated
using (bucket_id = 'product-images' and (select private.has_staff_role()))
with check (bucket_id = 'product-images' and (select private.has_staff_role()));

drop policy if exists "Staff can delete product images" on storage.objects;
create policy "Staff can delete product images" on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and (select private.has_staff_role()));
