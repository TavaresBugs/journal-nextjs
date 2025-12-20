"use client";

import { useState, useEffect, useRef } from "react";
import { isAdmin } from "@/services/admin/admin";
import { isMentor } from "@/services/mentor/invites";

export interface UserPermissions {
  isAdminUser: boolean;
  isMentorUser: boolean;
  isLoading: boolean;
}

/**
 * Hook for checking user permissions (admin and mentor status).
 * Caches the result to avoid redundant API calls.
 *
 * @returns User permission states
 */
export function useUserPermissions(): UserPermissions {
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isMentorUser, setIsMentorUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const loadPermissions = async () => {
      if (hasLoadedRef.current) {
        setIsLoading(false);
        return;
      }

      try {
        const [adminStatus, mentorStatus] = await Promise.all([isAdmin(), isMentor()]);

        setIsAdminUser(adminStatus);
        setIsMentorUser(mentorStatus);
        hasLoadedRef.current = true;
      } catch (error) {
        console.error("Error loading user permissions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();
  }, []);

  return {
    isAdminUser,
    isMentorUser,
    isLoading,
  };
}
