import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, PageHeader, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const profile = await getCurrentProfile(); if (!profile) redirect("/login");
  const supabase = await createClient();
  const { data: props } = await supabase.from("properties").select("id").eq("owner_id", profile.id);
  const ids = (props||[]).map((p:any)=>p.id);
  const { data: leases } = ids.length ? await supabase.from("leases").select("*, users!leases_tenant_id_fkey(name,email,phone), properties(name), rooms(room_number,name), bed_spaces(bed_code)").in("property_id", ids).order("created_at",{ascending:false}) : { data: [] as any[] };
  return (
    <div className="space-y-6">
      <PageHeader title="Tenant Management" subtitle="Active tenants derived from leases." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead className="text-left text-slate-500"><tr><th className="py-2">Tenant</th><th>Contact</th><th>Property / Room</th><th>Lease</th><th>Status</th></tr></thead>
            <tbody>
              {(leases||[]).map((l:any)=>(
                <tr key={l.id} className="border-t border-slate-100">
                  <td className="py-2 font-medium">{l.users?.name}</td>
                  <td><div>{l.users?.email}</div><div className="text-xs text-slate-500">{l.users?.phone||""}</div></td>
                  <td>{l.properties?.name} · Rm {l.rooms?.room_number} {l.bed_spaces?`· ${l.bed_spaces.bed_code}`:""}</td>
                  <td className="font-mono text-xs">{l.lease_number}</td>
                  <td><Badge tone={l.status==="active"?"success":l.status==="expiring_soon"?"warning":"default"}>{l.status}</Badge></td>
                </tr>
              ))}
              {(!leases||leases.length===0)&&<tr><td colSpan={5} className="py-6 text-center text-slate-500">No tenants yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
