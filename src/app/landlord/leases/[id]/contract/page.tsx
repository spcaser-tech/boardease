import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeaseContractPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile(); if (!profile) redirect("/login");
  const { id } = await params;
  const supabase = await createClient();
  const { data: lease } = await supabase.from("leases").select("*, users!leases_tenant_id_fkey(name,email,phone), properties(*), rooms(room_number,name,room_type)").eq("id", Number(id)).maybeSingle();
  if (!lease) notFound();
  const l: any = lease;
  return (
    <div className="mx-auto max-w-3xl bg-white p-8 print:p-0">
      <div className="no-print mb-4 flex justify-end"><a href="javascript:window.print()" className="rounded-lg bg-primary px-4 py-2 text-sm text-white">Print</a></div>
      <div className="border border-slate-300 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">BoardEase Digital Lease Contract</h1>
          <p className="text-sm text-slate-500">Lease No: {l.lease_number}</p>
        </div>
        <hr className="my-6" />
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div><div className="font-semibold">Property</div><div>{l.properties?.name}</div><div className="text-slate-600">{l.properties?.address}, {l.properties?.city}</div></div>
          <div><div className="font-semibold">Tenant</div><div>{l.users?.name}</div><div className="text-slate-600">{l.users?.email} · {l.users?.phone||""}</div></div>
          <div><div className="font-semibold">Room</div><div>Room {l.rooms?.room_number} — {l.rooms?.name} ({l.rooms?.room_type})</div></div>
          <div><div className="font-semibold">Term</div><div>{l.start_date} to {l.end_date}</div></div>
          <div><div className="font-semibold">Monthly Rent</div><div>{formatCurrency(l.monthly_rent)}</div></div>
          <div><div className="font-semibold">Security Deposit</div><div>{formatCurrency(l.security_deposit)} ({l.deposit_status})</div></div>
          <div><div className="font-semibold">Status</div><div className="capitalize">{l.status}</div></div>
        </div>
        <div className="mt-6">
          <div className="font-semibold">House Rules</div>
          <pre className="mt-1 whitespace-pre-wrap font-sans text-sm text-slate-700">{l.properties?.house_rules || "—"}</pre>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-8 pt-8 text-sm">
          <div className="border-t border-slate-400 pt-2 text-center">Landlord/Caretaker Signature</div>
          <div className="border-t border-slate-400 pt-2 text-center">Tenant Signature</div>
        </div>
      </div>
    </div>
  );
}
