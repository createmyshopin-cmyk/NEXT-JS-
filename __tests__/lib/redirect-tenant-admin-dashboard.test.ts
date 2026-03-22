import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  redirectTenantAdminDashboard,
  platformBaseDomainFromEnv,
  redirectAdminToTenantSubdomainEnabled,
} from "@/lib/redirectTenantAdminDashboard";

describe("platformBaseDomainFromEnv", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN;
  });

  it("defaults to travelvoo.in", () => {
    expect(platformBaseDomainFromEnv()).toBe("travelvoo.in");
  });

  it("strips leading www.", () => {
    process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN = "www.travelvoo.in";
    expect(platformBaseDomainFromEnv()).toBe("travelvoo.in");
  });

  it("uses apex when set correctly", () => {
    process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN = "travelvoo.in";
    expect(platformBaseDomainFromEnv()).toBe("travelvoo.in");
  });
});

function supabaseWithSession(): SupabaseClient {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: {} } }),
    },
  } as unknown as SupabaseClient;
}

describe("redirectAdminToTenantSubdomainEnabled", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_REDIRECT_ADMIN_TO_TENANT_SUBDOMAIN;
  });

  it("defaults to true when unset", () => {
    expect(redirectAdminToTenantSubdomainEnabled()).toBe(true);
  });

  it("is false when env is false, 0, or no", () => {
    process.env.NEXT_PUBLIC_REDIRECT_ADMIN_TO_TENANT_SUBDOMAIN = "false";
    expect(redirectAdminToTenantSubdomainEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_REDIRECT_ADMIN_TO_TENANT_SUBDOMAIN = "0";
    expect(redirectAdminToTenantSubdomainEnabled()).toBe(false);
  });
});

describe("redirectTenantAdminDashboard", () => {
  let locationReplaceMock: ReturnType<typeof vi.fn>;
  let routerReplaceMock: ReturnType<typeof vi.fn>;

  function stubWindow(hostname: string, protocol: "https:" | "http:" = "https:") {
    locationReplaceMock = vi.fn();
    vi.stubGlobal("window", {
      location: {
        hostname,
        protocol,
        replace: locationReplaceMock,
      },
    });
  }

  beforeEach(() => {
    routerReplaceMock = vi.fn();
    delete process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN;
    delete process.env.NEXT_PUBLIC_REDIRECT_ADMIN_TO_TENANT_SUBDOMAIN;
    stubWindow("www.travelvoo.in");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("on www: redirects to known subdomain without calling Supabase from()", async () => {
    const supabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: {} } }),
      },
      from: vi.fn(() => {
        throw new Error("from() should not run when knownSubdomain is set");
      }),
      rpc: vi.fn(),
    } as unknown as SupabaseClient;

    await redirectTenantAdminDashboard(supabase, "user-1", { replace: routerReplaceMock }, { knownSubdomain: "myresort" });

    expect(locationReplaceMock).toHaveBeenCalledWith("https://myresort.travelvoo.in/admin/dashboard");
    expect(routerReplaceMock).not.toHaveBeenCalled();
  });

  it("on www: uses NEXT_PUBLIC_PLATFORM_BASE_DOMAIN apex for URL", async () => {
    process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN = "example.com";
    const supabase = supabaseWithSession();

    await redirectTenantAdminDashboard(supabase, "user-1", { replace: routerReplaceMock }, { knownSubdomain: "demo" });

    expect(locationReplaceMock).toHaveBeenCalledWith("https://demo.example.com/admin/dashboard");
    expect(routerReplaceMock).not.toHaveBeenCalled();
  });

  it("on apex travelvoo.in: known subdomain redirects", async () => {
    stubWindow("travelvoo.in");
    const supabase = supabaseWithSession();
    await redirectTenantAdminDashboard(supabase, "u1", { replace: routerReplaceMock }, { knownSubdomain: "acme" });
    expect(locationReplaceMock).toHaveBeenCalledWith("https://acme.travelvoo.in/admin/dashboard");
  });

  it("on tenant host: does not cross-navigate; uses router only", async () => {
    stubWindow("wa.travelvoo.in");
    const supabase = supabaseWithSession();
    await redirectTenantAdminDashboard(supabase, "u1", { replace: routerReplaceMock }, { knownSubdomain: "wa" });
    expect(locationReplaceMock).not.toHaveBeenCalled();
    expect(routerReplaceMock).toHaveBeenCalledWith("/admin/dashboard");
  });

  it("when subdomain redirect is disabled: stays on current origin via router only", async () => {
    process.env.NEXT_PUBLIC_REDIRECT_ADMIN_TO_TENANT_SUBDOMAIN = "false";
    const supabase = supabaseWithSession();
    await redirectTenantAdminDashboard(supabase, "user-1", { replace: routerReplaceMock }, { knownSubdomain: "myresort" });
    expect(locationReplaceMock).not.toHaveBeenCalled();
    expect(routerReplaceMock).toHaveBeenCalledWith("/admin/dashboard");
  });
});
