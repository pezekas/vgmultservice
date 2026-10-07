import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { exampleCategories, exampleProducts } from "./examples";
import type { CatalogCategory, CatalogProduct } from "./types";

export async function getCatalog() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return { categories: exampleCategories, products: exampleProducts, isPreview: true };

  try {
    const supabase = createSupabaseClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [categoriesResult, productsResult] = await Promise.all([
      supabase.from("categories").select("id, name, slug, description, is_active").eq("is_active", true).order("name"),
      supabase
        .from("products")
        .select("id, name, slug, short_description, description, pricing_mode, requires_measurements, measurement_unit, requires_file, allowed_file_extensions, category:categories(id, name, slug, description), price_rules(option_value, unit_price, minimum_price), product_images(storage_path, alt_text, sort_order), product_options(name, option_type, is_required, choices, sort_order, surcharge_choice, surcharge_amount, surcharge_mode, surcharge_label)")
        .eq("is_active", true)
        .order("name"),
    ]);

    if (categoriesResult.error || productsResult.error) {
      return { categories: exampleCategories, products: exampleProducts, isPreview: true };
    }

    const categories: CatalogCategory[] = (categoriesResult.data ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
    }));

    const products: CatalogProduct[] = (productsResult.data ?? []).map((product) => {
      const categoryRelation = product.category;
      const relatedCategory = Array.isArray(categoryRelation) ? categoryRelation[0] : categoryRelation;
      const category = relatedCategory
        ? { id: relatedCategory.id, name: relatedCategory.name, slug: relatedCategory.slug, description: relatedCategory.description }
        : { name: "Outros", slug: "outros" };
      const productImages = [...(product.product_images ?? [])].sort((left, right) => left.sort_order - right.sort_order);

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        category,
        shortDescription: product.short_description ?? "Solicite uma análise da equipe.",
        description: product.description ?? product.short_description ?? "Consulte a equipe sobre este produto.",
        pricingMode: product.pricing_mode,
        requiresMeasurements: product.requires_measurements,
        measurementUnit: product.measurement_unit,
        requiresFile: product.requires_file,
        allowedFileExtensions: product.allowed_file_extensions ?? [],
        imageUrl: productImages[0]?.storage_path?.startsWith("/")
          ? productImages[0].storage_path
          : productImages[0]?.storage_path
            ? supabase.storage.from("product-images").getPublicUrl(productImages[0].storage_path).data.publicUrl
            : undefined,
        imageAlt: productImages[0]?.alt_text ?? undefined,
        additionalImages: productImages.slice(1).map((image) => ({
          imageUrl: image.storage_path.startsWith("/")
            ? image.storage_path
            : supabase.storage.from("product-images").getPublicUrl(image.storage_path).data.publicUrl,
          imageAlt: image.alt_text ?? undefined,
        })),
        options: (product.product_options ?? []).map((option) => ({
          name: option.name,
          type: option.option_type === "text" ? "text" as const : "select" as const,
          isRequired: option.is_required,
          choices: Array.isArray(option.choices) ? option.choices.map(String) : [],
          surchargeChoice: option.surcharge_choice ?? undefined,
          surchargeAmount: option.surcharge_amount == null ? undefined : Number(option.surcharge_amount),
          surchargeMode: option.surcharge_mode === "per_order" || option.surcharge_mode === "per_unit" ? option.surcharge_mode : undefined,
          surchargeLabel: option.surcharge_label ?? undefined,
        })),
        priceRules: (product.price_rules ?? []).flatMap((rule) => {
          if (rule.option_value == null || rule.unit_price == null) return [];
          return [{ optionValue: rule.option_value, unitPrice: Number(rule.unit_price), minimumPrice: rule.minimum_price == null ? null : Number(rule.minimum_price) }];
        }),
      };
    });

    return { categories, products, isPreview: false };
  } catch {
    return { categories: exampleCategories, products: exampleProducts, isPreview: true };
  }
}

