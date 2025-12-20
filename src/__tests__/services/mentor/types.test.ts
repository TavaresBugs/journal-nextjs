import { describe, it, expect } from "vitest";
import {
  mapInviteFromDB,
  mapCommentFromDB,
  DBMentorInvite,
  DBTradeComment,
} from "@/services/mentor/invites/types";

describe("Mentor Invites - Types/Mappers", () => {
  describe("mapInviteFromDB", () => {
    it("should map DB mentor invite to domain object", () => {
      const dbInvite: DBMentorInvite = {
        id: "invite-123",
        mentor_id: "mentor-456",
        mentor_email: "mentor@email.com",
        mentee_id: "mentee-789",
        mentee_email: "mentee@email.com",
        permission: "view_trades",
        status: "accepted",
        invite_token: "token-abc",
        created_at: "2024-01-01T10:00:00Z",
        accepted_at: "2024-01-02T10:00:00Z",
        expires_at: "2024-02-01T10:00:00Z",
      };

      const result = mapInviteFromDB(dbInvite);

      expect(result.id).toBe("invite-123");
      expect(result.mentorId).toBe("mentor-456");
      expect(result.mentorEmail).toBe("mentor@email.com");
      expect(result.menteeId).toBe("mentee-789");
      expect(result.menteeEmail).toBe("mentee@email.com");
      expect(result.permission).toBe("view_trades");
      expect(result.status).toBe("accepted");
      expect(result.inviteToken).toBe("token-abc");
      expect(result.createdAt).toBe("2024-01-01T10:00:00Z");
      expect(result.acceptedAt).toBe("2024-01-02T10:00:00Z");
      expect(result.expiresAt).toBe("2024-02-01T10:00:00Z");
    });

    it("should handle null mentee_id", () => {
      const dbInvite: DBMentorInvite = {
        id: "invite-123",
        mentor_id: "mentor-456",
        mentor_email: "mentor@email.com",
        mentee_id: null,
        mentee_email: "mentee@email.com",
        permission: "view_trades",
        status: "pending",
        invite_token: "token-abc",
        created_at: "2024-01-01T10:00:00Z",
        accepted_at: null,
        expires_at: "2024-02-01T10:00:00Z",
      };

      const result = mapInviteFromDB(dbInvite);

      expect(result.menteeId).toBe("");
    });

    it("should handle null accepted_at", () => {
      const dbInvite: DBMentorInvite = {
        id: "invite-123",
        mentor_id: "mentor-456",
        mentor_email: "mentor@email.com",
        mentee_id: "mentee-789",
        mentee_email: "mentee@email.com",
        permission: "view_trades",
        status: "pending",
        invite_token: "token-abc",
        created_at: "2024-01-01T10:00:00Z",
        accepted_at: null,
        expires_at: "2024-02-01T10:00:00Z",
      };

      const result = mapInviteFromDB(dbInvite);

      expect(result.acceptedAt).toBeUndefined();
    });
  });

  describe("mapCommentFromDB", () => {
    it("should map DB trade comment to domain object", () => {
      const dbComment: DBTradeComment = {
        id: "comment-123",
        trade_id: "trade-456",
        user_id: "user-789",
        content: "Great trade!",
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T11:00:00Z",
      };

      const result = mapCommentFromDB(dbComment);

      expect(result.id).toBe("comment-123");
      expect(result.tradeId).toBe("trade-456");
      expect(result.userId).toBe("user-789");
      expect(result.content).toBe("Great trade!");
      expect(result.createdAt).toBe("2024-01-01T10:00:00Z");
      expect(result.updatedAt).toBe("2024-01-01T11:00:00Z");
    });
  });
});
