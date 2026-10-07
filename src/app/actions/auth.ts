"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string };

export async function loginAction(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !/^\S+@\S+\.\S+$/.test(email) || password.length < 1) {
    return { error: "Informe um e-mail válido e sua senha." };
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return { error: "O acesso ainda não foi configurado. Configure as credenciais do Supabase no ambiente do projeto." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "Não foi possível entrar. Confira o e-mail e a senha ou fale com o administrador." };

  const { data: userResult } = await supabase.auth.getUser();
  const userId = userResult.user?.id;
  const { data: profile } = userId
    ? await supabase.from("staff_profiles").select("role, is_active").eq("user_id", userId).maybeSingle()
    : { data: null };

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return { error: "Este acesso não está ativo. Fale com o administrador da VG Multiservice." };
  }

  if (profile.role === "client") {
    redirect("/");
  }

  redirect("/admin");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
