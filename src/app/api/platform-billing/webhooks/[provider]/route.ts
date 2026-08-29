import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { billingProvider } from "@/features/subscriptions/providers";
import { clientAddress, consumeRateLimit, rateLimitHeaders } from "@/lib/security/rate-limit";
import { log, requestId } from "@/lib/observability/logger";

export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const id = requestId(request.headers); const startedAt = Date.now();
  const rate = await consumeRateLimit(`billing-webhook:${clientAddress(request.headers)}`, 120, 60_000);
  if (!rate.allowed) { log("warn", "billing_webhook_rate_limited", { requestId: id }); return Response.json({ error: { code: "rate_limited", message: "Too many requests" } }, { status: 429, headers: { ...rateLimitHeaders(rate), "Retry-After": String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))) } }); }
  const providerName = (await params).provider.toUpperCase(); const provider = billingProvider(providerName); if (!provider) return Response.json({ error: "Unsupported provider" }, { status: 404 });
  const rawBody = await request.text(); if (!provider.verifyWebhook(rawBody, request.headers)) return Response.json({ error: "Invalid signature" }, { status: 401 });
  let payload: unknown; try { payload = JSON.parse(rawBody); } catch { return Response.json({ error: "Invalid payload" }, { status: 400 }); }
  const identity = provider.eventIdentity(payload); if (!identity) return Response.json({ error: "Event identity missing" }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; if (!url || !serviceKey) return Response.json({ error: "Billing service unavailable" }, { status: 503 });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.rpc("record_platform_webhook_event", { target_provider: provider.name, target_event_id: identity.id, target_event_type: identity.type, target_payload_hash: createHash("sha256").update(rawBody).digest("hex") });
  if (error) { log("error", "billing_webhook_failed", { requestId: id, provider: provider.name, durationMs: Date.now() - startedAt, error: error.message }); return Response.json({ error: "Event processing failed" }, { status: 500, headers: { "x-request-id": id } }); }
  log("info", "billing_webhook_processed", { requestId: id, provider: provider.name, duplicate: data === false, durationMs: Date.now() - startedAt });
  return Response.json({ received: true, duplicate: data === false }, { headers: { "x-request-id": id, ...rateLimitHeaders(rate) } });
}
