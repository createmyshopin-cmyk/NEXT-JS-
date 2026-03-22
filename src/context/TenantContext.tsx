import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveTenantFromHostnameDb } from "@/lib/resolveTenantFromHost";

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
    resolveTenantFromHostnameDb(supabase, window.location.hostname)
      .then(({ tenant, isSubdomain }) => {
        if (tenant) {
          setTenantId(tenant.id);
          setTenantName(tenant.name);
        } else if (isSubdomain) {
          setNotFound(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("[TenantProvider] resolveTenantFromHostnameDb failed", err);
        setLoading(false);
      });
  }, []);

  return (
    <TenantContext.Provider value={{ tenantId, tenantName, loading, notFound, setTenantId }}>
      {children}
    </TenantContext.Provider>
  );
}
