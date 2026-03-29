/**
 * 18-BLOK: PROGRESS ENGINE
 * ========================
 * XP, Level, Streak, Mastery, Adaptive Difficulty hisoblash.
 * 
 * Session tugaganda bu engine chaqiriladi va natijalar
 * database ga yoziladi.
 */

// ============= TYPES =============

export interface SessionAttempt {
  isCorrect: boolean;
  responseTimeMs: number;
  correctAnswer: number;
  userAnswer: number | null;
}

export interface ProgressEngineInput {
  userId: string;
  sessionId: string;
  topic: string;        // oddiy, formula5, formula10plus, hammasi, manfiy, kopaytirish, bolish
  operation: string;    // add, sub, mixed
  mainFormula: number | null;
  digitsCount: number;
  termsCount: number;
  currentDifficulty: string;

  // Previous state from DB
  previousTotalXp: number;
  previousLevel: number;
  previousCurrentStreak: number;
  previousBestStreak: number;
  previousLastPracticeDate: string | null; // ISO date string (YYYY-MM-DD)

  // Previous topic stats
  previousTopicAttemptsCount: number;
  previousTopicCorrectCount: number;
  previousTopicAvgResponseTimeMs: number;

  attempts: SessionAttempt[];
}

export interface ProgressResult {
  sessionSummary: {
    userId: string;
    sessionId: string;
    topic: string;
    operation: string;
    mainFormula: number | null;
    digitsCount: number;
    termsCount: number;
    difficultyBefore: string;
    difficultyAfter: string;
    attemptsCount: number;
    correctCount: number;
    wrongCount: number;
    accuracyPercent: number;
    avgResponseTimeMs: number;
  };
  xp: {
    earned: number;
    previousTotalXp: number;
    newTotalXp: number;
  };
  level: {
    oldLevel: number;
    newLevel: number;
    levelUp: boolean;
  };
  streak: {
    currentStreak: number;
    bestStreak: number;
    lastPracticeDate: string;
  };
  topicProgress: {
    topic: string;
    operation: string;
    mainFormula: number | null;
    attemptsCount: number;
    correctCount: number;
    accuracyPercent: number;
    avgResponseTimeMs: number;
    masteryPercent: number;
    difficultyAfter: string;
  };
}

// ============= LEVEL THRESHOLDS =============

export const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 200,
  3: 500,
  4: 900,
  5: 1400,
  6: 2000,
  7: 2700,
  8: 3500,
  9: 4400,
  10: 5400,
};

// ============= HELPERS =============

export function calculateAttemptXp(isCorrect: boolean, responseTimeMs: number): number {
  let xp = 0;
  if (isCorrect) {
    xp += 10;
    if (responseTimeMs <= 3000) xp += 5;
  }
  return xp;
}

export function calculateAccuracyPercent(correctCount: number, attemptsCount: number): number {
  if (attemptsCount === 0) return 0;
  return Math.round((correctCount / attemptsCount) * 100);
}

export function calculateAvgResponseTime(attempts: SessionAttempt[]): number {
  if (attempts.length === 0) return 0;
  const total = attempts.reduce((sum, a) => sum + a.responseTimeMs, 0);
  return Math.round(total / attempts.length);
}

export function calculateSessionXp(attempts: SessionAttempt[], accuracyPercent: number): number {
  let totalXp = 0;
  for (const attempt of attempts) {
    totalXp += calculateAttemptXp(attempt.isCorrect, attempt.responseTimeMs);
  }
  // Bonus for high accuracy
  if (accuracyPercent >= 90) totalXp += 10;
  return totalXp;
}

export function calculateLevel(totalXp: number): number {
  let level = 1;
  for (const [lvl, threshold] of Object.entries(LEVEL_THRESHOLDS).sort(
    ([a], [b]) => Number(a) - Number(b)
  )) {
    if (totalXp >= threshold) level = Number(lvl);
  }
  return level;
}

export function calculateNewStreak(
  lastPracticeDate: string | null,
  currentStreak: number
): number {
  const today = new Date().toISOString().split('T')[0];
  if (!lastPracticeDate) return 1;
  if (lastPracticeDate === today) return currentStreak;

  const last = new Date(lastPracticeDate);
  const now = new Date(today);
  const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return currentStreak + 1;
  return 1;
}

export function calculateMasteryPercent(
  attemptsCount: number,
  accuracyPercent: number,
  avgResponseTimeMs: number
): number {
  const volumeScore = Math.min(attemptsCount * 2, 40);      // max 40
  const accuracyScore = Math.round(accuracyPercent * 0.4);   // max 40
  const speedScore = avgResponseTimeMs <= 3000 ? 20 
    : avgResponseTimeMs <= 6000 ? 10 : 5;

  return Math.min(volumeScore + accuracyScore + speedScore, 100);
}

/** 9-BLOK: Adaptive difficulty resolution */
function resolveNextDifficulty(
  currentDifficulty: string,
  attempts: SessionAttempt[]
): string {
  if (attempts.length === 0) return currentDifficulty;

  const correctCount = attempts.filter(a => a.isCorrect).length;
  const wrongCount = attempts.length - correctCount;
  const avgTime = calculateAvgResponseTime(attempts);

  // Count consecutive correct/wrong from the end
  let streakCorrect = 0;
  let streakWrong = 0;
  for (let i = attempts.length - 1; i >= 0; i--) {
    if (attempts[i].isCorrect) {
      if (streakWrong > 0) break;
      streakCorrect++;
    } else {
      if (streakCorrect > 0) break;
      streakWrong++;
    }
  }

  // Downgrade
  if (streakWrong >= 2) {
    if (currentDifficulty === 'hard') return 'medium';
    if (currentDifficulty === 'medium') return 'easy';
    return 'easy';
  }

  if (avgTime > 8000 && wrongCount > correctCount) {
    if (currentDifficulty === 'hard') return 'medium';
    if (currentDifficulty === 'medium') return 'easy';
    return 'easy';
  }

  // Upgrade
  if (streakCorrect >= 4 && avgTime <= 3000) {
    if (currentDifficulty === 'easy') return 'medium';
    if (currentDifficulty === 'medium') return 'hard';
    return 'hard';
  }

  return currentDifficulty;
}

// ============= MAIN ENGINE =============

export function processSessionProgress(data: ProgressEngineInput): ProgressResult {
  const attemptsCount = data.attempts.length;
  const correctCount = data.attempts.filter(a => a.isCorrect).length;
  const wrongCount = attemptsCount - correctCount;
  const accuracyPercent = calculateAccuracyPercent(correctCount, attemptsCount);
  const avgResponseTimeMs = calculateAvgResponseTime(data.attempts);

  // XP
  const xpEarned = calculateSessionXp(data.attempts, accuracyPercent);
  const newTotalXp = data.previousTotalXp + xpEarned;

  // Level
  const oldLevel = data.previousLevel;
  const newLevel = calculateLevel(newTotalXp);
  const levelUp = newLevel > oldLevel;

  // Streak
  const newCurrentStreak = calculateNewStreak(
    data.previousLastPracticeDate,
    data.previousCurrentStreak
  );
  const newBestStreak = Math.max(data.previousBestStreak, newCurrentStreak);

  // Difficulty
  const nextDifficulty = resolveNextDifficulty(data.currentDifficulty, data.attempts);

  // Topic progress
  const totalTopicAttempts = data.previousTopicAttemptsCount + attemptsCount;
  const totalTopicCorrect = data.previousTopicCorrectCount + correctCount;
  const previousTotalTime = data.previousTopicAttemptsCount * data.previousTopicAvgResponseTimeMs;
  const currentTotalTime = data.attempts.reduce((sum, a) => sum + a.responseTimeMs, 0);
  const newTopicAvgResponseTimeMs = totalTopicAttempts > 0
    ? Math.round((previousTotalTime + currentTotalTime) / totalTopicAttempts)
    : 0;

  const topicAccuracyPercent = calculateAccuracyPercent(totalTopicCorrect, totalTopicAttempts);
  const topicMasteryPercent = calculateMasteryPercent(
    totalTopicAttempts,
    topicAccuracyPercent,
    newTopicAvgResponseTimeMs
  );

  const today = new Date().toISOString().split('T')[0];

  return {
    sessionSummary: {
      userId: data.userId,
      sessionId: data.sessionId,
      topic: data.topic,
      operation: data.operation,
      mainFormula: data.mainFormula,
      digitsCount: data.digitsCount,
      termsCount: data.termsCount,
      difficultyBefore: data.currentDifficulty,
      difficultyAfter: nextDifficulty,
      attemptsCount,
      correctCount,
      wrongCount,
      accuracyPercent,
      avgResponseTimeMs,
    },
    xp: {
      earned: xpEarned,
      previousTotalXp: data.previousTotalXp,
      newTotalXp,
    },
    level: {
      oldLevel,
      newLevel,
      levelUp,
    },
    streak: {
      currentStreak: newCurrentStreak,
      bestStreak: newBestStreak,
      lastPracticeDate: today,
    },
    topicProgress: {
      topic: data.topic,
      operation: data.operation,
      mainFormula: data.mainFormula,
      attemptsCount: totalTopicAttempts,
      correctCount: totalTopicCorrect,
      accuracyPercent: topicAccuracyPercent,
      avgResponseTimeMs: newTopicAvgResponseTimeMs,
      masteryPercent: topicMasteryPercent,
      difficultyAfter: nextDifficulty,
    },
  };
}
