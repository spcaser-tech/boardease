import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Card, PageHeader, Badge } from "@/components/ui";
import { code } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function updateReservation(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const id = Number(formData.get("id"));
  const action = String(formData.get("action"));
  const { data: res } = await supabase.from("reservations").select("*, rooms(monthly_rate)").eq("id", id).single();
  if (!res) return;
  if (action === "reject") {
    await supabase.from("reservations").update({ status: "rejected" } as never).eq("id", id);
    if ((res as any).bed_space_id) await supabase.from("bed_spaces").update({ status: "available" } as never).eq("id", (res as any).bed_space_id);
  } else if (action === "approve") {
    // find or create tenant user profile by email (no auth password flow here; record profile for lease)
    let tenantId: number | null = null;
    const { data: existing } = await supabase.from("users").select("id").eq("email", (res as any).guest_email).maybeSingle();
    if (existing) tenantId = (existing as any).id;
    else {
      const { data: created } = await supabase.from("users").insert({
        name: (res as any).guest_name, email: (res as any).guest_email, phone: (res as any).guest_phone, password: "supabase", role: "tenant"
      } as any).select("id").single();
      tenantId = (created as any)?.id ?? null;
    }
    await supabase.from("reservations").update({ status: "converted" } as never).eq("id", id);
    if ((res as any).bed_space_id) await supabase.from("bed_spaces").update({ status: "occupied" } as never).eq("id", (res as any).bed_space_id);
    if (tenantId) {
      const start = (res as any).preferred_move_in_date;
      const end = new Date(start); end.setMonth(end.getMonth()+6);
      const rent = Number((res as any).rooms?.monthly_rate || 0);
      await supabase.from("leases").insert({
        lease_number: code("LEASE"), property_id: (res as any).property_id, tenant_id: tenantId,
        room_id: (res as any).room_id, bed_space_id: (res as any).bed_space_id, start_date: start,
        end_date: end.toISOString().slice(0,10), monthly_rent: rent, security_deposit: rent,
        deposit_status: "unpaid", status: "active"
      } as any);
    }
  }
  revalidatePath("/landlord/reservations");
  revalidatePath("/landlord/tenants");
  revalidatePath("/landlord/leases");
}

export default async function ReservationsPage() {
  const profile = await getCurrentProfile(); if (!profile) redirect("/login");
  const supabase = await createClient();
  const { data: props } = await supabase.from("properties").select("id").eq("owner_id", profile.id);
  const ids = (props||[]).map((p:any)=>p.id);
  const { data: reservations } = ids.length ? await supabase.from("reservations").select("*, properties(name), rooms(room_number,name), bed_spaces(bed_code)").in("property_id", ids).order("created_at",{ascending:false}) : { data: [] as any[] };
  return (
    <div className="space-y-6">
      <PageHeader title="Reservations" subtitle="Approve or reject guest reservations. Approving creates a tenant and lease." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead className="text-left text-slate-500"><tr><th className="py-2">Code</th><th>Guest</th><th>Property/Room</th><th>Move-in</th><th>Status</th><th>Valid ID</th><th></th></tr></thead>
            <tbody>
              {(reservations||[]).map((r:any)=>(
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="py-2 font-mono text-xs">{r.reservation_code}</td>
                  <td><div className="font-medium">{r.guest_name}</div><div className="text-xs text-slate-500">{r.guest_email}</div></td>
                  <td>{r.properties?.name} · Rm {r.rooms?.room_number} {r.bed_spaces?`· ${r.bed_spaces.bed_code}`:""}</td>
                  <td>{r.preferred_move_in_date}</td>
                  <td><Badge tone={r.status==="pending"?"warning":r.status==="converted"||r.status==="approved"?"success":r.status==="rejected"?"danger":"default"}>{r.status}</Badge></td>
                  <td>{r.valid_id_url ? <a href={r.valid_id_url} target="_blank" className="text-primary underline">View</a> : "—"}</td>
                  <td className="py-2">
                    {r.status==="pending" && (
                      <div className="flex gap-2">
                        <form action={updateReservation}><input type="hidden" name="id" value={r.id}/><input type="hidden" name="action" value="approve"/><button className="rounded bg-green-600 px-2 py-1 text-xs text-white">Approve</button></form>
                        <form action={updateReservation}><input type="hidden" name="id" value={r.id}/><input type="hidden" name="action" value="reject"/><button className="rounded bg-red-600 px-2 py-1 text-xs text-white">Reject</button></form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {(!reservations||reservations.length===0)&&<tr><td colSpan={7} className="py-6 text-center text-slate-500">No reservations.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

