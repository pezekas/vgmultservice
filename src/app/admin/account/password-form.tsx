"use client";

import { useActionState } from "react";
import { changeOwnPasswordAction, type UserActionState } from "@/app/actions/admin-users";

const initial: UserActionState = { error: "", success: "" };

export function PasswordForm() {
  const [state, action, pending] = useActionState(changeOwnPasswordAction, initial);
  return <form className="admin-product-form password-form" action={action}><h2>Alterar senha</h2><div className="admin-form-grid"><label className="form-field">Nova senha<input name="password" type="password" minLength={8} autoComplete="new-password" required /></label><label className="form-field">Confirme a nova senha<input name="confirmation" type="password" minLength={8} autoComplete="new-password" required /></label></div>{state.error ? <p className="form-error" role="alert">{state.error}</p> : null}{state.success ? <p className="admin-success" role="status">{state.success}</p> : null}<button className="button button-primary" disabled={pending}>{pending ? "Atualizando…" : "Atualizar senha"}</button></form>;
}
