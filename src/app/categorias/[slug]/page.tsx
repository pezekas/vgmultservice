import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogSection } from "@/components/catalog/catalog-section";
import { getCatalog } from "@/lib/catalog/data";

export const dynamic = "force-dynamic";

type Props = PageProps<"/categorias/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { categories } = await getCatalog();
  const category = categories.find((item) => item.slug === slug);
  if (!category) return { title: "Categoria não encontrada" };

  return {
    title: category.name,
    description: category.description ?? `Conheça os produtos de ${category.name} da VG Multiservice e solicite um orçamento.`,
    alternates: { canonical: `/categorias/${category.slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const { categories, products, isPreview } = await getCatalog();
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();
  const categoryProducts = products.filter((product) => product.category.slug === slug);

  return (
    <main className="site-shell">
      <header className="inner-page-header">
        <Link href="/" className="inner-brand">VG <span>Multiservice</span></Link>
        <Link className="text-link" href="/#catalogo">Todas as categorias <span aria-hidden="true">↗</span></Link>
      </header>
      <section className="inner-intro">
        <Link className="eyebrow back-link" href="/#catalogo">← Vitrine VG</Link>
        <h1>{category.name}</h1>
        <p>{category.description ?? "Confira os produtos desta categoria e converse com nossa equipe sobre seu projeto."}</p>
      </section>
      <CatalogSection categories={[category]} products={categoryProducts} isPreview={isPreview} />
      <footer className="inner-footer"><Link href="/">VG Multiservice</Link><span>Orçamentos pelo WhatsApp (81) 3204-9313</span></footer>
    </main>
  );
}
