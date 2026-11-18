import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TenantLeasePage() {
  const profile = await getCurrentProfile(); if (!profile) redirect("/login");
  const supabase = await createClient();
  const { data: lease } = await supabase.from("leases").select("*, properties(*), rooms(room_number,name,room_type)").eq("tenant_id", profile.id).order("created_at",{ascending:false}).maybeSingle();
  const l: any = lease;
  return (
    <div className="space-y-6">
      <PageHeader title="My Lease Contract" subtitle="View your lease terms and house rules." />
      {!l ? <Card><p className="text-sm text-slate-500">No lease found.</p></Card> : (
        <Card>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div><div className="text-slate-500">Lease number</div><div className="font-mono font-medium">{l.lease_number}</div></div>
            <div><div className="text-slate-500">Status</div><div className="font-medium capitalize">{l.status}</div></div>
            <div><div className="text-slate-500">Property</div><div className="font-medium">{l.properties?.name}</div><div className="text-slate-600">{l.properties?.address}, {l.properties?.city}</div></div>
            <div><div className="text-slate-500">Room</div><div className="font-medium">Room {l.rooms?.room_number} — {l.rooms?.name}</div></div>
            <div><div className="text-slate-500">Term</div><div className="font-medium">{l.start_date} to {l.end_date}</div></div>
            <div><div className="text-slate-500">Monthly rent</div><div className="font-medium">{formatCurrency(l.monthly_rent)}</div></div>
            <div><div className="text-slate-500">Security deposit</div><div className="font-medium">{formatCurrency(l.security_deposit)} ({l.deposit_status})</div></div>
          </div>
          <div className="mt-6">
            <div className="font-semibold">House Rules</div>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 font-sans text-sm text-slate-700">{l.properties?.house_rules || "No house rules provided."}</pre>
          </div>
        </Card>
      )}
    </div>
  );
}
