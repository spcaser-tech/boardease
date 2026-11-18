"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { name: form.name } } });
    if (error || !data.user) { setError(error?.message || "Registration failed"); setLoading(false); return; }
    await supabase.from("users").insert({ supabase_uid: data.user.id, name: form.name, email: form.email, phone: form.phone || null, password: "supabase", role: "tenant" } as any);
    router.push("/tenant/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 grid place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="mb-6 flex items-center gap-2 font-semibold"><span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-white"><Home size={18} /></span>BoardEase</Link>
        <h1 className="text-2xl font-semibold">Create tenant account</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {(["name","email","phone"] as const).map((k) => (
            <div key={k}><label className="mb-1 block text-sm font-medium capitalize">{k}</label><input value={(form as any)[k]} onChange={(e)=>setForm({...form,[k]:e.target.value})} required={k!=="phone"} type={k==="email"?"email":"text"} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></div>
          ))}
          <div><label className="mb-1 block text-sm font-medium">Password</label><input value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} type="password" required minLength={6} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></div>
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <button disabled={loading} className="h-10 w-full rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-50">{loading ? "Creating..." : "Register"}</button>
        </form>
        <p className="mt-4 text-sm text-slate-600">Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}
