import { redact } from "./redaction";

type Level = "info" | "warn" | "error";

export function requestId(headers: Headers) {
  return headers.get("x-request-id") ?? headers.get("x-vercel-id") ?? crypto.randomUUID();
}

export function log(level: Level, message: string, context: Record<string, unknown> = {}) {
  const entry = JSON.stringify(redact({ timestamp: new Date().toISOString(), level, message, ...context }));
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.info(entry);
}

export function classifyError(error: unknown) {
  if (error instanceof SyntaxError) return "invalid_input";
  if (error instanceof Error && /auth|permission|forbidden/i.test(error.message)) return "authorization";
  return "internal";
}
