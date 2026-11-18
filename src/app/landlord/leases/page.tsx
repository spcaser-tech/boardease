import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, PageHeader, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LeasesPage() {
  const profile = await getCurrentProfile(); if (!profile) redirect("/login");
  const supabase = await createClient();
  const { data: props } = await supabase.from("properties").select("id").eq("owner_id", profile.id);
  const ids = (props||[]).map((p:any)=>p.id);
  const { data: leases } = ids.length ? await supabase.from("leases").select("*, users!leases_tenant_id_fkey(name,email), properties(name,house_rules), rooms(room_number,name)").in("property_id", ids).order("created_at",{ascending:false}) : { data: [] as any[] };
  return (
    <div className="space-y-6">
      <PageHeader title="Leases" subtitle="Active and historical lease agreements." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead className="text-left text-slate-500"><tr><th className="py-2">Lease #</th><th>Tenant</th><th>Property/Room</th><th>Term</th><th>Rent</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {(leases||[]).map((l:any)=>(
                <tr key={l.id} className="border-t border-slate-100">
                  <td className="py-2 font-mono text-xs">{l.lease_number}</td>
                  <td>{l.users?.name}</td>
                  <td>{l.properties?.name} · Rm {l.rooms?.room_number}</td>
                  <td>{l.start_date} → {l.end_date}</td>
                  <td>{formatCurrency(l.monthly_rent)}</td>
                  <td><Badge tone={l.status==="active"?"success":l.status==="expiring_soon"?"warning":"default"}>{l.status}</Badge></td>
                  <td><Link href={`/landlord/leases/${l.id}/contract`} className="text-primary text-xs hover:underline">View/Print</Link></td>
                </tr>
              ))}
              {(!leases||leases.length===0)&&<tr><td colSpan={7} className="py-6 text-center text-slate-500">No leases.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
