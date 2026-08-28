import { createHmac, timingSafeEqual } from "node:crypto";

export type BillingProviderName = "PAYSTACK" | "FLUTTERWAVE";
export interface BillingProvider {
  name: BillingProviderName;
  verifyWebhook(rawBody: string, headers: Headers): boolean;
  eventIdentity(payload: unknown): { id: string; type: string } | null;
}
function safeEqual(a: string, b: string) { const left = Buffer.from(a); const right = Buffer.from(b); return left.length === right.length && timingSafeEqual(left, right); }

const paystack: BillingProvider = {
  name: "PAYSTACK",
  verifyWebhook(rawBody, headers) { const secret = process.env.PAYSTACK_SECRET_KEY; const signature = headers.get("x-paystack-signature"); if (!secret || !signature) return false; return safeEqual(createHmac("sha512", secret).update(rawBody).digest("hex"), signature); },
  eventIdentity(payload) { const event = payload as { event?: unknown; data?: { id?: unknown; reference?: unknown } }; const id = event.data?.id ?? event.data?.reference; return typeof event.event === "string" && (typeof id === "string" || typeof id === "number") ? { id: String(id), type: event.event } : null; },
};
const flutterwave: BillingProvider = {
  name: "FLUTTERWAVE",
  verifyWebhook(_rawBody, headers) { const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET; const signature = headers.get("verif-hash"); return Boolean(secret && signature && safeEqual(secret, signature)); },
  eventIdentity(payload) { const event = payload as { event?: unknown; id?: unknown; data?: { id?: unknown; tx_ref?: unknown } }; const id = event.id ?? event.data?.id ?? event.data?.tx_ref; return typeof event.event === "string" && (typeof id === "string" || typeof id === "number") ? { id: String(id), type: event.event } : null; },
};
export function billingProvider(name: string) { if (name === "PAYSTACK") return paystack; if (name === "FLUTTERWAVE") return flutterwave; return null; }
