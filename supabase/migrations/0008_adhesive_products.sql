-- Produtos de adesivo informados pela VG Multiservice.
insert into public.products (
  category_id, name, slug, short_description, description, sale_unit,
  requires_measurements, measurement_unit, requires_file, allowed_file_extensions,
  pricing_mode, is_active
)
select c.id, p.name, p.slug, p.short_description, p.description, p.sale_unit,
       p.requires_measurements, p.measurement_unit, p.requires_file,
       p.allowed_file_extensions, p.pricing_mode::public.pricing_mode, true
from (values
  ('Adesivo vinil brilho', 'adesivo-vinil-brilho', 'Adesivo de vinil brilho, impermeável e com excelente durabilidade.', 'Adesivo de vinil brilho impermeável e com excelente durabilidade. Informe as medidas, a quantidade e escolha com corte ou sem corte. O tamanho mínimo é A3 e o arquivo deve ser enviado em PNG, PDF ou CDR.', 'm²', true, 'cm', true, array['png','pdf','cdr']::text[], 'per_area_m2'),
  ('Adesivo transparente', 'adesivo-transparente', 'Adesivo transparente personalizado com cálculo por área.', 'Informe as medidas, a quantidade e escolha com corte ou sem corte. O tamanho mínimo é A3 e o arquivo deve ser enviado em PNG, PDF ou CDR.', 'm²', true, 'cm', true, array['png','pdf','cdr']::text[], 'per_area_m2'),
  ('Adesivo DTF', 'adesivo-dtf', 'Adesivo UV DTF, feito para longa duração.', 'Adesivo UV feito para longa duração. Folha A4: R$ 70,00. Folha A3: R$ 120,00. Para tamanhos maiores, entre em contato pelo WhatsApp para consultar valores.', 'folha', false, null, false, '{}'::text[], 'fixed')
) as p(name, slug, short_description, description, sale_unit,
       requires_measurements, measurement_unit, requires_file, allowed_file_extensions, pricing_mode)
join public.categories c on c.slug = 'adesivos'
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  description = excluded.description,
  sale_unit = excluded.sale_unit,
  requires_measurements = excluded.requires_measurements,
  measurement_unit = excluded.measurement_unit,
  requires_file = excluded.requires_file,
  allowed_file_extensions = excluded.allowed_file_extensions,
  pricing_mode = excluded.pricing_mode,
  is_active = true;

insert into public.product_images (product_id, storage_path, alt_text, sort_order)
select p.id, i.storage_path, i.alt_text, i.sort_order
from (values
  ('adesivo-vinil-brilho', '/products/adesivo-vinil-brilho.png', 'Adesivos impressos em vinil brilho', 0),
  ('adesivo-transparente', '/products/adesivo-transparente.png', 'Adesivos transparentes personalizados', 0),
  ('adesivo-dtf', '/products/adesivo-dtf.png', 'Adesivos DTF impressos em uma máquina de produção', 0),
  ('adesivo-dtf', '/products/adesivo-dtf-mfn.png', 'Exemplo de adesivo UV DTF aplicado em superfície colorida', 1)
) as i(product_slug, storage_path, alt_text, sort_order)
join public.products p on p.slug = i.product_slug
where not exists (
  select 1 from public.product_images existing
  where existing.product_id = p.id and existing.storage_path = i.storage_path
);

update public.product_images
set sort_order = 1
where product_id = (select id from public.products where slug = 'adesivo-dtf')
  and storage_path = '/products/adesivo-dtf-mfn.png';

update public.product_images
set sort_order = 0
where product_id = (select id from public.products where slug = 'adesivo-dtf')
  and storage_path = '/products/adesivo-dtf.png';

insert into public.product_options (product_id, name, option_type, is_required, choices, sort_order)
select p.id, 'Tamanho da folha', 'select', true, '["A4", "A3"]'::jsonb, 1
from public.products p
where p.slug = 'adesivo-dtf'
  and not exists (select 1 from public.product_options o where o.product_id = p.id and o.name = 'Tamanho da folha');

insert into public.price_rules (product_id, option_key, option_value, pricing_mode, unit_price, minimum_price, is_active)
select p.id, rates.option_key, rates.option_value, rates.pricing_mode::public.pricing_mode, rates.unit_price, rates.minimum_price, true
from (values
  ('adesivo-vinil-brilho', 'material', 'Vinil brilho', 'per_area_m2', 85.00::numeric, 35.00::numeric),
  ('adesivo-transparente', 'material', 'Transparente', 'per_area_m2', 95.00::numeric, 45.00::numeric),
  ('adesivo-dtf', 'size', 'A4', 'fixed', 70.00::numeric, null::numeric),
  ('adesivo-dtf', 'size', 'A3', 'fixed', 120.00::numeric, null::numeric)
) as rates(product_slug, option_key, option_value, pricing_mode, unit_price, minimum_price)
join public.products p on p.slug = rates.product_slug
where not exists (
  select 1 from public.price_rules existing
  where existing.product_id = p.id and existing.option_value = rates.option_value
);

insert into public.product_options (product_id, name, option_type, is_required, choices, sort_order)
select p.id, 'Corte', 'select', true, '["Com corte", "Sem corte"]'::jsonb, 2
from public.products p
where p.slug in ('adesivo-vinil-brilho', 'adesivo-transparente')
  and not exists (select 1 from public.product_options o where o.product_id = p.id and o.name = 'Corte');

