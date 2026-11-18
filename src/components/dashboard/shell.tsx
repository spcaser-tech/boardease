import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LayoutDashboard, Building2, Users, BedDouble, CalendarCheck, FileText, Wrench, CreditCard, BarChart3, Megaphone, Gauge, LogOut, ShieldCheck } from "lucide-react";

function NavLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900">
      <Icon size={16} /> {label}
    </Link>
  );
}

export async function DashboardShell({ children, role }: { children: React.ReactNode; role: "super_admin" | "landlord" | "caretaker" | "tenant" }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  const landlordLinks = [
    ["/landlord/dashboard", LayoutDashboard, "Dashboard"],
    ["/landlord/properties", Building2, "Properties"],
    ["/landlord/staff", Users, "Caretakers"],
    ["/landlord/rooms", BedDouble, "Rooms & Beds"],
    ["/landlord/reservations", CalendarCheck, "Reservations"],
    ["/landlord/tenants", Users, "Tenants"],
    ["/landlord/leases", FileText, "Leases"],
    ["/landlord/utilities", Gauge, "Utilities"],
    ["/landlord/invoices", FileText, "Invoices"],
    ["/landlord/payments", CreditCard, "Payments"],
    ["/landlord/reports", BarChart3, "Reports"],
    ["/landlord/tickets", Wrench, "Maintenance"],
    ["/landlord/announcements", Megaphone, "Announcements"],
  ] as const;
  const tenantLinks = [
    ["/tenant/dashboard", LayoutDashboard, "Dashboard"],
    ["/tenant/invoices", FileText, "My Bills"],
    ["/tenant/tickets", Wrench, "Maintenance"],
    ["/tenant/lease", FileText, "My Lease"],
  ] as const;
  const adminLinks = [
    ["/super-admin", LayoutDashboard, "Overview"],
    ["/super-admin/users", Users, "Users"],
  ] as const;

  const links = role === "super_admin" ? adminLinks : role === "tenant" ? tenantLinks : landlordLinks;
  const home = role === "super_admin" ? "/super-admin" : role === "tenant" ? "/tenant/dashboard" : "/landlord/dashboard";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
          <Link href={home} className="flex h-16 items-center gap-2 border-b border-slate-200 px-4 font-semibold text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-white text-sm">B</span> BoardEase
          </Link>
          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {links.map(([href, Icon, label]) => <NavLink key={href} href={href} icon={Icon} label={label} />)}
          </nav>
          <div className="border-t border-slate-200 p-3">
            <div className="mb-2 px-3 text-xs text-slate-500">{profile.name}<br/><span className="capitalize">{profile.role}</span></div>
            <form action={signOut}><button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"><LogOut size={16}/> Sign out</button></form>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-6">
            <Link href={home} className="font-semibold text-slate-900 md:hidden">BoardEase</Link>
            <div className="ml-auto flex items-center gap-3 text-sm text-slate-600"><ShieldCheck size={16} className="text-primary" /> {profile.role.replace("_"," ")}</div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
