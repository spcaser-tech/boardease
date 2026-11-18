import { createAdminClient } from "@/lib/supabase/admin";
import { Card, PageHeader } from "@/components/ui";
import { Building2, Users, BedDouble, Percent } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const admin = createAdminClient();
  const [{ count: props }, { count: landlords }, { count: tenants }, { data: beds }] = await Promise.all([
    admin.from("properties").select("*", { count: "exact", head: true }),
    admin.from("users").select("*", { count: "exact", head: true }).eq("role", "landlord"),
    admin.from("users").select("*", { count: "exact", head: true }).eq("role", "tenant"),
    admin.from("bed_spaces").select("status"),
  ]);
  const totalBeds = (beds || []).length;
  const occ = (beds || []).filter((b: any) => b.status === "occupied").length;
  const occPct = totalBeds ? Math.round((occ / totalBeds) * 100) : 0;
  const { data: pending } = await admin.from("properties").select("*, users!properties_owner_id_fkey(name,email)").eq("status", "pending_approval").order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Platform Overview" subtitle="Super admin control center" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Building2} label="Total Boarding Houses" value={props || 0} />
        <Kpi icon={Users} label="Landlords" value={landlords || 0} />
        <Kpi icon={BedDouble} label="Active Tenants" value={tenants || 0} />
        <Kpi icon={Percent} label="Occupancy" value={`${occPct}%`} />
      </div>
      <Card className="mt-6">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Property Approval Queue</h2><span className="text-sm text-slate-500">{(pending||[]).length} pending</span></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500"><tr><th className="py-2">Property</th><th>Owner</th><th>City</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {(pending||[]).map((p:any)=>(
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="py-2 font-medium">{p.name}</td>
                  <td>{p.users?.name} ({p.users?.email})</td>
                  <td>{p.city}</td>
                  <td className="capitalize">{p.status.replaceAll("_"," ")}</td>
                  <td className="py-2 text-right"><form action={async ()=>{"use server"; const a=createAdminClient(); await a.from("properties").update({status:"active"} as never).eq("id",p.id);}}><button className="rounded-md bg-primary px-3 py-1.5 text-xs text-white">Approve</button></form></td>
                </tr>
              ))}
              {(!pending||pending.length===0)&&<tr><td colSpan={5} className="py-6 text-center text-slate-500">No pending properties.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: any) {
  return <Card><div className="flex items-center justify-between"><div><div className="text-sm text-slate-500">{label}</div><div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div></div><div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon size={18}/></div></div></Card>;
}

