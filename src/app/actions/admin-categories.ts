"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type DeleteCategoryState = { error: string; success: string };

async function adminClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/admin/login");
  const { data: profile } = await supabase.from("staff_profiles").select("role,is_active").eq("user_id", userId).maybeSingle();
  if (!profile?.is_active || profile.role !== "admin") redirect("/admin");
  return supabase;
}

export async function saveCategoryAction(formData: FormData) {
  const supabase = await adminClient();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  const description = String(formData.get("description") ?? "").trim() || null;
  const is_active = formData.get("is_active") === "on";
  if (name.length < 2 || slug.length < 2) throw new Error("Informe nome e URL da categoria.");
  const result = id
    ? await supabase.from("categories").update({ name, slug, description, is_active, updated_at: new Date().toISOString() }).eq("id", id)
    : await supabase.from("categories").insert({ name, slug, description, is_active });
  if (result.error) throw new Error(`Não foi possível salvar: ${result.error.message}`);
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
}

export async function deleteCategoryAction(_previous: DeleteCategoryState, formData: FormData): Promise<DeleteCategoryState> {
  const supabase = await adminClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Categoria inválida.", success: "" };
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: `Não foi possível excluir a categoria: ${error.message}`, success: "" };
  revalidatePath("/");
  revalidatePath("/categorias");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  return { error: "", success: "Categoria excluída. Os produtos relacionados continuam no catálogo sem categoria." };
}

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
