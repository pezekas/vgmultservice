import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Ordens de serviço | Painel VG", robots: { index: false, follow: false } };

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  width_cm: number | null;
  height_cm: number | null;
  configuration: {
    category_name?: string;
    selections?: Record<string, string>;
    material?: string;
    cut?: string;
    file_name?: string;
    details?: string;
  };
  calculation_snapshot: {
    pricing_basis?: string;
    unit_price?: number;
    area_rate?: number;
  };
  estimated_total: number | null;
};

type StaffOrder = {
  id: string;
  order_number: string;
  status_code: string;
  status_label: string;
  created_at: string;
  full_name: string;
  whatsapp: string;
  whatsapp_normalized: string;
  email: string | null;
  city: string | null;
  items: OrderItem[];
  calculated_subtotal: number | null;
  has_unpriced_items: boolean;
};

type SearchParams = Promise<{ order?: string; name?: string; phone?: string; page?: string }>;
const pageSize = 50;

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const orderSearch = cleanSearch(params.order);
  const nameSearch = cleanSearch(params.name);
  const phoneSearch = (params.phone ?? "").replace(/\D/g, "").slice(0, 15);
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const supabase = await createClient();

  let query = supabase.from("staff_orders").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (orderSearch) query = query.ilike("order_number", `%${orderSearch}%`);
  if (nameSearch) query = query.ilike("full_name", `%${nameSearch}%`);
  if (phoneSearch) query = query.ilike("whatsapp_normalized", `%${phoneSearch}%`);
  const { data, error, count } = await query.range((currentPage - 1) * pageSize, currentPage * pageSize - 1);
  const orders = (data ?? []) as unknown as StaffOrder[];
  const hasSearch = Boolean(orderSearch || nameSearch || phoneSearch);
  const totalOrders = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalOrders / pageSize));
  const pageHref = (page: number) => ({ pathname: "/admin/orders", query: { ...(orderSearch ? { order: orderSearch } : {}), ...(nameSearch ? { name: nameSearch } : {}), ...(phoneSearch ? { phone: phoneSearch } : {}), page: String(page) } });

  return <main className="admin-content">
    <header className="admin-titlebar">
      <p className="eyebrow">Pedidos recebidos · acesso da equipe</p>
      <h1>Ordens de serviço</h1>
      <p>Consulte os pedidos salvos e encontre uma OS pelo número, nome ou telefone do cliente.</p>
    </header>

    <form className="admin-order-search" method="get" action="/admin/orders">
      <label className="form-field">Número da OS<input name="order" defaultValue={params.order ?? ""} placeholder="Ex.: OS-20260930-000001" /></label>
      <label className="form-field">Nome do cliente<input name="name" defaultValue={params.name ?? ""} placeholder="Digite o nome" /></label>
      <label className="form-field">Telefone do cliente<input name="phone" type="tel" inputMode="tel" defaultValue={params.phone ?? ""} placeholder="DDD e telefone" /></label>
      <div className="admin-order-search-actions"><button className="button button-primary" type="submit">Pesquisar</button>{hasSearch ? <Link className="button button-quiet" href="/admin/orders">Limpar filtros</Link> : null}</div>
    </form>

    {error ? <p className="form-error" role="alert">Não foi possível carregar as ordens. Confirme que a migração 0014 foi aplicada no Supabase. Detalhe: {error.message}</p> : null}
    {!error && !orders.length ? <section className="admin-panel-card admin-orders-empty"><div><h2>{hasSearch ? "Nenhuma OS encontrada" : "Ainda não há pedidos registrados"}</h2><p>{hasSearch ? "Confira os dados informados e pesquise novamente." : "Quando um cliente registrar um pedido no site, a ordem aparecerá aqui."}</p></div></section> : null}
    {!error && totalOrders > 0 ? <p className="admin-orders-count">Mostrando {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalOrders)} de {totalOrders} ordens</p> : null}

    <section className="admin-orders-list" aria-label="Ordens de serviço encontradas">
      {orders.map((order) => <article className="admin-order-card" key={order.id}>
        <header className="admin-order-heading">
          <div><span className="admin-order-label">ORDEM DE SERVIÇO</span><h2>{order.order_number}</h2><p>{new Date(order.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p></div>
          <span className="admin-status is-on">{order.status_label}</span>
        </header>
        <div className="admin-order-customer">
          <div><span>Cliente</span><strong>{order.full_name}</strong></div>
          <div><span>Telefone</span><a href={`tel:+${order.whatsapp_normalized}`}>{order.whatsapp}</a></div>
          {order.email ? <div><span>E-mail</span><a href={`mailto:${order.email}`}>{order.email}</a></div> : null}
          {order.city ? <div><span>Cidade/UF</span><strong>{order.city}</strong></div> : null}
        </div>
        <details className="admin-order-items">
          <summary>Especificações do pedido · {order.items.length} {order.items.length === 1 ? "item" : "itens"}</summary>
          <ol>{order.items.map((item) => <li key={item.id}>
            <strong>{item.product_name}</strong>{item.configuration.category_name ? <span> · {item.configuration.category_name}</span> : null}
            <p>Quantidade: {formatQuantity(item.quantity)}{item.width_cm != null && item.height_cm != null ? ` · Medidas: ${formatQuantity(item.width_cm)} × ${formatQuantity(item.height_cm)} cm` : ""}</p>
            {item.configuration.material ? <p>Material: {item.configuration.material}</p> : null}
            {item.configuration.selections ? Object.entries(item.configuration.selections).filter(([, value]) => value).map(([key, value]) => <p key={key}>{key}: {value}</p>) : null}
            {item.configuration.cut ? <p>Acabamento: {item.configuration.cut}</p> : null}
            {item.configuration.details ? <p>Detalhes: {item.configuration.details}</p> : null}
            {item.configuration.file_name ? <p>Arquivo informado: {item.configuration.file_name}</p> : null}
            {item.estimated_total != null ? <p><strong>{item.calculation_snapshot.pricing_basis === "area_estimate" ? "Estimativa do item" : "Total do item"}: {formatCurrency(item.estimated_total)}</strong>{item.calculation_snapshot.area_rate != null ? ` · ${formatCurrency(item.calculation_snapshot.area_rate)}/m²` : ""}</p> : <p><strong>Valor do item: a definir</strong></p>}
          </li>)}</ol>
        </details>
        <footer className="admin-order-total">
          <span>{order.has_unpriced_items ? "Valor final" : order.items.some((item) => item.calculation_snapshot.pricing_basis === "area_estimate") ? "Total estimado" : "Total"}</span>
          <strong>{order.has_unpriced_items ? `A definir${order.calculated_subtotal != null ? ` · subtotal calculado ${formatCurrency(order.calculated_subtotal)}` : ""}` : order.calculated_subtotal != null ? formatCurrency(order.calculated_subtotal) : "A definir"}</strong>
        </footer>
      </article>)}
    </section>
    {!error && pageCount > 1 ? <nav className="admin-order-pagination" aria-label="Páginas das ordens de serviço">
      {currentPage > 1 ? <Link className="button button-quiet" href={pageHref(currentPage - 1)}>← Anterior</Link> : <span />}
      <span>Página {currentPage} de {pageCount}</span>
      {currentPage < pageCount ? <Link className="button button-quiet" href={pageHref(currentPage + 1)}>Próxima →</Link> : <span />}
    </nav> : null}
  </main>;
}

function cleanSearch(value?: string) {
  return (value ?? "").trim().slice(0, 120).replace(/[%_]/g, "");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value);
}
