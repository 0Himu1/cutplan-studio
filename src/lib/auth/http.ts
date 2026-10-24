import 'server-only';

export function privateJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie', Pragma: 'no-cache' } });
}

export function sameOrigin(request: Request) {
  // A fixed external origin also works when Next's internal request URL uses localhost.
  const expected = process.env.APP_ORIGIN ?? new URL(request.url).origin;
  return request.headers.get('origin') === expected;
}

export async function readBody(request: Request, maxBytes = 2048): Promise<Record<string, unknown> | null> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) return null;
  // Bound the stream itself, rather than trusting a caller-controlled Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return null;
  let length = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > maxBytes) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  try {
    const buffer = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
    const value: unknown = JSON.parse(new TextDecoder().decode(buffer));
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch { return null; }
}

