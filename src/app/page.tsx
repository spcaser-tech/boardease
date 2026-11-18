import { SiteHeader, SiteFooter } from "@/components/layout/site-shell";
import { createAdminClient } from "@/lib/supabase/admin";
import { Search, Play, MapPin, Calendar, Home, Wallet, BarChart3, Users, Shield, Cloud, Smartphone, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ city?: string; room_type?: string; budget?: string; q?: string }> }) {
  const sp = await searchParams;
  const admin = createAdminClient();

  let roomQuery = admin
    .from("rooms")
    .select("id, room_number, name, room_type, monthly_rate, status, capacity, amenities, image_url, properties!inner(id,name,city,slug,status,cover_image_url,description)")
    .eq("status", "available")
    .eq("properties.status", "active")
    .order("created_at", { ascending: false })
    .limit(12);
  if (sp.city) roomQuery = roomQuery.ilike("properties.city", `%${sp.city}%`);
  if (sp.room_type) roomQuery = roomQuery.eq("room_type", sp.room_type);
  if (sp.budget) roomQuery = roomQuery.lte("monthly_rate", Number(sp.budget));
  const { data: rooms } = await roomQuery;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-rose-50/40 to-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
            <div>
              <div className="mb-3 text-xs font-semibold tracking-[0.2em] text-primary">YOUR HOME, YOUR COMMUNITY</div>
              <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
                Find Your Perfect Boarding House <span className="text-primary">Feel Like Home</span>
              </h1>
              <p className="mt-4 max-w-xl text-lg text-slate-600">
                Discover comfortable, affordable, and safe boarding houses near you. Live better, study better, achieve more.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#rooms" className="inline-flex h-12 items-center rounded-lg bg-primary px-6 font-medium text-white hover:bg-primary-dark">Browse Rooms</a>
                <a href="#how" className="inline-flex h-12 items-center gap-2 rounded-lg border border-slate-200 bg-white px-6 font-medium text-slate-700 hover:bg-slate-50">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary"><Play size={14} /></span> Watch Video
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xl">
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-rose-100 text-slate-500">
                  <div className="text-center p-8">
                    <Home className="mx-auto mb-3 h-16 w-16 text-primary/50" />
                    <div className="text-sm">Modern multi-story boarding house</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 rounded-xl border border-white/60 bg-white/80 p-4 shadow-lg backdrop-blur">
                <div className="text-xs text-slate-500">Trusted by owners & tenants</div>
                <div className="text-lg font-semibold text-slate-900">BoardEase Platform</div>
              </div>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="mx-auto -mb-10 max-w-6xl px-4 sm:px-6 lg:px-8">
            <form action="/#rooms" className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg md:grid-cols-5">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3">
                <MapPin size={16} className="text-slate-400" />
                <input name="city" defaultValue={sp.city || ""} placeholder="Location" className="h-10 w-full bg-transparent text-sm outline-none" />
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3">
                <Calendar size={16} className="text-slate-400" />
                <input type="date" name="move_in" className="h-10 w-full bg-transparent text-sm outline-none text-slate-600" />
              </div>
              <select name="room_type" defaultValue={sp.room_type || ""} className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-700">
                <option value="">Any type</option>
                <option value="solo">Solo</option>
                <option value="shared">Shared</option>
                <option value="bedspace">Bedspace</option>
              </select>
              <select name="budget" defaultValue={sp.budget || ""} className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-700">
                <option value="">Any budget</option>
                <option value="3000">Up to ₱3,000</option>
                <option value="5000">Up to ₱5,000</option>
                <option value="8000">Up to ₱8,000</option>
                <option value="12000">Up to ₱12,000</option>
              </select>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark">
                <Search size={16} /> Search Rooms
              </button>
            </form>
          </div>
        </section>

        {/* FEATURE HIGHLIGHTS */}
        <section id="about" className="bg-white pt-24 pb-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold text-slate-900">Core Modules & Features</h2>
              <p className="mt-2 text-slate-600">Everything you need to run a modern boarding house business.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: BarChart3, title: "Smart Dashboard", a: "View key metrics and business overview", b: "Monitor occupancy, revenue, and important activities in real-time" },
                { icon: Home, title: "Room & Tenant Management", a: "Organize rooms and tenants information", b: "Easily manage room, tenants, leases, and reservation in one place" },
                { icon: Wallet, title: "Payments & Dues Tracking", a: "Track payments and dues", b: "Track payments, dues, and generate reports with just a few clicks" },
                { icon: BarChart3, title: "Reports & Analytics", a: "View key metrics and business overview", b: "Generate financial and collection reports" },
              ].map((f) => (
                <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><f.icon /></div>
                  <h3 className="font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{f.a}</p>
                  <p className="mt-1 text-sm text-slate-500">{f.b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DASHBOARD MOCKUPS 01-03 */}
        <section id="how" className="bg-slate-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-3">
              {[
                { n: "01", title: "SMART DASHBOARD", desc: "Real-time KPI summary cards, occupancy donut chart, revenue overview graphs, and live activity feeds." },
                { n: "02", title: "PAYMENTS & DUES TRACKING", desc: "Ledger tables tracking tenant dues, payment statuses, and instant report generation tools." },
                { n: "03", title: "TENANT MANAGEMENT PORTAL", desc: "Unified portal organizing room assignments, tenant profiles, active leases, and online reservations." },
              ].map((c) => (
                <div key={c.n} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="absolute -right-4 -top-4 grid h-16 w-16 place-items-center rounded-full bg-primary text-xl font-bold text-white">{c.n}</div>
                  <h3 className="pr-10 text-lg font-semibold text-slate-900">{c.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{c.desc}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="h-20 rounded-lg bg-slate-100" />
                    <div className="h-20 rounded-lg bg-rose-50" />
                    <div className="col-span-2 h-24 rounded-lg bg-slate-50 border border-dashed border-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROOMS CATALOG */}
        <section id="rooms" className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Available Rooms</h2>
                <p className="mt-1 text-slate-600">Browse active listings from verified boarding houses.</p>
              </div>
              <Link href="/reservations/check" className="text-sm font-medium text-primary hover:underline">Check reservation status</Link>
            </div>
            {(!rooms || rooms.length === 0) ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">No available rooms match your filters right now.</div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(rooms as any[]).map((r) => (
                  <div key={r.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="h-40 bg-gradient-to-br from-slate-100 to-rose-50 grid place-items-center text-slate-400"><Home /></div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-900">{r.name} · {r.properties?.name}</div>
                          <div className="text-sm text-slate-500">{r.properties?.city} · Room {r.room_number}</div>
                        </div>
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 capitalize">{r.room_type}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {(r.amenities || []).slice(0, 4).map((a: string) => <span key={a} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{a}</span>)}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-lg font-semibold text-primary">₱{Number(r.monthly_rate).toLocaleString()}<span className="text-sm font-normal text-slate-500">/mo</span></div>
                        <Link href={`/reserve/${r.id}`} className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark">Reserve</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* AMENITIES / CTA */}
        <section id="amenities" className="bg-primary py-14 text-white">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold">List Your Boarding House on BoardEase</h2>
            <p className="mt-2 text-white/90">Reach more tenants, manage reservations, billing, and maintenance in one place.</p>
            <Link href="/register-owner" className="mt-6 inline-flex h-12 items-center rounded-lg bg-white px-6 font-medium text-primary hover:bg-rose-50">List Your Boarding House</Link>
          </div>
        </section>

        {/* Reservation status quick check */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-slate-200 p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Check Reservation Status</h3>
              <p className="mt-1 text-sm text-slate-600">Enter your reservation code and email to track your request.</p>
              <form action="/reservations/check" className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <input name="code" placeholder="Reservation code" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" required />
                <input name="email" type="email" placeholder="Email address" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" required />
                <button className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark">Check</button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
