import { NextResponse, type NextRequest } from "next/server";
import { redirectWithCookies, updateSession } from "@/lib/supabase/proxy";

// /offline is served by the service worker without a session, so it must never redirect.
const PUBLIC_PATHS = ["/", "/auth", "/offline"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)));
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // If a sign-in link's redirect address isn't on Supabase's allow list, Supabase
  // falls back to the bare Site URL with the one-time code attached. Hand it to
  // the callback so the sign-in still completes instead of landing on the welcome page.
  if (pathname === "/" && (searchParams.has("code") || searchParams.has("token_hash"))) {
    const callback = request.nextUrl.clone();
    callback.pathname = "/auth/callback";
    return NextResponse.redirect(callback);
  }

  const { response, userId } = await updateSession(request);

  if (!userId && !isPublic(pathname)) {
    return redirectWithCookies(request, response, "/");
  }

  if (userId && pathname === "/") {
    return redirectWithCookies(request, response, "/home");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
