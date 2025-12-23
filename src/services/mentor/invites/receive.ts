/**
 * Mentor Service - Receive/Get Data Functions
 */
"use server";

import { supabase } from "@/lib/supabase";
import {
  MentorInvite,
  MentorPermission,
  TradeComment,
  MenteeOverview,
  Trade,
  JournalEntry,
  DailyRoutine,
} from "@/types";
import { mapInviteFromDB, mapCommentFromDB } from "./types";

/**
 * Lista os convites enviados pelo usuário logado (como mentor).
 */
export async function getSentInvites(): Promise<MentorInvite[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("mentor_invites")
    .select("*")
    .eq("mentor_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getSentInvites] Error:", error);
    return [];
  }

  return (data || []).map(mapInviteFromDB);
}

/**
 * Lista os convites recebidos pelo usuário logado (como mentorado).
 */
export async function getReceivedInvites(): Promise<MentorInvite[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return [];

  const userEmail = user.email.toLowerCase();

  const { data, error } = await supabase
    .from("mentor_invites")
    .select("*")
    .eq("mentee_email", userEmail)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getReceivedInvites] Error:", error);
    return [];
  }

  return (data || []).map(mapInviteFromDB);
}

/**
 * Lista os mentores do usuário logado.
 */
export async function getMentors(): Promise<MentorInvite[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("mentor_invites")
    .select("*")
    .eq("mentee_id", user.id)
    .eq("status", "accepted")
    .order("accepted_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar mentores:", error);
    return [];
  }

  return (data || []).map(mapInviteFromDB);
}

/**
 * Busca todos os mentores do usuário atual.
 */
export async function getMyMentors(): Promise<MentorInvite[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("mentor_invites")
    .select("*")
    .eq("mentee_id", user.id)
    .eq("status", "accepted");

  if (error) {
    console.error("Erro ao buscar mentores:", error);
    return [];
  }

  return (data || []).map((invite) => ({
    id: invite.id,
    mentorId: invite.mentor_id,
    mentorEmail: invite.mentor_email,
    menteeId: invite.mentee_id,
    menteeEmail: invite.mentee_email,
    permission: invite.permission,
    status: invite.status,
    inviteToken: invite.invite_token,
    createdAt: invite.created_at,
    acceptedAt: invite.accepted_at,
    expiresAt: invite.expires_at,
  }));
}

import { prismaTradeRepo } from "@/lib/database/repositories";

// ... existing imports

/**
 * Lista os alunos do usuário logado (convites aceitos onde sou mentor).
 */
export async function getMentees(): Promise<MenteeOverview[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: invites, error } = await supabase
    .from("mentor_invites")
    .select("*")
    .eq("mentor_id", user.id)
    .eq("status", "accepted");

  if (error) {
    console.error("Erro ao buscar alunos:", error);
    return [];
  }

  const mentees: MenteeOverview[] = [];

  for (const invite of invites || []) {
    if (!invite.mentee_id) continue;

    const statsDetail = await prismaTradeRepo.getMenteeStats(invite.mentee_id);
    const stats = statsDetail.data || {
      totalTrades: 0,
      wins: 0,
      winRate: 0,
      recentTradesCount: 0,
      lastTradeDate: undefined,
    };

    mentees.push({
      menteeId: invite.mentee_id,
      menteeName: invite.mentee_email?.split("@")[0] || "Mentorado",
      menteeEmail: invite.mentee_email || "Email não disponível",
      menteeAvatar: undefined,
      permission: invite.permission as MentorPermission,
      totalTrades: stats.totalTrades,
      winRate: stats.winRate,
      recentTradesCount: stats.recentTradesCount,
      lastTradeDate: stats.lastTradeDate,
    });
  }

  return mentees;
}

/**
 * Busca os trades de um aluno específico.
 */
export async function getMenteeTrades(menteeId: string, accountId?: string): Promise<Trade[]> {
  const result = await prismaTradeRepo.getByUserId(menteeId, { accountId });

  if (result.error) {
    console.error("Erro ao buscar trades do aluno:", result.error);
    return [];
  }

  return result.data || [];
}

/**
 * Busca as entradas de diário de um aluno.
 */
export async function getMenteeJournalEntries(
  menteeId: string,
  date: string,
  accountId?: string
): Promise<JournalEntry[]> {
  let query = supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", menteeId)
    .eq("date", date)
    .order("created_at", { ascending: false });

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao buscar entradas de diário do aluno:", error);
    return [];
  }

  return (data || []).map((db) => ({
    id: db.id,
    userId: db.user_id,
    accountId: db.account_id,
    date: db.date,
    title: db.title,
    asset: db.asset,
    tradeIds: db.trade_id ? [db.trade_id] : [],
    images: db.images || [],
    emotion: db.emotion,
    analysis: db.analysis,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }));
}

/**
 * Busca a rotina diária de um aluno.
 */
export async function getMenteeRoutine(
  menteeId: string,
  date: string,
  accountId?: string
): Promise<DailyRoutine | null> {
  let query = supabase.from("daily_routines").select("*").eq("user_id", menteeId).eq("date", date);

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Erro ao buscar rotina do aluno:", error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    accountId: data.account_id,
    date: data.date,
    aerobic: data.aerobic,
    diet: data.diet,
    reading: data.reading,
    meditation: data.meditation,
    preMarket: data.pre_market,
    prayer: data.prayer,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Busca as carteiras permitidas de um mentorado para o mentor atual.
 */
export async function getMenteePermittedAccounts(
  menteeId: string
): Promise<Array<{ id: string; name: string; currency: string }>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: invite } = await supabase
    .from("mentor_invites")
    .select("id")
    .eq("mentor_id", user.id)
    .eq("mentee_id", menteeId)
    .eq("status", "accepted")
    .maybeSingle();

  if (!invite) return [];

  const { data, error } = await supabase
    .from("mentor_account_permissions")
    .select(
      `
            account_id,
            accounts:account_id (id, name, currency)
        `
    )
    .eq("invite_id", invite.id)
    .eq("can_view_trades", true);

  if (error) {
    console.error("Erro ao buscar carteiras permitidas:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = data as any[];

  return rows
    .filter((d) => d.accounts)
    .map((d) => ({
      id: d.accounts.id,
      name: d.accounts.name,
      currency: d.accounts.currency,
    }));
}

// ============================================
// COMMENT FUNCTIONS
// ============================================

/**
 * Adiciona um comentário em um trade.
 */
export async function addTradeComment(
  tradeId: string,
  content: string
): Promise<TradeComment | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("trade_comments")
    .insert({
      trade_id: tradeId,
      user_id: user.id,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao adicionar comentário:", error);
    return null;
  }

  return mapCommentFromDB(data);
}

/**
 * Busca todos os comentários de um trade.
 */
export async function getTradeComments(tradeId: string): Promise<TradeComment[]> {
  const { data, error } = await supabase
    .from("trade_comments")
    .select("*")
    .eq("trade_id", tradeId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar comentários:", error);
    return [];
  }

  return (data || []).map((item) => ({
    ...mapCommentFromDB(item),
    userName: "Mentor",
    userAvatar: undefined,
  }));
}

/**
 * Exclui um comentário pelo ID.
 */
export async function deleteTradeComment(commentId: string): Promise<boolean> {
  const { error } = await supabase.from("trade_comments").delete().eq("id", commentId);

  if (error) {
    console.error("Erro ao deletar comentário:", error);
    return false;
  }

  return true;
}

/**
 * Verifica se o usuário atual pode comentar em um trade específico.
 */
export async function canCommentOnTrade(tradeId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const result = await prismaTradeRepo.getById(tradeId);
  const trade = result.data;

  if (trade?.userId === user.id) return true;

  if (!trade?.userId) return false;

  const { data: invite } = await supabase
    .from("mentor_invites")
    .select("permission")
    .eq("mentor_id", user.id)
    .eq("mentee_id", trade.userId)
    .eq("status", "accepted")
    .eq("permission", "comment")
    .maybeSingle();

  return invite !== null;
}
