import { describe, it, expect } from "vitest";
import { evaluateFlowDefinition, buildConditionsMeta } from "@/lib/flow-engine";

describe("flow-engine", () => {
  it("walks trigger to action", async () => {
    const def = {
      nodes: [
        { id: "t1", type: "trigger", data: { channel: "dm" } },
        { id: "a1", type: "action", data: { action: "template_reply", template_text: "Hi" } },
      ],
      edges: [{ source: "t1", target: "a1" }],
    };
    const r = await evaluateFlowDefinition(def, {
      channel: "dm",
      messageText: "x",
      senderIgId: "1",
      tenantId: "t",
    });
    expect(r.action?.type).toBe("template_reply");
    expect(r.action?.templateText).toBe("Hi");
  });

  it("branches keyword condition yes/no", async () => {
    const def = {
      nodes: [
        { id: "t1", type: "trigger", data: { channel: "dm" } },
        {
          id: "c1",
          type: "condition",
          data: { conditionType: "keyword", match: "book", match_type: "contains", case_sensitive: false },
        },
        { id: "aY", type: "action", data: { action: "template_reply", template_text: "YES" } },
        { id: "aN", type: "action", data: { action: "template_reply", template_text: "NO" } },
      ],
      edges: [
        { source: "t1", target: "c1" },
        { source: "c1", target: "aY", sourceHandle: "yes" },
        { source: "c1", target: "aN", sourceHandle: "no" },
      ],
    };
    const yes = await evaluateFlowDefinition(def, {
      channel: "dm",
      messageText: "I want to book",
      senderIgId: "1",
      tenantId: "t",
    });
    expect(yes.action?.templateText).toBe("YES");
    const no = await evaluateFlowDefinition(def, {
      channel: "dm",
      messageText: "hello",
      senderIgId: "1",
      tenantId: "t",
    });
    expect(no.action?.templateText).toBe("NO");
  });

  it("treats unknown follower as no branch (fail closed)", async () => {
    const def = {
      nodes: [
        { id: "t1", type: "trigger", data: { channel: "dm" } },
        { id: "c1", type: "condition", data: { conditionType: "follower" } },
        { id: "aY", type: "action", data: { action: "template_reply", template_text: "VIP" } },
        { id: "aN", type: "action", data: { action: "template_reply", template_text: "FOLLOW" } },
      ],
      edges: [
        { source: "t1", target: "c1" },
        { source: "c1", target: "aY", sourceHandle: "yes" },
        { source: "c1", target: "aN", sourceHandle: "no" },
      ],
    };
    const r = await evaluateFlowDefinition(
      def,
      { channel: "dm", messageText: "x", senderIgId: "1", tenantId: "t" },
      { checkFollower: async () => ({ follows: null }) },
    );
    expect(r.action?.templateText).toBe("FOLLOW");
  });

  it("first_message_only branches on isFirstMessage", async () => {
    const def = {
      nodes: [
        { id: "t1", type: "trigger", data: { channel: "dm" } },
        { id: "c1", type: "condition", data: { conditionType: "first_message_only" } },
        { id: "a1", type: "action", data: { action: "template_reply", template_text: "WELCOME" } },
        { id: "a2", type: "action", data: { action: "template_reply", template_text: "AGAIN" } },
      ],
      edges: [
        { source: "t1", target: "c1" },
        { source: "c1", target: "a1", sourceHandle: "yes" },
        { source: "c1", target: "a2", sourceHandle: "no" },
      ],
    };
    const first = await evaluateFlowDefinition(def, {
      channel: "dm",
      messageText: "hi",
      senderIgId: "1",
      tenantId: "t",
      isFirstMessage: true,
    });
    expect(first.action?.templateText).toBe("WELCOME");
    const again = await evaluateFlowDefinition(def, {
      channel: "dm",
      messageText: "hi",
      senderIgId: "1",
      tenantId: "t",
      isFirstMessage: false,
    });
    expect(again.action?.templateText).toBe("AGAIN");
  });

  it("follower with require_follower false skips API and passes yes", async () => {
    const def = {
      nodes: [
        { id: "t1", type: "trigger", data: { channel: "dm" } },
        { id: "c1", type: "condition", data: { conditionType: "follower", require_follower: false } },
        { id: "aY", type: "action", data: { action: "template_reply", template_text: "OK" } },
        { id: "aN", type: "action", data: { action: "template_reply", template_text: "BAD" } },
      ],
      edges: [
        { source: "t1", target: "c1" },
        { source: "c1", target: "aY", sourceHandle: "yes" },
        { source: "c1", target: "aN", sourceHandle: "no" },
      ],
    };
    const r = await evaluateFlowDefinition(
      def,
      { channel: "dm", messageText: "x", senderIgId: "1", tenantId: "t" },
      { checkFollower: async () => ({ follows: false }) },
    );
    expect(r.action?.templateText).toBe("OK");
  });

  it("buildConditionsMeta lists condition nodes", () => {
    const def = {
      nodes: [
        { id: "c1", type: "condition", data: { conditionType: "keyword", match: "hi" } },
      ],
      edges: [],
    };
    const m = buildConditionsMeta(def);
    expect(Array.isArray((m as { conditions: unknown[] }).conditions)).toBe(true);
    expect((m as { conditions: { id: string }[] }).conditions[0].id).toBe("c1");
  });
});
