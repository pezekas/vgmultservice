"use client";

import { deleteProductAction } from "@/app/actions/admin-products";

export function DeleteProductButton({ productId }: { productId: string }) {
  const action = deleteProductAction.bind(null, productId);
  return <form action={action} onSubmit={(event) => { if (!window.confirm("Excluir este produto? Essa ação também remove suas fotos, opções e preços do catálogo.")) event.preventDefault(); }}><button className="button button-quiet admin-delete-button" type="submit">Excluir produto</button></form>;
}
