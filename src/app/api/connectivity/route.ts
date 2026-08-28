export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store, max-age=0" };

export function HEAD() {
  return new Response(null, { status: 204, headers });
}

export function GET() {
  return Response.json({ online: true, receivedAt: new Date().toISOString() }, { headers });
}
