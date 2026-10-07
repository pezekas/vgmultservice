import { createClient } from "@/lib/supabase/server";
import { requirePanelAccess } from "@/lib/supabase/access";
import { CategoryManager } from "./category-manager";

export const metadata = { title: "Categorias | Painel VG", robots: { index: false, follow: false } };

export default async function AdminCategoriesPage() {
  await requirePanelAccess("admin");
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("id,name,slug,description,is_active").order("name");
  return <main className="admin-content"><header className="admin-titlebar"><p className="eyebrow">Catálogo compartilhado</p><h1>Categorias</h1><p>Ative ou desative categorias exibidas na vitrine e mantenha os produtos organizados.</p></header>{error ? <p className="form-error">Não foi possível carregar as categorias: {error.message}</p> : null}<CategoryManager categories={data ?? []} /></main>;
}
