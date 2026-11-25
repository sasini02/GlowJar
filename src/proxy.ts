import type { NextRequest } from "next/server";
import { redirectWithCookies, updateSession } from "@/lib/supabase/proxy";

// /offline is served by the service worker without a session, so it must never redirect.
const PUBLIC_PATHS = ["/", "/auth", "/offline"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)));
}

export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!userId && !isPublic(pathname)) {
    return redirectWithCookies(request, response, "/");
  }

  if (userId && pathname === "/") {
    return redirectWithCookies(request, response, "/feed");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
