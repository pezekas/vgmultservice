-- Grava cada orçamento enviado como ordem de serviço e libera leitura apenas à equipe.
-- Clientes anônimos podem criar uma OS somente pela função validada; as tabelas
-- de clientes e orçamentos continuam sem INSERT/SELECT direto para anon.

create sequence if not exists public.orders_number_seq start with 1 increment by 1;

create or replace function public.create_public_order(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer jsonb;
  v_items jsonb;
  v_item jsonb;
  v_full_name text;
  v_phone text;
  v_phone_normalized text;
  v_email text;
  v_city text;
  v_lead_id uuid;
  v_quote_id uuid;
  v_order_number text;
  v_product_id uuid;
  v_product_slug text;
  v_product_name text;
  v_quantity numeric(12,3);
  v_width numeric(12,3);
  v_height numeric(12,3);
  v_unit_price numeric(12,2);
  v_area_rate numeric(12,2);
  v_surcharge numeric(12,2);
  v_estimated_total numeric(12,2);
  v_pricing_basis text;
  v_item_index integer := 0;
begin
  if pg_catalog.jsonb_typeof(p_payload) is distinct from 'object' then
    raise exception 'Dados do pedido inválidos.' using errcode = '22023';
  end if;

  v_customer := p_payload -> 'customer';
  v_items := p_payload -> 'items';
  if pg_catalog.jsonb_typeof(v_customer) is distinct from 'object'
    or pg_catalog.jsonb_typeof(v_items) is distinct from 'array' then
    raise exception 'Informe os dados do cliente e os itens do pedido.' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_array_length(v_items) < 1 or pg_catalog.jsonb_array_length(v_items) > 50 then
    raise exception 'Informe os dados do cliente e de 1 a 50 itens.' using errcode = '22023';
  end if;

  v_full_name := pg_catalog.left(pg_catalog.btrim(coalesce(v_customer ->> 'name', '')), 120);
  v_phone := pg_catalog.left(pg_catalog.btrim(coalesce(v_customer ->> 'phone', '')), 30);
  v_phone_normalized := pg_catalog.regexp_replace(v_phone, '[^0-9]', '', 'g');
  v_email := nullif(pg_catalog.left(pg_catalog.btrim(coalesce(v_customer ->> 'email', '')), 254), '');
  v_city := nullif(pg_catalog.left(pg_catalog.btrim(coalesce(v_customer ->> 'city', '')), 120), '');

  if pg_catalog.length(v_full_name) < 2
    or pg_catalog.length(v_phone_normalized) < 10
    or pg_catalog.length(v_phone_normalized) > 15
    or (v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') then
    raise exception 'Confira o nome, telefone e e-mail informados.' using errcode = '22023';
  end if;

  -- Serializa pedidos simultâneos do mesmo telefone para reaproveitar o lead.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_phone_normalized, 0));
  select lead.id into v_lead_id
  from public.leads as lead
  where lead.whatsapp_normalized = v_phone_normalized
  order by lead.updated_at desc
  limit 1
  for update;

  if v_lead_id is null then
    insert into public.leads (full_name, whatsapp, whatsapp_normalized, email, city)
    values (v_full_name, v_phone, v_phone_normalized, v_email, v_city)
    returning id into v_lead_id;
  else
    update public.leads
    set full_name = v_full_name,
        whatsapp = v_phone,
        email = coalesce(v_email, email),
        city = coalesce(v_city, city),
        updated_at = pg_catalog.now()
    where id = v_lead_id;
  end if;

  insert into public.quotes (lead_id, status_code)
  values (v_lead_id, 'new')
  returning id into v_quote_id;

  v_order_number := 'OS-' || pg_catalog.to_char(pg_catalog.now() at time zone 'America/Sao_Paulo', 'YYYYMMDD')
    || '-' || pg_catalog.lpad(pg_catalog.nextval('public.orders_number_seq'::regclass)::text, 6, '0');
  update public.quotes set public_code = v_order_number where id = v_quote_id;

  insert into public.quote_status_history (quote_id, old_status, new_status, note)
  values (v_quote_id, null, 'new', 'Ordem de serviço criada pelo pedido online.');

  for v_item in select item.value from pg_catalog.jsonb_array_elements(v_items) as item(value)
  loop
    v_item_index := v_item_index + 1;
    if pg_catalog.jsonb_typeof(v_item) is distinct from 'object' then
      raise exception 'O item % está inválido.', v_item_index using errcode = '22023';
    end if;

    v_product_slug := pg_catalog.left(pg_catalog.btrim(coalesce(v_item ->> 'productSlug', '')), 160);
    v_product_name := pg_catalog.left(pg_catalog.btrim(coalesce(v_item ->> 'productName', '')), 180);
    v_quantity := coalesce(nullif(v_item ->> 'quantity', '')::numeric, 0);
    v_width := nullif(v_item ->> 'width', '')::numeric;
    v_height := nullif(v_item ->> 'height', '')::numeric;
    v_unit_price := nullif(v_item ->> 'unitPrice', '')::numeric;
    v_area_rate := nullif(v_item ->> 'areaRate', '')::numeric;
    v_surcharge := nullif(v_item ->> 'surchargeAmount', '')::numeric;
    v_estimated_total := nullif(v_item ->> 'estimatedTotal', '')::numeric;
    v_pricing_basis := v_item ->> 'pricingBasis';

    if pg_catalog.length(v_product_name) < 1 or v_quantity <= 0 or v_quantity > 100000
      or (v_width is not null and v_width <= 0) or (v_height is not null and v_height <= 0)
      or (v_unit_price is not null and v_unit_price < 0)
      or (v_area_rate is not null and v_area_rate < 0)
      or (v_surcharge is not null and v_surcharge < 0)
      or (v_estimated_total is not null and v_estimated_total < 0) then
      raise exception 'Confira os dados do item %.', v_item_index using errcode = '22023';
    end if;

    select product.id into v_product_id
    from public.products as product
    where product.slug = v_product_slug
    limit 1;

    insert into public.quote_items (
      quote_id, product_id, product_name_snapshot, quantity,
      width_cm, height_cm, unit_label, configuration,
      calculation_snapshot, estimated_total
    ) values (
      v_quote_id,
      v_product_id,
      v_product_name,
      v_quantity,
      v_width,
      v_height,
      'unidade',
      pg_catalog.jsonb_build_object(
        'category_name', pg_catalog.left(coalesce(v_item ->> 'categoryName', ''), 120),
        'selections', case when pg_catalog.jsonb_typeof(v_item -> 'selections') = 'object' then v_item -> 'selections' else '{}'::jsonb end,
        'material', nullif(pg_catalog.left(coalesce(v_item ->> 'material', ''), 120), ''),
        'cut', nullif(pg_catalog.left(coalesce(v_item ->> 'cut', ''), 120), ''),
        'file_name', nullif(pg_catalog.left(coalesce(v_item ->> 'fileName', ''), 255), ''),
        'details', nullif(pg_catalog.left(coalesce(v_item ->> 'details', ''), 2000), '')
      ),
      pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
        'pricing_basis', case when v_pricing_basis in ('area_estimate', 'unit_price') then v_pricing_basis else 'manual' end,
        'unit_price', v_unit_price,
        'area_rate', v_area_rate,
        'surcharge_amount', v_surcharge,
        'estimated_total', v_estimated_total,
        'currency', 'BRL'
      )),
      v_estimated_total
    );
  end loop;

  return pg_catalog.jsonb_build_object('id', v_quote_id, 'order_number', v_order_number);
end;
$$;

revoke all on function public.create_public_order(jsonb) from public;
grant execute on function public.create_public_order(jsonb) to anon, authenticated;

create or replace view public.staff_orders
with (security_invoker = true)
as
select
  quote.id,
  quote.public_code as order_number,
  quote.status_code,
  coalesce(status.label, quote.status_code) as status_label,
  quote.created_at,
  lead.full_name,
  lead.whatsapp,
  lead.whatsapp_normalized,
  lead.email,
  lead.city,
  coalesce(
    pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id', item.id,
      'product_name', item.product_name_snapshot,
      'quantity', item.quantity,
      'width_cm', item.width_cm,
      'height_cm', item.height_cm,
      'unit_label', item.unit_label,
      'configuration', item.configuration,
      'calculation_snapshot', item.calculation_snapshot,
      'estimated_total', item.estimated_total
    ) order by item.created_at) filter (where item.id is not null),
    '[]'::jsonb
  ) as items,
  pg_catalog.sum(item.estimated_total) as calculated_subtotal,
  pg_catalog.bool_or(item.estimated_total is null) as has_unpriced_items
from public.quotes as quote
join public.leads as lead on lead.id = quote.lead_id
left join public.quote_statuses as status on status.code = quote.status_code
left join public.quote_items as item on item.quote_id = quote.id
group by quote.id, status.label, lead.id;

grant select on public.staff_orders to authenticated;

