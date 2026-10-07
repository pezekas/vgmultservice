import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/admin/login?setup=required");
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("staff_profiles")
    .select("role, display_name, is_active, force_password_change")
    .eq("user_id", data.claims.sub)
    .maybeSingle();

  if (!profile || !profile.is_active) redirect("/admin/login?access=denied");
  if (profile.role === "client") redirect("/");
  if (profile.force_password_change) redirect("/admin/account");

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-sidebar-brand"><Image src="/vg-logo.png" alt="VG Multiservice" width={90} height={90} priority /></Link>
        <p className="admin-sidebar-label">PAINEL</p>
        <Link className="admin-sidebar-link active" href="/admin">Visão geral</Link>
        <Link className="admin-sidebar-link" href="/admin/orders">Ordens de serviço</Link>
        <Link className="admin-sidebar-link" href="/admin/products">Produtos</Link>
        {profile.role === "admin" ? <><Link className="admin-sidebar-link" href="/admin/categories">Categorias</Link><Link className="admin-sidebar-link" href="/admin/users">Usuários</Link></> : null}
        <Link className="admin-sidebar-link" href="/admin/account">Minha conta</Link>
        <Link className="admin-sidebar-link" href="/">Ver vitrine ↗</Link>
        <form action={logoutAction}>
          <button className="admin-sidebar-link admin-sidebar-logout" type="submit">Sair</button>
        </form>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
