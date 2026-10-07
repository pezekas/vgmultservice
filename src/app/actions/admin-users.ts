"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export type UserActionState = { error: string; success: string };

async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/admin/login");
  const { data: profile } = await supabase.from("staff_profiles").select("role,is_active").eq("user_id", userId).maybeSingle();
  if (profile?.role !== "admin" || !profile.is_active) redirect("/admin");
  const service = createServiceClient();
  if (!service) return { supabase, service: null, userId };
  return { supabase, service, userId };
}

export async function createUserAction(_previous: UserActionState, formData: FormData): Promise<UserActionState> {
  const { service } = await requireAdmin();
  if (!service) return { error: "Gestão de usuários indisponível: falta configurar SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor.", success: "" };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("display_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email) || name.length < 2 || password.length < 8 || !["admin", "staff", "client"].includes(role)) {
    return { error: "Informe nome, e-mail, função e senha temporária com pelo menos 8 caracteres.", success: "" };
  }
  const { data: created, error } = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: name } });
  if (error || !created.user) return { error: `Não foi possível criar a conta: ${error?.message ?? "erro desconhecido"}`, success: "" };
  const { error: profileError } = await service.from("staff_profiles").insert({ user_id: created.user.id, display_name: name, role, is_active: true, force_password_change: true });
  if (profileError) {
    await service.auth.admin.deleteUser(created.user.id);
    return { error: `A conta não foi finalizada: ${profileError.message}`, success: "" };
  }
  revalidatePath("/admin/users");
  return { error: "", success: `Conta criada para ${email}. A pessoa deverá trocar a senha temporária.` };
}

export async function updateUserAction(_previous: UserActionState, formData: FormData): Promise<UserActionState> {
  const { service, userId: currentUserId } = await requireAdmin();
  if (!service) return { error: "Gestão de usuários indisponível: falta configurar SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor.", success: "" };
  const targetId = String(formData.get("user_id") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("display_name") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const active = formData.get("is_active") === "on";
  if (!targetId || !/^\S+@\S+\.\S+$/.test(email) || name.length < 2 || !["admin", "staff", "client"].includes(role)) return { error: "Revise os dados informados.", success: "" };
  const { data: previous, error: previousError } = await service.from("staff_profiles").select("role,is_active").eq("user_id", targetId).single();
  if (previousError) return { error: previousError.message, success: "" };
  if (targetId === currentUserId && (!active || role !== "admin")) return { error: "Você não pode desativar ou rebaixar a própria conta ADM.", success: "" };
  if (previous.role === "admin" && previous.is_active && (!active || role !== "admin")) {
    const { count } = await service.from("staff_profiles").select("user_id", { count: "exact", head: true }).eq("role", "admin").eq("is_active", true);
    if ((count ?? 0) <= 1) return { error: "Mantenha pelo menos um administrador ativo.", success: "" };
  }
  const { error: authError } = await service.auth.admin.updateUserById(targetId, { email, user_metadata: { display_name: name } });
  if (authError) return { error: `Não foi possível atualizar a conta: ${authError.message}`, success: "" };
  const { error } = await service.from("staff_profiles").update({ display_name: name, role, is_active: active }).eq("user_id", targetId);
  if (error) return { error: `Conta de autenticação alterada, mas o perfil não foi atualizado: ${error.message}`, success: "" };
  revalidatePath("/admin/users");
  return { error: "", success: "Usuário atualizado." };
}

export async function changeOwnPasswordAction(_previous: UserActionState, formData: FormData): Promise<UserActionState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/admin/login");
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password.length < 8) return { error: "Use uma senha com pelo menos 8 caracteres.", success: "" };
  if (password !== confirmation) return { error: "As senhas informadas não coincidem.", success: "" };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: `Não foi possível atualizar a senha: ${error.message}`, success: "" };
  await supabase.from("staff_profiles").update({ force_password_change: false }).eq("user_id", data.claims.sub);
  revalidatePath("/admin/account");
  return { error: "", success: "Senha atualizada com sucesso." };
}
