import { describe, it, expect } from "vitest";
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  mapInviteFromPrisma,
  mapCommentFromPrisma,
} from "@/lib/database/repositories/MentorRepository";

describe("Mentor Invites - Types/Mappers", () => {
  describe("mapInviteFromPrisma", () => {
    it("should map Prisma mentor invite to domain object", () => {
      // Mocking the complex Prisma return type roughly
      const dbInvite: any = {
        id: "invite-123",
        mentor_id: "mentor-456",
        mentor_email: "mentor@email.com",
        mentee_id: "mentee-789",
        mentee_email: "mentee@email.com",
        permission: "view", // changed from view_trades to view as per repo definition
        status: "accepted",
        invite_token: "token-abc",
        created_at: new Date("2024-01-01T10:00:00Z"),
        accepted_at: new Date("2024-01-02T10:00:00Z"),
        expires_at: new Date("2024-02-01T10:00:00Z"),
        // Mock relations
        users_mentor_invites_mentee_idTousers: {
          profiles: { display_name: "Mentee Name", avatar_url: "url" },
          users_extended_users_extended_idTousers: { name: "Ext Name", avatar_url: "url2" },
        },
      };

      const result = mapInviteFromPrisma(dbInvite);

      expect(result.id).toBe("invite-123");
      expect(result.mentorId).toBe("mentor-456");
      expect(result.mentorEmail).toBe("mentor@email.com");
      expect(result.menteeId).toBe("mentee-789");
      expect(result.menteeEmail).toBe("mentee@email.com");
      expect(result.menteeName).toBe("Mentee Name");
      expect(result.permission).toBe("view");
      expect(result.status).toBe("accepted");
      expect(result.inviteToken).toBe("token-abc");
      // Check ISO strings
      expect(result.createdAt).toBe("2024-01-01T10:00:00.000Z");
      expect(result.acceptedAt).toBe("2024-01-02T10:00:00.000Z");
      expect(result.expiresAt).toBe("2024-02-01T10:00:00.000Z");
    });

    it("should handle null mentee_id and dates", () => {
      const dbInvite: any = {
        id: "invite-123",
        mentor_id: "mentor-456",
        mentor_email: "mentor@email.com",
        mentee_id: null,
        mentee_email: "try@email.com",
        permission: "view",
        status: "pending",
        invite_token: "token-abc",
        created_at: new Date("2024-01-01T10:00:00Z"),
        accepted_at: null,
        expires_at: null,
        users_mentor_invites_mentee_idTousers: null,
      };

      const result = mapInviteFromPrisma(dbInvite);

      expect(result.menteeId).toBeNull();
      expect(result.menteeName).toBe("try"); // fallback to email split
      expect(result.acceptedAt).toBeNull();
      expect(result.expiresAt).toBeNull();
    });
  });

  describe("mapCommentFromPrisma", () => {
    it("should map Prisma trade comment to domain object", () => {
      const dbComment: any = {
        id: "comment-123",
        trade_id: "trade-456",
        user_id: "user-789",
        content: "Great trade!",
        created_at: new Date("2024-01-01T10:00:00Z"),
        updated_at: new Date("2024-01-01T11:00:00Z"),
        users: { email: "user@test.com" },
      };

      const result = mapCommentFromPrisma(dbComment);

      expect(result.id).toBe("comment-123");
      expect(result.tradeId).toBe("trade-456");
      expect(result.userId).toBe("user-789");
      expect(result.content).toBe("Great trade!");
      expect(result.createdAt).toBe("2024-01-01T10:00:00.000Z");
      expect(result.updatedAt).toBe("2024-01-01T11:00:00.000Z");
      expect(result.userName).toBe("user");
    });
  });
});
