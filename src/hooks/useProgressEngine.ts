/**
 * useProgressEngine hook
 * =====================
 * NumberTrainer uchun progress tracking va session management.
 */

import { useCallback, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { processSessionProgress, type SessionAttempt, type ProgressResult } from '@/lib/progressEngine';
import { saveProgressResult, loadTopicProgress } from '@/lib/progressRepository';
import { supabase } from '@/integrations/supabase/client';

export interface UseProgressEngineOptions {
  topic: string;
  operation: string;
  mainFormula: number | null;
  digitsCount: number;
  termsCount: number;
}

export function useProgressEngine() {
  const { user } = useAuth();
  const attemptsRef = useRef<SessionAttempt[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const [lastResult, setLastResult] = useState<ProgressResult | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

  /** Session boshida chaqirish */
  const startSession = useCallback(() => {
    attemptsRef.current = [];
    sessionIdRef.current = null;
    setShowLevelUp(false);
  }, []);

  /** Har bir javobda chaqirish */
  const recordAttempt = useCallback((attempt: SessionAttempt) => {
    attemptsRef.current.push(attempt);
  }, []);

  /** Session tugaganda chaqirish */
  const finishSession = useCallback(async (
    options: UseProgressEngineOptions,
    gameSessionId?: string
  ): Promise<ProgressResult | null> => {
    if (!user || attemptsRef.current.length === 0) return null;

    sessionIdRef.current = gameSessionId || null;

    try {
      // Load current user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_score, current_streak, best_streak, last_active_date')
        .eq('user_id', user.id)
        .single();

      // Load topic progress
      const topicData = await loadTopicProgress(
        user.id,
        options.topic,
        options.operation
      );

      // Process
      const result = processSessionProgress({
        userId: user.id,
        sessionId: gameSessionId || '',
        topic: options.topic,
        operation: options.operation,
        mainFormula: options.mainFormula,
        digitsCount: options.digitsCount,
        termsCount: options.termsCount,
        currentDifficulty: topicData?.currentDifficulty || 'medium',
        previousTotalXp: profile?.total_score || 0,
        previousLevel: calculateLevelQuick(profile?.total_score || 0),
        previousCurrentStreak: profile?.current_streak || 0,
        previousBestStreak: profile?.best_streak || 0,
        previousLastPracticeDate: profile?.last_active_date || null,
        previousTopicAttemptsCount: topicData?.attemptsCount || 0,
        previousTopicCorrectCount: topicData?.correctCount || 0,
        previousTopicAvgResponseTimeMs: topicData?.avgResponseTimeMs || 0,
        attempts: attemptsRef.current,
      });

      // Save to DB
      await saveProgressResult(result);

      setLastResult(result);
      if (result.level.levelUp) {
        setShowLevelUp(true);
      }

      return result;
    } catch (error) {
      console.error('Progress engine error:', error);
      return null;
    }
  }, [user]);

  const dismissLevelUp = useCallback(() => {
    setShowLevelUp(false);
  }, []);

  return {
    startSession,
    recordAttempt,
    finishSession,
    lastResult,
    showLevelUp,
    dismissLevelUp,
  };
}

function calculateLevelQuick(xp: number): number {
  const thresholds = [0, 200, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400];
  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1;
  }
  return level;
}
