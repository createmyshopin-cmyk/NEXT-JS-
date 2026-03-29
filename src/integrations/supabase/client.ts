import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { getAuthCookieOptionsForHostname } from "@/lib/auth-cookie-options";

/** In-memory storage for SSR / non-browser (no document.cookie). */
function getMemoryStorage(): Storage {
  const mem: Record<string, string> = {};
  return {
    getItem: (key) => mem[key] ?? null,
    setItem: (key, value) => {
      mem[key] = value;
    },
    removeItem: (key) => {
      delete mem[key];
    },
    clear: () => {
      for (const k of Object.keys(mem)) delete mem[k];
    },
    get length() {
      return Object.keys(mem).length;
    },
    key: (i) => Object.keys(mem)[i] ?? null,
  } as Storage;
}

let _client: SupabaseClient<Database> | null = null;

function getClient(): SupabaseClient<Database> {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

  if (typeof window !== "undefined" && (!url || !key)) {
    console.error(
      "[Supabase] Missing URL or anon key. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local and restart the dev server."
    );
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    _client = createBrowserClient<Database>(url, key, {
      cookieOptions: getAuthCookieOptionsForHostname(hostname),
      isSingleton: true,
    });

    void _client.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { error } = await _client!.auth.refreshSession();
      if (!error) return;
      const msg = (error.message || "").toLowerCase();
      const code = (error as { code?: string }).code;
      if (
        code === "refresh_token_not_found" ||
        msg.includes("refresh token not found") ||
        msg.includes("invalid refresh token")
      ) {
        await _client!.auth.signOut({ scope: "local" });
      }
    });
  } else {
    _client = createClient<Database>(url, key, {
      auth: {
        storage: getMemoryStorage(),
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return _client;
}

/** Lazy singleton; browser uses cookie auth (shared across subdomains when domain is set). */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    const c = getClient();
    const v = Reflect.get(c, prop, receiver);
    if (typeof v === "function") {
      return (v as (...args: unknown[]) => unknown).bind(c);
    }
    return v;
  },
});
