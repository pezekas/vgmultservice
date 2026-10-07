import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductEditor } from "../product-editor";

export const metadata = { title: "Adicionar produto | Painel VG", robots: { index: false, follow: false } };

export default async function NewAdminProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id,name,is_active").order("name");
  return <main className="admin-content"><Link className="admin-back-link" href="/admin/products">← Voltar aos produtos</Link><header className="admin-titlebar"><p className="eyebrow">Catálogo compartilhado</p><h1>Adicionar produto</h1><p>O novo produto poderá aparecer na vitrine assim que for ativado.</p></header><ProductEditor categories={categories ?? []} images={[]} options={[]} prices={[]} /></main>;
}
