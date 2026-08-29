import { getPublicEnvironment } from "@/lib/env/public";
import { parseServerEnvironment } from "@/lib/env/server";
import { log, requestId } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const startedAt = Date.now();
  const id = requestId(request.headers);
  try {
    const publicEnvironment = getPublicEnvironment();
    const databaseResponse = await fetch(`${publicEnvironment.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/production_database_readiness`, {
      method: "POST",
      headers: { apikey: publicEnvironment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${publicEnvironment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`, "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    if (!databaseResponse.ok) throw new Error(`database_readiness_${databaseResponse.status}`);
    const env = parseServerEnvironment();
    log("info", "readiness_check", { requestId: id, durationMs: Date.now() - startedAt, ready: true });
    return Response.json({ status: "ready", environment: env.APP_ENV, version: env.APP_VERSION }, { headers: { "Cache-Control": "no-store", "x-request-id": id } });
  } catch (error) {
    log("error", "readiness_check", { requestId: id, durationMs: Date.now() - startedAt, ready: false, error: error instanceof Error ? error.message : "unknown" });
    return Response.json({ status: "not_ready" }, { status: 503, headers: { "Cache-Control": "no-store", "x-request-id": id } });
  }
}
