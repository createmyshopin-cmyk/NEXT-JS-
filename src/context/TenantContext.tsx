import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  resolveTenantFromHostnameDb,
  type ResolvedTenantFromHost,
} from "@/lib/resolveTenantFromHost";

const TENANT_RESOLVE_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Tenant resolution timeout")), ms);
  });
  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    timeoutPromise,
  ]);
}

interface TenantContextType {
  tenantId: string | null;
  tenantName: string | null;
  loading: boolean;
  /** true when the URL is a subdomain that has no registered tenant */
  notFound: boolean;
  setTenantId: (id: string | null) => void;
}

const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  tenantName: null,
  loading: true,
  notFound: false,
  setTenantId: () => {},
});

export const useTenant = () => useContext(TenantContext);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const hostname = window.location.hostname;

    const apply = (r: ResolvedTenantFromHost) => {
      if (cancelled) return;
      if (r.tenant) {
        setTenantId(r.tenant.id);
        setTenantName(r.tenant.name);
      } else if (r.isSubdomain) {
        setNotFound(true);
      }
    };

    (async () => {
      try {
        const result = await withTimeout(
          resolveTenantFromHostnameDb(supabase, hostname),
          TENANT_RESOLVE_TIMEOUT_MS
        );
        apply(result);
      } catch (err) {
        console.error("[TenantProvider] resolveTenantFromHostnameDb failed", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <TenantContext.Provider value={{ tenantId, tenantName, loading, notFound, setTenantId }}>
      {children}
    </TenantContext.Provider>
  );
}
