import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes("REPLACE")) {
      return NextResponse.json({ reply: "AI is not configured yet. Please set `GEMINI_API_KEY` in the environment." });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let role: string | null = null;
    let profileId: number | null = null;
    if (user) {
      const { data: p } = await supabase.from("users").select("id, role").eq("supabase_uid", user.id).maybeSingle();
      role = (p as any)?.role ?? null;
      profileId = (p as any)?.id ?? null;
    }

    const admin = createAdminClient();
    const toolData: Record<string, unknown> = {};

    // SearchAvailableRoomsTool (public)
    const { data: rooms } = await admin
      .from("rooms")
      .select("id, room_number, name, room_type, monthly_rate, status, capacity, amenities, properties!inner(name, city, status)")
      .eq("status", "available")
      .eq("properties.status", "active")
      .limit(10);
    toolData.availableRooms = rooms ?? [];

    if (role === "tenant" && profileId) {
      const { data: invoices } = await admin.from("invoices").select("invoice_number,billing_month,total_amount,due_date,status").eq("tenant_id", profileId).order("created_at", { ascending: false }).limit(10);
      const { data: tickets } = await admin.from("maintenance_tickets").select("ticket_number,title,status,priority,created_at").eq("tenant_id", profileId).order("created_at", { ascending: false }).limit(10);
      toolData.tenantBilling = { invoices: invoices ?? [], tickets: tickets ?? [] };
    }

    if ((role === "landlord" || role === "caretaker") && profileId) {
      let propIds: number[] = [];
      if (role === "landlord") {
        const { data: ps } = await admin.from("properties").select("id,name").eq("owner_id", profileId);
        propIds = (ps ?? []).map((p: any) => p.id);
      } else {
        const { data: ps } = await admin.from("property_staff").select("property_id").eq("user_id", profileId);
        propIds = (ps ?? []).map((p: any) => p.property_id);
      }
      if (propIds.length) {
        const { data: inv } = await admin.from("invoices").select("status,total_amount").in("property_id", propIds);
        const { data: beds } = await admin.from("bed_spaces").select("status, room_id, rooms!inner(property_id)").in("rooms.property_id", propIds);
        const paid = (inv ?? []).filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.total_amount), 0);
        const unpaid = (inv ?? []).filter((i: any) => i.status !== "paid").reduce((s: number, i: any) => s + Number(i.total_amount), 0);
        const totalBeds = (beds ?? []).length;
        const occ = (beds ?? []).filter((b: any) => b.status === "occupied").length;
        toolData.landlordSummary = { collected: paid, unpaid, occupancy: totalBeds ? Math.round((occ / totalBeds) * 100) : 0, totalBeds, occupied: occ };
      }
    }

    const history = (messages || []).slice(-12).map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");
    const system = `You are BoardEase AI Chatbot Assistant for a boarding house management system. Be helpful, concise, and friendly.
Use ONLY the provided tool data for factual answers (availability, bills, stats). Do not invent data.
If data is unavailable for the user's role, explain they must log in with the right account.
Tool data (JSON): ${JSON.stringify(toolData).slice(0, 12000)}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: system });
    const result = await model.generateContent(history || "Say hello.");
    const reply = result.response.text();
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Chat error" }, { status: 500 });
  }
}
