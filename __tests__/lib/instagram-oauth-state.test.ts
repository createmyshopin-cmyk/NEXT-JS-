import { describe, it, expect } from "vitest";
import { parseInstagramOAuthState } from "@/lib/instagram-oauth-state";

describe("parseInstagramOAuthState", () => {
  it("parses pipe state for Instagram", () => {
    const tid = "fff65ecd-51ee-4037-9cf7-60bd373270db";
    const s = `${tid}|deadbeef|ig`;
    expect(parseInstagramOAuthState(s)).toEqual({ tenantId: tid, flow: "instagram" });
  });

  it("parses pipe state for Facebook", () => {
    const tid = "fff65ecd-51ee-4037-9cf7-60bd373270db";
    const s = `${tid}|deadbeef|fb`;
    expect(parseInstagramOAuthState(s)).toEqual({ tenantId: tid, flow: "facebook" });
  });

  it("parses legacy colon state", () => {
    const tid = "fff65ecd-51ee-4037-9cf7-60bd373270db";
    const s = `${tid}:abc123`;
    expect(parseInstagramOAuthState(s)).toEqual({ tenantId: tid, flow: "facebook" });
  });
});
