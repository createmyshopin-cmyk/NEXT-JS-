/**
 * Evaluates Instagram automation flow graphs (React Flow JSON) for webhook handling.
 */

export type FlowChannel = "dm" | "comment" | "story" | "all";

export interface FlowEvalContext {
  channel: "dm" | "comment" | "story";
  messageText: string;
  senderIgId: string;
  tenantId: string;
  now?: Date;
  /** True when the sender has no prior DM activity rows for this tenant (webhook sets this). */
  isFirstMessage?: boolean;
}

export interface FlowEvalDeps {
  checkFollower?: () => Promise<{ follows: boolean | null; source?: string }>;
}

export type ResolvedFlowActionType =
  | "ai_reply"
  | "template_reply"
  | "send_link"
  | "suppress"
  | "qualify_lead_only";

export interface ResolvedFlowAction {
  type: ResolvedFlowActionType;
  templateText?: string;
  url?: string;
  meta?: Record<string, unknown>;
}

export interface FlowEdge {
  id?: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
}

export interface FlowNode {
  id: string;
  type?: string;
  data?: Record<string, unknown>;
}

export interface FlowDefinition {
  nodes?: FlowNode[];
  edges?: FlowEdge[];
}

export type FlowVisit = { nodeId: string; passed: boolean | null; meta?: Record<string, unknown> };

export interface FlowEvalResult {
  action: ResolvedFlowAction | null;
  followerCheck?: { follows: boolean | null; source?: string };
  visited: FlowVisit[];
}

function channelMatches(flowChannel: string | undefined, ctxChannel: string): boolean {
  const c = (flowChannel || "dm").toLowerCase();
  if (c === "all") return true;
  return c === ctxChannel;
}

function matchKeyword(
  text: string,
  match: string,
  matchType: string,
  caseSensitive: boolean,
): boolean {
  const needle = (caseSensitive ? match : match.toLowerCase()).trim();
  const haystack = caseSensitive ? text.trim() : text.toLowerCase().trim();
  if (matchType === "exact") return haystack === needle;
  if (matchType === "whole_word") {
    return new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, caseSensitive ? "" : "i").test(text);
  }
  return haystack.includes(needle);
}

function scheduleWindowsFromNodeData(data: Record<string, unknown>): { days: number[]; start: string; end: string }[] {
  if (Array.isArray(data.windows)) return data.windows as { days: number[]; start: string; end: string }[];
  const start = String(data.window_start ?? "09:00");
  const end = String(data.window_end ?? "17:00");
  const raw = String(data.window_days ?? "1,2,3,4,5");
  const days = raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n));
  return [{ days: days.length ? days : [1, 2, 3, 4, 5], start, end }];
}

function evaluateSchedule(data: Record<string, unknown>, now: Date): boolean {
  const timezone = typeof data.timezone === "string" && data.timezone ? data.timezone : "UTC";
  const windows = scheduleWindowsFromNodeData(data);
  if (!windows.length) return true;

  let hour = now.getUTCHours();
  let minute = now.getUTCMinutes();
  let dow = now.getUTCDay();

  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      weekday: "short",
    });
    const parts = fmt.formatToParts(now);
    const h = parts.find((p) => p.type === "hour")?.value;
    const m = parts.find((p) => p.type === "minute")?.value;
    const wd = parts.find((p) => p.type === "weekday")?.value;
    if (h != null && m != null) {
      hour = parseInt(h, 10);
      minute = parseInt(m, 10);
    }
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    if (wd && wd in map) dow = map[wd];
  } catch {
    /* keep UTC */
  }

  const minutesNow = hour * 60 + minute;

  for (const w of windows) {
    const days = Array.isArray(w.days) && w.days.length ? w.days : [0, 1, 2, 3, 4, 5, 6];
    if (!days.includes(dow)) continue;
    const [sh, sm] = (w.start || "00:00").split(":").map((x) => parseInt(x, 10));
    const [eh, em] = (w.end || "23:59").split(":").map((x) => parseInt(x, 10));
    const startM = (sh || 0) * 60 + (sm || 0);
    const endM = (eh || 23) * 60 + (em || 59);
    if (startM <= endM) {
      if (minutesNow >= startM && minutesNow <= endM) return true;
    } else {
      if (minutesNow >= startM || minutesNow <= endM) return true;
    }
  }
  return false;
}

async function evaluateCondition(
  data: Record<string, unknown>,
  ctx: FlowEvalContext,
  deps: FlowEvalDeps,
  followerState: { follows: boolean | null; source?: string } | undefined,
  setFollower: (v: { follows: boolean | null; source?: string }) => void,
): Promise<boolean> {
  const conditionType = (data.conditionType as string) || "keyword";

  if (conditionType === "keyword") {
    const match = String(data.match ?? "");
    const matchType = String(data.match_type ?? "contains");
    const caseSensitive = Boolean(data.case_sensitive);
    return matchKeyword(ctx.messageText, match, matchType, caseSensitive);
  }

  if (conditionType === "follower") {
    if (data.require_follower === false) return true;
    let state = followerState;
    if (!state && deps.checkFollower) {
      state = await deps.checkFollower();
      setFollower(state);
    }
    const follows = state?.follows ?? null;
    if (follows === true) return true;
    return false;
  }

  if (conditionType === "schedule") {
    return evaluateSchedule(data, ctx.now ?? new Date());
  }

  if (conditionType === "first_message_only") {
    return ctx.isFirstMessage === true;
  }

  return true;
}

function outgoingEdges(edges: FlowEdge[], nodeId: string, handle?: string | null): FlowEdge[] {
  return edges.filter((e) => {
    if (e.source !== nodeId) return false;
    if (handle == null || handle === "") return true;
    const sh = e.sourceHandle ?? "yes";
    return sh === handle;
  });
}

function nodeMap(nodes: FlowNode[]): Map<string, FlowNode> {
  const m = new Map<string, FlowNode>();
  for (const n of nodes) m.set(n.id, n);
  return m;
}

function actionFromNodeData(data: Record<string, unknown> | undefined): ResolvedFlowAction | null {
  if (!data) return null;
  const type = (data.action as ResolvedFlowActionType) || "ai_reply";
  const valid: ResolvedFlowActionType[] = [
    "ai_reply",
    "template_reply",
    "send_link",
    "suppress",
    "qualify_lead_only",
  ];
  const t = valid.includes(type) ? type : "ai_reply";
  return {
    type: t,
    templateText: typeof data.template_text === "string" ? data.template_text : undefined,
    url: typeof data.url === "string" ? data.url : undefined,
  };
}

/**
 * Walk a flow graph from matching trigger nodes and return the first terminal action, if any.
 */
export async function evaluateFlowDefinition(
  def: FlowDefinition,
  ctx: FlowEvalContext,
  deps: FlowEvalDeps = {},
): Promise<FlowEvalResult> {
  const nodes = def.nodes ?? [];
  const edges = def.edges ?? [];
  const map = nodeMap(nodes);
  const visited: FlowEvalResult["visited"] = [];
  let followerCheck: { follows: boolean | null; source?: string } | undefined;

  const triggers = nodes.filter((n) => n.type === "trigger" && channelMatches(n.data?.channel as string, ctx.channel));

  async function walk(nodeId: string, visitedIds: Set<string>): Promise<ResolvedFlowAction | null> {
    if (visitedIds.has(nodeId)) return null;
    visitedIds.add(nodeId);

    const node = map.get(nodeId);
    if (!node) return null;

    const type = node.type ?? "action";
    const data = node.data ?? {};

    if (type === "trigger") {
      const next = outgoingEdges(edges, nodeId, null);
      for (const e of next) {
        const r = await walk(e.target, visitedIds);
        if (r) return r;
      }
      return null;
    }

    if (type === "condition") {
      const passed = await evaluateCondition(data, ctx, deps, followerCheck, (v) => {
        followerCheck = v;
      });
      visited.push({ nodeId, passed, meta: { conditionType: data.conditionType } });

      const outs = edges.filter((e) => e.source === nodeId);
      const nextEdges = outs.filter((e) => {
        const h = e.sourceHandle;
        if (passed) return h !== "no";
        return h === "no";
      });

      if (
        !passed &&
        data.conditionType === "follower" &&
        typeof data.else_message === "string" &&
        data.else_message.trim()
      ) {
        const hasExplicitNo = outs.some((e) => e.sourceHandle === "no");
        if (!hasExplicitNo || nextEdges.length === 0) {
          return { type: "template_reply", templateText: data.else_message.trim() };
        }
      }

      for (const e of nextEdges) {
        const r = await walk(e.target, new Set(visitedIds));
        if (r) return r;
      }
      return null;
    }

    if (type === "action") {
      visited.push({ nodeId, passed: null });
      return actionFromNodeData(data);
    }

    return null;
  }

  for (const t of triggers) {
    const action = await walk(t.id, new Set());
    if (action) {
      return { action, followerCheck, visited };
    }
  }

  return { action: null, followerCheck, visited };
}

export function buildConditionsMeta(def: FlowDefinition): Record<string, unknown> {
  const nodes = def.nodes ?? [];
  const summary: Record<string, unknown> = { conditions: [] as unknown[] };
  const list = summary.conditions as Record<string, unknown>[];

  for (const n of nodes) {
    if (n.type !== "condition") continue;
    const d = n.data ?? {};
    list.push({
      id: n.id,
      conditionType: d.conditionType ?? "keyword",
      match: d.match,
      require_follower: d.require_follower,
      has_else_message: Boolean(typeof d.else_message === "string" && d.else_message),
      first_message_only: d.conditionType === "first_message_only",
    });
  }
  return summary;
}
