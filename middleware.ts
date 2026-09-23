import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isDashboardRoute =
    pathname.startsWith("/registrar") ||
    pathname.startsWith("/judge") ||
    pathname.startsWith("/lawyer");

  // Protect dashboard routes when unauthenticated
  if (!user && isDashboardRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Enforce role isolation on dashboard sub-routes
  if (user && isDashboardRoute) {
    const userRole = (user.user_metadata?.role as string) || "REGISTRAR";
    const expectedPrefix = `/${userRole.toLowerCase()}`;
    if (!pathname.startsWith(expectedPrefix)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = expectedPrefix;
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Redirect authenticated users away from login page
  if (user && pathname === "/login") {
    const userRole = (user.user_metadata?.role as string) || "REGISTRAR";
    const roleRoutes: Record<string, string> = {
      REGISTRAR: "/registrar",
      JUDGE: "/judge",
      LAWYER: "/lawyer",
    };
    const targetRoute = roleRoutes[userRole] || "/registrar";
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = targetRoute;
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
