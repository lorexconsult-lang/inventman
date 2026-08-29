import { parseServerEnvironment } from "@/lib/env/server";

export const dynamic = "force-dynamic";
export function GET() {
  const env = parseServerEnvironment();
  return Response.json({ status: "ok", environment: env.APP_ENV, version: env.APP_VERSION }, { headers: { "Cache-Control": "no-store" } });
}
