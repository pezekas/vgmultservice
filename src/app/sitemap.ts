import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog/data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { categories, products } = await getCatalog();

  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    ...categories.map((category) => ({ url: `${baseUrl}/categorias/${category.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((product) => ({ url: `${baseUrl}/produtos/${product.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
