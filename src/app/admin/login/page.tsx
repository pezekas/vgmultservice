import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { logoutAction } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Entrar | VG Multiservice",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const params = await searchParams;
  return (
    <main className="login-page">
      <Link className="login-back" href="/">← Voltar para a vitrine</Link>
      <section className="login-card" aria-labelledby="login-title">
        <Image src="/vg-logo.png" alt="VG Multiservice — A sua Gráfica Digital" width={190} height={190} priority />
        <p className="eyebrow">Acesso VG Multiservice</p>
        <h1 id="login-title">Entrar</h1>
        <p className="login-intro">Informe seu e-mail e senha. O acesso será direcionado conforme o perfil cadastrado.</p>
        {params.setup ? <p className="form-error" role="status">O Supabase ainda não foi configurado para este ambiente. Consulte o README para continuar.</p> : null}
        {params.access ? (
          <>
            <p className="form-error" role="status">Este usuário ainda não recebeu um perfil de acesso. Peça ao administrador para verificar seu cadastro.</p>
            <form action={logoutAction}><button className="button button-quiet" type="submit">Encerrar sessão</button></form>
          </>
        ) : null}
        <LoginForm />
      </section>
    </main>
  );
}

