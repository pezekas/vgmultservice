import Link from "next/link";
import { requirePanelAccess } from "@/lib/supabase/access";
import { PasswordForm } from "./password-form";
import { logoutAction } from "@/app/actions/auth";

export const metadata = { title: "Minha conta | Painel VG", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const { profile, email } = await requirePanelAccess();
  return <main className="admin-content"><header className="admin-titlebar"><p className="eyebrow">Configurações da conta</p><h1>Minha conta</h1><p>Gerencie seus dados de acesso com segurança.</p></header><section className="admin-panel-card account-info"><div><h2>{profile.display_name}</h2><p>{email} · {profile.role === "admin" ? "Administrador" : "Funcionário"}</p></div>{!profile.force_password_change ? <Link className="button button-quiet" href="/admin">Voltar ao painel</Link> : null}</section>{profile.force_password_change ? <p className="admin-warning">Sua conta foi criada com senha temporária. Troque-a para continuar.</p> : null}<PasswordForm /><form className="account-logout" action={logoutAction}><button className="button button-quiet" type="submit">Sair</button></form></main>;
}
