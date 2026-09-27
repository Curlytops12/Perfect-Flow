// Supabase's shared email service enforces a project-wide rate limit. When
// hit, the call fails outright (no account/session is ever partially
// created), so it's safe to just retry the exact same request later.
// This never persists anything (like a password) outside the current tab.
export async function retryOnRateLimit(fn, { onRetry, intervalMs = 120000, maxMs = 40 * 60000 } = {}) {
  const start = Date.now();
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await fn();
    const isRateLimit = /rate limit/i.test(result?.error?.message || '');
    if (!result?.error || !isRateLimit) return result;
    if (Date.now() - start >= maxMs) return result;
    attempt += 1;
    onRetry?.(attempt);
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
