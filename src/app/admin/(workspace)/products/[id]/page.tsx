import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductEditor } from "../product-editor";
import { DeleteProductButton } from "../delete-button";
import { requirePanelAccess } from "@/lib/supabase/access";

export const metadata = { title: "Editar produto | Painel VG", robots: { index: false, follow: false } };

export default async function EditAdminProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { profile } = await requirePanelAccess();
  const { id } = await params;
  const supabase = await createClient();
  const [productResult, categoriesResult] = await Promise.all([
    supabase.from("products").select("*,product_images(id,storage_path,alt_text,sort_order),product_options(id,name,option_type,is_required,choices,sort_order,surcharge_choice,surcharge_amount,surcharge_mode,surcharge_label),price_rules(id,option_key,option_value,pricing_mode,unit_price,minimum_price,is_active)").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id,name,is_active").order("name"),
  ]);
  if (!productResult.data) notFound();
  const p = productResult.data;
  const productImages = [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((image) => ({ id: image.id, storage_path: image.storage_path, alt_text: image.alt_text ?? "" }));
  const images = productImages.map((image) => ({ ...image, url: publicUrl(supabase, image.storage_path) }));
  return <main className="admin-content"><Link className="admin-back-link" href="/admin/products">← Voltar aos produtos</Link><header className="admin-titlebar"><p className="eyebrow">Editar catálogo compartilhado</p><h1>{p.name}</h1><p>Salve para refletir as alterações na vitrine pública.</p></header><ProductEditor product={{ ...p, product_images: undefined }} categories={categoriesResult.data ?? []} images={images} options={p.product_options ?? []} prices={(p.price_rules ?? []).filter((rule: { is_active: boolean }) => rule.is_active)} />{profile.role === "admin" ? <section className="admin-delete-section"><h2>Excluir produto</h2><p>O produto, as opções e as regras de preço serão removidos do catálogo.</p><DeleteProductButton productId={id} /></section> : null}</main>;
}

function publicUrl(supabase: Awaited<ReturnType<typeof createClient>>, path: string) {
  return path.startsWith("/") ? path : supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}
