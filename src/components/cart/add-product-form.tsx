"use client";

import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { useCart } from "@/components/cart/cart-provider";
import type { CatalogProduct } from "@/lib/catalog/types";

const engravingFontPreviewStyles: Record<string, CSSProperties> = {
  "WEDDING BY MANDALA": { fontFamily: '"WEDDING BY MANDALA", "Segoe Script", cursive', fontStyle: "italic", letterSpacing: "-.03em" },
  DOGGIE: { fontFamily: '"DOGGIE", "Comic Sans MS", cursive', fontWeight: 700, letterSpacing: ".02em" },
  "COMIC SANS MS": { fontFamily: '"COMIC SANS MS", "Comic Sans MS", cursive', fontWeight: 400 },
  SERINAH: { fontFamily: '"SERINAH", "Segoe Print", cursive', fontStyle: "italic", letterSpacing: ".03em" },
  ANANDA: { fontFamily: '"ANANDA", Georgia, serif', fontStyle: "italic", letterSpacing: "-.02em" },
  PEPERNOTES: { fontFamily: '"PEPERNOTES", "Segoe Print", cursive', fontWeight: 700, letterSpacing: ".025em" },
  "VAGROUNDED BT": { fontFamily: '"VAGROUNDED BT", "Arial Rounded MT Bold", "Trebuchet MS", sans-serif', fontWeight: 700, letterSpacing: ".01em" },
  GAMALIYA: { fontFamily: '"GAMALIYA", "Segoe Script", cursive', letterSpacing: ".06em" },
  "CHEDDAR JACK": { fontFamily: '"CHEDDAR JACK", Impact, "Arial Narrow", sans-serif', fontWeight: 700, letterSpacing: ".025em" },
  "CAVIAR DREAMS": { fontFamily: '"CAVIAR DREAMS", Georgia, serif', letterSpacing: ".14em" },
  "CANDY ROUND BTN": { fontFamily: '"CANDY ROUND BTN", "Trebuchet MS", sans-serif', fontWeight: 700, letterSpacing: ".04em" },
  "BABY ALEHA": { fontFamily: '"BABY ALEHA", "Segoe Print", cursive', fontWeight: 700, fontStyle: "italic" },
};

export function AddProductForm({ product }: { product: CatalogProduct }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [widthValue, setWidthValue] = useState("");
  const [heightValue, setHeightValue] = useState("");
  const [quantityValue, setQuantityValue] = useState("1");
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const isSticker = product.category.slug === "adesivos" && product.requiresMeasurements;
  const isFixedSizeAdhesive = product.slug === "adesivo-dtf";
  const isAreaPriced = product.pricingMode === "per_area_m2";
  const selectedAreaRule = product.priceRules.find((rule) => rule.optionValue === selectedOption);
  const hasOptionBasedPrice = product.options?.some((option) => option.choices.some((choice) => product.priceRules.some((rule) => rule.optionValue === choice))) ?? false;
  const selectedPriceRule = product.priceRules.find((rule) => rule.optionValue === selectedOption)
    ?? product.priceRules.find((rule) => !rule.optionValue)
    ?? (!hasOptionBasedPrice ? product.priceRules[0] : undefined);
  const unitPrice = product.pricingMode === "fixed" || product.pricingMode === "per_unit" ? selectedPriceRule?.unitPrice : undefined;
  const selectedOptionConfig = product.options?.find((option) => option.surchargeChoice === selectedOptions[option.name]);
  const surchargeAmount = selectedOptionConfig?.surchargeAmount ?? 0;
  const surchargeTotal = selectedOptionConfig?.surchargeMode === "per_unit" ? surchargeAmount * Number(quantityValue || 0) : surchargeAmount;
  const areaRate = selectedAreaRule?.unitPrice;
  const engravingName = selectedOptions["Nome para gravação"] ?? "";
  const engravingFont = selectedOptions["Fonte da gravação"] ?? "";
  const hasEngravingOptions = product.options?.some((option) => option.name === "Nome para gravação") ?? false;
  const hasLaserChoice = product.options?.some((option) => option.choices.some((choice) => /laser/i.test(choice))) ?? false;
  const engravingEnabled = hasEngravingOptions && (!hasLaserChoice || Object.values(selectedOptions).some((value) => /laser/i.test(value)));
  const areaEstimate = useMemo(() => {
    const width = Number(widthValue);
    const height = Number(heightValue);
    const quantity = Number(quantityValue);
    if (!isAreaPriced || !areaRate || width <= 0 || height <= 0 || quantity <= 0) return null;
    const subtotal = (width / 100) * (height / 100) * areaRate * quantity;
    return Math.round(Math.max(subtotal, selectedAreaRule?.minimumPrice ?? 0) * 100) / 100;
  }, [areaRate, heightValue, isAreaPriced, quantityValue, selectedAreaRule?.minimumPrice, widthValue]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSticker) {
      const width = Number(new FormData(event.currentTarget).get("width"));
      const height = Number(new FormData(event.currentTarget).get("height"));
      const isAtLeastA3 = (width >= 29.7 && height >= 21) || (width >= 21 && height >= 29.7);
      if (!isAtLeastA3) {
        const widthInput = event.currentTarget.elements.namedItem("width");
        if (widthInput instanceof HTMLInputElement) {
          widthInput.setCustomValidity("O tamanho mínimo é A3: 29,7 × 21 cm, em qualquer orientação.");
          widthInput.reportValidity();
        }
        return;
      }
    }
    const data = new FormData(event.currentTarget);
    const file = data.get("file");
    addItem({
      productSlug: product.slug,
      productName: product.name,
      categoryName: product.category.name,
      quantity: Number(data.get("quantity")),
      unitPrice,
      areaRate,
      calculatedTotal: areaEstimate ?? undefined,
      surchargeAmount: surchargeTotal || undefined,
      surchargeLabel: surchargeTotal ? selectedOptionConfig?.surchargeLabel : undefined,
      material: String(data.get("material") ?? "") || undefined,
      width: Number(data.get("width")) || undefined,
      height: Number(data.get("height")) || undefined,
      cut: String(data.get("cut") ?? "") || undefined,
      fileName: file instanceof File && file.name ? file.name : undefined,
      selections: Object.fromEntries([
        ...(product.options ?? []).filter((option) => option.type !== "text" || engravingEnabled).map((option) => [option.name, String(data.get(`option:${option.name}`) ?? "")] as const),
        ...(engravingFont === "Nenhuma delas" ? [["Fonte desejada (especificação)", String(data.get("custom-font") ?? "").trim()] as const] : []),
      ]),
      details: String(data.get("details") ?? "").trim(),
    });
    event.currentTarget.reset();
    setWidthValue("");
    setHeightValue("");
    setQuantityValue("1");
    setSelectedOption("");
    setSelectedOptions({});
    setAdded(true);
    window.setTimeout(() => setAdded(false), 4000);
  }

  return <form className="add-product-form" onSubmit={handleSubmit}>
    <h2>Adicionar ao pedido</h2>
    {isSticker ? <>
      <div className="cart-form-grid">
        <label className="form-field"><span>Material <b>*</b></span><select name="material" required value={selectedOption} onChange={(event) => setSelectedOption(event.target.value)}><option value="" disabled>Selecione</option>{product.priceRules.map((rule) => <option key={rule.optionValue}>{rule.optionValue}</option>)}</select></label>
        <label className="form-field"><span>Quantidade <b>*</b></span><input name="quantity" type="number" min="1" step="1" value={quantityValue} onChange={(event) => setQuantityValue(event.target.value)} required /></label>
        <label className="form-field"><span>Largura (cm) <b>*</b></span><input name="width" type="number" min="21" step="0.1" value={widthValue} placeholder="Tamanho mínimo A3" onChange={(event) => { setWidthValue(event.target.value); event.currentTarget.setCustomValidity(""); }} required /></label>
        <label className="form-field"><span>Altura (cm) <b>*</b></span><input name="height" type="number" min="21" step="0.1" value={heightValue} placeholder="Tamanho mínimo A3" onChange={(event) => setHeightValue(event.target.value)} required /></label>
        <label className="form-field"><span>Corte <b>*</b></span><select name="cut" required defaultValue=""><option value="" disabled>Selecione</option><option>Com corte</option><option>Sem corte</option></select></label>
        <label className="form-field"><span>Arquivo <b>*</b></span><input className="file-input" name="file" type="file" accept=".png,.pdf,.cdr,image/png,application/pdf" required /></label>
      </div>
      {isAreaPriced ? <p className="area-estimate" aria-live="polite">{areaEstimate != null && areaRate != null ? <>Estimativa: {widthValue} × {heightValue} cm · {quantityValue} unidade(s) × R$ {areaRate.toFixed(2).replace(".", ",")}/m² = <strong>R$ {areaEstimate.toFixed(2).replace(".", ",")}</strong>{selectedAreaRule?.minimumPrice ? ` (mínimo ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(selectedAreaRule.minimumPrice)})` : null}</> : "Selecione o material e informe as medidas para calcular a estimativa."}</p> : null}
      <p className="cart-file-note">O arquivo fica neste dispositivo e não é guardado no carrinho. Anexe-o à conversa do WhatsApp após abrir o pedido.</p>
    </> : <>
      {product.options?.filter((option) => !["Nome para gravação", "Fonte da gravação"].includes(option.name) || engravingEnabled).map((option) => option.type === "text" ? <label className="form-field" key={option.name}><span>{option.name} {option.isRequired ? <b>*</b> : null}</span><input name={`option:${option.name}`} value={selectedOptions[option.name] ?? ""} onChange={(event) => setSelectedOptions((current) => ({ ...current, [option.name]: event.target.value }))} required={option.isRequired && engravingEnabled} maxLength={80} placeholder="Digite o texto que será gravado" /></label> : <label className="form-field" key={option.name}><span>{option.name} {option.isRequired ? <b>*</b> : null}</span><select name={`option:${option.name}`} value={selectedOptions[option.name] ?? ""} onChange={(event) => { if (product.priceRules.some((rule) => rule.optionValue === event.target.value)) setSelectedOption(event.target.value); setSelectedOptions((current) => ({ ...current, [option.name]: event.target.value })); }} required={option.isRequired}><option value="" disabled>Selecione</option>{option.choices.map((choice) => <option key={choice}>{choice}</option>)}</select></label>)}
      {engravingEnabled ? <div className="engraving-preview-panel"><span className="field-hint">Prévia ilustrativa da gravação</span><p className="engraving-preview-text" style={engravingFontPreviewStyles[engravingFont] ?? { fontFamily: '"Segoe Script", cursive' }}>{engravingName || "Seu nome aparecerá aqui"}</p><small>{engravingFont || "Escolha uma fonte para ver a prévia"} · aparência aproximada para ajudar na escolha</small></div> : null}
      {engravingEnabled && engravingFont === "Nenhuma delas" ? <label className="form-field"><span>Descreva a fonte desejada <b>*</b></span><textarea name="custom-font" rows={2} placeholder="Escreva o nome ou descreva a fonte que deseja" required /></label> : null}
      {isFixedSizeAdhesive ? <p className="cart-file-note">Para folhas maiores que A3, entre em contato pelo WhatsApp para consultar o valor.</p> : null}
      {product.requiresMeasurements ? <div className="cart-form-grid">
        <label className="form-field"><span>Largura (cm) <b>*</b></span><input name="width" type="number" min="0.1" step="0.1" value={widthValue} onChange={(event) => setWidthValue(event.target.value)} required /></label>
        <label className="form-field"><span>Altura (cm) <b>*</b></span><input name="height" type="number" min="0.1" step="0.1" value={heightValue} onChange={(event) => setHeightValue(event.target.value)} required /></label>
      </div> : null}
      {product.requiresFile && (product.options?.some((option) => option.name === "Arte") ? selectedOption === "Tenho arte pronta" : true) ? <label className="form-field"><span>Arquivo de arte <b>*</b></span><input className="file-input" name="file" type="file" accept={product.allowedFileExtensions.map((ext) => `.${ext}`).join(",")} required /><small className="field-hint">O arquivo selecionado não é armazenado pelo site; anexe-o na conversa do WhatsApp.</small></label> : null}
      {product.requiresFile && product.options?.some((option) => option.name === "Arte") && selectedOption !== "Tenho arte pronta" ? <p className="cart-file-note">Você escolheu solicitar a criação da arte. Não precisa anexar arquivo.</p> : null}
      <label className="form-field"><span>Quantidade <b>*</b></span><input name="quantity" type="number" min="1" step="1" value={quantityValue} onChange={(event) => setQuantityValue(event.target.value)} required /></label>
      {unitPrice != null ? <p className="area-estimate" aria-live="polite">{surchargeTotal ? <>R$ {unitPrice.toFixed(2).replace(".", ",")} por unidade × {quantityValue} + {selectedOptionConfig?.surchargeLabel}: R$ {surchargeTotal.toFixed(2).replace(".", ",")} = <strong>R$ {(unitPrice * Number(quantityValue || 0) + surchargeTotal).toFixed(2).replace(".", ",")}</strong></> : <>R$ {unitPrice.toFixed(2).replace(".", ",")} por unidade × {quantityValue} = <strong>R$ {(unitPrice * Number(quantityValue || 0)).toFixed(2).replace(".", ",")}</strong></>}</p> : null}
      {isAreaPriced ? <p className="area-estimate" aria-live="polite">{areaEstimate != null && areaRate != null ? <>Estimativa: {widthValue} × {heightValue} cm · {quantityValue} unidade(s) × R$ {areaRate.toFixed(2).replace(".", ",")}/m² = <strong>R$ {areaEstimate.toFixed(2).replace(".", ",")}</strong></> : "Selecione a espessura e informe as medidas para calcular a estimativa."}</p> : null}
    </>}
    <label className="form-field cart-details-field"><span>Detalhes ou personalização <small>opcional</small></span><textarea name="details" rows={3} placeholder="Se quiser, descreva algum detalhe do pedido" /></label>
    <button className="button button-primary" type="submit">{added ? <>Adicionado ao pedido <span aria-hidden="true">✓</span></> : <>Adicionar item <span aria-hidden="true">＋</span></>}</button>
    {added ? <p className="cart-added-message" role="status"><span aria-hidden="true">✓</span> Item adicionado ao pedido. Você pode continuar escolhendo produtos.</p> : null}
  </form>;
}
