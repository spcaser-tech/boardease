"use client";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const sp = useSearchParams();
  const redirect = sp.get("redirect");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setError(error?.message || "Login failed");
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase.from("users").select("role").eq("supabase_uid", data.user.id).maybeSingle();
    const role = (profile as any)?.role as string | undefined;
    const dest = redirect || (role === "super_admin" ? "/super-admin" : role === "tenant" ? "/tenant/dashboard" : "/landlord/dashboard");
    router.push(dest);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="mb-6 flex items-center gap-2 font-semibold text-slate-900"><span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-white"><Home size={18} /></span>BoardEase</Link>
        <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">Access your BoardEase dashboard.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div><label className="mb-1 block text-sm font-medium">Email</label><input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></div>
          <div><label className="mb-1 block text-sm font-medium">Password</label><input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" required className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></div>
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <button disabled={loading} className="h-10 w-full rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-50">{loading ? "Signing in..." : "Login"}</button>
        </form>
        <div className="mt-5 space-y-2 text-sm text-slate-600">
          <p>New tenant? <Link href="/register" className="text-primary hover:underline">Create an account</Link></p>
          <p>Boarding house owner? <Link href="/register-owner" className="text-primary hover:underline">List your property</Link></p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
