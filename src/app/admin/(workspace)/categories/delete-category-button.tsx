"use client";

import { useActionState } from "react";
import { deleteCategoryAction, type DeleteCategoryState } from "@/app/actions/admin-categories";

const initialState: DeleteCategoryState = { error: "", success: "" };

export function DeleteCategoryButton({ categoryId, categoryName }: { categoryId: string; categoryName: string }) {
  const [state, action, pending] = useActionState(deleteCategoryAction, initialState);
  return <div className="admin-category-delete"><form action={action} onSubmit={(event) => {
    if (!window.confirm(`Excluir a categoria "${categoryName}"? Os produtos continuarão cadastrados, mas ficarão sem categoria.`)) event.preventDefault();
  }}><input type="hidden" name="id" value={categoryId} /><button className="button button-quiet admin-delete-button" type="submit" disabled={pending}>{pending ? "Excluindo…" : "Excluir categoria"}</button></form>{state.error ? <small className="form-error" role="alert">{state.error}</small> : null}{state.success ? <small className="admin-success" role="status">{state.success}</small> : null}</div>;
}
