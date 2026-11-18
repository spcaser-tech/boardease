import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Card, PageHeader, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

async function addAnnouncement(formData: FormData) {
  "use server";
  const profile = await getCurrentProfile(); if (!profile) return;
  const supabase = await createClient();
  await supabase.from("announcements").insert({
    property_id: Number(formData.get("property_id")), author_id: profile.id,
    title: String(formData.get("title")), content: String(formData.get("content")),
    priority: String(formData.get("priority")), is_published: true,
  } as any);
  revalidatePath("/landlord/announcements");
}

export default async function AnnouncementsPage() {
  const profile = await getCurrentProfile(); if (!profile) redirect("/login");
  const supabase = await createClient();
  const { data: props } = await supabase.from("properties").select("id,name").eq("owner_id", profile.id);
  const ids = (props||[]).map((p:any)=>p.id);
  const { data: items } = ids.length ? await supabase.from("announcements").select("*, properties(name)").in("property_id", ids).order("created_at",{ascending:false}) : { data: [] as any[] };
  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" subtitle="Post property-wide bulletins to tenants." />
      <Card>
        <form action={addAnnouncement} className="grid gap-3 sm:grid-cols-2">
          <select name="property_id" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm">{(props||[]).map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select name="priority" className="h-10 rounded-lg border border-slate-200 px-3 text-sm"><option value="normal">Normal</option><option value="urgent">Urgent</option></select>
          <input name="title" placeholder="Title" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm sm:col-span-2" />
          <textarea name="content" placeholder="Content" required rows={3} className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
          <button className="sm:col-span-2 h-10 rounded-lg bg-primary text-white font-medium">Publish Announcement</button>
        </form>
      </Card>
      <div className="grid gap-3">
        {(items||[]).map((a:any)=>(
          <Card key={a.id}>
            <div className="flex items-center justify-between"><div className="font-semibold">{a.title}</div><Badge tone={a.priority==="urgent"?"danger":"default"}>{a.priority}</Badge></div>
            <div className="text-xs text-slate-500 mt-1">{a.properties?.name} · {new Date(a.created_at).toLocaleString()}</div>
            <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{a.content}</p>
          </Card>
        ))}
        {(!items||items.length===0)&&<Card><p className="text-sm text-slate-500">No announcements.</p></Card>}
      </div>
    </div>
  );
}
