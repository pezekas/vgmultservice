-- Produtos informados para a categoria 3D.
insert into public.categories (name, slug, description)
values ('3D', '3d', 'Produtos e peças personalizados com impressão 3D.')
on conflict (slug) do nothing;

insert into public.products (category_id, name, slug, short_description, description, sale_unit, pricing_mode, is_active)
select c.id, p.name, p.slug, p.short_description, p.description, 'unidade', 'fixed', true
from (values
  ('Microfone para lapela', 'microfone-para-lapela', 'Microfone para lapela personalizado.', 'Microfone para lapela personalizado. Informe a quantidade desejada para solicitar o pedido.', 40.00::numeric),
  ('Suporte para celular personalizado', 'suporte-celular-personalizado', 'Suporte para celular personalizado produzido em 3D.', 'Suporte para celular personalizado. Informe a cor desejada nos detalhes; a disponibilidade será confirmada pela equipe no WhatsApp.', 20.00::numeric)
) as p(name, slug, short_description, description, unit_price)
join public.categories c on c.slug = '3d'
on conflict (slug) do nothing;

insert into public.product_images (product_id, storage_path, alt_text, sort_order)
select p.id, i.path, i.alt_text, 0
from (values
  ('microfone-para-lapela', '/products/microfone-lapela-3d.png', 'Microfones de lapela personalizados em duas cores'),
  ('suporte-celular-personalizado', '/products/suporte-celular-personalizado.png', 'Suporte para celular personalizado em impressão 3D')
) as i(product_slug, path, alt_text)
join public.products p on p.slug = i.product_slug
where not exists (select 1 from public.product_images x where x.product_id = p.id and x.storage_path = i.path);

insert into public.price_rules (product_id, option_key, option_value, pricing_mode, unit_price, is_active)
select p.id, 'unit', '', 'fixed', prices.unit_price, true
from (values ('microfone-para-lapela', 40.00::numeric), ('suporte-celular-personalizado', 20.00::numeric)) as prices(product_slug, unit_price)
join public.products p on p.slug = prices.product_slug
where not exists (select 1 from public.price_rules r where r.product_id = p.id);
