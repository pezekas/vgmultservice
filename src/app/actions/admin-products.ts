"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireStaff() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const id = auth?.claims?.sub;
  if (!id) redirect("/admin/login");
  const { data: profile } = await supabase.from("staff_profiles").select("role,is_active").eq("user_id", id).maybeSingle();
  if (!profile?.is_active || profile.role === "client") redirect("/admin/login?access=denied");
  return { supabase, id };
}

export type ProductActionState = { error: string; success: string };

export async function saveProductAction(_prev: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const { supabase, id } = await requireStaff();
  const productId = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "").trim() || null;
  const slug = slugify(String(formData.get("slug") ?? name));
  const pricingMode = String(formData.get("pricing_mode") ?? "manual");
  const validModes = ["manual", "fixed", "per_unit", "per_area_m2", "per_linear_m"];
  if (name.length < 2 || slug.length < 2 || !validModes.includes(pricingMode)) return { error: "Confira o nome, URL e modelo de preço.", success: "" };

  const product = {
    name, slug, category_id: categoryId,
    short_description: String(formData.get("short_description") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    sale_unit: String(formData.get("sale_unit") ?? "").trim() || null,
    estimated_lead_time: String(formData.get("estimated_lead_time") ?? "").trim() || null,
    pricing_mode: pricingMode,
    requires_measurements: formData.get("requires_measurements") === "on",
    measurement_unit: String(formData.get("measurement_unit") ?? "").trim() || null,
    requires_file: formData.get("requires_file") === "on",
    allowed_file_extensions: String(formData.get("allowed_file_extensions") ?? "").split(",").map((value) => value.trim().replace(/^\./, "")).filter(Boolean),
    is_active: formData.get("is_active") === "on",
    updated_at: new Date().toISOString(),
  };

  let savedId = productId;
  if (productId) {
    const { error } = await supabase.from("products").update(product).eq("id", productId);
    if (error) return { error: `Não foi possível atualizar o produto: ${error.message}`, success: "" };
  } else {
    const { data, error } = await supabase.from("products").insert({ ...product, created_by: id }).select("id").single();
    if (error || !data) return { error: `Não foi possível cadastrar o produto: ${error?.message ?? "erro desconhecido"}`, success: "" };
    savedId = data.id;
  }

  const images = parseJson<Array<{ storage_path: string; alt_text: string; sort_order: number }>>(formData.get("images_json"));
  const options = parseJson<Array<{ name: string; option_type: string; is_required: boolean; choices: string[]; sort_order: number }>>(formData.get("options_json"));
  const prices = parseJson<Array<{ option_key: string | null; option_value: string | null; pricing_mode: string; unit_price: number | null; minimum_price: number | null }>>(formData.get("prices_json"));

  const mutations = await Promise.all([
    supabase.from("product_images").delete().eq("product_id", savedId),
    supabase.from("product_options").delete().eq("product_id", savedId),
    supabase.from("price_rules").delete().eq("product_id", savedId),
  ]);
  const mutationError = mutations.find((result) => result.error)?.error;
  if (mutationError) return { error: `O produto foi salvo, mas não foi possível substituir opções/preços: ${mutationError.message}`, success: "" };

  const [imageResult, optionResult, priceResult] = await Promise.all([
    images.length ? supabase.from("product_images").insert(images.map((image, index) => ({ ...image, product_id: savedId, sort_order: index }))) : Promise.resolve({ error: null }),
    options.length ? supabase.from("product_options").insert(options.map((option, index) => ({ ...option, product_id: savedId, sort_order: index }))) : Promise.resolve({ error: null }),
    prices.length ? supabase.from("price_rules").insert(prices.map((price) => ({ ...price, product_id: savedId, is_active: true, created_by: id }))) : Promise.resolve({ error: null }),
  ]);
  const relatedError = imageResult.error ?? optionResult.error ?? priceResult.error;
  if (relatedError) return { error: `O produto foi salvo, mas houve uma falha nos detalhes: ${relatedError.message}`, success: "" };

  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/admin/products");
  revalidatePath(`/produto/${slug}`);
  return { error: "", success: "Produto salvo. As alterações já estão ligadas ao catálogo público." };
}

export async function deleteProductAction(id: string) {
  const { supabase } = await requireStaff();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  const { data: profile } = await supabase.from("staff_profiles").select("role").eq("user_id", userId ?? "").maybeSingle();
  if (profile?.role !== "admin") throw new Error("Somente administradores podem excluir produtos.");
  const { data: imageRows } = await supabase.from("product_images").select("storage_path").eq("product_id", id);
  const storagePaths = (imageRows ?? []).map((image) => image.storage_path).filter((path) => path && !path.startsWith("/"));
  if (storagePaths.length) {
    const { error: storageError } = await supabase.storage.from("product-images").remove(storagePaths);
    if (storageError) throw new Error(`Não foi possível remover as fotos do armazenamento: ${storageError.message}`);
  }
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(`Não foi possível excluir: ${error.message}`);
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

function parseJson<T>(value: FormDataEntryValue | null): T {
  try { return JSON.parse(String(value ?? "[]")) as T; } catch { return [] as T; }
}

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
