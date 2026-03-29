import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Simple in-memory rate limiter: max 5 submissions per IP per 10 minutes.
 * Resets on cold-start. Suitable for serverless edge; for multi-instance
 * production scale use Upstash Redis + @upstash/ratelimit.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const ipMap = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipMap.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    ipMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= MAX_REQUESTS) return true;
  entry.count += 1;
  return false;
}

function sanitizeText(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

function sanitizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/[^\d\s\+\-\(\)]/g, "").trim().slice(0, 20);
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many enquiries. Please wait a few minutes before trying again." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = sanitizeText(body.name, 100);
  const mobile = sanitizePhone(body.mobile);

  if (!name || !mobile) {
    return NextResponse.json({ error: "Name and mobile are required" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Resolve tenantId server-side
  let targetTenantId = sanitizeText(body.tenantId, 36) || null;
  if (!targetTenantId) {
    const { data } = await supabase.rpc("get_platform_tenant_id");
    targetTenantId = data ?? null;
  }

  if (!targetTenantId) {
    return NextResponse.json({ error: "Could not resolve tenant" }, { status: 400 });
  }

  const message = [
    `Destination: ${sanitizeText(body.destination, 100) || "N/A"}`,
    `Travel Date: ${sanitizeText(body.travelDate, 20) || "N/A"}`,
    `Location: ${sanitizeText(body.location, 100) || "N/A"}`,
    `Days: ${sanitizeText(body.days, 10) || "N/A"}`,
    `People: ${sanitizeText(body.people, 10) || "N/A"}`,
    `Type: ${sanitizeText(body.type, 50) || "N/A"}`,
    `Travel Type: ${sanitizeText(body.travelType, 50) || "N/A"}`,
  ].join("\n");

  const emailRaw = sanitizeText(body.email, 255);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw);

  const { error } = await supabase.from("leads").insert({
    tenant_id: targetTenantId,
    source: "enquiry_form",
    full_name: name,
    phone: mobile,
    email: emailValid ? emailRaw : null,
    message,
    status: "new",
  });

  if (error) {
    console.error("Enquiry insert error");
    return NextResponse.json({ error: "Failed to save enquiry" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
