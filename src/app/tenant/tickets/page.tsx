"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TenantTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [lease, setLease] = useState<any>(null);
  const [form, setForm] = useState({ category: "plumbing", title: "", description: "", priority: "medium" });
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: p } = await supabase.from("users").select("*").eq("supabase_uid", user.id).single();
    setProfile(p);
    const { data: l } = p ? await supabase.from("leases").select("*").eq("tenant_id", (p as any).id).eq("status","active").maybeSingle() : { data: null };
    setLease(l);
    if (p) {
      const { data: t } = await supabase.from("maintenance_tickets").select("*").eq("tenant_id", (p as any).id).order("created_at",{ascending:false});
      setTickets(t || []);
    }
  }, []);

  useEffect(()=>{ void load(); },[load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !lease) { setMsg("No active lease found."); return; }
    const supabase = createClient();
    let photo_url: string | null = null;
    if (file) {
      const path = `tickets/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("boardease-uploads").upload(path, file, { upsert: true });
      if (!up.error) photo_url = supabase.storage.from("boardease-uploads").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from("maintenance_tickets").insert({
      ticket_number: "TKT-" + Math.random().toString(36).slice(2,8).toUpperCase(),
      property_id: (lease as any).property_id, tenant_id: (profile as any).id, room_id: (lease as any).room_id,
      category: form.category, title: form.title, description: form.description, priority: form.priority, photo_url, status: "pending",
    } as any);
    if (error) setMsg(error.message); else { setMsg("Ticket submitted."); setForm({ category:"plumbing", title:"", description:"", priority:"medium" }); setFile(null); void load(); }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold text-slate-900">Maintenance Requests</h1><p className="text-sm text-slate-500">Submit and track repair tickets.</p></div>
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">New Ticket</h2>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="h-10 rounded-lg border border-slate-200 px-3 text-sm"><option value="plumbing">Plumbing</option><option value="electrical">Electrical</option><option value="internet">Internet</option><option value="furniture">Furniture</option><option value="other">Other</option></select>
          <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="h-10 rounded-lg border border-slate-200 px-3 text-sm"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
          <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Title" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm sm:col-span-2" />
          <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Description" required rows={3} className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
          <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium">Photo (optional)</label><input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)} className="text-sm" /></div>
          <button className="sm:col-span-2 h-10 rounded-lg bg-primary text-white font-medium">Submit Ticket</button>
        </form>
        {msg && <div className="mt-3 text-sm text-slate-700">{msg}</div>}
      </div>
      <div className="grid gap-3">
        {tickets.map((t)=>(
          <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between"><span className="font-mono text-xs text-slate-500">{t.ticket_number}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize">{t.status.replace("_"," ")}</span></div>
            <div className="font-semibold mt-1">{t.title}</div>
            <div className="text-sm text-slate-600 capitalize">{t.category} · {t.priority} priority</div>
            <p className="mt-1 text-sm">{t.description}</p>
            {t.admin_notes && <div className="mt-2 rounded bg-slate-50 p-2 text-sm text-slate-700"><strong>Admin notes:</strong> {t.admin_notes}</div>}
          </div>
        ))}
        {tickets.length===0 && <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">No tickets yet.</div>}
      </div>
    </div>
  );
}
