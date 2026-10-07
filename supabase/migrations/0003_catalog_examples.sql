-- Conteúdo inicial editável para abrir a vitrine. Nenhum preço é presumido
-- além dos valores de adesivos fornecidos pela VG Multiservice.

insert into public.categories (name, slug, description) values
  ('Adesivos', 'adesivos', 'Adesivos personalizados para diferentes usos e superfícies.'),
  ('Placas', 'placas', 'Placas produzidas conforme a necessidade de cada projeto.'),
  ('Acrílicos', 'acrilicos', 'Peças em acrílico para comunicação, sinalização e projetos personalizados.'),
  ('Comunicação visual', 'comunicacao-visual', 'Soluções gráficas para apresentar e destacar sua marca.'),
  ('Impressões', 'impressoes', 'Impressões personalizadas de acordo com o material e formato desejados.'),
  ('Troféus', 'trofeus', 'Troféus e reconhecimentos preparados para sua ocasião.'),
  ('Gravações', 'gravacoes', 'Gravações personalizadas em materiais e produtos selecionados.'),
  ('Personalizados', 'personalizados', 'Produtos personalizados para empresas, eventos e presentes.'),
  ('Outros', 'outros', 'Outros serviços gráficos e de comunicação visual.')
on conflict (slug) do nothing;

insert into public.products (
  category_id, name, slug, short_description, description, sale_unit,
  requires_measurements, measurement_unit, requires_file, allowed_file_extensions,
  pricing_mode, is_active
)
select c.id, p.name, p.slug, p.short_description, p.description, p.sale_unit,
       p.requires_measurements, p.measurement_unit, p.requires_file,
       p.allowed_file_extensions, p.pricing_mode::public.pricing_mode, true
from (values
  ('adesivos', 'Adesivo personalizado', 'adesivo-personalizado', 'Adesivo sob medida em diferentes materiais e acabamentos.', 'Informe as medidas, escolha o material e indique se deseja corte. O arquivo de impressão é necessário.', 'm²', true, 'cm', true, array['png','pdf','cdr']::text[], 'per_area_m2'),
  ('placas', 'Placa personalizada', 'placa-personalizada', 'Placa preparada conforme o material, formato e uso desejados.', 'Exemplo de produto para o catálogo. O administrador poderá ajustar descrição, opções e condições.', null, false, null, false, '{}'::text[], 'manual'),
  ('acrilicos', 'Peça em acrílico', 'peca-em-acrilico', 'Peça em acrílico criada para o seu projeto.', 'Exemplo de produto para o catálogo. Consulte a equipe sobre formatos, espessuras e acabamentos disponíveis.', null, false, null, false, '{}'::text[], 'manual'),
  ('comunicacao-visual', 'Comunicação visual sob medida', 'comunicacao-visual-sob-medida', 'Solução visual preparada para sua empresa ou evento.', 'Exemplo de produto para o catálogo. Envie sua ideia para a equipe avaliar os materiais e as medidas.', null, false, null, false, '{}'::text[], 'manual'),
  ('impressoes', 'Impressão personalizada', 'impressao-personalizada', 'Impressão produzida conforme o formato e material do projeto.', 'Exemplo de produto para o catálogo. As especificações e o valor são confirmados pela equipe.', null, false, null, false, '{}'::text[], 'manual'),
  ('trofeus', 'Troféu personalizado', 'trofeu-personalizado', 'Reconhecimento personalizado para eventos e premiações.', 'Exemplo de produto para o catálogo. Consulte a equipe para definir modelo, gravação e quantidade.', null, false, null, false, '{}'::text[], 'manual'),
  ('gravacoes', 'Gravação personalizada', 'gravacao-personalizada', 'Gravação feita conforme a peça e a personalização desejada.', 'Exemplo de produto para o catálogo. O material, o conteúdo e as condições serão avaliados pela equipe.', null, false, null, false, '{}'::text[], 'manual'),
  ('personalizados', 'Produto personalizado', 'produto-personalizado', 'Um item preparado com a personalização do seu projeto.', 'Exemplo de produto para o catálogo. Descreva o que precisa para receber atendimento da equipe.', null, false, null, false, '{}'::text[], 'manual'),
  ('outros', 'Outros serviços gráficos', 'outros-servicos-graficos', 'Tem outra necessidade gráfica? Conte para a gente.', 'Exemplo de produto para o catálogo. A equipe analisa solicitações que não se encaixam nas demais categorias.', null, false, null, false, '{}'::text[], 'manual')
) as p(category_slug, name, slug, short_description, description, sale_unit,
       requires_measurements, measurement_unit, requires_file, allowed_file_extensions, pricing_mode)
join public.categories c on c.slug = p.category_slug
on conflict (slug) do nothing;

insert into public.product_options (product_id, name, option_type, is_required, choices, sort_order)
select p.id, option_data.name, option_data.option_type, true, option_data.choices, option_data.sort_order
from public.products p
cross join (values
  ('Material', 'select', '["Vinil", "Transparente", "Fosco"]'::jsonb, 1),
  ('Corte', 'select', '["Com corte", "Sem corte"]'::jsonb, 2)
) as option_data(name, option_type, choices, sort_order)
where p.slug = 'adesivo-personalizado'
  and not exists (
    select 1 from public.product_options existing
    where existing.product_id = p.id and existing.name = option_data.name
  );

insert into public.price_rules (
  product_id, option_key, option_value, pricing_mode, unit_price, minimum_price, is_active
)
select p.id, 'material', prices.material, 'per_area_m2', prices.unit_price, prices.minimum_price, true
from public.products p
cross join (values
  ('Vinil', 85.00::numeric, 35.00::numeric),
  ('Transparente', 95.00::numeric, 45.00::numeric),
  ('Fosco', 95.00::numeric, 45.00::numeric)
) as prices(material, unit_price, minimum_price)
where p.slug = 'adesivo-personalizado'
  and not exists (
    select 1 from public.price_rules existing
    where existing.product_id = p.id
      and existing.option_key = 'material'
      and existing.option_value = prices.material
  );

