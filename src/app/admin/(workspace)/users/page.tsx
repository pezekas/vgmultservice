import { createServiceClient } from "@/lib/supabase/admin";
import { UserManager } from "./user-manager";
import { requirePanelAccess } from "@/lib/supabase/access";

export const metadata = { title: "Usuários | Painel VG", robots: { index: false, follow: false } };

export default async function AdminUsersPage() {
  const { userId } = await requirePanelAccess("admin");
  const service = createServiceClient();
  if (!service) return <main className="admin-content"><header className="admin-titlebar"><p className="eyebrow">Acesso exclusivo ADM</p><h1>Usuários</h1><p>Para criar e editar contas com segurança, conecte o serviço administrativo do Supabase no servidor.</p></header><section className="admin-panel-card admin-config-card"><div><h2>Configuração necessária</h2><p>Adicione <code>SUPABASE_SERVICE_ROLE_KEY</code> ao arquivo local <code>.env.local</code> e ao ambiente de hospedagem. Obtenha a chave em Supabase → Project Settings → API Keys, mantendo-a somente no servidor. Depois reinicie o servidor de desenvolvimento.</p></div></section></main>;
  const { data: profiles, error } = await service.from("staff_profiles").select("user_id,display_name,role,is_active,force_password_change,created_at").order("created_at", { ascending: false });
  const { data: authUsers } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const users = (profiles ?? []).map((item) => ({ ...item, email: authUsers.users.find((user) => user.id === item.user_id)?.email ?? "" }));
  return <main className="admin-content"><header className="admin-titlebar"><p className="eyebrow">Acesso exclusivo ADM</p><h1>Usuários</h1><p>Crie contas e atribua suas funções. A função fica vinculada ao perfil no banco de dados.</p></header>{error ? <p className="form-error">Falha ao carregar usuários: {error.message}</p> : null}<UserManager users={users} currentUserId={userId} /></main>;
}
