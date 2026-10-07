import Image from "next/image";
import Link from "next/link";
import { CatalogSection } from "@/components/catalog/catalog-section";
import { CartLink } from "@/components/cart/cart-provider";
import { CartCheckout } from "@/components/cart/cart-checkout";
import { FloatingWhatsApp } from "@/components/contact/floating-whatsapp";
import { InstagramSection } from "@/components/contact/instagram-section";
import { getCatalog } from "@/lib/catalog/data";

const whatsappLink = `https://wa.me/${process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP ?? "8132049313"}?text=${encodeURIComponent("Olá! Gostaria de conhecer os produtos da VG Multiservice.")}`;
const quoteWhatsAppLink = `https://wa.me/${process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP ?? "8132049313"}?text=${encodeURIComponent("Olá! Gostaria de solicitar um orçamento com a VG Multiservice.")}`;

export const dynamic = "force-dynamic";

export default async function Home() {
  const catalog = await getCatalog();
  const featuredCategories = catalog.categories.filter((category) =>
    ["adesivos", "placas", "acrilicos", "comunicacao-visual"].includes(category.slug),
  ).slice(0, 4);

  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="VG Multiservice, início">
          <Image src="/vg-logo.png" alt="VG Multiservice — A sua Gráfica Digital" width={108} height={108} priority />
        </Link>
        <nav className="main-nav" aria-label="Navegação principal">
          <a href="#catalogo">Produtos</a>
          <a href="#sobre">Sobre</a>
          <CartLink />
          <Link className="button button-outline nav-login-button" href="/admin/login">Entrar</Link>
          <a className="button button-primary nav-quote-button" href={quoteWhatsAppLink} target="_blank" rel="noopener noreferrer">Solicitar orçamento <span aria-hidden="true">↗</span></a>
        </nav>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" />Sua ideia ganha forma aqui</p>
          <h1 id="hero-title">Impressão que <span>transforma</span> ideias em realidade.</h1>
          <p className="hero-description">Adesivos, placas e soluções gráficas que ajudam sua marca a se destacar. Explore a vitrine e converse com nossa equipe para montar seu orçamento.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#orcamento">Peça seu orçamento <span aria-hidden="true">↓</span></a>
            <a className="text-link" href="#catalogo">Ver produtos <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero-note"><span className="note-check" aria-hidden="true">✓</span><span>Atendimento humano pelo WhatsApp</span><span className="note-divider" /><span>Orçamentos personalizados</span></div>
        </div>

        <div className="hero-art" aria-label="Identidade visual colorida da VG Multiservice">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-card card-back"><span className="card-line" /><span className="card-line short" /><span className="card-dot" /></div>
          <div className="art-card card-front"><span className="art-spark">✳</span><span className="art-word">SUA MARCA</span><span className="art-tagline">COM MAIS COR.</span></div>
          <div className="art-sticker sticker-pink">IDEIAS<br />IMPRESSAS</div>
          <div className="art-sticker sticker-yellow">VG<br />✦</div>
          <div className="art-caption"><span className="caption-line" /><span>Criatividade em cada detalhe</span></div>
        </div>
      </section>

      <section className="service-strip" aria-label="Soluções gráficas">
        {featuredCategories.map((category, index) => (
          <Link href={`/categorias/${category.slug}`} key={category.slug}>
            <span className="service-number">{String(index + 1).padStart(2, "0")}</span><span>{category.name}</span><span className="service-arrow" aria-hidden="true">↗</span>
          </Link>
        ))}
      </section>

      <CatalogSection categories={catalog.categories} products={catalog.products} isPreview={catalog.isPreview} />

      <InstagramSection />

      <section className="quote-section" id="orcamento" aria-labelledby="quote-section-title">
        <div className="quote-section-heading">
          <p className="eyebrow">Solicite seu orçamento</p>
          <h2 id="quote-section-title">Seu próximo projeto começa <span>aqui.</span></h2>
        </div>
        <CartCheckout />
      </section>

      <section className="about-section" id="sobre">
        <p className="eyebrow">VG Multiservice · A sua Gráfica Digital</p>
        <h2>Da ideia à impressão, <span>conte com a gente.</span></h2>
        <p>Somos uma gráfica pronta para ajudar sua empresa, seu evento e seus projetos a ganharem vida. Conte o que você precisa e nossa equipe prepara o atendimento pelo WhatsApp.</p>
        <a className="text-link" href={whatsappLink} target="_blank" rel="noreferrer">Vamos conversar <span aria-hidden="true">↗</span></a>
      </section>

      <footer className="site-footer">
        <Image src="/vg-logo.png" alt="VG Multiservice" width={76} height={76} />
        <span>© {new Date().getFullYear()} VG Multiservice. Todos os direitos reservados.</span>
        <a href={whatsappLink} target="_blank" rel="noreferrer">WhatsApp (81) 3204-9313</a>
      </footer>
      <FloatingWhatsApp />
    </main>
  );
}

