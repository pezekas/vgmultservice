"use client";

import { useState, type FormEvent } from "react";
import { useCart } from "@/components/cart/cart-provider";

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function CartCheckout() {
  const { items, removeItem, clearCart } = useCart();
  const [whatsAppUrl, setWhatsAppUrl] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderError, setOrderError] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);

  async function prepareOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length || savingOrder) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const city = String(data.get("city") ?? "").trim();
    const createdAt = new Date();
    const orderDate = createdAt.toLocaleDateString("pt-BR");
    const itemsWithTotals = items.map((item) => {
      const total = item.calculatedTotal ?? (item.unitPrice != null ? item.unitPrice * item.quantity + (item.surchargeAmount ?? 0) : undefined);
      return { item, total };
    });
    const unpricedCount = itemsWithTotals.filter(({ total }) => total == null).length;
    const containsEstimate = items.some((item) => item.calculatedTotal != null);
    const calculatedSubtotal = itemsWithTotals.reduce((sum, entry) => sum + (entry.total ?? 0), 0);
    setSavingOrder(true);
    setOrderError("");
    setWhatsAppUrl("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, phone, email, city },
          items: itemsWithTotals.map(({ item, total }) => ({
            productSlug: item.productSlug,
            productName: item.productName,
            categoryName: item.categoryName,
            quantity: item.quantity,
            unitPrice: item.unitPrice ?? null,
            areaRate: item.areaRate ?? null,
            surchargeAmount: item.surchargeAmount ?? null,
            estimatedTotal: total ?? null,
            pricingBasis: item.calculatedTotal != null ? "area_estimate" : item.unitPrice != null ? "unit_price" : "manual",
            material: item.material ?? null,
            width: item.width ?? null,
            height: item.height ?? null,
            cut: item.cut ?? null,
            fileName: item.fileName ?? null,
            selections: item.selections ?? {},
            details: item.details,
          })),
        }),
      });
      const result = await response.json() as { orderNumber?: string; error?: string };
      if (!response.ok || !result.orderNumber) throw new Error(result.error || "Não foi possível salvar o pedido.");
      const orderReference = result.orderNumber;
      setOrderNumber(orderReference);
    const lines = [
      "APRESENTAÇÃO DO CLIENTE",
      "",
      `Nome: ${name}`,
      `WhatsApp do cliente: ${phone}`,
      ...(email ? [`E-mail: ${email}`] : []),
      ...(city ? [`Cidade/UF: ${city}`] : []),
      "",
      "ORDEM DE SERVIÇO DO PEDIDO",
      `Identificação: ${orderReference}`,
      `Data: ${orderDate}`,
      "",
      `ESPECIFICAÇÃO DO PEDIDO (${items.length} ${items.length === 1 ? "item" : "itens"})`,
    ];

    itemsWithTotals.forEach(({ item, total }, index) => {
      lines.push(
        "",
        `${index + 1}. ${item.productName} · Categoria: ${item.categoryName}`,
        `Quantidade: ${item.quantity}`,
        ...Object.entries(item.selections ?? {}).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`),
        ...(item.productSlug === "adesivo-dtf" && item.selections?.["Tamanho da folha"] === "A3" ? ["Observação: para folha maior que A3, consultar valor com a equipe no WhatsApp."] : []),
        ...(item.material ? [`Material: ${item.material}`] : []),
        ...(item.width && item.height ? [`Medidas: ${item.width} × ${item.height} cm`] : []),
        ...(item.cut ? [`Acabamento: ${item.cut}`] : []),
        ...(item.fileName ? [`Arquivo selecionado: ${item.fileName} (vou anexar nesta conversa)`] : []),
        ...(item.details ? [`Detalhes: ${item.details}`] : []),
        ...(item.calculatedTotal != null ? [`Estimativa do item: ${formatCurrency(item.calculatedTotal)}${item.areaRate != null ? ` (R$ ${item.areaRate.toFixed(2).replace(".", ",")}/m²)` : ""}`] : item.unitPrice != null ? [`Valor unitário: ${formatCurrency(item.unitPrice)} · Total do item: ${formatCurrency(total ?? 0)}`] : ["Valor do item: A definir com a equipe"]),
      );
    });
    lines.push("", "VALOR FINAL DO PEDIDO");
    if (unpricedCount) {
      lines.push("Valor final: A definir com a equipe VG Multiservice.");
      if (calculatedSubtotal > 0) lines.push(`Subtotal calculado/estimado dos demais itens: ${formatCurrency(calculatedSubtotal)}.`);
    } else if (containsEstimate) {
      lines.push(`Valor final estimado: ${formatCurrency(calculatedSubtotal)}. A equipe confirmará o valor e o prazo.`);
    } else {
      lines.push(`Valor final: ${formatCurrency(calculatedSubtotal)}.`);
    }
    lines.push("", "Aguardo o atendimento da equipe VG Multiservice para confirmar valores e prazo.");

    const businessPhone = (process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP ?? "8132049313").replace(/\D/g, "");
    const message = new URLSearchParams({ text: lines.join("\n") }).toString();
    setWhatsAppUrl(`https://wa.me/${businessPhone}?${message}`);
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : "Não foi possível registrar a ordem de serviço.");
    } finally {
      setSavingOrder(false);
    }
  }

  return <div className="cart-checkout-layout">
    <div className="cart-review">
      <div className="cart-review-heading"><h2>Itens do seu pedido</h2><div><a href="#catalogo">Adicionar produtos <span aria-hidden="true">＋</span></a>{items.length ? <button className="cart-clear" type="button" onClick={() => { clearCart(); setWhatsAppUrl(""); setOrderNumber(""); setOrderError(""); }}>Limpar pedido</button> : null}</div></div>
      {!items.length ? <div className="cart-empty"><p>Seu pedido ainda está vazio.</p><a className="button button-primary" href="#catalogo">Escolher produtos</a></div> : (
        <ul className="cart-item-list">
          {items.map((item, index) => <li className="cart-item" key={item.id}>
            <div><span className="cart-item-number">ITEM {String(index + 1).padStart(2, "0")}</span><h3>{item.productName}</h3><p>{item.quantity} unidade(s){Object.entries(item.selections ?? {}).filter(([, value]) => value).map(([key, value]) => ` · ${key}: ${value}`).join("")}{item.material ? ` · ${item.material}` : ""}{item.width && item.height ? ` · ${item.width} × ${item.height} cm` : ""}{item.cut ? ` · ${item.cut}` : ""}</p><p>{item.calculatedTotal != null ? `Estimativa total: R$ ${item.calculatedTotal.toFixed(2).replace(".", ",")}` : item.unitPrice != null ? `R$ ${item.unitPrice.toFixed(2).replace(".", ",")} cada · Total: R$ ${(item.unitPrice * item.quantity + (item.surchargeAmount ?? 0)).toFixed(2).replace(".", ",")}${item.surchargeAmount ? ` (inclui ${item.surchargeLabel}: R$ ${item.surchargeAmount.toFixed(2).replace(".", ",")})` : ""}` : "Preço: A definir"}</p>{item.details ? <p>{item.details}</p> : null}{item.fileName ? <small>Arquivo para anexar no WhatsApp: {item.fileName}</small> : null}</div>
            <button className="cart-remove" type="button" onClick={() => { removeItem(item.id); setWhatsAppUrl(""); setOrderNumber(""); setOrderError(""); }} aria-label={`Remover ${item.productName} do pedido`}>Remover</button>
          </li>)}
        </ul>
      )}
    </div>

    <form className="cart-customer-form" onChange={() => { setWhatsAppUrl(""); setOrderError(""); }} onSubmit={prepareOrder}>
      <p className="eyebrow"><span className="eyebrow-dot" />Finalizar pelo WhatsApp</p>
      <h2>Seus dados</h2>
      <label className="form-field"><span>Seu nome <b>*</b></span><input name="name" autoComplete="name" placeholder="Como podemos chamar você?" required /></label>
      <label className="form-field"><span>Seu WhatsApp <b>*</b></span><input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="(00) 00000-0000" pattern="[0-9()+. -]{10,20}" title="Informe seu número com DDD." required /></label>
      <label className="form-field"><span>E-mail <small>opcional</small></span><input name="email" type="email" autoComplete="email" placeholder="voce@email.com" /></label>
      <label className="form-field"><span>Cidade/UF <small>opcional</small></span><input name="city" autoComplete="address-level2" placeholder="Ex.: Recife/PE" /></label>
      <p className="quote-privacy-note">O resumo de todos os itens será preparado em uma única mensagem. Você revisa e envia pelo WhatsApp. Arquivos selecionados precisam ser anexados na conversa.</p>
      {orderError ? <p className="form-error" role="alert">{orderError}</p> : null}
      <button className="button button-primary cart-submit" type="submit" disabled={!items.length || savingOrder}>{savingOrder ? "Registrando ordem…" : "Registrar ordem e preparar WhatsApp"} {!savingOrder ? <span aria-hidden="true">↗</span> : null}</button>
      {whatsAppUrl ? <div className="quote-success" role="status"><span>Ordem de serviço {orderNumber} salva. Confira o resumo antes de enviar pelo WhatsApp.</span><a className="button button-whatsapp" href={whatsAppUrl} target="_blank" rel="noopener noreferrer">Abrir WhatsApp e enviar <span aria-hidden="true">↗</span></a></div> : null}
    </form>
  </div>;
}
