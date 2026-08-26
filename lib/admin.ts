import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function getAdminContext() {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("id,role,display_name").eq("id", user.id).maybeSingle();
  if (!profile || !["admin","moderator"].includes(profile.role)) return null;
  return { supabase, user, profile };
}
