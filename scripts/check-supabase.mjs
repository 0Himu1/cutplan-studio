const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error('Supabase check failed: set the URL and publishable key in .env.local.');
  process.exit(1);
}

try {
  const endpoint = new URL('/auth/v1/settings', url);
  const response = await fetch(endpoint, {
    headers: { apikey: key },
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store'
  });
  if (!response.ok) {
    console.error(`Supabase Auth API check failed (HTTP ${response.status}). Check the project and key.`);
    process.exit(1);
  }
  await response.json();
  console.log('PASS: Supabase project and publishable key reach the Auth settings API.');
  console.log('Read-only check only: no database, user or policy changes; login and RLS are not yet tested.');
} catch {
  console.error('Supabase check failed: request timed out or the project could not be reached.');
  process.exit(1);
}
