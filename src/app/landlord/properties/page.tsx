import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Card, PageHeader } from "@/components/ui";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function createProperty(formData: FormData) {
  "use server";
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const supabase = await createClient();
  const name = String(formData.get("name")||"");
  await supabase.from("properties").insert({
    owner_id: profile.id, name, slug: slugify(name)+"-"+Math.random().toString(36).slice(2,6),
    address: String(formData.get("address")||""), city: String(formData.get("city")||""),
    description: String(formData.get("description")||"") || null,
    gcash_number: String(formData.get("gcash_number")||"") || null,
    maya_number: String(formData.get("maya_number")||"") || null,
    bank_details: String(formData.get("bank_details")||"") || null,
    house_rules: String(formData.get("house_rules")||"") || null,
    status: "pending_approval",
  } as any);
  revalidatePath("/landlord/properties");
}

export default async function PropertiesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const supabase = await createClient();
  const { data: properties } = await supabase.from("properties").select("*").eq("owner_id", profile.id).order("created_at",{ascending:false});
  return (
    <div className="space-y-6">
      <PageHeader title="Properties" subtitle="Manage your boarding house profiles and payment details." />
      <Card>
        <h2 className="mb-3 font-semibold">Add Property</h2>
        <form action={createProperty} className="grid gap-3 sm:grid-cols-2">
          <input name="name" placeholder="Property name" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input name="city" placeholder="City" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input name="address" placeholder="Address" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm sm:col-span-2" />
          <input name="gcash_number" placeholder="GCash number" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <input name="maya_number" placeholder="Maya number" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <textarea name="description" placeholder="Description" className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
          <textarea name="house_rules" placeholder="House rules" className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
          <textarea name="bank_details" placeholder="Bank details" className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
          <button className="sm:col-span-2 h-10 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark">Create Property</button>
        </form>
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">Your Properties</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead className="text-left text-slate-500"><tr><th className="py-2">Name</th><th>City</th><th>Status</th><th>GCash</th><th>Maya</th></tr></thead>
            <tbody>
              {(properties||[]).map((p:any)=>(<tr key={p.id} className="border-t border-slate-100"><td className="py-2 font-medium">{p.name}</td><td>{p.city}</td><td className="capitalize">{p.status.replaceAll("_"," ")}</td><td>{p.gcash_number||"—"}</td><td>{p.maya_number||"—"}</td></tr>))}
              {(!properties||properties.length===0)&&<tr><td colSpan={5} className="py-6 text-center text-slate-500">No properties yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
