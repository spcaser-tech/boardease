"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader, SiteFooter } from "@/components/layout/site-shell";

export default function ReservePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [room, setRoom] = useState<any>(null);
  const [beds, setBeds] = useState<any[]>([]);
  const [form, setForm] = useState({ guest_name: "", guest_email: "", guest_phone: "", preferred_move_in_date: "", notes: "", bed_space_id: "" });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("rooms").select("*, properties(id,name,city)").eq("id", Number(roomId)).single();
      setRoom(data);
      const { data: b } = await supabase.from("bed_spaces").select("*").eq("room_id", Number(roomId)).eq("status", "available");
      setBeds(b || []);
    })();
  }, [roomId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!room) return;
    setLoading(true); setError(null);
    let valid_id_url: string | null = null;
    if (file) {
      const path = `reservations/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("boardease-uploads").upload(path, file, { upsert: true });
      if (!up.error) {
        const { data: pub } = supabase.storage.from("boardease-uploads").getPublicUrl(path);
        valid_id_url = pub.publicUrl;
      }
    }
    const code = "RES-" + Math.random().toString(36).slice(2,8).toUpperCase();
    const { error } = await supabase.from("reservations").insert({
      reservation_code: code,
      property_id: room.property_id,
      guest_name: form.guest_name,
      guest_email: form.guest_email,
      guest_phone: form.guest_phone,
      room_id: room.id,
      bed_space_id: form.bed_space_id ? Number(form.bed_space_id) : null,
      preferred_move_in_date: form.preferred_move_in_date,
      notes: form.notes || null,
      valid_id_url,
      status: "pending",
    } as any);
    if (error) { setError(error.message); setLoading(false); return; }
    if (form.bed_space_id) {
      await supabase.from("bed_spaces").update({ status: "reserved" } as never).eq("id", Number(form.bed_space_id));
    }
    router.push(`/reservations/check?code=${code}&email=${encodeURIComponent(form.guest_email)}`);
  }

  if (!room) return <div className="min-h-screen grid place-items-center">Loading…</div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Reserve: {room.name}</h1>
          <p className="mt-1 text-sm text-slate-600">{room.properties?.name} · {room.properties?.city} · Room {room.room_number} · ₱{Number(room.monthly_rate).toLocaleString()}/mo</p>
          <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-sm font-medium">Full name</label><input required value={form.guest_name} onChange={e=>setForm({...form,guest_name:e.target.value})} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"/></div>
            <div><label className="mb-1 block text-sm font-medium">Email</label><input required type="email" value={form.guest_email} onChange={e=>setForm({...form,guest_email:e.target.value})} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"/></div>
            <div><label className="mb-1 block text-sm font-medium">Phone</label><input required value={form.guest_phone} onChange={e=>setForm({...form,guest_phone:e.target.value})} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"/></div>
            <div><label className="mb-1 block text-sm font-medium">Preferred move-in date</label><input required type="date" value={form.preferred_move_in_date} onChange={e=>setForm({...form,preferred_move_in_date:e.target.value})} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"/></div>
            {beds.length > 0 && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Select bed space (optional)</label>
                <select value={form.bed_space_id} onChange={e=>setForm({...form,bed_space_id:e.target.value})} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                  <option value="">Any available</option>
                  {beds.map((b)=> <option key={b.id} value={b.id}>{b.bed_code} · {b.position} · ₱{Number(b.monthly_rate).toLocaleString()}</option>)}
                </select>
              </div>
            )}
            <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium">Valid ID (upload)</label><input type="file" accept="image/*,application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)} className="block w-full text-sm" /></div>
            <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium">Notes</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            {error && <div className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <button disabled={loading} className="sm:col-span-2 h-11 rounded-lg bg-primary font-medium text-white hover:bg-primary-dark disabled:opacity-50">{loading ? "Submitting..." : "Submit Reservation"}</button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

