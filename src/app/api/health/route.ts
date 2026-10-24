export function GET() {
  return Response.json({ status: 'ok', application: 'cutplan-studio' }, { headers: { 'Cache-Control': 'no-store' } });
}
