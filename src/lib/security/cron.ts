import { timingSafeEqual } from "node:crypto";

export function authorizeCronRequest(authorization: string | null, secret = process.env.CRON_SECRET) {
  if (!secret || secret.length < 20 || !authorization?.startsWith("Bearer ")) return false;
  const provided = authorization.slice(7);
  const expectedBuffer = Buffer.from(secret);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

export function scheduledEnvironment(environment = process.env.APP_ENV) {
  return environment === "staging" || environment === "production";
}
