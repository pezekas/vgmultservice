-- Novos produtos informados pela VG Multiservice.
-- Imagens são servidas como arquivos estáticos em public/products.

insert into public.categories (name, slug, description) values
  ('Garrafas', 'garrafas', 'Garrafas térmicas personalizadas em diferentes modelos e cores.'),
  ('3D', '3d', 'Produtos e peças personalizados com impressão 3D.')
on conflict (slug) do nothing;

insert into public.products (
  category_id, name, slug, short_description, description, sale_unit,
  pricing_mode, is_active
)
select c.id, p.name, p.slug, p.short_description, p.description, 'unidade',
       p.pricing_mode::public.pricing_mode, true
from (values
  ('garrafas', 'Garrafa térmica inox', 'garrafa-termica-inox', 'Garrafa térmica inox personalizada, disponível em várias cores.', 'Garrafa térmica em inox personalizada. Consulte a disponibilidade da cor desejada.', 'fixed'),
  ('garrafas', 'Garrafa térmica com alça', 'garrafa-termica-com-alca', 'Garrafa térmica com alça, em cores variadas.', 'Garrafa térmica com alça para facilitar o transporte. Consulte a disponibilidade da cor desejada.', 'fixed'),
  ('garrafas', 'Garrafa térmica com base amadeirada', 'garrafa-termica-base-amadeirada', 'Garrafa térmica branca com base amadeirada.', 'Garrafa térmica branca com detalhe de base amadeirada. Consulte a equipe para confirmar disponibilidade.', 'fixed'),
  ('garrafas', 'Garrafa térmica new inox', 'garrafa-termica-new-inox', 'Garrafa térmica inox personalizada em várias cores.', 'Garrafa térmica new inox. Consulte a equipe para confirmar disponibilidade da cor escolhida e o valor.', 'manual'),
  ('3d', 'Microfone para lapela', 'microfone-para-lapela', 'Microfone para lapela personalizado.', 'Microfone para lapela personalizado. Informe a quantidade desejada para solicitar o pedido.', 'fixed')
) as p(category_slug, name, slug, short_description, description, pricing_mode)
join public.categories c on c.slug = p.category_slug
on conflict (slug) do nothing;

insert into public.product_images (product_id, storage_path, alt_text, sort_order)
select p.id, image.path, image.alt_text, 0
from (values
  ('garrafa-termica-inox', '/products/garrafa-termica-inox.png', 'Garrafas térmicas personalizadas nas cores rosa, vermelha e preta'),
  ('garrafa-termica-com-alca', '/products/garrafa-termica-com-alca.png', 'Garrafas térmicas com alça nas cores rosa, bege, azul e preta'),
  ('garrafa-termica-base-amadeirada', '/products/garrafa-termica-base-amadeirada.png', 'Garrafa térmica branca com base amadeirada'),
  ('garrafa-termica-new-inox', '/products/garrafa-termica-new-inox.png', 'Garrafa térmica new inox rosa pastel'),
  ('microfone-para-lapela', '/products/microfone-lapela-3d.png', 'Microfones de lapela personalizados em duas cores')
) as image(product_slug, path, alt_text)
join public.products p on p.slug = image.product_slug
where not exists (
  select 1 from public.product_images existing
  where existing.product_id = p.id and existing.storage_path = image.path
);

insert into public.product_options (product_id, name, option_type, is_required, choices, sort_order)
select p.id, 'Cor', 'select', true, colors.choices::jsonb, 1
from (values
  ('garrafa-termica-inox', '["Preto", "Branco", "Rosa", "Vermelho", "Azul", "Laranja"]'),
  ('garrafa-termica-com-alca', '["Preto", "Vermelho", "Branco", "Bege", "Rosa", "Azul", "Amarelo"]'),
  ('garrafa-termica-base-amadeirada', '["Branco"]'),
  ('garrafa-termica-new-inox', '["Preto fosco", "Vermelho", "Rosa pastel", "Amarelo", "Branco", "Verde"]')
) as colors(product_slug, choices)
join public.products p on p.slug = colors.product_slug
where not exists (
  select 1 from public.product_options existing
  where existing.product_id = p.id and existing.name = 'Cor'
);

insert into public.price_rules (
  product_id, option_key, option_value, pricing_mode, unit_price, is_active
)
select p.id, 'unit', '', 'fixed', 100.00, true
from public.products p
where p.slug in ('garrafa-termica-inox', 'garrafa-termica-com-alca', 'garrafa-termica-base-amadeirada')
  and not exists (select 1 from public.price_rules r where r.product_id = p.id);

insert into public.price_rules (
  product_id, option_key, option_value, pricing_mode, unit_price, is_active
)
select p.id, 'unit', '', 'fixed', 40.00, true
from public.products p
where p.slug = 'microfone-para-lapela'
  and not exists (select 1 from public.price_rules r where r.product_id = p.id);
