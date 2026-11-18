import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Card, PageHeader, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function verifyPayment(formData: FormData) {
  "use server";
  const profile = await getCurrentProfile(); if (!profile) return;
  const supabase = await createClient();
  const id = Number(formData.get("id"));
  const action = String(formData.get("action"));
  const reason = String(formData.get("reason")||"");
  if (action === "approve") {
    const { data: p } = await supabase.from("payments").select("invoice_id").eq("id", id).single();
    await supabase.from("payments").update({ status: "approved", verified_by: profile.id, verified_at: new Date().toISOString() } as never).eq("id", id);
    if (p) await supabase.from("invoices").update({ status: "paid" } as never).eq("id", (p as any).invoice_id);
  } else {
    const { data: p } = await supabase.from("payments").select("invoice_id").eq("id", id).single();
    await supabase.from("payments").update({ status: "rejected", verified_by: profile.id, verified_at: new Date().toISOString(), rejection_reason: reason || "Rejected" } as never).eq("id", id);
    if (p) await supabase.from("invoices").update({ status: "unpaid" } as never).eq("id", (p as any).invoice_id);
  }
  revalidatePath("/landlord/payments");
  revalidatePath("/landlord/invoices");
}

export default async function PaymentsPage() {
  const profile = await getCurrentProfile(); if (!profile) redirect("/login");
  const supabase = await createClient();
  const { data: props } = await supabase.from("properties").select("id").eq("owner_id", profile.id);
  const ids = (props||[]).map((p:any)=>p.id);
  const { data: payments } = ids.length ? await supabase.from("payments").select("*, users!payments_tenant_id_fkey(name,email), invoices(invoice_number,total_amount,due_date,status)").in("property_id", ids).order("created_at",{ascending:false}) : { data: [] as any[] };
  return (
    <div className="space-y-6">
      <PageHeader title="Payment Verification" subtitle="Review proofs side-by-side with invoice details. Approve or reject." />
      <div className="grid gap-4">
        {(payments||[]).map((p:any)=>(
          <Card key={p.id}>
            <div className="grid gap-4 md:grid-cols-[1fr_240px]">
              <div>
                <div className="flex items-center gap-2"><span className="font-mono text-xs">{p.reference_number}</span><Badge tone={p.status==="approved"?"success":p.status==="rejected"?"danger":"warning"}>{p.status}</Badge></div>
                <div className="mt-1 font-medium">{p.users?.name}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-600">
                  <div>Invoice: <span className="font-mono">{p.invoices?.invoice_number}</span></div>
                  <div>Invoice total: {formatCurrency(p.invoices?.total_amount)}</div>
                  <div>Amount paid: <strong>{formatCurrency(p.amount_paid)}</strong></div>
                  <div>Method: <span className="capitalize">{p.payment_method.replace("_"," ")}</span></div>
                  <div>Date: {new Date(p.payment_date).toLocaleString()}</div>
                </div>
                {p.status==="pending" && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <form action={verifyPayment}><input type="hidden" name="id" value={p.id}/><input type="hidden" name="action" value="approve"/><button className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white">Approve</button></form>
                    <form action={verifyPayment} className="flex gap-2"><input type="hidden" name="id" value={p.id}/><input type="hidden" name="action" value="reject"/><input name="reason" placeholder="Rejection reason" className="h-9 rounded-lg border border-slate-200 px-2 text-sm"/><button className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white">Reject</button></form>
                  </div>
                )}
                {p.rejection_reason && <div className="mt-2 text-sm text-red-700">Reason: {p.rejection_reason}</div>}
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-center text-sm text-slate-500">
                {p.proof_image_url ? <a href={p.proof_image_url} target="_blank"><img src={p.proof_image_url} alt="Proof" className="mx-auto max-h-48 rounded object-contain"/></a> : "No proof uploaded"}
              </div>
            </div>
          </Card>
        ))}
        {(!payments||payments.length===0)&&<Card><p className="text-sm text-slate-500">No payments submitted.</p></Card>}
      </div>
    </div>
  );
}

