import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useConfetti } from '@/hooks/useConfetti';

// Types
interface GamificationState {
  level: number;
  currentXp: number;
  totalXp: number;
  energy: number;
  maxEnergy: number;
  difficultyLevel: number;
  combo: number;
  maxCombo: number;
  isFlagged: boolean;
  suspiciousScore: number;
}

interface ActivityLog {
  responseTimeMs: number;
  isCorrect: boolean;
  timestamp: number;
}

interface UseAdaptiveGamificationOptions {
  gameType: string;
  baseScore?: number;
  enabled?: boolean;
}

// Constants
const COMBO_MULTIPLIER_PER_STREAK = 0.05;
const MAX_COMBO_MULTIPLIER = 2.5;
const XP_PENALTY_FOR_STRUGGLING = 0.85; // -15% XP
const MIN_RESPONSE_TIME_MS = 150; // Anti-cheat: minimum humanly possible response time
const SUSPICIOUS_CONSISTENCY_THRESHOLD = 0.95; // 95% consistency is suspicious
const MAX_ENERGY = 5;
const ENERGY_REGEN_HOURS = 1;

// Calculate XP required for level
const getRequiredXP = (level: number): number => {
  return Math.floor(120 * Math.pow(level, 1.25));
};

// Calculate difficulty multiplier
const getDifficultyMultiplier = (difficultyLevel: number): number => {
  return 1 + (difficultyLevel - 1) * 0.2;
};

// Calculate combo multiplier
const getComboMultiplier = (combo: number): number => {
  return Math.min(1 + combo * COMBO_MULTIPLIER_PER_STREAK, MAX_COMBO_MULTIPLIER);
};

export const useAdaptiveGamification = (options: UseAdaptiveGamificationOptions) => {
  const { gameType, baseScore = 10, enabled = true } = options;
  const { user } = useAuth();
  const { triggerLevelUpConfetti, triggerStreakConfetti } = useConfetti();
  
  const [state, setState] = useState<GamificationState>({
    level: 1,
    currentXp: 0,
    totalXp: 0,
    energy: 5,
    maxEnergy: 5,
    difficultyLevel: 1,
    combo: 0,
    maxCombo: 0,
    isFlagged: false,
    suspiciousScore: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isStruggling, setIsStruggling] = useState(false);
  const [xpUntilLevelUp, setXpUntilLevelUp] = useState(0);
  
  const activityLogRef = useRef<ActivityLog[]>([]);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const lastAnswersRef = useRef<boolean[]>([]);
  const questionsAnsweredRef = useRef<number>(0);

  // Load gamification data
  const loadGamificationData = useCallback(async () => {
    if (!user || !enabled) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading gamification:', error);
        return;
      }

      if (data) {
        // Calculate regenerated energy
        const lastUpdate = new Date(data.last_energy_update);
        const now = new Date();
        const hoursPassed = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
        const regeneratedEnergy = Math.floor(hoursPassed / ENERGY_REGEN_HOURS);
        const newEnergy = Math.min(data.energy + regeneratedEnergy, MAX_ENERGY);

        setState({
          level: data.level,
          currentXp: data.current_xp,
          totalXp: data.total_xp,
          energy: newEnergy,
          maxEnergy: data.max_energy,
          difficultyLevel: data.difficulty_level,
          combo: 0,
          maxCombo: data.max_combo,
          isFlagged: data.is_flagged,
          suspiciousScore: data.suspicious_score,
        });

        lastAnswersRef.current = data.last_5_results || [];
        setXpUntilLevelUp(getRequiredXP(data.level) - data.current_xp);

        // Update energy in database if regenerated
        if (regeneratedEnergy > 0 && newEnergy !== data.energy) {
          await supabase
            .from('user_gamification')
            .update({ 
              energy: newEnergy, 
              last_energy_update: now.toISOString() 
            })
            .eq('user_id', user.id);
        }
      } else {
        // Create new gamification record
        const { error: insertError } = await supabase
          .from('user_gamification')
          .insert({ user_id: user.id });

        if (insertError) {
          console.error('Error creating gamification record:', insertError);
        }
      }
    } catch (err) {
      console.error('Error in loadGamificationData:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, enabled]);

  useEffect(() => {
    loadGamificationData();
  }, [loadGamificationData]);

  // Anti-cheat: Check for suspicious activity
  const checkForSuspiciousActivity = useCallback((responseTimeMs: number, isCorrect: boolean): number => {
    activityLogRef.current.push({
      responseTimeMs,
      isCorrect,
      timestamp: Date.now(),
    });

    // Keep only last 20 activities for analysis
    if (activityLogRef.current.length > 20) {
      activityLogRef.current = activityLogRef.current.slice(-20);
    }

    let suspiciousPoints = 0;

    // Check 1: Response too fast (inhuman)
    if (responseTimeMs < MIN_RESPONSE_TIME_MS) {
      suspiciousPoints += 30;
    }

    // Check 2: Consistent response times (bot-like behavior)
    if (activityLogRef.current.length >= 10) {
      const times = activityLogRef.current.map(a => a.responseTimeMs);
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const variance = times.reduce((sum, t) => sum + Math.pow(t - avgTime, 2), 0) / times.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / avgTime;

      // Very low variation is suspicious
      if (coefficientOfVariation < 0.1) {
        suspiciousPoints += 25;
      }
    }

    // Check 3: 24/7 activity pattern (check timestamps)
    const recentActivities = activityLogRef.current.filter(
      a => Date.now() - a.timestamp < 24 * 60 * 60 * 1000
    );
    if (recentActivities.length > 500) {
      suspiciousPoints += 20;
    }

    return suspiciousPoints;
  }, []);

  // Dynamic Difficulty Adjustment (DDA)
  const adjustDifficulty = useCallback(() => {
    questionsAnsweredRef.current++;
    
    // Check every 5 questions
    if (questionsAnsweredRef.current % 5 !== 0) return;

    const last5 = lastAnswersRef.current.slice(-5);
    if (last5.length < 5) return;

    const incorrectCount = last5.filter(r => !r).length;
    const correctStreak = last5.every(r => r);

    if (incorrectCount >= 3 && state.difficultyLevel > 1) {
      // Struggling: decrease difficulty
      setState(prev => ({
        ...prev,
        difficultyLevel: Math.max(1, prev.difficultyLevel - 1),
      }));
      setIsStruggling(true);
      toast.info('Qiyinlik darajasi pasaytirildi');
    } else if (correctStreak && state.combo >= 5 && state.difficultyLevel < 10) {
      // Doing well: increase difficulty
      setState(prev => ({
        ...prev,
        difficultyLevel: Math.min(10, prev.difficultyLevel + 1),
      }));
      setIsStruggling(false);
      toast.success('Qiyinlik darajasi oshirildi! 🔥');
    }
  }, [state.difficultyLevel, state.combo]);

  // Process answer and calculate rewards
  const processAnswer = useCallback(async (
    isCorrect: boolean,
    responseTimeMs: number,
    problemDifficulty: number = 1
  ): Promise<{ xpEarned: number; scoreEarned: number; leveledUp: boolean }> => {
    if (!user || !enabled) {
      return { xpEarned: 0, scoreEarned: 0, leveledUp: false };
    }

    // Update last answers
    lastAnswersRef.current = [...lastAnswersRef.current.slice(-4), isCorrect];

    // Check for suspicious activity
    const suspiciousPoints = checkForSuspiciousActivity(responseTimeMs, isCorrect);
    const newSuspiciousScore = Math.min(100, state.suspiciousScore + suspiciousPoints);
    const isFlagged = newSuspiciousScore >= 70;

    let xpEarned = 0;
    let scoreEarned = 0;
    let leveledUp = false;
    let newLevel = state.level;
    let newCurrentXp = state.currentXp;
    let newCombo = state.combo;
    let newMaxCombo = state.maxCombo;

    if (isCorrect) {
      newCombo = state.combo + 1;
      newMaxCombo = Math.max(newMaxCombo, newCombo);

      // Celebration for streak milestones
      if (newCombo === 5 || (newCombo > 5 && newCombo % 5 === 0)) {
        triggerStreakConfetti(newCombo);
      }

      // Calculate score: base * difficulty * performance * comboMultiplier
      const difficultyMultiplier = getDifficultyMultiplier(state.difficultyLevel);
      const performanceMultiplier = Math.max(0.5, 1 - (responseTimeMs / 10000)); // Faster = better
      const comboMultiplier = getComboMultiplier(newCombo);
      
      scoreEarned = Math.floor(
        baseScore * 
        difficultyMultiplier * 
        performanceMultiplier * 
        comboMultiplier * 
        problemDifficulty
      );

      // XP calculation (affected by struggling status and anti-cheat)
      let xpMultiplier = 1;
      if (isStruggling) {
        xpMultiplier *= XP_PENALTY_FOR_STRUGGLING;
      }
      if (isFlagged) {
        xpMultiplier = 0; // No XP if flagged
        toast.error('Shubhali faoliyat aniqlandi. XP berilmadi.');
      }
      
      xpEarned = Math.floor(scoreEarned * 0.5 * xpMultiplier);

      // Level up check
      newCurrentXp += xpEarned;
      const requiredXP = getRequiredXP(state.level);
      
      if (newCurrentXp >= requiredXP && !isFlagged) {
        leveledUp = true;
        newLevel = state.level + 1;
        newCurrentXp = newCurrentXp - requiredXP;
        triggerLevelUpConfetti();
        toast.success(`Level UP! 🎉 Siz endi ${newLevel}-darajaga chiqdingiz!`);
      }

      // Check for \"1 question until level up\"
      const xpRemaining = getRequiredXP(newLevel) - newCurrentXp;
      if (xpRemaining <= baseScore * 2 && !leveledUp) {
        setXpUntilLevelUp(xpRemaining);
      }
    } else {
      // Wrong answer: reset combo
      newCombo = 0;
    }

    // Update state
    setState(prev => ({
      ...prev,
      combo: newCombo,
      maxCombo: newMaxCombo,
      currentXp: newCurrentXp,
      totalXp: prev.totalXp + xpEarned,
      level: newLevel,
      suspiciousScore: newSuspiciousScore,
      isFlagged,
    }));

    setXpUntilLevelUp(getRequiredXP(newLevel) - newCurrentXp);

    // Adjust difficulty
    adjustDifficulty();

    // Save to database
    try {
      await supabase.from('user_gamification').update({
        level: newLevel,
        current_xp: newCurrentXp,
        total_xp: state.totalXp + xpEarned,
        combo: newCombo,
        max_combo: newMaxCombo,
        difficulty_level: state.difficultyLevel,
        last_5_results: lastAnswersRef.current,
        suspicious_score: newSuspiciousScore,
        is_flagged: isFlagged,
        total_correct: state.isFlagged ? undefined : (isCorrect ? 1 : 0),
        total_incorrect: state.isFlagged ? undefined : (isCorrect ? 0 : 1),
      }).eq('user_id', user.id);

      // Log activity
      await supabase.from('user_activity_log').insert({
        user_id: user.id,
        activity_type: 'answer',
        game_type: gameType,
        response_time_ms: responseTimeMs,
        is_correct: isCorrect,
        difficulty_level: state.difficultyLevel,
        xp_earned: xpEarned,
        score_earned: scoreEarned,
        session_id: sessionIdRef.current,
        metadata: {
          combo: newCombo,
          suspicious_score: newSuspiciousScore,
        },
      });
    } catch (err) {
      console.error('Error saving gamification data:', err);
    }

    return { xpEarned, scoreEarned, leveledUp };
  }, [
    user, enabled, state, isStruggling, baseScore, gameType,
    checkForSuspiciousActivity, adjustDifficulty, 
    triggerLevelUpConfetti, triggerStreakConfetti
  ]);

  // Use energy
  const useEnergy = useCallback(async (amount: number = 1): Promise<boolean> => {
    if (!user || state.energy < amount) {
      toast.error('Yetarli energiya yo\'q!');
      return false;
    }

    const newEnergy = state.energy - amount;
    setState(prev => ({ ...prev, energy: newEnergy }));

    await supabase
      .from('user_gamification')
      .update({ energy: newEnergy, last_energy_update: new Date().toISOString() })
      .eq('user_id', user.id);

    return true;
  }, [user, state.energy]);

  // Get bonus challenge
  const checkBonusAvailability = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    const { data } = await supabase
      .from('user_gamification')
      .select('bonus_cooldown_until')
      .eq('user_id', user.id)
      .single();

    if (!data?.bonus_cooldown_until) return true;
    
    return new Date() > new Date(data.bonus_cooldown_until);
  }, [user]);

  // Complete bonus challenge
  const completeBonusChallenge = useCallback(async (rewardXp: number, rewardEnergy: number) => {
    if (!user) return;

    const cooldownHours = 3 + Math.random() * 3; // 3-6 hours
    const cooldownUntil = new Date(Date.now() + cooldownHours * 60 * 60 * 1000);

    const newEnergy = Math.min(state.energy + rewardEnergy, MAX_ENERGY);
    const newCurrentXp = state.currentXp + rewardXp;
    
    let newLevel = state.level;
    let adjustedXp = newCurrentXp;
    
    if (newCurrentXp >= getRequiredXP(state.level)) {
      newLevel++;
      adjustedXp = newCurrentXp - getRequiredXP(state.level);
      triggerLevelUpConfetti();
      toast.success(`Level UP! 🎉 Siz endi ${newLevel}-darajaga chiqdingiz!`);
    }

    setState(prev => ({
      ...prev,
      energy: newEnergy,
      currentXp: adjustedXp,
      totalXp: prev.totalXp + rewardXp,
      level: newLevel,
    }));

    await supabase.from('user_gamification').update({
      energy: newEnergy,
      current_xp: adjustedXp,
      total_xp: state.totalXp + rewardXp,
      level: newLevel,
      bonus_cooldown_until: cooldownUntil.toISOString(),
    }).eq('user_id', user.id);

    toast.success(`Bonus olindi: +${rewardXp} XP, +${rewardEnergy} Energiya!`);
  }, [user, state, triggerLevelUpConfetti]);

  // Reset combo (when game ends or restarts)
  const resetCombo = useCallback(() => {
    setState(prev => ({ ...prev, combo: 0 }));
    questionsAnsweredRef.current = 0;
    lastAnswersRef.current = [];
    sessionIdRef.current = crypto.randomUUID();
  }, []);

  // Get progress percentage towards next level
  const getLevelProgress = useCallback((): number => {
    const required = getRequiredXP(state.level);
    return Math.min(100, (state.currentXp / required) * 100);
  }, [state.level, state.currentXp]);

  return {
    // State
    level: state.level,
    currentXp: state.currentXp,
    totalXp: state.totalXp,
    energy: state.energy,
    maxEnergy: state.maxEnergy,
    difficultyLevel: state.difficultyLevel,
    combo: state.combo,
    maxCombo: state.maxCombo,
    isFlagged: state.isFlagged,
    isLoading,
    isStruggling,
    xpUntilLevelUp,
    
    // Computed
    comboMultiplier: getComboMultiplier(state.combo),
    levelProgress: getLevelProgress(),
    requiredXp: getRequiredXP(state.level),
    
    // Methods
    processAnswer,
    useEnergy,
    checkBonusAvailability,
    completeBonusChallenge,
    resetCombo,
    reload: loadGamificationData,
  };
};
