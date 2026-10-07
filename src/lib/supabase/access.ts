import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requirePanelAccess(required: "staff" | "admin" = "staff") {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/admin/login");
  const { data: profile } = await supabase.from("staff_profiles").select("role,display_name,is_active,force_password_change").eq("user_id", userId).maybeSingle();
  if (!profile?.is_active || profile.role === "client") redirect("/admin/login?access=denied");
  if (required === "admin" && profile.role !== "admin") redirect("/admin");
  return { supabase, profile, userId, email: String(data.claims.email ?? "") };
}
