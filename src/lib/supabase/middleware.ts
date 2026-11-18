import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  const protectedPrefixes = ["/super-admin", "/landlord", "/tenant"];
  const isProtected = protectedPrefixes.some((p) => path.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("supabase_uid", user.id)
      .maybeSingle();
    const role = (profile as { role?: string } | null)?.role;

    if (role) {
      if (path.startsWith("/super-admin") && role !== "super_admin") {
        return NextResponse.redirect(new URL(roleHome(role), request.url));
      }
      if (path.startsWith("/landlord") && role !== "landlord" && role !== "caretaker") {
        return NextResponse.redirect(new URL(roleHome(role), request.url));
      }
      if (path.startsWith("/tenant") && role !== "tenant") {
        return NextResponse.redirect(new URL(roleHome(role), request.url));
      }
    }

    if ((path === "/login" || path === "/register" || path === "/register-owner") && role) {
      return NextResponse.redirect(new URL(roleHome(role), request.url));
    }
  }

  return supabaseResponse;
}

export function roleHome(role: string) {
  switch (role) {
    case "super_admin": return "/super-admin";
    case "landlord":
    case "caretaker": return "/landlord/dashboard";
    case "tenant": return "/tenant/dashboard";
    default: return "/";
  }
}
