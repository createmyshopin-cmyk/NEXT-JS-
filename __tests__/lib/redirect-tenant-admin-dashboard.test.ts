import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  redirectTenantAdminDashboard,
  platformBaseDomainFromEnv,
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

describe("redirectTenantAdminDashboard", () => {
  let hrefAssigned: string;
  let replaceMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    hrefAssigned = "";
    replaceMock = vi.fn();
    delete process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN;
    vi.stubGlobal("window", {
      location: {
        hostname: "www.travelvoo.in",
        set href(v: string) {
          hrefAssigned = v;
        },
        get href() {
          return hrefAssigned;
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("on www: redirects to known subdomain without calling Supabase", async () => {
    const supabase = {
      from: vi.fn(() => {
        throw new Error("from() should not run when knownSubdomain is set");
      }),
      rpc: vi.fn(),
    } as unknown as SupabaseClient;

    await redirectTenantAdminDashboard(supabase, "user-1", { replace: replaceMock }, { knownSubdomain: "myresort" });

    expect(hrefAssigned).toBe("https://myresort.travelvoo.in/admin/dashboard");
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("on www: uses NEXT_PUBLIC_PLATFORM_BASE_DOMAIN apex for URL", async () => {
    process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN = "example.com";
    const supabase = {} as SupabaseClient;

    await redirectTenantAdminDashboard(supabase, "user-1", { replace: replaceMock }, { knownSubdomain: "demo" });

    expect(hrefAssigned).toBe("https://demo.example.com/admin/dashboard");
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("on apex travelvoo.in: known subdomain redirects", async () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "travelvoo.in",
        set href(v: string) {
          hrefAssigned = v;
        },
        get href() {
          return hrefAssigned;
        },
      },
    });
    const supabase = {} as SupabaseClient;
    await redirectTenantAdminDashboard(supabase, "u1", { replace: replaceMock }, { knownSubdomain: "acme" });
    expect(hrefAssigned).toBe("https://acme.travelvoo.in/admin/dashboard");
  });

  it("on tenant host: does not cross-navigate; uses router only", async () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "wa.travelvoo.in",
        set href(v: string) {
          hrefAssigned = v;
        },
        get href() {
          return hrefAssigned;
        },
      },
    });
    const supabase = {} as SupabaseClient;
    await redirectTenantAdminDashboard(supabase, "u1", { replace: replaceMock }, { knownSubdomain: "wa" });
    expect(hrefAssigned).toBe("");
    expect(replaceMock).toHaveBeenCalledWith("/admin/dashboard");
  });
});
