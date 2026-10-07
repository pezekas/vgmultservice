import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Produtos | Painel VG", robots: { index: false, follow: false } };

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase.from("products")
    .select("id,name,slug,short_description,is_active,pricing_mode,category:categories(name),price_rules(unit_price,minimum_price,is_active)")
    .order("name");

  return <main className="admin-content">
    <header className="admin-titlebar admin-titlebar-row">
      <div><p className="eyebrow">Catálogo conectado à vitrine</p><h1>Produtos</h1><p>Edite as informações que os clientes veem no site.</p></div>
      <Link className="button button-primary" href="/admin/products/new">Adicionar produto +</Link>
    </header>
    {error ? <p className="form-error">Não foi possível carregar o catálogo: {error.message}</p> : null}
    <section className="admin-table-wrap" aria-label="Produtos cadastrados">
      <table className="admin-table"><thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Status</th><th></th></tr></thead>
        <tbody>{(products ?? []).map((product) => {
          const category = Array.isArray(product.category) ? product.category[0] : product.category;
          const activePrices = (product.price_rules ?? []).filter((rule) => rule.is_active && rule.unit_price != null);
          const minimum = activePrices.length ? Math.min(...activePrices.map((rule) => Number(rule.minimum_price ?? rule.unit_price))) : null;
          return <tr key={product.id}><td><strong>{product.name}</strong><small>/{product.slug}</small></td><td>{category?.name ?? "Sem categoria"}</td><td>{minimum == null ? "Sob consulta" : `A partir de ${currency(minimum)}`}</td><td><span className={`admin-status ${product.is_active ? "is-on" : "is-off"}`}>{product.is_active ? "Ativo" : "Inativo"}</span></td><td><Link className="admin-edit-link" href={`/admin/products/${product.id}`}>Editar →</Link></td></tr>;
        })}</tbody>
      </table>
      {!products?.length && !error ? <p className="admin-empty">Nenhum produto foi encontrado no banco conectado.</p> : null}
    </section>
  </main>;
}

function currency(value: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value); }
