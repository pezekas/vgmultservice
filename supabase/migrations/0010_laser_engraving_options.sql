-- Opção de nome e fonte para produtos que oferecem gravação a laser.
with laser_products as (
  select distinct p.id
  from public.products p
  join public.product_options o on o.product_id = p.id
  cross join lateral jsonb_array_elements_text(o.choices) choice(value)
  where choice.value ilike '%laser%'
), engraving_fonts as (
  select jsonb_build_array(
    'WEDDING BY MANDALA', 'DOGGIE', 'COMIC SANS MS', 'SERINAH', 'ANANDA',
    'PEPERNOTES', 'VAGROUNDED BT', 'GAMALIYA', 'CHEDDAR JACK',
    'CAVIAR DREAMS', 'CANDY ROUND BTN', 'BABY ALEHA', 'Nenhuma delas'
  ) as choices
)
insert into public.product_options (product_id, name, option_type, is_required, choices, sort_order)
select p.id, options.name, options.option_type, true, options.choices, options.sort_order
from laser_products p
cross join engraving_fonts fonts
cross join lateral (
  select 'Nome para gravação'::text as name, 'text'::text as option_type, '[]'::jsonb as choices,
         coalesce((select max(existing.sort_order) + 1 from public.product_options existing where existing.product_id = p.id), 1) as sort_order
  union all
  select 'Fonte da gravação', 'select', fonts.choices,
         coalesce((select max(existing.sort_order) + 2 from public.product_options existing where existing.product_id = p.id), 2)
) options
where not exists (
  select 1 from public.product_options existing
  where existing.product_id = p.id and existing.name = options.name
);

