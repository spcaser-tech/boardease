import { createAdminClient } from "@/lib/supabase/admin";
import { Card, PageHeader, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const admin = createAdminClient();
  const { data: users } = await admin.from("users").select("id,name,email,role,phone,created_at").order("created_at", { ascending: false }).limit(200);
  return (
    <div>
      <PageHeader title="User Management" subtitle="All platform users" />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500"><tr><th className="py-2">Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th></tr></thead>
            <tbody>
              {(users||[]).map((u:any)=>(<tr key={u.id} className="border-t border-slate-100"><td className="py-2 font-medium">{u.name}</td><td>{u.email}</td><td>{u.phone||"—"}</td><td><Badge tone={u.role==="super_admin"?"danger":u.role==="landlord"?"info":"default"}>{u.role}</Badge></td><td>{new Date(u.created_at).toLocaleDateString()}</td></tr>))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
