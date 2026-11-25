// Scheduled functions are called by pg_cron (see the scheduled_jobs migration)
// with a shared secret instead of a user's JWT.
export function isCronRequest(request: Request): boolean {
  const expected = Deno.env.get("CRON_SECRET");
  const received = request.headers.get("x-cron-secret");
  return Boolean(expected) && received === expected;
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
