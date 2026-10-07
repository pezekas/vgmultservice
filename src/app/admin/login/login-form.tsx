"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = { error: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="login-form">
      <label htmlFor="email">E-mail</label>
      <input id="email" name="email" type="email" autoComplete="username" required />

      <label htmlFor="password">Senha</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required />

      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}

      <button className="button button-primary login-submit" type="submit" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
      <p className="login-note">ADM e funcionários acessam o painel. Clientes seguem para a vitrine. O perfil é identificado pelo cadastro associado ao e-mail.</p>
    </form>
  );
}
