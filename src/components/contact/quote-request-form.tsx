"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { CatalogProduct } from "@/lib/catalog/types";

type Props = { products: CatalogProduct[] };

export function QuoteRequestForm({ products }: Props) {
  const [whatsAppUrl, setWhatsAppUrl] = useState("");
  const [selectedSlug, setSelectedSlug] = useState(products[0]?.slug ?? "");
  const selectedProduct = useMemo(() => products.find((product) => product.slug === selectedSlug), [products, selectedSlug]);
  function createWhatsAppMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const phoneInput = String(formData.get("phone") ?? "").trim();
    const customerPhone = phoneInput.replace(/\D/g, "");
    const product = products.find((item) => item.slug === String(formData.get("product"))) ?? selectedProduct;
    if (!product) return;

    const lines = [
      "Olá! Gostaria de solicitar um orçamento.",
      "",
      `Nome: ${name}`,
      `WhatsApp do cliente: ${phoneInput}`,
      `Produto: ${product.name}`,
    ];

    const email = String(formData.get("email") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const quantity = String(formData.get("quantity") ?? "").trim();
    const details = String(formData.get("details") ?? "").trim();

    if (email) lines.push(`E-mail: ${email}`);
    if (city) lines.push(`Cidade/UF: ${city}`);
    if (quantity) lines.push(`Quantidade: ${quantity}`);

    if (product.requiresMeasurements) {
      const material = String(formData.get("material") ?? "");
      const width = String(formData.get("width") ?? "");
      const height = String(formData.get("height") ?? "");
      const cut = String(formData.get("cut") ?? "");
      const file = formData.get("art-file");
      if (material) lines.push(`Material: ${material}`);
      if (width && height) lines.push(`Medidas: ${width} × ${height} cm`);
      if (cut) lines.push(`Corte: ${cut}`);
      if (file instanceof File && file.name) lines.push(`Arquivo selecionado: ${file.name} (vou anexá-lo nesta conversa)`);
    }

    if (details) lines.push(`Observações: ${details}`);
    lines.push("", "Aguardo o atendimento da equipe VG Multiservice.");

    const businessPhone = (process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP ?? "8132049313").replace(/\D/g, "");
    const params = new URLSearchParams({ text: lines.join("\n") });
    if (customerPhone.length < 10) return;
    setWhatsAppUrl(`https://wa.me/${businessPhone}?${params.toString()}`);
  }

  if (!products.length) {
    return <p className="quote-empty">A equipe está atualizando os produtos. Fale conosco pelo botão de WhatsApp para solicitar seu orçamento.</p>;
  }

  return (
    <div className="quote-form-layout">
      <div className="quote-form-aside">
        <p className="eyebrow"><span className="eyebrow-dot" />Vamos conversar</p>
        <h2>Conte o que você <span>precisa.</span></h2>
        <p>Preencha os dados e prepare uma mensagem com seu pedido. Nossa equipe continua o atendimento pelo WhatsApp.</p>
        <div className="quote-aside-note"><span aria-hidden="true">✳</span><span>Quanto mais detalhes, mais fácil para a equipe entender seu projeto.</span></div>
      </div>

      <form className="quote-form" onChange={() => setWhatsAppUrl("")} onSubmit={createWhatsAppMessage}>
        <div className="form-grid">
          <label className="form-field">
            <span>Seu nome <b>*</b></span>
            <input name="name" type="text" autoComplete="name" placeholder="Como podemos chamar você?" required />
          </label>
          <label className="form-field">
            <span>Seu WhatsApp <b>*</b></span>
            <input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="(00) 00000-0000" pattern="[0-9()+. -]{10,20}" title="Informe seu número com DDD." required />
          </label>
          <label className="form-field">
            <span>E-mail <small>opcional</small></span>
            <input name="email" type="email" autoComplete="email" placeholder="voce@email.com" />
          </label>
          <label className="form-field">
            <span>Cidade/UF <small>opcional</small></span>
            <input name="city" type="text" autoComplete="address-level2" placeholder="Ex.: Recife/PE" />
          </label>
          <label className="form-field form-field-wide">
            <span>O que você precisa? <b>*</b></span>
            <select name="product" value={selectedSlug} onChange={(event) => setSelectedSlug(event.target.value)} required>
              {products.map((product) => <option key={product.slug} value={product.slug}>{product.name} · {product.category.name}</option>)}
            </select>
          </label>

          {selectedProduct?.requiresMeasurements ? (
            <>
              <label className="form-field">
                <span>Material do adesivo <b>*</b></span>
                <select name="material" required defaultValue="">
                  <option value="" disabled>Selecione o material</option>
                  {selectedProduct.priceRules.map((rule) => <option key={rule.optionValue} value={rule.optionValue}>{rule.optionValue}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>Quantidade <b>*</b></span>
                <input name="quantity" type="number" min="1" step="1" placeholder="Ex.: 10" required />
              </label>
              <label className="form-field">
                <span>Largura (cm) <b>*</b></span>
                <input name="width" type="number" min="0.1" step="0.1" placeholder="Ex.: 20" required />
              </label>
              <label className="form-field">
                <span>Altura (cm) <b>*</b></span>
                <input name="height" type="number" min="0.1" step="0.1" placeholder="Ex.: 30" required />
              </label>
              <label className="form-field">
                <span>Acabamento de corte <b>*</b></span>
                <select name="cut" required defaultValue="">
                  <option value="" disabled>Escolha uma opção</option>
                  <option>Com corte</option>
                  <option>Sem corte</option>
                </select>
              </label>
              <label className="form-field form-field-wide">
                <span>Arquivo de impressão <b>*</b></span>
                <input className="file-input" name="art-file" type="file" accept=".png,.pdf,.cdr,image/png,application/pdf" required />
                <small className="field-hint">PNG, PDF ou CDR. O arquivo não é enviado automaticamente pelo formulário: anexe-o na conversa do WhatsApp que será aberta.</small>
              </label>
            </>
          ) : (
            <label className="form-field">
              <span>Quantidade <small>opcional</small></span>
              <input name="quantity" type="number" min="1" step="1" placeholder="Se já souber" />
            </label>
          )}

          <label className="form-field form-field-wide">
            <span>Detalhes do seu pedido <b>*</b></span>
            <textarea name="details" rows={4} placeholder="Conte um pouco sobre o material, tamanho ou personalização que imaginou." required />
          </label>
        </div>

        <p className="quote-privacy-note">Ao continuar, abriremos o WhatsApp com os dados preenchidos. Você poderá revisar e confirmar o envio por lá. Este formulário ainda não salva o pedido no site.</p>
        <button className="button button-primary quote-submit" type="submit">Preparar pedido no WhatsApp <span aria-hidden="true">↗</span></button>

        {whatsAppUrl ? (
          <div className="quote-success" role="status">
            <span>Seu resumo está pronto.</span>
            <a className="button button-whatsapp" href={whatsAppUrl} target="_blank" rel="noopener noreferrer">Abrir WhatsApp e enviar <span aria-hidden="true">↗</span></a>
          </div>
        ) : null}
      </form>
    </div>
  );
}
