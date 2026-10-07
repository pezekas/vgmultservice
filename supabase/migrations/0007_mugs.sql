-- Canecas informadas pela VG, com criação da arte cobrada uma vez por pedido.
alter table public.product_options add column if not exists surcharge_choice text;
alter table public.product_options add column if not exists surcharge_amount numeric(12,2);
alter table public.product_options add column if not exists surcharge_mode text;
alter table public.product_options add column if not exists surcharge_label text;

do $$ begin
  alter table public.product_options add constraint product_options_surcharge_mode_check
    check (surcharge_mode is null or surcharge_mode in ('per_order', 'per_unit'));
exception when duplicate_object then null;
end $$;

insert into public.categories (name, slug, description)
values ('Canecas', 'canecas', 'Canecas personalizadas com diferentes técnicas de aplicação.')
on conflict (slug) do nothing;

insert into public.products (
  category_id, name, slug, short_description, description, sale_unit,
  requires_file, allowed_file_extensions, pricing_mode, is_active
)
select c.id, m.name, m.slug, m.short_description, m.description, 'unidade',
       m.requires_file, m.allowed_file_extensions, 'fixed', true
from (values
  ('Caneca inox', 'caneca-inox', 'Caneca inox personalizada com DTF ou gravação a laser.', 'Escolha a técnica de personalização desejada: DTF ou gravação a laser.', false, '{}'::text[]),
  ('Caneca porcelana branca', 'caneca-porcelana-branca', 'Caneca de porcelana branca personalizada.', 'Caneca de porcelana branca. Se já tiver a arte pronta, anexe em PDF, PNG ou CDR. Se quiser solicitar a criação da arte, será acrescentado R$ 10,00 ao total do pedido.', true, array['pdf','png','cdr']::text[]),
  ('Caneca porcelana preta', 'caneca-porcelana-preta', 'Caneca de porcelana preta personalizada.', 'Caneca de porcelana preta. Se já tiver a arte pronta, anexe em PDF, PNG ou CDR. Se quiser solicitar a criação da arte, será acrescentado R$ 10,00 ao total do pedido.', true, array['pdf','png','cdr']::text[])
) as m(name, slug, short_description, description, requires_file, allowed_file_extensions)
join public.categories c on c.slug = 'canecas'
on conflict (slug) do nothing;

insert into public.product_images (product_id, storage_path, alt_text, sort_order)
select p.id, i.path, i.alt_text, 0
from (values
  ('caneca-inox', '/products/caneca-inox.png', 'Caneca inox preta personalizada'),
  ('caneca-porcelana-branca', '/products/caneca-porcelana-branca.png', 'Caneca de porcelana branca personalizada'),
  ('caneca-porcelana-preta', '/products/caneca-porcelana-preta.png', 'Caneca de porcelana preta personalizada')
) as i(product_slug, path, alt_text)
join public.products p on p.slug = i.product_slug
where not exists (select 1 from public.product_images x where x.product_id = p.id and x.storage_path = i.path);

insert into public.product_options (product_id, name, option_type, is_required, choices, sort_order, surcharge_choice, surcharge_amount, surcharge_mode, surcharge_label)
select p.id, options.option_name, 'select', true, options.choices::jsonb, 1, options.surcharge_choice, options.surcharge_amount, options.surcharge_mode, options.surcharge_label
from (values
  ('caneca-inox', 'Personalização', '["Gravação a laser", "DTF"]', null::text, null::numeric, null::text, null::text),
  ('caneca-porcelana-branca', 'Arte', '["Tenho arte pronta", "Quero criação da arte (+ R$ 10,00 no total)"]', 'Quero criação da arte (+ R$ 10,00 no total)', 10.00::numeric, 'per_order', 'Criação da arte'),
  ('caneca-porcelana-preta', 'Arte', '["Tenho arte pronta", "Quero criação da arte (+ R$ 10,00 no total)"]', 'Quero criação da arte (+ R$ 10,00 no total)', 10.00::numeric, 'per_order', 'Criação da arte')
) as options(product_slug, option_name, choices, surcharge_choice, surcharge_amount, surcharge_mode, surcharge_label)
join public.products p on p.slug = options.product_slug
where not exists (select 1 from public.product_options o where o.product_id = p.id and o.name = options.option_name);

insert into public.price_rules (product_id, option_key, option_value, pricing_mode, unit_price, is_active)
select p.id, 'customization', rates.option_value, 'fixed', rates.unit_price, true
from (values
  ('caneca-inox', 'Gravação a laser', 65.00::numeric),
  ('caneca-inox', 'DTF', 75.00::numeric),
  ('caneca-porcelana-branca', 'Tenho arte pronta', 30.00::numeric),
  ('caneca-porcelana-preta', 'Tenho arte pronta', 40.00::numeric),
  ('caneca-porcelana-branca', 'Quero criação da arte (+ R$ 10,00 no total)', 30.00::numeric),
  ('caneca-porcelana-preta', 'Quero criação da arte (+ R$ 10,00 no total)', 40.00::numeric)
) as rates(product_slug, option_value, unit_price)
join public.products p on p.slug = rates.product_slug
where not exists (select 1 from public.price_rules r where r.product_id = p.id and r.option_value = rates.option_value);
