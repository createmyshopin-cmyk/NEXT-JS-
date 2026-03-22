/**
 * Instagram Business Login (OAuth on instagram.com) stores a long-lived **Instagram user** token
 * that must be used with `https://graph.instagram.com`.
 * Facebook Login + Page token uses `https://graph.facebook.com`.
 *
 * Callback stores the same id in both `facebook_page_id` and `instagram_business_account_id`
 * only for the Instagram-only flow.
 */
export function resolveInstagramGraphHost(conn: {
  facebook_page_id: string;
  instagram_business_account_id: string;
}): "https://graph.facebook.com" | "https://graph.instagram.com" {
  return String(conn.facebook_page_id) === String(conn.instagram_business_account_id)
    ? "https://graph.instagram.com"
    : "https://graph.facebook.com";
}

/** Send API: Instagram Login tokens must call `graph.instagram.com`; Page tokens use `graph.facebook.com`. */
export function resolveInstagramSendMessagesUrl(
  conn: { facebook_page_id: string; instagram_business_account_id: string },
  graphVersion: string,
): string {
  const host = resolveInstagramGraphHost(conn);
  return `${host}/${graphVersion}/me/messages`;
}

/** POST Send API with one retry on the alternate host if the token does not match the first host. */
export async function sendInstagramMessagesWithHostFallback(
  conn: { facebook_page_id: string; instagram_business_account_id: string },
  graphVersion: string,
  payload: Record<string, unknown>,
): Promise<Response> {
  const primary = resolveInstagramSendMessagesUrl(conn, graphVersion);
  let res = await fetch(primary, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.ok) return res;
  const errText = await res.text();
  if (!isLikelyWrongGraphHostTokenError(errText)) {
    return new Response(errText, { status: res.status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  const alternateHost =
    resolveInstagramGraphHost(conn) === "https://graph.instagram.com"
      ? "https://graph.facebook.com"
      : "https://graph.instagram.com";
  const altUrl = `${alternateHost}/${graphVersion}/me/messages`;
  return fetch(altUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** POST Send API with one retry on the alternate host for responding to a comment. */
export async function replyInstagramCommentWithHostFallback(
  conn: { facebook_page_id: string; instagram_business_account_id: string },
  graphVersion: string,
  commentId: string,
  messageText: string,
  pageToken: string,
): Promise<Response> {
  const primaryHost = resolveInstagramGraphHost(conn);
  const primaryUrl = `${primaryHost}/${graphVersion}/${commentId}/replies?message=${encodeURIComponent(messageText)}&access_token=${pageToken}`;
  
  let res = await fetch(primaryUrl, { method: "POST" });
  if (res.ok) return res;
  
  const errText = await res.text();
  if (!isLikelyWrongGraphHostTokenError(errText)) {
    return new Response(errText, { status: res.status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  
  const alternateHost =
    primaryHost === "https://graph.instagram.com"
      ? "https://graph.facebook.com"
      : "https://graph.instagram.com";
  
  const altUrl = `${alternateHost}/${graphVersion}/${commentId}/replies?message=${encodeURIComponent(messageText)}&access_token=${pageToken}`;
  return fetch(altUrl, { method: "POST" });
}

export function isLikelyWrongGraphHostTokenError(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("invalid oauth") ||
    m.includes("cannot parse access token") ||
    m.includes("parse access token") ||
    m.includes("invalid access token")
  );
}
