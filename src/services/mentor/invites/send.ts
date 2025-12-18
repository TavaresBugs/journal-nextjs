/**
 * Mentor Service - Send Invites
 */

import { supabase } from "@/lib/supabase";
import { MentorInvite, MentorPermission } from "@/types";
import { mapInviteFromDB } from "./types";

/**
 * Verifica se o usuário atual é mentor.
 */
export async function isMentor(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: userExtended } = await supabase
    .from("users_extended")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (userExtended?.role === "mentor") {
    return true;
  }

  const { data, error } = await supabase
    .from("mentor_invites")
    .select("id")
    .eq("mentor_id", user.id)
    .eq("status", "accepted")
    .limit(1);

  if (error) {
    console.error("Erro ao verificar status de mentor:", error);
    return false;
  }

  return (data?.length || 0) > 0;
}

/**
 * Envia um convite de mentoria para um aluno.
 */
export async function inviteMentee(
  menteeEmail: string,
  permission: MentorPermission = "view"
): Promise<MentorInvite | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("[inviteMentee] No authenticated user");
    return null;
  }

  // Check for existing pending invite
  const { data: existingInvite, error: checkError } = await supabase
    .from("mentor_invites")
    .select()
    .eq("mentor_id", user.id)
    .eq("mentee_email", menteeEmail.toLowerCase())
    .eq("status", "pending")
    .maybeSingle();

  if (checkError) {
    console.error("[inviteMentee] Error checking existing invite:", checkError);
  }

  if (existingInvite) {
    return mapInviteFromDB(existingInvite);
  }

  const { data, error } = await supabase
    .from("mentor_invites")
    .insert({
      mentor_id: user.id,
      mentor_email: user.email?.toLowerCase(),
      mentee_email: menteeEmail.toLowerCase(),
      permission,
    })
    .select()
    .single();

  if (error) {
    console.error("[inviteMentee] Error creating invite:", error);
    return null;
  }

  return mapInviteFromDB(data);
}

/**
 * @deprecated Use inviteMentee instead
 */
export async function inviteMentor(
  mentorEmail: string,
  permission: MentorPermission = "view"
): Promise<MentorInvite | null> {
  console.warn("inviteMentor is deprecated, use inviteMentee instead");
  return inviteMentee(mentorEmail, permission);
}
