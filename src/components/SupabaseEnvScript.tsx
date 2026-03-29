/**
 * Previously injected window.__STAY_SUPABASE__ with the anon key as a plain-text
 * inline script visible in every HTML page response. Removed — the Supabase client
 * reads NEXT_PUBLIC_* values baked into the JS bundle instead.
 */
export function SupabaseEnvScript() {
  return null;
}
