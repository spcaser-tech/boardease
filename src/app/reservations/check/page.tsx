import { SiteHeader, SiteFooter } from "@/components/layout/site-shell";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function ReservationCheckPage({ searchParams }: { searchParams: Promise<{ code?: string; email?: string }> }) {
  const sp = await searchParams;
  const code = sp.code?.trim();
  const email = sp.email?.trim();
  let reservation: any = null;
  let notFound = false;
  if (code && email) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("reservations")
      .select("*, properties(name,city), rooms(room_number,name)")
      .eq("reservation_code", code)
      .eq("guest_email", email)
      .maybeSingle();
    reservation = data;
    notFound = !data;
  }
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Reservation Status Checker</h1>
          <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input name="code" defaultValue={code || ""} placeholder="Reservation code" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" required />
            <input name="email" type="email" defaultValue={email || ""} placeholder="Email address" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" required />
            <button className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark">Check</button>
          </form>
          {notFound && <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">No reservation found for that code and email.</div>}
          {reservation && (
            <div className="mt-6 rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900">{reservation.reservation_code}</div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">{reservation.status}</span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-slate-500">Guest</dt><dd className="font-medium">{reservation.guest_name}</dd></div>
                <div><dt className="text-slate-500">Property</dt><dd className="font-medium">{reservation.properties?.name}</dd></div>
                <div><dt className="text-slate-500">Room</dt><dd className="font-medium">{reservation.rooms?.name} ({reservation.rooms?.room_number})</dd></div>
                <div><dt className="text-slate-500">Preferred move-in</dt><dd className="font-medium">{reservation.preferred_move_in_date}</dd></div>
              </dl>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
