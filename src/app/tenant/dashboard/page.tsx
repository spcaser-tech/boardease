import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, PageHeader, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TenantDashboard() {
  const profile = await getCurrentProfile(); if (!profile) redirect("/login");
  const supabase = await createClient();
  const { data: lease } = await supabase.from("leases").select("*, properties(name,house_rules), rooms(room_number,name)").eq("tenant_id", profile.id).eq("status","active").maybeSingle();
  const { data: invoices } = await supabase.from("invoices").select("*").eq("tenant_id", profile.id).neq("status","paid").order("due_date",{ascending:true});
  const { data: announcements } = lease ? await supabase.from("announcements").select("*").eq("property_id", (lease as any).property_id).eq("is_published", true).order("created_at",{ascending:false}).limit(5) : { data: [] as any[] };
  const unpaid = (invoices||[]).reduce((s:number,i:any)=>s+Number(i.total_amount),0);

  return (
    <div className="space-y-6">
      <PageHeader title="Tenant Dashboard" subtitle={`Welcome back, ${profile.name}`} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><div className="text-sm text-slate-500">Active Lease</div><div className="mt-1 font-semibold">{lease ? `${(lease as any).properties?.name} · Rm ${(lease as any).rooms?.room_number}` : "No active lease"}</div></Card>
        <Card><div className="text-sm text-slate-500">Unpaid Balance</div><div className="mt-1 text-xl font-semibold text-primary">{formatCurrency(unpaid)}</div></Card>
        <Card><div className="text-sm text-slate-500">Quick Actions</div><div className="mt-2 flex flex-wrap gap-2"><Link href="/tenant/invoices" className="rounded-lg bg-primary px-3 py-1.5 text-sm text-white">Pay Bills</Link><Link href="/tenant/tickets" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">Request Repair</Link></div></Card>
      </div>
      {lease && (
        <Card>
          <h2 className="font-semibold">Lease Summary</h2>
          <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
            <div>Lease #: <span className="font-mono">{(lease as any).lease_number}</span></div>
            <div>Room: {(lease as any).rooms?.name} ({(lease as any).rooms?.room_number})</div>
            <div>Term: {(lease as any).start_date} → {(lease as any).end_date}</div>
            <div>Monthly rent: {formatCurrency((lease as any).monthly_rent)}</div>
          </div>
        </Card>
      )}
      <Card>
        <h2 className="mb-3 font-semibold">Unpaid / Pending Invoices</h2>
        {(!invoices||invoices.length===0) ? <p className="text-sm text-slate-500">No unpaid invoices.</p> : (
          <ul className="space-y-2">{(invoices as any[]).map((i)=>(
            <li key={i.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
              <div><div className="font-medium">{i.invoice_number} · {i.billing_month}</div><div className="text-slate-500">Due {i.due_date}</div></div>
              <div className="text-right"><div className="font-semibold">{formatCurrency(i.total_amount)}</div><Badge tone={i.status==="pending_verification"?"warning":i.status==="overdue"?"danger":"default"}>{i.status}</Badge></div>
            </li>
          ))}</ul>
        )}
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">Announcements</h2>
        {(!announcements||announcements.length===0) ? <p className="text-sm text-slate-500">No announcements.</p> : (
          <div className="space-y-3">{(announcements as any[]).map((a)=>(
            <div key={a.id} className="rounded-lg border border-slate-200 p-3"><div className="flex items-center justify-between"><span className="font-medium">{a.title}</span><Badge tone={a.priority==="urgent"?"danger":"default"}>{a.priority}</Badge></div><p className="mt-1 text-sm text-slate-600">{a.content}</p></div>
          ))}</div>
        )}
      </Card>
    </div>
  );
}
