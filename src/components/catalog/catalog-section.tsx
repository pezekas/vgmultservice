"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { CatalogCategory, CatalogProduct } from "@/lib/catalog/types";

const categoryColors: Record<string, string> = {
  adesivos: "blue",
  placas: "yellow",
  acrilicos: "pink",
  "comunicacao-visual": "blue",
  impressoes: "pink",
  trofeus: "yellow",
  gravacoes: "blue",
  personalizados: "pink",
  garrafas: "blue",
  "3d": "yellow",
  "pvc-e-ima": "pink",
  canecas: "blue",
  outros: "yellow",
};

const categorySymbols: Record<string, string> = {
  adesivos: "✳", placas: "▱", acrilicos: "◇", "comunicacao-visual": "✦",
  impressoes: "▤", trofeus: "♛", gravacoes: "◉", personalizados: "✿", outros: "＋",
  garrafas: "◒", "3d": "▰", "pvc-e-ima": "▱", canecas: "▱",
};

const categoryFilterOrder = ["adesivos", "garrafas", "3d", "pvc-e-ima", "canecas", "outros"];

function productPriceLabel(product: CatalogProduct) {
  if (!product.priceRules.length) return product.pricingMode === "manual" ? "Preço a definir" : "Orçamento sob medida";
  if (product.pricingMode === "fixed" && product.priceRules[0]?.unitPrice != null) {
    const prices = product.priceRules.map((rule) => rule.unitPrice);
    const lowest = Math.min(...prices);
    const highest = Math.max(...prices);
    return lowest === highest ? `R$ ${lowest.toFixed(2).replace(".", ",")}` : `A partir de R$ ${lowest.toFixed(2).replace(".", ",")}`;
  }
  if (product.pricingMode === "per_unit" && product.priceRules[0]?.unitPrice != null) return `R$ ${product.priceRules[0].unitPrice.toFixed(2).replace(".", ",")} / unidade`;
  const minimums = product.priceRules.map((rule) => rule.minimumPrice).filter((price): price is number => price !== null);
  if (!minimums.length) return "Cálculo conforme configuração";
  const minimum = Math.min(...minimums);
  return `Mínimo de R$ ${minimum.toFixed(2).replace(".", ",")}`;
}

type Props = { categories: CatalogCategory[]; products: CatalogProduct[]; isPreview: boolean };

export function CatalogSection({ categories, products, isPreview }: Props) {
  const [activeCategory, setActiveCategory] = useState("todos");
  const [search, setSearch] = useState("");
  const visibleCategories = categoryFilterOrder
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter((category): category is CatalogCategory => Boolean(category));

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return products.filter((product) => {
      const matchesCategory = activeCategory === "todos" || product.category.slug === activeCategory;
      const matchesSearch = !normalizedSearch || `${product.name} ${product.shortDescription} ${product.category.name}`.toLocaleLowerCase("pt-BR").includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, products, search]);

  return (
    <section className="catalog-section" id="catalogo" aria-labelledby="catalog-title">
      <div className="catalog-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" />Vitrine VG</p>
          <h2 id="catalog-title">Encontre o que <span>você imaginou.</span></h2>
          <p className="catalog-intro">Explore alguns dos produtos e serviços da VG. Cada projeto tem suas particularidades, então nossa equipe ajuda a definir os detalhes.</p>
        </div>
        <label className="catalog-search">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <span className="sr-only">Pesquisar produtos</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="O que você está procurando?" />
          {search ? <button type="button" aria-label="Limpar pesquisa" onClick={() => setSearch("")}>×</button> : null}
        </label>
      </div>

      {isPreview ? <p className="preview-notice">Catálogo demonstrativo. Os exemplos serão substituídos pelos produtos cadastrados no Supabase após a configuração do banco.</p> : null}

      <div className="category-filters" aria-label="Filtrar por categoria">
        <button aria-pressed={activeCategory === "todos"} className={activeCategory === "todos" ? "filter-chip selected" : "filter-chip"} type="button" onClick={() => setActiveCategory("todos")}>Todos os produtos</button>
        {visibleCategories.map((category) => (
          <button key={category.slug} aria-pressed={activeCategory === category.slug} className={activeCategory === category.slug ? "filter-chip selected" : "filter-chip"} type="button" onClick={() => setActiveCategory(category.slug)}>
            {category.name}
          </button>
        ))}
      </div>

      {visibleProducts.length ? (
        <div className="product-grid">
          {visibleProducts.map((product, index) => (
            <Link className="product-card" href={`/produtos/${product.slug}`} key={product.slug}>
              <div className={`product-art art-${categoryColors[product.category.slug] ?? ["blue", "pink", "yellow"][index % 3]}${product.imageUrl ? " has-product-photo" : ""}`}>
                {product.imageUrl ? <Image className="product-photo" src={product.imageUrl} alt={product.imageAlt ?? product.name} fill sizes="(max-width: 650px) 100vw, (max-width: 850px) 50vw, 33vw" /> : <span className="product-art-symbol" aria-hidden="true">{categorySymbols[product.category.slug] ?? "✳"}</span>}
                <span className="product-art-caption">VG MULTISERVICE</span>
                {product.category.slug === "adesivos" ? <span className="product-art-pill">SOB MEDIDA</span> : null}
              </div>
              <div className="product-card-info">
                <span className="product-category">{product.category.name}</span>
                <h3>{product.name}</h3>
                <p>{product.shortDescription}</p>
                <div className="product-card-bottom"><span>{productPriceLabel(product)}</span><span className="product-card-arrow" aria-hidden="true">↗</span></div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="catalog-empty"><span aria-hidden="true">⌕</span><p>Nenhum produto encontrado. Tente outra busca ou categoria.</p><button type="button" onClick={() => { setActiveCategory("todos"); setSearch(""); }}>Limpar filtros</button></div>
      )}
    </section>
  );
}
