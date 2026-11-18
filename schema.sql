-- BoardEase schema (mirrors existing Supabase/PostgreSQL tables)
-- Run in Supabase SQL editor. Tables assumed already exist per migrations; this is the reference DDL.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id bigserial primary key,
  supabase_uid text unique,
  name text not null,
  email text not null unique,
  phone text,
  password text not null,
  role text not null default 'tenant' check (role in ('super_admin','landlord','caretaker','tenant')),
  avatar_url text,
  email_verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.properties (
  id bigserial primary key,
  owner_id bigint not null references public.users(id) on delete restrict,
  name text not null,
  slug text not null unique,
  address text not null,
  city text not null,
  description text,
  house_rules text,
  cover_image_url text,
  gcash_number text,
  maya_number text,
  bank_details text,
  status text not null default 'pending_approval' check (status in ('pending_approval','active','suspended')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists properties_owner_status_idx on public.properties(owner_id, status);

create table if not exists public.property_staff (
  id bigserial primary key,
  property_id bigint not null references public.properties(id) on delete cascade,
  user_id bigint not null references public.users(id) on delete cascade,
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(property_id, user_id)
);

create table if not exists public.rooms (
  id bigserial primary key,
  property_id bigint not null references public.properties(id) on delete cascade,
  room_number text not null,
  name text not null,
  floor_level text,
  room_type text not null check (room_type in ('solo','shared','bedspace')),
  capacity int not null,
  monthly_rate numeric(10,2) not null,
  amenities jsonb not null default '[]'::jsonb,
  description text,
  image_url text,
  status text not null default 'available' check (status in ('available','full','maintenance')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(property_id, room_number)
);
create index if not exists rooms_property_status_idx on public.rooms(property_id, status);

create table if not exists public.bed_spaces (
  id bigserial primary key,
  room_id bigint not null references public.rooms(id) on delete cascade,
  bed_code text not null,
  position text not null check (position in ('upper_deck','lower_deck','single')),
  monthly_rate numeric(10,2) not null,
  status text not null default 'available' check (status in ('available','occupied','reserved','maintenance')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(room_id, bed_code)
);
create index if not exists bed_spaces_room_status_idx on public.bed_spaces(room_id, status);

create table if not exists public.reservations (
  id bigserial primary key,
  reservation_code text not null unique,
  property_id bigint not null references public.properties(id) on delete cascade,
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  room_id bigint not null references public.rooms(id) on delete restrict,
  bed_space_id bigint references public.bed_spaces(id) on delete set null,
  preferred_move_in_date date not null,
  notes text,
  valid_id_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','converted')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists reservations_property_status_idx on public.reservations(property_id, status);

create table if not exists public.leases (
  id bigserial primary key,
  lease_number text not null unique,
  property_id bigint not null references public.properties(id) on delete cascade,
  tenant_id bigint not null references public.users(id) on delete restrict,
  room_id bigint not null references public.rooms(id) on delete restrict,
  bed_space_id bigint references public.bed_spaces(id) on delete set null,
  start_date date not null,
  end_date date not null,
  monthly_rent numeric(10,2) not null,
  security_deposit numeric(10,2) not null,
  deposit_status text not null default 'unpaid' check (deposit_status in ('unpaid','paid','refunded')),
  status text not null default 'active' check (status in ('active','expiring_soon','terminated','completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists leases_property_status_idx on public.leases(property_id, status);
create index if not exists leases_tenant_status_idx on public.leases(tenant_id, status);

create table if not exists public.utility_readings (
  id bigserial primary key,
  property_id bigint not null references public.properties(id) on delete cascade,
  room_id bigint not null references public.rooms(id) on delete cascade,
  billing_month date not null,
  electric_prev numeric(10,2) not null,
  electric_curr numeric(10,2) not null,
  electric_rate numeric(10,4) not null,
  water_prev numeric(10,2) not null,
  water_curr numeric(10,2) not null,
  water_rate numeric(10,4) not null,
  total_utility_cost numeric(10,2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(property_id, room_id, billing_month)
);

create table if not exists public.invoices (
  id bigserial primary key,
  invoice_number text not null unique,
  property_id bigint not null references public.properties(id) on delete cascade,
  lease_id bigint not null references public.leases(id) on delete cascade,
  tenant_id bigint not null references public.users(id) on delete restrict,
  billing_month date not null,
  rent_amount numeric(10,2) not null,
  electric_share numeric(10,2) not null,
  water_share numeric(10,2) not null,
  other_fees numeric(10,2) not null,
  total_amount numeric(10,2) not null,
  due_date date not null,
  status text not null default 'unpaid' check (status in ('unpaid','pending_verification','paid','overdue')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists invoices_property_status_idx on public.invoices(property_id, status, due_date);
create index if not exists invoices_tenant_status_idx on public.invoices(tenant_id, status);

create table if not exists public.payments (
  id bigserial primary key,
  reference_number text not null unique,
  property_id bigint not null references public.properties(id) on delete cascade,
  invoice_id bigint not null references public.invoices(id) on delete cascade,
  tenant_id bigint not null references public.users(id) on delete restrict,
  amount_paid numeric(10,2) not null,
  payment_method text not null check (payment_method in ('gcash','maya','bank_transfer','cash')),
  proof_image_url text,
  payment_date timestamptz not null,
  verified_by bigint references public.users(id) on delete set null,
  verified_at timestamptz,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists payments_property_status_idx on public.payments(property_id, status);
create index if not exists payments_tenant_status_idx on public.payments(tenant_id, status);

create table if not exists public.maintenance_tickets (
  id bigserial primary key,
  ticket_number text not null unique,
  property_id bigint not null references public.properties(id) on delete cascade,
  tenant_id bigint not null references public.users(id) on delete restrict,
  room_id bigint not null references public.rooms(id) on delete restrict,
  category text not null check (category in ('plumbing','electrical','internet','furniture','other')),
  title text not null,
  description text not null,
  photo_url text,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'pending' check (status in ('pending','in_progress','resolved')),
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists tickets_property_status_idx on public.maintenance_tickets(property_id, status, priority);

create table if not exists public.announcements (
  id bigserial primary key,
  property_id bigint not null references public.properties(id) on delete cascade,
  author_id bigint not null references public.users(id) on delete restrict,
  title text not null,
  content text not null,
  priority text not null default 'normal' check (priority in ('normal','urgent')),
  is_published boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists announcements_property_idx on public.announcements(property_id, is_published, priority);

create table if not exists public.activity_logs (
  id bigserial primary key,
  property_id bigint references public.properties(id) on delete set null,
  user_id bigint references public.users(id) on delete set null,
  action text not null,
  description text not null,
  ip_address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists activity_logs_property_idx on public.activity_logs(property_id, created_at);
create index if not exists activity_logs_user_idx on public.activity_logs(user_id, created_at);

-- Storage bucket (create in Supabase dashboard or via API): boardease-uploads
-- Suggested RLS: enable RLS and scope reads/writes by role and property ownership in production.
