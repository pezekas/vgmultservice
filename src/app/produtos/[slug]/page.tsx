import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/catalog/data";
import { CartLink } from "@/components/cart/cart-provider";
import { AddProductForm } from "@/components/cart/add-product-form";
import { ProductImageGallery } from "@/components/catalog/product-image-gallery";

export const dynamic = "force-dynamic";

type Props = PageProps<"/produtos/[slug]">;

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await getCatalog();
  const product = products.find((item) => item.slug === slug);
  if (!product) return { title: "Produto não encontrado" };

  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical: `/produtos/${product.slug}` },
    openGraph: { title: `${product.name} | VG Multiservice`, description: product.shortDescription, type: "website" },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const { products, isPreview } = await getCatalog();
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();

  const isSticker = product.category.slug === "adesivos" && product.requiresMeasurements;

  return (
    <main className="site-shell">
      <header className="inner-page-header">
        <Link href="/" className="inner-brand" aria-label="VG Multiservice - página inicial"><Image className="inner-brand-logo" src="/vg-logo.png" alt="VG Multiservice — A sua Gráfica Digital" width={640} height={640} priority /></Link>
        <div className="inner-header-actions"><CartLink /><Link className="text-link" href="/#catalogo">Voltar à vitrine <span aria-hidden="true">↗</span></Link></div>
      </header>
      <article className="product-detail">
        {product.imageUrl ? <ProductImageGallery name={product.name} images={[{ imageUrl: product.imageUrl, imageAlt: product.imageAlt }, ...(product.additionalImages ?? [])]} /> : <div className="product-detail-art"><div className="detail-art-circle"><span aria-hidden="true">{isSticker ? "✳" : "✦"}</span></div><span className="detail-art-label">VG MULTISERVICE</span></div>}
        <div className="product-detail-copy">
          <Link href={`/categorias/${product.category.slug}`} className="eyebrow back-link">← {product.category.name}</Link>
          <h1>{product.name}</h1>
          <p className="product-detail-lead">{product.shortDescription}</p>
          <p className="product-detail-description">{product.description}</p>

          {isSticker ? (
            <div className="sticker-pricing">
              <h2>Valores informados</h2>
              {product.priceRules.map((rule) => <div className="sticker-price-row" key={rule.optionValue}><span>{rule.optionValue}</span><span>{money(rule.unitPrice)} / m²</span><strong>{rule.minimumPrice != null ? `Mínimo ${money(rule.minimumPrice)}` : "Por área"}</strong></div>)}
              <p>O valor depende das medidas, material e quantidade. {product.priceRules.some((rule) => rule.minimumPrice != null) ? "O tamanho mínimo informado é A3; a equipe confirma os detalhes do corte e do arquivo no atendimento." : "Confira a estimativa calculada para as medidas informadas."}</p>
            </div>
          ) : product.pricingMode === "fixed" && product.priceRules.length ? (
            <div className="sticker-pricing"><h2>Valores</h2>{product.options?.some((option) => option.surchargeAmount) ? <><div className="sticker-price-row"><span>Caneca</span><span>{money(product.priceRules[0].unitPrice)}</span><strong>por unidade</strong></div><p>Ao solicitar a criação da arte, acrescentamos {money(product.options.find((option) => option.surchargeAmount)?.surchargeAmount ?? 0)} ao total do pedido.</p></> : product.priceRules.map((rule) => <div className="sticker-price-row" key={`${rule.optionValue}-${rule.unitPrice}`}><span>{rule.optionValue || "Preço unitário"}</span><span>{money(rule.unitPrice)}</span><strong>{product.slug === "adesivo-dtf" ? "por folha" : "por unidade"}</strong></div>)}<p>{product.slug === "adesivo-dtf" ? "Para tamanhos maiores que A3, consulte a equipe pelo WhatsApp." : "Escolha as opções e a quantidade para ver o subtotal antes de adicionar ao pedido."}</p></div>
          ) : product.pricingMode === "per_area_m2" && product.priceRules.length ? (
            <div className="sticker-pricing"><h2>Preço por área</h2>{product.priceRules.map((rule) => <div className="sticker-price-row" key={rule.optionValue}><span>{rule.optionValue}</span><span>{money(rule.unitPrice)} / m²</span><strong>{rule.minimumPrice != null ? `Mínimo ${money(rule.minimumPrice)}` : "Por área"}</strong></div>)}<p>A estimativa é calculada pela largura × altura em metros, multiplicada pelo valor do m² e pela quantidade.</p></div>
          ) : (
            <div className="manual-price-note"><span aria-hidden="true">✳</span><div><strong>Orçamento sob medida</strong><p>Este produto precisa de avaliação da equipe. Nenhum preço foi cadastrado ainda.</p></div></div>
          )}

          {product.requiresFile ? <p className="file-requirement"><strong>Arquivo:</strong> envie em {product.allowedFileExtensions.map((ext) => ext.toUpperCase()).join(", ")} para análise no WhatsApp.</p> : null}
          <AddProductForm product={product} />
          {isPreview ? <p className="preview-notice detail-preview">Este é um conteúdo demonstrativo; a equipe poderá revisar nome e descrição ao cadastrar o catálogo.</p> : null}
        </div>
      </article>
      <footer className="inner-footer"><Link href="/">VG Multiservice</Link><span>Atendimento humano pelo WhatsApp (81) 3204-9313</span></footer>
    </main>
  );
}
