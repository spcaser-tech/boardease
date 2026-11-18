import { createClient } from "@/lib/supabase/server";
import type { User } from "@/lib/types";

export async function getCurrentProfile(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("*").eq("supabase_uid", user.id).maybeSingle();
  return (data as User | null) ?? null;
}

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");
  return profile;
}
