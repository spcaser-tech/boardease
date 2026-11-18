import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, PageHeader, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { Building2, BedDouble, Banknote, AlertCircle, Wrench, CalendarCheck } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getOwnedPropertyIds(profile: any) {
  const supabase = await createClient();
  if (profile.role === "landlord") {
    const { data } = await supabase.from("properties").select("id").eq("owner_id", profile.id);
    return (data || []).map((p: any) => p.id);
  } else {
    const { data } = await supabase.from("property_staff").select("property_id").eq("user_id", profile.id);
    return (data || []).map((p: any) => p.property_id);
  }
}

export default async function LandlordDashboard({ searchParams }: { searchParams: Promise<{ property?: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const supabase = await createClient();
  const sp = await searchParams;

  let properties: any[] = [];
  if (profile.role === "landlord") {
    const { data } = await supabase.from("properties").select("*").eq("owner_id", profile.id).order("created_at", { ascending: false });
    properties = data || [];
  } else {
    const { data } = await supabase.from("property_staff").select("property_id, properties(*)").eq("user_id", profile.id);
    properties = (data || []).map((r: any) => r.properties).filter(Boolean);
  }

  const activePropId = sp.property ? Number(sp.property) : properties[0]?.id;
  const propIds = activePropId ? [activePropId] : await getOwnedPropertyIds(profile);

  const [{ data: rooms }, { data: invoices }, { data: reservations }, { data: tickets }] = await Promise.all([
    propIds.length ? supabase.from("rooms").select("id,room_number,name,status, bed_spaces(id,status,bed_code,position,monthly_rate)").in("property_id", propIds) : Promise.resolve({ data: [] as any[] }),
    propIds.length ? supabase.from("invoices").select("status,total_amount,due_date").in("property_id", propIds) : Promise.resolve({ data: [] as any[] }),
    propIds.length ? supabase.from("reservations").select("id,status").in("property_id", propIds).eq("status","pending") : Promise.resolve({ data: [] as any[] }),
    propIds.length ? supabase.from("maintenance_tickets").select("id,status").in("property_id", propIds).neq("status","resolved") : Promise.resolve({ data: [] as any[] }),
  ]);

  const beds = (rooms || []).flatMap((r: any) => r.bed_spaces || []);
  const totalBeds = beds.length;
  const occ = beds.filter((b: any) => b.status === "occupied").length;
  const occPct = totalBeds ? Math.round((occ/totalBeds)*100) : 0;
  const collected = (invoices || []).filter((i:any)=>i.status==="paid").reduce((s:number,i:any)=>s+Number(i.total_amount),0);
  const unpaid = (invoices || []).filter((i:any)=>i.status!=="paid").reduce((s:number,i:any)=>s+Number(i.total_amount),0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Smart Dashboard</h1>
          <p className="text-sm text-slate-500">Real-time KPIs, occupancy, and activity overview.</p>
        </div>
        {properties.length > 1 && (
          <form>
            <select name="property" defaultValue={activePropId} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" >
              {properties.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button className="ml-2 h-10 rounded-lg bg-primary px-4 text-sm text-white">Switch</button>
          </form>
        )}
      </div>

      {properties.length === 0 && (
        <Card><p className="text-slate-600">No properties yet. <Link href="/landlord/properties" className="text-primary underline">Create one</Link> to get started.</p></Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi icon={BedDouble} label="Total Bed Spaces" value={totalBeds} />
        <Kpi icon={Building2} label="Occupancy" value={`${occPct}%`} />
        <Kpi icon={Banknote} label="Collected" value={formatCurrency(collected)} />
        <Kpi icon={AlertCircle} label="Unpaid/Overdue" value={formatCurrency(unpaid)} />
        <Kpi icon={CalendarCheck} label="Pending Reservations" value={(reservations||[]).length} />
        <Kpi icon={Wrench} label="Open Tickets" value={(tickets||[]).length} />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-slate-900">Visual Room Map</h2><span className="text-xs text-slate-500">Green: Available · Red: Occupied · Amber: Reserved · Gray: Maintenance</span></div>
        {(!rooms || rooms.length===0) ? <p className="text-sm text-slate-500">No rooms yet.</p> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(rooms as any[]).map((r:any)=>(
              <div key={r.id} className="rounded-lg border border-slate-200 p-4">
                <div className="mb-2 flex items-center justify-between"><div className="font-medium">Room {r.room_number} · {r.name}</div><Badge tone={r.status==="available"?"success":r.status==="maintenance"?"default":"warning"}>{r.status}</Badge></div>
                <div className="flex flex-wrap gap-2">
                  {(r.bed_spaces||[]).map((b:any)=>(
                    <div key={b.id} title={`${b.bed_code} (${b.status})`} className={`grid h-10 min-w-10 place-items-center rounded-md px-2 text-xs font-medium text-white ${b.status==="available"?"bg-green-500":b.status==="occupied"?"bg-red-500":b.status==="reserved"?"bg-amber-500":"bg-slate-400"}`}>
                      {b.bed_code}
                    </div>
                  ))}
                  {(!r.bed_spaces||r.bed_spaces.length===0)&&<span className="text-xs text-slate-400">No bed spaces</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: any) {
  return <Card className="p-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon size={18}/></div><div><div className="text-xs text-slate-500">{label}</div><div className="text-lg font-semibold text-slate-900">{value}</div></div></div></Card>;
}
