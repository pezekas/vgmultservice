"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { saveProductAction, type ProductActionState } from "@/app/actions/admin-products";
import { createClient } from "@/lib/supabase/client";

type Category = { id: string; name: string; is_active: boolean };
type ImageItem = { storage_path: string; alt_text: string; url: string };
type OptionItem = { name: string; option_type: string; is_required: boolean; choices: string[]; surcharge_choice: string; surcharge_amount: string; surcharge_mode: string; surcharge_label: string };
type PriceItem = { option_key: string; option_value: string; pricing_mode: string; unit_price: string; minimum_price: string };
type ExistingProduct = Record<string, unknown> & { id?: string; name?: string; slug?: string; category_id?: string | null; short_description?: string | null; description?: string | null; sale_unit?: string | null; estimated_lead_time?: string | null; pricing_mode?: string; requires_measurements?: boolean; measurement_unit?: string | null; requires_file?: boolean; allowed_file_extensions?: string[]; is_active?: boolean };

const initialState: ProductActionState = { error: "", success: "" };
const emptyPrice: PriceItem = { option_key: "", option_value: "", pricing_mode: "per_unit", unit_price: "", minimum_price: "" };

export function ProductEditor({ product, categories, images: initialImages, options: initialOptions, prices: initialPrices }: { product?: ExistingProduct; categories: Category[]; images: ImageItem[]; options: Array<Record<string, unknown>>; prices: Array<Record<string, unknown>> }) {
  const [state, action, pending] = useActionState(saveProductAction, initialState);
  const [images, setImages] = useState(initialImages);
  const [options, setOptions] = useState<OptionItem[]>(initialOptions.map((item) => ({ name: String(item.name), option_type: String(item.option_type), is_required: Boolean(item.is_required), choices: Array.isArray(item.choices) ? item.choices.map(String) : [], surcharge_choice: String(item.surcharge_choice ?? ""), surcharge_amount: item.surcharge_amount == null ? "" : String(item.surcharge_amount), surcharge_mode: String(item.surcharge_mode ?? ""), surcharge_label: String(item.surcharge_label ?? "") })));
  const [prices, setPrices] = useState<PriceItem[]>(initialPrices.map((item) => ({ option_key: String(item.option_key ?? ""), option_value: String(item.option_value ?? ""), pricing_mode: String(item.pricing_mode ?? "per_unit"), unit_price: item.unit_price == null ? "" : String(item.unit_price), minimum_price: item.minimum_price == null ? "" : String(item.minimum_price) })));
  const [uploadError, setUploadError] = useState("");

  async function saveWithUploads(formData: FormData) {
    setUploadError("");
    const files = formData.getAll("product_files").filter((value): value is File => value instanceof File && value.size > 0);
    const uploaded: ImageItem[] = [];
    try {
      const supabase = createClient();
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name}: o limite por foto é 5 MB.`);
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error(`${file.name}: use JPG, PNG ou WebP.`);
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const storagePath = `${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from("product-images").upload(storagePath, file, { contentType: file.type, cacheControl: "31536000" });
        if (error) throw new Error(error.message);
        uploaded.push({ storage_path: storagePath, alt_text: file.name.replace(/\.[^.]+$/, ""), url: URL.createObjectURL(file) });
      }
      const allImages = [...images, ...uploaded];
      formData.set("images_json", JSON.stringify(allImages.map(({ storage_path, alt_text }, index) => ({ storage_path, alt_text, sort_order: index }))));
      formData.set("options_json", JSON.stringify(options.map(({ surcharge_amount, ...option }, sort_order) => ({ ...option, surcharge_amount: surcharge_amount.trim() ? Number(surcharge_amount.replace(",", ".")) : null, surcharge_choice: option.surcharge_choice || null, surcharge_mode: option.surcharge_mode || null, surcharge_label: option.surcharge_label || null, sort_order }))));
      formData.set("prices_json", JSON.stringify(prices.filter((price) => price.unit_price.trim() !== "").map((price) => ({ ...price, unit_price: Number(price.unit_price.replace(",", ".")), minimum_price: price.minimum_price.trim() ? Number(price.minimum_price.replace(",", ".")) : null, option_key: price.option_key || null, option_value: price.option_value || null }))));
      action(formData);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Não foi possível enviar as imagens.");
    }
  }

  const value = (key: keyof ExistingProduct) => product?.[key] == null ? "" : String(product[key]);

  return <form action={saveWithUploads} className="admin-product-form">
    <input type="hidden" name="id" value={product?.id ?? ""} />
    <input type="hidden" name="images_json" value="[]" />
    <input type="hidden" name="options_json" value="[]" />
    <input type="hidden" name="prices_json" value="[]" />
    <section className="admin-form-section"><h2>Informações do produto</h2><div className="admin-form-grid">
      <label className="form-field">Nome do produto<input name="name" defaultValue={value("name")} required minLength={2} /></label>
      <label className="form-field">URL (slug)<input name="slug" defaultValue={value("slug")} placeholder="gerado a partir do nome" /></label>
      <label className="form-field">Categoria<select name="category_id" defaultValue={value("category_id")}><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}{category.is_active ? "" : " (inativa)"}</option>)}</select></label>
      <label className="form-field">Unidade de venda<input name="sale_unit" defaultValue={value("sale_unit")} placeholder="por unidade, por folha..." /></label>
      <label className="form-field form-field-wide">Resumo<input name="short_description" defaultValue={value("short_description")} /></label>
      <label className="form-field form-field-wide">Descrição<textarea name="description" defaultValue={value("description")} rows={4} /></label>
      <label className="form-field">Prazo estimado<input name="estimated_lead_time" defaultValue={value("estimated_lead_time")} placeholder="A combinar" /></label>
      <label className="form-field">Modelo de preço<select name="pricing_mode" defaultValue={value("pricing_mode") || "manual"}><option value="manual">Sob consulta</option><option value="fixed">Preço fixo</option><option value="per_unit">Por unidade</option><option value="per_area_m2">Por m²</option><option value="per_linear_m">Por metro linear</option></select></label>
      <label className="form-field"><span>Extensões aceitas para arquivo (separadas por vírgula)</span><input name="allowed_file_extensions" defaultValue={Array.isArray(product?.allowed_file_extensions) ? product.allowed_file_extensions.join(", ") : ""} placeholder="PDF, PNG, CDR" /></label>
      <label className="form-field">Unidade das medidas<input name="measurement_unit" defaultValue={value("measurement_unit")} placeholder="cm" /></label>
      <div className="admin-checkboxes"><label><input type="checkbox" name="is_active" defaultChecked={product ? product.is_active : true} /> Produto ativo na vitrine</label><label><input type="checkbox" name="requires_measurements" defaultChecked={Boolean(product?.requires_measurements)} /> Solicitar medidas</label><label><input type="checkbox" name="requires_file" defaultChecked={Boolean(product?.requires_file)} /> Solicitar arquivo</label></div>
    </div></section>

    <section className="admin-form-section"><h2>Fotos do produto</h2><p>JPG, PNG ou WebP; até 5 MB por imagem. A primeira foto será a principal.</p>
      <div className="admin-image-grid">{images.map((image, index) => <article className="admin-image-card" key={image.storage_path}><Image src={image.url} alt={image.alt_text || "Foto do produto"} width={120} height={105} unoptimized /><span>{index === 0 ? "Principal" : `Foto ${index + 1}`}</span><button type="button" onClick={() => setImages((current) => current.filter((_, i) => i !== index))}>Remover</button></article>)}</div>
      <label className="form-field">Adicionar fotos<input name="product_files" type="file" accept="image/jpeg,image/png,image/webp" multiple /></label>
    </section>

    <section className="admin-form-section"><div className="admin-section-heading"><div><h2>Opções</h2><p>Ex.: cor, acabamento, tipo de gravação.</p></div><button className="button button-quiet" type="button" onClick={() => setOptions((current) => [...current, { name: "", option_type: "select", is_required: false, choices: [], surcharge_choice: "", surcharge_amount: "", surcharge_mode: "", surcharge_label: "" }])}>Adicionar opção +</button></div>
      {options.map((option, index) => <div className="admin-inline-editor admin-option-editor" key={index}><label className="form-field">Nome<input value={option.name} onChange={(event) => setOptions((current) => current.map((row, i) => i === index ? { ...row, name: event.target.value } : row))} /></label><label className="form-field">Tipo<select value={option.option_type} onChange={(event) => setOptions((current) => current.map((row, i) => i === index ? { ...row, option_type: event.target.value } : row))}><option value="select">Lista de opções</option><option value="text">Texto livre</option><option value="boolean">Sim/não</option><option value="number">Número</option></select></label><label className="form-field">Opções separadas por vírgula<input value={option.choices.join(", ")} onChange={(event) => setOptions((current) => current.map((row, i) => i === index ? { ...row, choices: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) } : row))} disabled={option.option_type !== "select"} /></label><label className="admin-check"><input type="checkbox" checked={option.is_required} onChange={(event) => setOptions((current) => current.map((row, i) => i === index ? { ...row, is_required: event.target.checked } : row))} /> Obrigatória</label><button type="button" className="admin-remove" onClick={() => setOptions((current) => current.filter((_, i) => i !== index))} aria-label="Remover opção">×</button><label className="form-field">Escolha com acréscimo<input value={option.surcharge_choice} onChange={(event) => setOptions((current) => current.map((row, i) => i === index ? { ...row, surcharge_choice: event.target.value } : row))} placeholder="Laser" /></label><label className="form-field">Acréscimo (R$)<input inputMode="decimal" value={option.surcharge_amount} onChange={(event) => setOptions((current) => current.map((row, i) => i === index ? { ...row, surcharge_amount: event.target.value } : row))} /></label><label className="form-field">Aplicar acréscimo<select value={option.surcharge_mode} onChange={(event) => setOptions((current) => current.map((row, i) => i === index ? { ...row, surcharge_mode: event.target.value } : row))}><option value="">Sem acréscimo</option><option value="per_order">Uma vez no pedido</option><option value="per_unit">Por unidade</option></select></label><label className="form-field">Descrição do acréscimo<input value={option.surcharge_label} onChange={(event) => setOptions((current) => current.map((row, i) => i === index ? { ...row, surcharge_label: event.target.value } : row))} placeholder="Adicional de laser" /></label></div>)}
    </section>

    <section className="admin-form-section"><div className="admin-section-heading"><div><h2>Regras de preço</h2><p>Informe os valores reais definidos pela VG. Não preencha preços ainda não definidos.</p></div><button className="button button-quiet" type="button" onClick={() => setPrices((current) => [...current, { ...emptyPrice }])}>Adicionar preço +</button></div>
      {prices.map((price, index) => <div className="admin-inline-editor admin-price-editor" key={index}><label className="form-field">Opção vinculada<input value={price.option_key} onChange={(event) => setPrices((current) => current.map((row, i) => i === index ? { ...row, option_key: event.target.value } : row))} placeholder="material, espessura..." /></label><label className="form-field">Valor da opção<input value={price.option_value} onChange={(event) => setPrices((current) => current.map((row, i) => i === index ? { ...row, option_value: event.target.value } : row))} placeholder="Vinil, 1 mm..." /></label><label className="form-field">Cobrança<select value={price.pricing_mode} onChange={(event) => setPrices((current) => current.map((row, i) => i === index ? { ...row, pricing_mode: event.target.value } : row))}><option value="fixed">Preço fixo</option><option value="per_unit">Por unidade</option><option value="per_area_m2">Por m²</option><option value="per_linear_m">Por metro linear</option><option value="manual">Sob consulta</option></select></label><label className="form-field">Preço unitário (R$)<input inputMode="decimal" value={price.unit_price} onChange={(event) => setPrices((current) => current.map((row, i) => i === index ? { ...row, unit_price: event.target.value } : row))} /></label><label className="form-field">Preço mínimo (R$)<input inputMode="decimal" value={price.minimum_price} onChange={(event) => setPrices((current) => current.map((row, i) => i === index ? { ...row, minimum_price: event.target.value } : row))} /></label><button type="button" className="admin-remove" onClick={() => setPrices((current) => current.filter((_, i) => i !== index))} aria-label="Remover preço">×</button></div>)}
    </section>
    {uploadError ? <p className="form-error" role="alert">Falha no envio da foto: {uploadError}</p> : null}{state.error ? <p className="form-error" role="alert">{state.error}</p> : null}{state.success ? <p className="admin-success" role="status">{state.success}</p> : null}
    <div className="admin-form-actions"><button className="button button-primary" type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar produto"}</button></div>
  </form>;
}
