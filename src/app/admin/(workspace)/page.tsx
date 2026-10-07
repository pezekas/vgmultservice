import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Painel | VG Multiservice", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const { data: profile } = await supabase
    .from("staff_profiles")
    .select("role, display_name")
    .eq("user_id", data?.claims?.sub ?? "")
    .maybeSingle();

  return (
    <main className="admin-content">
      <header className="admin-titlebar"><div><p className="eyebrow">Painel administrativo · {profile?.role === "admin" ? "Administrador" : "Funcionário"}</p><h1>Olá, {profile?.display_name ?? "equipe VG"}</h1><p>Acompanhe e gerencie o catálogo da loja.</p></div></header>
      <section className="admin-stat-grid">
        <article className="admin-stat"><span>Produtos ativos</span><strong>{await countRows(supabase, "products", true)}</strong></article>
        <article className="admin-stat"><span>Categorias ativas</span><strong>{await countRows(supabase, "categories", true)}</strong></article>
        <article className="admin-stat"><span>Ordens de serviço</span><strong>{await countRows(supabase, "quotes")}</strong></article>
      </section>
      <section className="admin-panel-card"><div><h2>Pedidos recebidos</h2><p>Pesquise as ordens de serviço por número, nome ou telefone do cliente.</p></div><Link className="button button-primary" href="/admin/orders">Consultar ordens →</Link></section>
      <section className="admin-panel-card"><div><h2>Catálogo</h2><p>Produtos gerenciados aqui são os mesmos exibidos na vitrine pública.</p></div><Link className="button button-primary" href="/admin/products">Gerenciar produtos →</Link></section>
    </main>
  );
}

async function countRows(supabase: Awaited<ReturnType<typeof createClient>>, table: string, activeOnly = false) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (activeOnly) query = query.eq("is_active", true);
  const { count } = await query;
  return count ?? 0;
}

