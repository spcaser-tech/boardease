import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const profile = await getCurrentProfile(); if (!profile) redirect("/login");
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: props } = await supabase.from("properties").select("id,name").eq("owner_id", profile.id);
  const ids = (props||[]).map((p:any)=>p.id);
  let q = supabase.from("invoices").select("*, users!invoices_tenant_id_fkey(name), properties(name)").in("property_id", ids.length?ids:[-1]).order("billing_month",{ascending:false});
  if (sp.month) q = q.eq("billing_month", sp.month + "-01");
  const { data: invoices } = await q;
  const total = (invoices||[]).reduce((s:number,i:any)=>s+Number(i.total_amount),0);
  const paid = (invoices||[]).filter((i:any)=>i.status==="paid").reduce((s:number,i:any)=>s+Number(i.total_amount),0);
  const csvRows = [["Invoice","Tenant","Property","Month","Total","Status"], ...(invoices||[]).map((i:any)=>[i.invoice_number,i.users?.name,i.properties?.name,i.billing_month,i.total_amount,i.status])];
  const csv = csvRows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
  return (
    <div className="space-y-6">
      <PageHeader title="Financial Reports" subtitle="Filter and export billing and collection data." />
      <Card>
        <form className="flex flex-wrap items-end gap-3">
          <div><label className="mb-1 block text-sm font-medium">Month</label><input name="month" type="month" defaultValue={sp.month||""} className="h-10 rounded-lg border border-slate-200 px-3 text-sm"/></div>
          <button className="h-10 rounded-lg bg-primary px-4 text-sm text-white">Filter</button>
          <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="boardease-report.csv" className="h-10 inline-flex items-center rounded-lg border border-slate-200 px-4 text-sm">Export CSV</a>
          <button type="button" onClick={undefined} className="h-10 rounded-lg border border-slate-200 px-4 text-sm" id="print-btn">Print</button>
        </form>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-4"><div className="text-xs text-slate-500">Billed</div><div className="text-xl font-semibold">{formatCurrency(total)}</div></div>
          <div className="rounded-lg bg-green-50 p-4"><div className="text-xs text-slate-500">Collected</div><div className="text-xl font-semibold text-green-700">{formatCurrency(paid)}</div></div>
          <div className="rounded-lg bg-rose-50 p-4"><div className="text-xs text-slate-500">Outstanding</div><div className="text-xl font-semibold text-primary">{formatCurrency(total-paid)}</div></div>
        </div>
      </Card>
      <Card>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-slate-500"><tr><th className="py-2">Invoice</th><th>Tenant</th><th>Property</th><th>Month</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>{(invoices||[]).map((i:any)=>(<tr key={i.id} className="border-t border-slate-100"><td className="py-2 font-mono text-xs">{i.invoice_number}</td><td>{i.users?.name}</td><td>{i.properties?.name}</td><td>{i.billing_month}</td><td>{formatCurrency(i.total_amount)}</td><td className="capitalize">{i.status.replaceAll("_"," ")}</td></tr>))}
          {(!invoices||invoices.length===0)&&<tr><td colSpan={6} className="py-6 text-center text-slate-500">No records.</td></tr>}</tbody></table></div>
      </Card>
    </div>
  );
}
