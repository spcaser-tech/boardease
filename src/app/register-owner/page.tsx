"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";

export default function RegisterOwnerPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", property_name: "", address: "", city: "", description: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { name: form.name, role: "landlord" } } });
    if (error || !data.user) { setError(error?.message || "Registration failed"); setLoading(false); return; }
    const { data: profile, error: pErr } = await supabase.from("users").insert({ supabase_uid: data.user.id, name: form.name, email: form.email, phone: form.phone || null, password: "supabase", role: "landlord" } as any).select("id").single();
    if (pErr || !profile) { setError(pErr?.message || "Profile creation failed"); setLoading(false); return; }
    const slug = slugify(form.property_name) + "-" + Math.random().toString(36).slice(2,6);
    await supabase.from("properties").insert({ owner_id: (profile as any).id, name: form.property_name, slug, address: form.address, city: form.city, description: form.description || null, status: "pending_approval" } as any);
    router.push("/landlord/dashboard");
    router.refresh();
  }

  const fields: Array<[keyof typeof form, string, string?, boolean?]> = [
    ["name","Your name","text",true],["email","Email","email",true],["phone","Phone","text",false],
    ["property_name","Property name","text",true],["address","Property address","text",true],["city","City","text",true],
  ];
  return (
    <div className="min-h-screen bg-slate-50 grid place-items-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="mb-6 flex items-center gap-2 font-semibold"><span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-white"><Home size={18} /></span>BoardEase</Link>
        <h1 className="text-2xl font-semibold">List Your Boarding House</h1>
        <p className="mt-1 text-sm text-slate-600">Create a landlord account and register your property for approval.</p>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          {fields.map(([k,label,type,req]) => (
            <div key={k}>
              <label className="mb-1 block text-sm font-medium">{label}</label>
              <input value={form[k]} onChange={(e)=>setForm({...form,[k]:e.target.value})} type={type||"text"} required={req} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
            </div>
          ))}
          <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium">Description</label><textarea value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={3} /></div>
          <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium">Password</label><input value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} type="password" required minLength={6} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></div>
          {error && <div className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <button disabled={loading} className="sm:col-span-2 h-11 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-50">{loading ? "Submitting..." : "Register & Submit Property"}</button>
        </form>
      </div>
    </div>
  );
}
