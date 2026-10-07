-- Totem em PVC com precificação por metro quadrado.
insert into public.categories (name, slug, description)
values ('PVC e Ímã', 'pvc-e-ima', 'Produtos personalizados em PVC e ímã.')
on conflict (slug) do nothing;

insert into public.products (
  category_id, name, slug, short_description, description, sale_unit,
  requires_measurements, measurement_unit, pricing_mode, is_active
)
select c.id, 'Totem', 'totem-pvc', 'Totem personalizado em PVC com cálculo por área.',
       'Informe a largura e a altura, escolha a espessura do PVC e veja uma estimativa calculada pela área do produto.',
       'm²', true, 'cm', 'per_area_m2', true
from public.categories c where c.slug = 'pvc-e-ima'
on conflict (slug) do nothing;

insert into public.product_images (product_id, storage_path, alt_text, sort_order)
select p.id, '/products/totem-pvc.png', 'Totem decorativo recortado em PVC', 0
from public.products p
where p.slug = 'totem-pvc'
  and not exists (select 1 from public.product_images i where i.product_id = p.id and i.storage_path = '/products/totem-pvc.png');

insert into public.product_options (product_id, name, option_type, is_required, choices, sort_order)
select p.id, 'Espessura do PVC', 'select', true, '["1 mm", "2 mm"]'::jsonb, 1
from public.products p
where p.slug = 'totem-pvc'
  and not exists (select 1 from public.product_options o where o.product_id = p.id and o.name = 'Espessura do PVC');

insert into public.price_rules (product_id, option_key, option_value, pricing_mode, unit_price, is_active)
select p.id, 'thickness', rates.thickness, 'per_area_m2', rates.unit_price, true
from (values ('1 mm', 220.00::numeric), ('2 mm', 290.00::numeric)) as rates(thickness, unit_price)
join public.products p on p.slug = 'totem-pvc'
where not exists (
  select 1 from public.price_rules r where r.product_id = p.id and r.option_value = rates.thickness
);
