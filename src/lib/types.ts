export type UserRole = "super_admin" | "landlord" | "caretaker" | "tenant";

export type PropertyStatus = "pending_approval" | "active" | "suspended";
export type RoomType = "solo" | "shared" | "bedspace";
export type RoomStatus = "available" | "full" | "maintenance";
export type BedPosition = "upper_deck" | "lower_deck" | "single";
export type BedStatus = "available" | "occupied" | "reserved" | "maintenance";
export type ReservationStatus = "pending" | "approved" | "rejected" | "converted";
export type LeaseStatus = "active" | "expiring_soon" | "terminated" | "completed";
export type DepositStatus = "unpaid" | "paid" | "refunded";
export type InvoiceStatus = "unpaid" | "pending_verification" | "paid" | "overdue";
export type PaymentMethod = "gcash" | "maya" | "bank_transfer" | "cash";
export type PaymentStatus = "pending" | "approved" | "rejected";
export type TicketCategory = "plumbing" | "electrical" | "internet" | "furniture" | "other";
export type TicketPriority = "low" | "medium" | "high";
export type TicketStatus = "pending" | "in_progress" | "resolved";
export type AnnouncementPriority = "normal" | "urgent";

export interface User {
  id: number;
  supabase_uid: string | null;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: number;
  owner_id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  description: string | null;
  house_rules: string | null;
  cover_image_url: string | null;
  gcash_number: string | null;
  maya_number: string | null;
  bank_details: string | null;
  status: PropertyStatus;
  created_at: string;
  updated_at: string;
}

export interface PropertyStaff {
  id: number;
  property_id: number;
  user_id: number;
  permissions: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: number;
  property_id: number;
  room_number: string;
  name: string;
  floor_level: string | null;
  room_type: RoomType;
  capacity: number;
  monthly_rate: number;
  amenities: string[];
  description: string | null;
  image_url: string | null;
  status: RoomStatus;
  created_at: string;
  updated_at: string;
}

export interface BedSpace {
  id: number;
  room_id: number;
  bed_code: string;
  position: BedPosition;
  monthly_rate: number;
  status: BedStatus;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: number;
  reservation_code: string;
  property_id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  room_id: number;
  bed_space_id: number | null;
  preferred_move_in_date: string;
  notes: string | null;
  valid_id_url: string | null;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
}

export interface Lease {
  id: number;
  lease_number: string;
  property_id: number;
  tenant_id: number;
  room_id: number;
  bed_space_id: number | null;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  security_deposit: number;
  deposit_status: DepositStatus;
  status: LeaseStatus;
  created_at: string;
  updated_at: string;
}

export interface UtilityReading {
  id: number;
  property_id: number;
  room_id: number;
  billing_month: string;
  electric_prev: number;
  electric_curr: number;
  electric_rate: number;
  water_prev: number;
  water_curr: number;
  water_rate: number;
  total_utility_cost: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  property_id: number;
  lease_id: number;
  tenant_id: number;
  billing_month: string;
  rent_amount: number;
  electric_share: number;
  water_share: number;
  other_fees: number;
  total_amount: number;
  due_date: string;
  status: InvoiceStatus;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  reference_number: string;
  property_id: number;
  invoice_id: number;
  tenant_id: number;
  amount_paid: number;
  payment_method: PaymentMethod;
  proof_image_url: string | null;
  payment_date: string;
  verified_by: number | null;
  verified_at: string | null;
  status: PaymentStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceTicket {
  id: number;
  ticket_number: string;
  property_id: number;
  tenant_id: number;
  room_id: number;
  category: TicketCategory;
  title: string;
  description: string;
  photo_url: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: number;
  property_id: number;
  author_id: number;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  property_id: number | null;
  user_id: number | null;
  action: string;
  description: string;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: { Row: User; Insert: Partial<User> & Pick<User, "name" | "email" | "role">; Update: Partial<User> };
      properties: { Row: Property; Insert: Partial<Property> & Pick<Property, "owner_id" | "name" | "slug" | "address" | "city">; Update: Partial<Property> };
      property_staff: { Row: PropertyStaff; Insert: Partial<PropertyStaff> & Pick<PropertyStaff, "property_id" | "user_id">; Update: Partial<PropertyStaff> };
      rooms: { Row: Room; Insert: Partial<Room> & Pick<Room, "property_id" | "room_number" | "name" | "room_type" | "capacity" | "monthly_rate">; Update: Partial<Room> };
      bed_spaces: { Row: BedSpace; Insert: Partial<BedSpace> & Pick<BedSpace, "room_id" | "bed_code" | "position" | "monthly_rate">; Update: Partial<BedSpace> };
      reservations: { Row: Reservation; Insert: Partial<Reservation> & Pick<Reservation, "reservation_code" | "property_id" | "guest_name" | "guest_email" | "guest_phone" | "room_id" | "preferred_move_in_date">; Update: Partial<Reservation> };
      leases: { Row: Lease; Insert: Partial<Lease> & Pick<Lease, "lease_number" | "property_id" | "tenant_id" | "room_id" | "start_date" | "end_date" | "monthly_rent" | "security_deposit">; Update: Partial<Lease> };
      utility_readings: { Row: UtilityReading; Insert: Partial<UtilityReading> & Pick<UtilityReading, "property_id" | "room_id" | "billing_month" | "electric_prev" | "electric_curr" | "electric_rate" | "water_prev" | "water_curr" | "water_rate" | "total_utility_cost">; Update: Partial<UtilityReading> };
      invoices: { Row: Invoice; Insert: Partial<Invoice> & Pick<Invoice, "invoice_number" | "property_id" | "lease_id" | "tenant_id" | "billing_month" | "rent_amount" | "electric_share" | "water_share" | "other_fees" | "total_amount" | "due_date">; Update: Partial<Invoice> };
      payments: { Row: Payment; Insert: Partial<Payment> & Pick<Payment, "reference_number" | "property_id" | "invoice_id" | "tenant_id" | "amount_paid" | "payment_method" | "payment_date">; Update: Partial<Payment> };
      maintenance_tickets: { Row: MaintenanceTicket; Insert: Partial<MaintenanceTicket> & Pick<MaintenanceTicket, "ticket_number" | "property_id" | "tenant_id" | "room_id" | "category" | "title" | "description">; Update: Partial<MaintenanceTicket> };
      announcements: { Row: Announcement; Insert: Partial<Announcement> & Pick<Announcement, "property_id" | "author_id" | "title" | "content">; Update: Partial<Announcement> };
      activity_logs: { Row: ActivityLog; Insert: Partial<ActivityLog> & Pick<ActivityLog, "action" | "description">; Update: Partial<ActivityLog> };
    };
  };
}
