import { describe, it, expect } from "vitest";
import { followerFollowsToPlanValue } from "@/lib/instagram-follower-check";

describe("followerFollowsToPlanValue", () => {
  it("maps true to follower", () => {
    expect(followerFollowsToPlanValue(true)).toBe("follower");
  });
  it("maps false to not_following", () => {
    expect(followerFollowsToPlanValue(false)).toBe("not_following");
  });
  it("maps null/undefined to unknown", () => {
    expect(followerFollowsToPlanValue(null)).toBe("unknown");
    expect(followerFollowsToPlanValue(undefined)).toBe("unknown");
  });
});
