/**
 * Nagłówki CORS wspólne dla wszystkich Edge Functions.
 *
 * Dopuszczamy dokładnie jedno pochodzenie produkcyjne (SITE_URL) oraz adresy
 * deweloperskie Vite. Nagłówek `Access-Control-Allow-Origin` może nieść tylko
 * jedną wartość, dlatego odbijamy pochodzenie z żądania, jeśli jest na liście.
 */
const ALLOWED = [
  Deno.env.get('SITE_URL'),
  'http://localhost:5173',
  'http://localhost:4173',
].filter((v): v is string => Boolean(v))

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  const allow = ALLOWED.includes(origin) ? origin : ALLOWED[0] ?? ''
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  })
}

export function text(req: Request, body: string, status = 200): Response {
  return new Response(body, { status, headers: corsHeaders(req) })
}
