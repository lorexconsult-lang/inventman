import { createClient } from "@supabase/supabase-js";
import { log, requestId } from "@/lib/observability/logger";
import { authorizeCronRequest, scheduledEnvironment } from "@/lib/security/cron";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = requestId(request.headers);
  if (!scheduledEnvironment()) return Response.json({ error: "not_available" }, { status: 404 });
  if (!authorizeCronRequest(request.headers.get("authorization"))) {
    log("warn", "subscription_maintenance_unauthorized", { requestId: id, environment: process.env.APP_ENV });
    return Response.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store", "x-request-id": id } });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return Response.json({ error: "service_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store", "x-request-id": id } });
  const startedAt = Date.now();
  const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.rpc("run_subscription_maintenance" as never, { target_now: new Date().toISOString() } as never);
  if (error) {
    log("error", "subscription_maintenance_failed", { requestId: id, durationMs: Date.now() - startedAt, code: error.code });
    return Response.json({ error: "maintenance_failed" }, { status: 503, headers: { "Cache-Control": "no-store", "x-request-id": id } });
  }
  log("info", "subscription_maintenance_completed", { requestId: id, durationMs: Date.now() - startedAt, result: data });
  return Response.json({ ok: true, result: data }, { headers: { "Cache-Control": "no-store", "x-request-id": id } });
}
