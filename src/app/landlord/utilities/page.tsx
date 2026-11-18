import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Card, PageHeader } from "@/components/ui";
import { formatCurrency, formatMonth } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function addReading(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const ep = Number(formData.get("electric_prev")||0), ec = Number(formData.get("electric_curr")||0);
  const er = Number(formData.get("electric_rate")||0), wp = Number(formData.get("water_prev")||0);
  const wc = Number(formData.get("water_curr")||0), wr = Number(formData.get("water_rate")||0);
  const total = Math.max(0, ec-ep)*er + Math.max(0, wc-wp)*wr;
  const property_id = Number(formData.get("property_id"));
  const room_id = Number(formData.get("room_id"));
  const billing_month = String(formData.get("billing_month")) + "-01";
  await supabase.from("utility_readings").upsert({
    property_id, room_id, billing_month,
    electric_prev: ep, electric_curr: ec, electric_rate: er,
    water_prev: wp, water_curr: wc, water_rate: wr,
    total_utility_cost: total,
  } as any, { onConflict: "property_id,room_id,billing_month" });
  revalidatePath("/landlord/utilities");
}

export default async function UtilitiesPage() {
  const profile = await getCurrentProfile(); if (!profile) redirect("/login");
  const supabase = await createClient();
  const { data: props } = await supabase.from("properties").select("id,name").eq("owner_id", profile.id);
  const propIds = (props||[]).map((p:any)=>p.id);
  const { data: rooms } = propIds.length ? await supabase.from("rooms").select("id,room_number,name,property_id").in("property_id", propIds) : { data: [] as any[] };
  const { data: readings } = propIds.length ? await supabase.from("utility_readings").select("*, rooms(room_number,name), properties(name)").in("property_id", propIds).order("billing_month",{ascending:false}).limit(50) : { data: [] as any[] };
  return (
    <div className="space-y-6">
      <PageHeader title="Utility Sub-Metering" subtitle="Record per-room readings. Total = (curr-prev)*rate for electric + water." />
      <Card>
        <form action={addReading} className="grid gap-3 sm:grid-cols-3">
          <select name="property_id" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm">{(props||[]).map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select name="room_id" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm">{(rooms||[]).map((r:any)=><option key={r.id} value={r.id}>Rm {r.room_number} — {r.name}</option>)}</select>
          <input name="billing_month" type="month" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input name="electric_prev" type="number" step="0.01" placeholder="Electric prev" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input name="electric_curr" type="number" step="0.01" placeholder="Electric curr" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input name="electric_rate" type="number" step="0.0001" placeholder="Electric rate" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input name="water_prev" type="number" step="0.01" placeholder="Water prev" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input name="water_curr" type="number" step="0.01" placeholder="Water curr" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input name="water_rate" type="number" step="0.0001" placeholder="Water rate" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <button className="sm:col-span-3 h-10 rounded-lg bg-primary text-white font-medium">Save Reading</button>
        </form>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead className="text-left text-slate-500"><tr><th className="py-2">Month</th><th>Property/Room</th><th>Electric</th><th>Water</th><th>Total</th></tr></thead>
            <tbody>
              {(readings||[]).map((r:any)=>(<tr key={r.id} className="border-t border-slate-100"><td className="py-2">{formatMonth(r.billing_month)}</td><td>{r.properties?.name} · Rm {r.rooms?.room_number}</td><td>{r.electric_prev}→{r.electric_curr} @ {r.electric_rate}</td><td>{r.water_prev}→{r.water_curr} @ {r.water_rate}</td><td className="font-medium">{formatCurrency(r.total_utility_cost)}</td></tr>))}
              {(!readings||readings.length===0)&&<tr><td colSpan={5} className="py-6 text-center text-slate-500">No readings yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
