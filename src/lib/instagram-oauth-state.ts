/**
 * OAuth `state` for Instagram connect:
 * - New: `tenantId|nonce|fb` or `tenantId|nonce|ig` (pipe-safe for UUIDs)
 * - Legacy: `tenantId:hex` (single colon before random hex; UUID uses hyphens only)
 */
export function parseInstagramOAuthState(state: string | null): { tenantId: string; flow: "facebook" | "instagram" } | null {
  if (!state) return null;
  if (state.includes("|")) {
    const parts = state.split("|");
    if (parts.length < 3) return null;
    const tenantId = parts[0];
    const marker = parts[parts.length - 1];
    if (!tenantId) return null;
    return { tenantId, flow: marker === "ig" ? "instagram" : "facebook" };
  }
  const colon = state.indexOf(":");
  if (colon === -1) return { tenantId: state, flow: "facebook" };
  return { tenantId: state.slice(0, colon), flow: "facebook" };
}
