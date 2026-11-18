import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Card, PageHeader, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

async function updateTicket(formData: FormData) {
  "use server";
  const supabase = await createClient();
  await supabase.from("maintenance_tickets").update({ status: String(formData.get("status")), admin_notes: String(formData.get("admin_notes")||"") || null } as never).eq("id", Number(formData.get("id")));
  revalidatePath("/landlord/tickets");
}

export default async function TicketsPage() {
  const profile = await getCurrentProfile(); if (!profile) redirect("/login");
  const supabase = await createClient();
  const { data: props } = await supabase.from("properties").select("id").eq("owner_id", profile.id);
  const ids = (props||[]).map((p:any)=>p.id);
  const { data: tickets } = ids.length ? await supabase.from("maintenance_tickets").select("*, users!maintenance_tickets_tenant_id_fkey(name), properties(name), rooms(room_number)").in("property_id", ids).order("created_at",{ascending:false}) : { data: [] as any[] };
  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance Tickets" subtitle="Track and resolve tenant repair requests." />
      <div className="grid gap-4">
        {(tickets||[]).map((t:any)=>(
          <Card key={t.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2"><span className="font-mono text-xs">{t.ticket_number}</span><Badge tone={t.status==="resolved"?"success":t.status==="in_progress"?"warning":"default"}>{t.status}</Badge><Badge tone={t.priority==="high"?"danger":t.priority==="medium"?"warning":"default"}>{t.priority}</Badge></div>
                <div className="mt-1 font-semibold">{t.title}</div>
                <div className="text-sm text-slate-600">{t.properties?.name} · Rm {t.rooms?.room_number} · {t.users?.name} · <span className="capitalize">{t.category}</span></div>
                <p className="mt-2 text-sm text-slate-700">{t.description}</p>
                {t.photo_url && <a href={t.photo_url} target="_blank" className="mt-2 inline-block text-sm text-primary underline">View photo</a>}
              </div>
              <form action={updateTicket} className="w-full max-w-sm space-y-2">
                <input type="hidden" name="id" value={t.id} />
                <select name="status" defaultValue={t.status} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm"><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select>
                <textarea name="admin_notes" defaultValue={t.admin_notes||""} placeholder="Admin notes" className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm" rows={2}/>
                <button className="h-9 rounded-lg bg-primary px-3 text-sm text-white">Update</button>
              </form>
            </div>
          </Card>
        ))}
        {(!tickets||tickets.length===0)&&<Card><p className="text-sm text-slate-500">No tickets.</p></Card>}
      </div>
    </div>
  );
}

