import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Card, PageHeader, Badge } from "@/components/ui";
import { formatCurrency, formatMonth, code } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function generateInvoices(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const property_id = Number(formData.get("property_id"));
  const billing_month = String(formData.get("billing_month")) + "-01";
  const due_date = String(formData.get("due_date"));
  const other_fees = Number(formData.get("other_fees") || 0);

  const { data: leases } = await supabase.from("leases").select("id,tenant_id,room_id,monthly_rent").eq("property_id", property_id).eq("status","active");
  for (const l of (leases || []) as any[]) {
    // count active tenants sharing room
    const { count } = await supabase.from("leases").select("*", { count: "exact", head: true }).eq("property_id", property_id).eq("room_id", l.room_id).eq("status","active");
    const share = Math.max(1, count || 1);
    const { data: reading } = await supabase.from("utility_readings").select("total_utility_cost").eq("property_id", property_id).eq("room_id", l.room_id).eq("billing_month", billing_month).maybeSingle();
    const util = Number((reading as any)?.total_utility_cost || 0) / share;
    // simple split: half electric half water if not itemized; store as electric_share/water_share split 50/50
    const electric_share = util / 2;
    const water_share = util - electric_share;
    const rent = Number(l.monthly_rent);
    const total = rent + electric_share + water_share + other_fees;
    // avoid duplicate for same lease+month
    const { data: existing } = await supabase.from("invoices").select("id").eq("lease_id", l.id).eq("billing_month", billing_month).maybeSingle();
    if (existing) continue;
    await supabase.from("invoices").insert({
      invoice_number: code("INV"), property_id, lease_id: l.id, tenant_id: l.tenant_id,
      billing_month, rent_amount: rent, electric_share, water_share, other_fees, total_amount: total,
      due_date, status: "unpaid",
    } as any);
  }
  revalidatePath("/landlord/invoices");
}

export default async function InvoicesPage() {
  const profile = await getCurrentProfile(); if (!profile) redirect("/login");
  const supabase = await createClient();
  const { data: props } = await supabase.from("properties").select("id,name").eq("owner_id", profile.id);
  const ids = (props||[]).map((p:any)=>p.id);
  const { data: invoices } = ids.length ? await supabase.from("invoices").select("*, users!invoices_tenant_id_fkey(name), properties(name)").in("property_id", ids).order("created_at",{ascending:false}).limit(100) : { data: [] as any[] };
  return (
    <div className="space-y-6">
      <PageHeader title="Invoices & Billing" subtitle="Generate monthly invoices split by rent + room utility share." />
      <Card>
        <h2 className="mb-3 font-semibold">Generate Monthly Invoices</h2>
        <form action={generateInvoices} className="grid gap-3 sm:grid-cols-4">
          <select name="property_id" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm">{(props||[]).map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <input name="billing_month" type="month" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input name="due_date" type="date" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input name="other_fees" type="number" step="0.01" placeholder="Other fees" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <button className="sm:col-span-4 h-10 rounded-lg bg-primary text-white font-medium">Generate Invoices</button>
        </form>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead className="text-left text-slate-500"><tr><th className="py-2">Invoice #</th><th>Tenant</th><th>Month</th><th>Rent</th><th>Utilities</th><th>Total</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>
              {(invoices||[]).map((i:any)=>(<tr key={i.id} className="border-t border-slate-100"><td className="py-2 font-mono text-xs">{i.invoice_number}</td><td>{i.users?.name}</td><td>{formatMonth(i.billing_month)}</td><td>{formatCurrency(i.rent_amount)}</td><td>{formatCurrency(Number(i.electric_share)+Number(i.water_share))}</td><td className="font-medium">{formatCurrency(i.total_amount)}</td><td>{i.due_date}</td><td><Badge tone={i.status==="paid"?"success":i.status==="pending_verification"?"warning":i.status==="overdue"?"danger":"default"}>{i.status}</Badge></td></tr>))}
              {(!invoices||invoices.length===0)&&<tr><td colSpan={8} className="py-6 text-center text-slate-500">No invoices.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
