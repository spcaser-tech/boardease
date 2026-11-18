import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

async function addStaff(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const email = String(formData.get("email")||"");
  const property_id = Number(formData.get("property_id"));
  const { data: user } = await supabase.from("users").select("id").eq("email", email).eq("role","caretaker").maybeSingle();
  if (user) {
    await supabase.from("property_staff").insert({ property_id, user_id: (user as any).id, permissions: { manage_rooms: true, manage_maintenance: true } } as any);
  }
  revalidatePath("/landlord/staff");
}

export default async function StaffPage() {
  const profile = await getCurrentProfile(); if (!profile) redirect("/login");
  const supabase = await createClient();
  const { data: properties } = await supabase.from("properties").select("id,name").eq("owner_id", profile.id);
  const propIds = (properties||[]).map((p:any)=>p.id);
  const { data: staff } = propIds.length ? await supabase.from("property_staff").select("*, users(name,email), properties(name)").in("property_id", propIds) : { data: [] as any[] };
  return (
    <div className="space-y-6">
      <PageHeader title="Caretaker Management" subtitle="Assign caretakers and permissions per property." />
      <Card>
        <form action={addStaff} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <select name="property_id" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm">{(properties||[]).map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <input name="email" type="email" placeholder="Caretaker email (must be registered)" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <button className="h-10 rounded-lg bg-primary px-4 text-white font-medium">Assign</button>
        </form>
      </Card>
      <Card>
        <table className="w-full text-sm"><thead className="text-left text-slate-500"><tr><th className="py-2">Caretaker</th><th>Email</th><th>Property</th></tr></thead>
          <tbody>{(staff||[]).map((s:any)=>(<tr key={s.id} className="border-t border-slate-100"><td className="py-2 font-medium">{s.users?.name}</td><td>{s.users?.email}</td><td>{s.properties?.name}</td></tr>))}{(!staff||staff.length===0)&&<tr><td colSpan={3} className="py-6 text-center text-slate-500">No caretakers assigned.</td></tr>}</tbody>
        </table>
      </Card>
    </div>
  );
}
