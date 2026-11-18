import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Card, PageHeader, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

async function addRoom(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const property_id = Number(formData.get("property_id"));
  const capacity = Number(formData.get("capacity")||1);
  const rate = Number(formData.get("monthly_rate")||0);
  const room_type = String(formData.get("room_type"));
  const { data: room } = await supabase.from("rooms").insert({
    property_id, room_number: String(formData.get("room_number")), name: String(formData.get("name")),
    floor_level: String(formData.get("floor_level")||"") || null, room_type, capacity, monthly_rate: rate,
    amenities: String(formData.get("amenities")||"").split(",").map(s=>s.trim()).filter(Boolean),
    description: String(formData.get("description")||"") || null, status: "available",
  } as any).select("id").single();
  if (room) {
    const beds = Array.from({length: capacity}, (_,i)=>({
      room_id: (room as any).id, bed_code: `B${i+1}`, position: capacity===1?"single":(i%2===0?"lower_deck":"upper_deck"),
      monthly_rate: rate, status: "available",
    }));
    await supabase.from("bed_spaces").insert(beds as any);
  }
  revalidatePath("/landlord/rooms");
}

async function deleteRoom(formData: FormData) {
  "use server";
  const supabase = await createClient();
  await supabase.from("rooms").delete().eq("id", Number(formData.get("id")));
  revalidatePath("/landlord/rooms");
}

export default async function RoomsPage() {
  const profile = await getCurrentProfile(); if (!profile) redirect("/login");
  const supabase = await createClient();
  const { data: properties } = await supabase.from("properties").select("id,name").eq("owner_id", profile.id);
  const propIds = (properties||[]).map((p:any)=>p.id);
  const { data: rooms } = propIds.length ? await supabase.from("rooms").select("*, properties(name), bed_spaces(id,bed_code,status,position,monthly_rate)").in("property_id", propIds).order("created_at",{ascending:false}) : { data: [] as any[] };
  return (
    <div className="space-y-6">
      <PageHeader title="Room & Bed-Space Management" subtitle="Create rooms and auto-generate bed spaces." />
      <Card>
        <form action={addRoom} className="grid gap-3 sm:grid-cols-3">
          <select name="property_id" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm">{(properties||[]).map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <input name="room_number" placeholder="Room number" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input name="name" placeholder="Room name" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input name="floor_level" placeholder="Floor level" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <select name="room_type" className="h-10 rounded-lg border border-slate-200 px-3 text-sm"><option value="solo">Solo</option><option value="shared">Shared</option><option value="bedspace">Bedspace</option></select>
          <input name="capacity" type="number" min={1} defaultValue={1} placeholder="Capacity" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input name="monthly_rate" type="number" step="0.01" placeholder="Monthly rate" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input name="amenities" placeholder="Amenities (comma separated)" className="h-10 rounded-lg border border-slate-200 px-3 text-sm sm:col-span-2" />
          <textarea name="description" placeholder="Description" className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-3" />
          <button className="sm:col-span-3 h-10 rounded-lg bg-primary text-white font-medium">Add Room</button>
        </form>
      </Card>
      <div className="grid gap-4">
        {(rooms||[]).map((r:any)=>(
          <Card key={r.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="font-semibold">{r.properties?.name} · Room {r.room_number} — {r.name}</div><div className="text-sm text-slate-500">{r.room_type} · Cap {r.capacity} · ₱{Number(r.monthly_rate).toLocaleString()}/mo</div></div>
              <div className="flex items-center gap-2"><Badge tone={r.status==="available"?"success":r.status==="maintenance"?"default":"warning"}>{r.status}</Badge><form action={deleteRoom}><input type="hidden" name="id" value={r.id}/><button className="text-sm text-red-600 hover:underline">Delete</button></form></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">{(r.bed_spaces||[]).map((b:any)=><span key={b.id} className={`rounded px-2 py-1 text-xs font-medium text-white ${b.status==="available"?"bg-green-500":b.status==="occupied"?"bg-red-500":b.status==="reserved"?"bg-amber-500":"bg-slate-400"}`}>{b.bed_code} · {b.status}</span>)}</div>
          </Card>
        ))}
        {(!rooms||rooms.length===0)&&<Card><p className="text-sm text-slate-500">No rooms yet.</p></Card>}
      </div>
    </div>
  );
}
