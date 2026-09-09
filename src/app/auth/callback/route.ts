import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getPublicEnvironment } from "@/lib/env/public";
import type { Database } from "@/types/database.generated";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next");
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const response = noStoreRedirect(new URL(safeNext, request.url));
  const client = createServerClient<Database>(
    getPublicEnvironment().NEXT_PUBLIC_SUPABASE_URL,
    getPublicEnvironment().NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    const { data: claims } = await client.auth.getClaims();
    if (!error && typeof claims?.claims?.sub === "string") {
      response.cookies.set("inventman-organization", "", {
        expires: new Date(0),
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
      });
      return response;
    }
  }
  return noStoreRedirect(
    new URL("/auth/check-email?mode=callback-error", request.url),
  );
}

function noStoreRedirect(url: URL) {
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}
