# BoardEase

Web-based Boarding House Rental Management System with Online Reservation, Tenant Management, Payment Monitoring, and an integrated AI Chatbot Assistant.

**Stack:** Next.js (App Router, TypeScript) · React · Tailwind CSS v4 · Supabase (Auth, PostgreSQL, Storage) · Google Gemini (`gemini-2.5-flash`) · Vercel-ready

## Features

- **Public landing page** (poster-spec): hero with kicker/headline/CTAs, floating search & filter bar, feature highlights, dashboard mockup cards (01 Smart Dashboard, 02 Payments & Dues Tracking, 03 Tenant Management Portal), room catalog, reservation status checker, footer badges + QR placeholder.
- **Online reservation:** browse active rooms, reserve with move-in date/bed space/valid ID upload, track via `reservation_code` + email.
- **Auth & RBAC (Supabase Auth + middleware):** `super_admin`, `landlord`, `caretaker`, `tenant` routed to `/super-admin`, `/landlord/*`, `/tenant/*`.
- **Owner onboarding:** `/register-owner` creates landlord profile + initial property (pending approval).
- **Super Admin:** platform KPIs (properties/landlords/tenants/occupancy), property approval queue, user management.
- **Landlord/Caretaker portal:** property switcher, smart dashboard (KPIs + visual room map), property profiles & payment details, caretaker/staff assignments, rooms & bed-space CRUD, reservation approval/rejection (converts to tenant + lease and marks bed occupied), tenant/lease management + printable lease contract, utility sub-meter readings (`(curr-prev)*rate`) and monthly invoice generation (rent + room utility split), payment proof verification (approve/reject with notes), financial reports with CSV export, maintenance tickets, announcements.
- **Tenant portal:** dashboard (lease/unpaid/announcements/quick actions), itemized bills with landlord payment details + receipt download + proof upload, maintenance requests with photo, lease contract & house rules view.
- **AI Chatbot Assistant:** floating widget (`/api/chat`, Gemini 2.5 Flash) with context-aware, read-only tools — `SearchAvailableRoomsTool` (public), `GetTenantBillingSummaryTool` (tenant-scoped invoices/tickets), `GetLandlordSummaryTool` (landlord/caretaker-scoped collection/occupancy).

## Project structure

```text
.
├─ schema.sql                         # Supabase/PostgreSQL DDL reference (mirrors existing tables)
├─ .env.example                       # Environment template
├─ .env.local                         # Local environment (configure keys)
├─ src/
│  ├─ middleware.ts                   # Auth session refresh + RBAC route protection
│  ├─ app/
│  │  ├─ layout.tsx, globals.css, page.tsx
│  │  ├─ login/ register/ register-owner/
│  │  ├─ reserve/[roomId]/            # Public reservation form + ID upload
│  │  ├─ reservations/check/          # Reservation status checker
│  │  ├─ api/chat/route.ts            # Gemini chatbot API with scoped tools
│  │  ├─ super-admin/                 # Overview + users
│  │  ├─ landlord/                    # Dashboard, properties, staff, rooms, reservations,
│  │  │                               # tenants, leases(+contract), utilities, invoices,
│  │  │                               # payments, reports, tickets, announcements
│  │  └─ tenant/                      # Dashboard, invoices+payment upload, tickets, lease
│  ├─ components/
│  │  ├─ layout/site-shell.tsx        # Public header/footer (poster spec)
│  │  ├─ dashboard/shell.tsx          # Role-based dashboard shell/sidebar
│  │  ├─ chat/chat-widget.tsx         # Floating AI Chatbot Assistant
│  │  └─ ui/index.tsx                 # Shared UI primitives
│  └─ lib/
│     ├─ types.ts                     # DB/domain types matching schema
│     ├─ utils.ts, auth.ts
│     └─ supabase/                    # client.ts, server.ts, admin.ts, middleware.ts
└─ public/
```

## Database (existing schema)

Application targets the existing Supabase PostgreSQL schema (tables): `users`, `properties`, `property_staff`, `rooms`, `bed_spaces`, `reservations`, `leases`, `utility_readings`, `invoices`, `payments`, `maintenance_tickets`, `announcements`, `activity_logs`. See `schema.sql` for the reference DDL.

Uploads (property/room photos, valid IDs, payment proofs, ticket photos) use Supabase Storage bucket **`boardease-uploads`** (public read or signed URLs as configured).

## Setup

1. **Install**
   ```bash
   npm install
   ```

2. **Environment** — copy and fill `.env.example` → `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   DATABASE_URL=postgresql://postgres.<ref>:<password>@<pooler-host>:5432/postgres
   GEMINI_API_KEY=<google-gemini-api-key>
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
   - Anon/service keys are from your Supabase project (API settings). `DATABASE_URL` is the session pooler connection string.
   - `GEMINI_API_KEY` powers the AI chatbot (`gemini-2.5-flash`); without it the widget returns a configuration notice.

3. **Supabase**
   - Ensure the schema above exists (run `schema.sql` in SQL editor if needed).
   - Create Storage bucket `boardease-uploads` and configure policies for uploads/reads.
   - Configure Auth (email/password). For frictionless local testing you may disable email confirmation in Supabase Auth settings; otherwise handle confirmation emails.
   - Recommended: enable RLS policies to enforce per-role/property data isolation in production (middleware and server-side checks are included; RLS should be the source-of-truth guard).

4. **Run**
   ```bash
   npm run dev    # http://localhost:3000
   npm run build  # production build
   npm start
   ```

## Deploy (Vercel)

- Zero-config: import the repo in Vercel, set the environment variables above, and deploy.
- `turbopack.root` is set in `next.config.ts` for monorepo/lockfile-safe builds.

## Notes

- Reservation approval (landlord) converts a reservation into a `tenant` profile record (matched/created by email), marks the bed occupied (if selected), and creates an active `lease`. Tenants must have a Supabase Auth account linked by `users.supabase_uid` for portal access; in production, wire an invite/magic-link flow on approval.
- Invoice generation splits room `utility_readings.total_utility_cost` equally across active leases in the room for the billing month plus `other_fees`.
- Some lint rules are relaxed (`@typescript-eslint/no-explicit-any`) to accommodate dynamic Supabase query shapes; TypeScript strict mode remains enabled and `next build` passes.