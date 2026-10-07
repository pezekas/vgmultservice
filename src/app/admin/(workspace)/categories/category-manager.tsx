"use client";

import { useState } from "react";
import { saveCategoryAction } from "@/app/actions/admin-categories";
import { DeleteCategoryButton } from "./delete-category-button";

type Category = { id: string; name: string; slug: string; description: string | null; is_active: boolean };

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [creating, setCreating] = useState(false);
  return <div className="admin-users-layout"><section className="admin-panel-card"><div><h2>Categorias existentes</h2><p>As categorias são as mesmas do catálogo público.</p></div><button className="button button-primary" type="button" onClick={() => setCreating((value) => !value)}>{creating ? "Fechar" : "Adicionar categoria +"}</button></section>{creating ? <form action={saveCategoryAction} className="admin-create-user"><h2>Nova categoria</h2><CategoryFields /><button className="button button-primary" type="submit">Salvar categoria</button></form> : null}<section className="admin-category-list">{categories.map((category) => {
    const editFormId = `edit-category-${category.id}`;
    return <div className="admin-category-card" key={category.id}>
      <form action={saveCategoryAction} id={editFormId}>
        <input type="hidden" name="id" value={category.id} />
        <div className="admin-form-grid">
          <label className="form-field">Nome<input name="name" defaultValue={category.name} required /></label>
          <label className="form-field">URL<input name="slug" defaultValue={category.slug} required /></label>
          <label className="form-field form-field-wide">Descrição<input name="description" defaultValue={category.description ?? ""} /></label>
          <label className="admin-check"><input type="checkbox" name="is_active" defaultChecked={category.is_active} /> Ativa na vitrine</label>
        </div>
      </form>
      <div className="admin-category-actions">
        <button className="button button-quiet" type="submit" form={editFormId}>Salvar alteração</button>
        <DeleteCategoryButton categoryId={category.id} categoryName={category.name} />
      </div>
    </div>;
  })}{!categories.length ? <p className="admin-empty">Nenhuma categoria cadastrada.</p> : null}</section></div>;
}

function CategoryFields() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  function updateName(value: string) {
    setName(value);
    setSlug(value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }
  return <div className="admin-form-grid"><label className="form-field">Nome<input name="name" value={name} onChange={(event) => updateName(event.target.value)} required minLength={2} /></label><label className="form-field">URL<input name="slug" value={slug} onChange={(event) => setSlug(event.target.value)} required /></label><label className="form-field form-field-wide">Descrição<input name="description" /></label><label className="admin-check"><input type="checkbox" name="is_active" defaultChecked /> Ativa na vitrine</label></div>;
}
