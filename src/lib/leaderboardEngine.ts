/**
 * 19-BLOK: LEADERBOARD ENGINE
 * ============================
 * Period-based leaderboard stats management.
 */

import { supabase } from '@/integrations/supabase/client';

// ============= PERIOD KEYS =============

export function getPeriodKeys(today: Date = new Date()): Record<string, string> {
  const iso = today.toISOString().split('T')[0];
  const year = today.getFullYear();
  // ISO week calculation
  const jan1 = new Date(year, 0, 1);
  const days = Math.floor((today.getTime() - jan1.getTime()) / (1000 * 60 * 60 * 24));
  const weekNum = Math.ceil((days + jan1.getDay() + 1) / 7);

  return {
    daily: iso,
    weekly: `${year}-W${String(weekNum).padStart(2, '0')}`,
    monthly: iso.substring(0, 7),
    all_time: 'all_time',
  };
}

// ============= MERGE AVG =============

function mergeAverage(prevCount: number, prevAvg: number, newCount: number, newAvg: number): number {
  const total = prevCount + newCount;
  if (total === 0) return 0;
  return Math.round((prevCount * prevAvg + newCount * newAvg) / total);
}

// ============= SESSION LEADERBOARD UPDATE =============

export interface LeaderboardSessionInput {
  userId: string;
  topic: string;
  operation: string;
  mainFormula: number | null;
  xpEarned: number;
  attemptsCount: number;
  correctCount: number;
  avgResponseTimeMs: number;
}

export async function updateLeaderboardStats(input: LeaderboardSessionInput): Promise<void> {
  const periods = getPeriodKeys();

  for (const [periodType, periodKey] of Object.entries(periods)) {
    // Global update (topic=null)
    await upsertPeriodStat(input.userId, periodType, periodKey, null, null, null, input);
    // Topic-based update
    await upsertPeriodStat(input.userId, periodType, periodKey, input.topic, input.operation, input.mainFormula, input);
  }
}

async function upsertPeriodStat(
  userId: string,
  periodType: string,
  periodKey: string,
  topic: string | null,
  operation: string | null,
  mainFormula: number | null,
  input: LeaderboardSessionInput
): Promise<void> {
  // Try to find existing
  let query = supabase
    .from('user_period_stats' as any)
    .select('id, xp_earned, attempts_count, correct_count, avg_response_time_ms')
    .eq('user_id', userId)
    .eq('period_type', periodType)
    .eq('period_key', periodKey);

  if (topic === null) {
    query = query.is('topic', null);
  } else {
    query = query.eq('topic', topic);
  }
  if (operation === null) {
    query = query.is('operation', null);
  } else {
    query = query.eq('operation', operation);
  }
  if (mainFormula === null) {
    query = query.is('main_formula', null);
  } else {
    query = query.eq('main_formula', mainFormula);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    const e = existing as any;
    const newAttempts = (e.attempts_count || 0) + input.attemptsCount;
    const newCorrect = (e.correct_count || 0) + input.correctCount;
    const newXp = (e.xp_earned || 0) + input.xpEarned;
    const newAvg = mergeAverage(
      e.attempts_count || 0, e.avg_response_time_ms || 0,
      input.attemptsCount, input.avgResponseTimeMs
    );

    await supabase
      .from('user_period_stats' as any)
      .update({
        xp_earned: newXp,
        attempts_count: newAttempts,
        correct_count: newCorrect,
        avg_response_time_ms: newAvg,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', e.id);
  } else {
    await supabase
      .from('user_period_stats' as any)
      .insert({
        user_id: userId,
        period_type: periodType,
        period_key: periodKey,
        topic,
        operation,
        main_formula: mainFormula,
        xp_earned: input.xpEarned,
        attempts_count: input.attemptsCount,
        correct_count: input.correctCount,
        avg_response_time_ms: input.avgResponseTimeMs,
      } as any);
  }
}

// ============= LEADERBOARD QUERIES =============

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl: string | null;
  xpEarned: number;
  attemptsCount: number;
  correctCount: number;
  avgResponseTimeMs: number;
  rank: number;
}

export async function getTopLeaderboard(
  periodType: string,
  periodKey: string,
  limit: number = 10,
  topic?: string | null,
  operation?: string | null,
  mainFormula?: number | null,
): Promise<LeaderboardEntry[]> {
  let query = supabase
    .from('user_period_stats' as any)
    .select('user_id, xp_earned, attempts_count, correct_count, avg_response_time_ms')
    .eq('period_type', periodType)
    .eq('period_key', periodKey);

  if (topic === undefined || topic === null) {
    query = query.is('topic', null);
  } else {
    query = query.eq('topic', topic);
  }
  if (operation === undefined || operation === null) {
    query = query.is('operation', null);
  } else {
    query = query.eq('operation', operation);
  }
  if (mainFormula === undefined || mainFormula === null) {
    query = query.is('main_formula', null);
  } else {
    query = query.eq('main_formula', mainFormula);
  }

  const { data: stats } = await query
    .order('xp_earned', { ascending: false })
    .limit(limit);

  if (!stats || stats.length === 0) return [];

  const userIds = (stats as any[]).map((s: any) => s.user_id);
  const { data: profiles } = await supabase.rpc('get_public_profiles_by_ids', { user_ids: userIds });

  const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

  return (stats as any[]).map((s: any, i: number) => {
    const profile = profileMap.get(s.user_id);
    return {
      userId: s.user_id,
      username: profile?.username || 'Unknown',
      avatarUrl: profile?.avatar_url || null,
      xpEarned: s.xp_earned,
      attemptsCount: s.attempts_count,
      correctCount: s.correct_count,
      avgResponseTimeMs: s.avg_response_time_ms,
      rank: i + 1,
    };
  });
}

export async function getUserRank(
  userId: string,
  periodType: string,
  periodKey: string,
): Promise<number | null> {
  const { data } = await supabase
    .from('user_period_stats' as any)
    .select('user_id, xp_earned')
    .eq('period_type', periodType)
    .eq('period_key', periodKey)
    .is('topic', null)
    .is('operation', null)
    .order('xp_earned', { ascending: false });

  if (!data) return null;
  const idx = (data as any[]).findIndex((r: any) => r.user_id === userId);
  return idx >= 0 ? idx + 1 : null;
}
