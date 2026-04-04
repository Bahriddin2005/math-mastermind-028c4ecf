/**
 * Progress Repository
 * ===================
 * Progress Engine natijalarini database ga yozish.
 */

import { supabase } from '@/integrations/supabase/client';
import type { ProgressResult } from './progressEngine';
import { updateLeaderboardStats } from './leaderboardEngine';

/**
 * Session progress natijalarini database ga saqlash
 */
export async function saveProgressResult(result: ProgressResult): Promise<void> {
  const { sessionSummary, xp, level, streak, topicProgress } = result;
  const userId = sessionSummary.userId;

  // 1. Get current profile data first
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('total_problems_solved')
    .eq('user_id', userId)
    .single();

  const currentSolved = currentProfile?.total_problems_solved || 0;

  // Update profiles table (total_score as XP, streaks, problems solved)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      total_score: xp.newTotalXp,
      current_streak: streak.currentStreak,
      best_streak: streak.bestStreak,
      last_active_date: streak.lastPracticeDate,
      total_problems_solved: currentSolved + sessionSummary.attemptsCount,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (profileError) {
    console.error('Profile update error:', profileError);
  }

  // 2. Upsert topic_progress
  const { data: existingTopic } = await supabase
    .from('topic_progress' as any)
    .select('id')
    .eq('user_id', userId)
    .eq('topic', topicProgress.topic)
    .eq('operation', topicProgress.operation)
    .maybeSingle();

  if (existingTopic) {
    await supabase
      .from('topic_progress' as any)
      .update({
        attempts_count: topicProgress.attemptsCount,
        correct_count: topicProgress.correctCount,
        avg_response_time_ms: topicProgress.avgResponseTimeMs,
        mastery_percent: topicProgress.masteryPercent,
        current_difficulty: topicProgress.difficultyAfter,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', (existingTopic as any).id);
  } else {
    await supabase
      .from('topic_progress' as any)
      .insert({
        user_id: userId,
        topic: topicProgress.topic,
        operation: topicProgress.operation,
        main_formula: topicProgress.mainFormula,
        attempts_count: topicProgress.attemptsCount,
        correct_count: topicProgress.correctCount,
        avg_response_time_ms: topicProgress.avgResponseTimeMs,
        mastery_percent: topicProgress.masteryPercent,
        current_difficulty: topicProgress.difficultyAfter,
      } as any);
  }

  // 3. Insert session_progress_logs
  if (sessionSummary.sessionId) {
    await supabase
      .from('session_progress_logs' as any)
      .insert({
        user_id: userId,
        session_id: sessionSummary.sessionId,
        topic: sessionSummary.topic,
        operation: sessionSummary.operation,
        main_formula: sessionSummary.mainFormula,
        digits_count: sessionSummary.digitsCount,
        terms_count: sessionSummary.termsCount,
        attempts_count: sessionSummary.attemptsCount,
        correct_count: sessionSummary.correctCount,
        wrong_count: sessionSummary.wrongCount,
        accuracy_percent: sessionSummary.accuracyPercent,
        avg_response_time_ms: sessionSummary.avgResponseTimeMs,
        xp_earned: xp.earned,
        old_level: level.oldLevel,
        new_level: level.newLevel,
        level_up: level.levelUp,
        old_difficulty: sessionSummary.difficultyBefore,
        new_difficulty: sessionSummary.difficultyAfter,
        streak_after_session: streak.currentStreak,
      } as any);
  }

  // 4. Update leaderboard period stats
  try {
    await updateLeaderboardStats({
      userId,
      topic: topicProgress.topic,
      operation: topicProgress.operation,
      mainFormula: topicProgress.mainFormula,
      xpEarned: xp.earned,
      attemptsCount: sessionSummary.attemptsCount,
      correctCount: sessionSummary.correctCount,
      avgResponseTimeMs: sessionSummary.avgResponseTimeMs,
    });
  } catch (e) {
    console.error('Leaderboard update error:', e);
  }
}

/**
 * Topic progress yuklash
 */
export async function loadTopicProgress(
  userId: string,
  topic: string,
  operation: string
): Promise<{
  attemptsCount: number;
  correctCount: number;
  avgResponseTimeMs: number;
  currentDifficulty: string;
} | null> {
  const { data } = await supabase
    .from('topic_progress' as any)
    .select('attempts_count, correct_count, avg_response_time_ms, current_difficulty')
    .eq('user_id', userId)
    .eq('topic', topic)
    .eq('operation', operation)
    .maybeSingle();

  if (!data) return null;
  const d = data as any;
  return {
    attemptsCount: d.attempts_count || 0,
    correctCount: d.correct_count || 0,
    avgResponseTimeMs: d.avg_response_time_ms || 0,
    currentDifficulty: d.current_difficulty || 'medium',
  };
}

/**
 * User progress summary (dashboard uchun)
 */
export async function loadUserProgressSummary(userId: string): Promise<{
  totalXp: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  totalProblemsSolved: number;
  topicProgress: Array<{
    topic: string;
    operation: string;
    masteryPercent: number;
    currentDifficulty: string;
    attemptsCount: number;
  }>;
}> {
  const [profileRes, topicRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('total_score, current_streak, best_streak, total_problems_solved')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('topic_progress' as any)
      .select('topic, operation, mastery_percent, current_difficulty, attempts_count')
      .eq('user_id', userId),
  ]);

  const profile = profileRes.data;
  const topics = (topicRes.data || []) as any[];

  const totalXp = profile?.total_score || 0;

  return {
    totalXp,
    level: calculateLevelFromXp(totalXp),
    currentStreak: profile?.current_streak || 0,
    bestStreak: profile?.best_streak || 0,
    totalProblemsSolved: profile?.total_problems_solved || 0,
    topicProgress: topics.map((t: any) => ({
      topic: t.topic,
      operation: t.operation,
      masteryPercent: t.mastery_percent || 0,
      currentDifficulty: t.current_difficulty || 'medium',
      attemptsCount: t.attempts_count || 0,
    })),
  };
}

function calculateLevelFromXp(xp: number): number {
  const thresholds = [0, 200, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400];
  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1;
  }
  return level;
}
