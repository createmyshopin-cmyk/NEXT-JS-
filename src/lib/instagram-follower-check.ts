/**
 * Normalized follower_check values for instagram_channel_activity.follower_check (plan: follower | not_following | unknown).
 */
export type FollowerCheckPlanValue = "follower" | "not_following" | "unknown";

export function followerFollowsToPlanValue(follows: boolean | null | undefined): FollowerCheckPlanValue {
  if (follows === true) return "follower";
  if (follows === false) return "not_following";
  return "unknown";
}
