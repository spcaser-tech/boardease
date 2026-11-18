"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TenantInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [property, setProperty] = useState<any>(null);
  const [file, setFile] = useState<Record<number, File | null>>({});
  const [method, setMethod] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: p } = await supabase.from("users").select("*").eq("supabase_uid", user.id).single();
    if (!p) return;
    const { data: inv } = await supabase.from("invoices").select("*, properties(name,gcash_number,maya_number,bank_details)").eq("tenant_id", (p as any).id).order("billing_month",{ascending:false});
    setInvoices(inv || []);
    if (inv && inv[0]) setProperty((inv[0] as any).properties);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function submitPayment(invoice: any) {
    setMsg(null);
    const supabase = createClient();
    let proof_image_url: string | null = null;
    const f = file[invoice.id];
    if (f) {
      const path = `payments/${Date.now()}-${f.name}`;
      const up = await supabase.storage.from("boardease-uploads").upload(path, f, { upsert: true });
      if (!up.error) proof_image_url = supabase.storage.from("boardease-uploads").getPublicUrl(path).data.publicUrl;
    }
    const ref = "PAY-" + Math.random().toString(36).slice(2,8).toUpperCase();
    const { error } = await supabase.from("payments").insert({
      reference_number: ref, property_id: invoice.property_id, invoice_id: invoice.id, tenant_id: invoice.tenant_id,
      amount_paid: invoice.total_amount, payment_method: method[invoice.id] || "gcash",
      proof_image_url, payment_date: new Date().toISOString(), status: "pending",
    } as any);
    if (!error) {
      await supabase.from("invoices").update({ status: "pending_verification" } as never).eq("id", invoice.id);
      setMsg(`Payment ${ref} submitted for verification.`);
      void load();
    } else setMsg(error.message);
  }

  function dl(inv: any) {
    const txt = `BoardEase Invoice\nInvoice: ${inv.invoice_number}\nMonth: ${inv.billing_month}\nRent: ${inv.rent_amount}\nElectric: ${inv.electric_share}\nWater: ${inv.water_share}\nOther: ${inv.other_fees}\nTOTAL: ${inv.total_amount}\nDue: ${inv.due_date}\nStatus: ${inv.status}`;
    const blob = new Blob([txt], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${inv.invoice_number}.txt`; a.click();
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold text-slate-900">My Bills & Payment Upload</h1><p className="text-sm text-slate-500">View itemized invoices, landlord payment details, and submit proof.</p></div>
      {property && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <div className="font-medium">Payment Details — {property.name}</div>
          <div className="mt-1 text-slate-600">GCash: {property.gcash_number || "—"} · Maya: {property.maya_number || "—"} · Bank: {property.bank_details || "—"}</div>
        </div>
      )}
      {msg && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{msg}</div>}
      <div className="grid gap-4">
        {invoices.map((inv) => (
          <div key={inv.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-mono text-xs text-slate-500">{inv.invoice_number}</div>
                <div className="font-semibold">{inv.billing_month} · Due {inv.due_date}</div>
                <ul className="mt-2 text-sm text-slate-700 space-y-0.5">
                  <li>Rent: ₱{Number(inv.rent_amount).toLocaleString()}</li>
                  <li>Electric share: ₱{Number(inv.electric_share).toLocaleString()}</li>
                  <li>Water share: ₱{Number(inv.water_share).toLocaleString()}</li>
                  <li>Other fees: ₱{Number(inv.other_fees).toLocaleString()}</li>
                  <li className="font-semibold">Total: ₱{Number(inv.total_amount).toLocaleString()}</li>
                </ul>
              </div>
              <div className="text-right">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize">{inv.status.replaceAll("_"," ")}</span>
                <div className="mt-2"><button onClick={()=>dl(inv)} className="text-sm text-primary hover:underline">Download receipt</button></div>
              </div>
            </div>
            {(inv.status === "unpaid" || inv.status === "overdue") && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="mb-2 text-sm font-medium">Submit Payment Proof</div>
                <div className="flex flex-wrap items-center gap-2">
                  <select value={method[inv.id]||"gcash"} onChange={e=>setMethod({...method,[inv.id]:e.target.value})} className="h-9 rounded-lg border border-slate-200 px-2 text-sm"><option value="gcash">GCash</option><option value="maya">Maya</option><option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option></select>
                  <input type="file" accept="image/*" onChange={e=>setFile({...file,[inv.id]:e.target.files?.[0]||null})} className="text-sm" />
                  <button onClick={()=>submitPayment(inv)} className="h-9 rounded-lg bg-primary px-3 text-sm text-white">Submit Proof</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {invoices.length===0 && <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">No invoices found.</div>}
      </div>
    </div>
  );
}

