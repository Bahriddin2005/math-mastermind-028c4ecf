/**
 * 9-BLOK: Adaptive Difficulty Hook
 * 10-BLOK: Weighted Choice Integration
 * 11-BLOK: Generator Integration
 * 
 * O'quvchining natijasiga qarab misol murakkabligini boshqaradi.
 * 
 * MUHIM QOIDALAR:
 * - Mavzu (topic) O'ZGARMAYDI
 * - Formula O'ZGARMAYDI
 * - Xonalar soni (digits_count) O'ZGARMAYDI
 * - Hadlar soni (terms_count) O'ZGARMAYDI
 * - FAQAT ichki tanlash og'irliklari (primary/fallback nisbati) o'zgaradi
 * 
 * 3 daraja: easy, medium, hard
 */

import { useCallback, useRef, useState } from 'react';

// ==========================================
// TYPES
// ==========================================

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type FormulaTopicType = 'five' | 'ten' | 'mix' | 'basic';

/** 9-BLOK: UserPerformance — o'quvchi haqidagi minimal ma'lumot */
export interface UserPerformance {
  is_correct: boolean;
  response_time_ms: number;
  streak_correct: number;
  streak_wrong: number;
  current_difficulty: DifficultyLevel;
}

/** 9-BLOK: Difficulty Profile — generatorga ichki ko'rsatmalar */
export interface DifficultyProfile {
  primary_weight: number;
  fallback_weight: number;
  // 10-lik va mix uchun fallback turlari
  fallback_5_weight?: number;
  fallback_formulasiz_weight?: number;
  fallback_10_weight?: number;
}

/** 10-BLOK: Weighted choice natijasi */
export interface WeightedChoiceResult<T = number> {
  operand_digit: T;
  formula_group: 'primary' | 'fallback_10' | 'fallback_5' | 'fallback_formulasiz';
  is_primary: boolean;
}

// ==========================================
// 9-BLOK: DIFFICULTY PROFILES
// ==========================================

/** 5-lik formula uchun vaznlar */
const FIVE_FORMULA_PROFILES: Record<DifficultyLevel, DifficultyProfile> = {
  easy: {
    primary_weight: 25,
    fallback_weight: 75,
  },
  medium: {
    primary_weight: 50,
    fallback_weight: 50,
  },
  hard: {
    primary_weight: 80,
    fallback_weight: 20,
  },
};

/** 10-lik formula uchun vaznlar */
const TEN_FORMULA_PROFILES: Record<DifficultyLevel, DifficultyProfile> = {
  easy: {
    primary_weight: 25,
    fallback_weight: 75,
    fallback_5_weight: 35,
    fallback_formulasiz_weight: 40,
  },
  medium: {
    primary_weight: 50,
    fallback_weight: 50,
    fallback_5_weight: 25,
    fallback_formulasiz_weight: 25,
  },
  hard: {
    primary_weight: 80,
    fallback_weight: 20,
    fallback_5_weight: 10,
    fallback_formulasiz_weight: 10,
  },
};

/** Mix formula uchun vaznlar */
const MIX_FORMULA_PROFILES: Record<DifficultyLevel, DifficultyProfile> = {
  easy: {
    primary_weight: 25,
    fallback_weight: 75,
    fallback_10_weight: 30,
    fallback_5_weight: 20,
    fallback_formulasiz_weight: 25,
  },
  medium: {
    primary_weight: 50,
    fallback_weight: 50,
    fallback_10_weight: 20,
    fallback_5_weight: 15,
    fallback_formulasiz_weight: 15,
  },
  hard: {
    primary_weight: 80,
    fallback_weight: 20,
    fallback_10_weight: 10,
    fallback_5_weight: 5,
    fallback_formulasiz_weight: 5,
  },
};

// ==========================================
// 9-BLOK: CORE FUNCTIONS
// ==========================================

/** Threshold qiymatlari */
const STREAK_UP_THRESHOLD = 4;    // 4 ta ketma-ket to'g'ri → oshirish
const STREAK_DOWN_THRESHOLD = 2;  // 2 ta ketma-ket xato → pasaytirish
const FAST_RESPONSE_MS = 3000;    // 3s dan tez = yaxshi
const SLOW_RESPONSE_MS = 8000;    // 8s dan sekin = qiyinlanyapti
const RECENT_WINDOW = 10;         // Oxirgi 10 ta javobni tahlil qilish

/**
 * 9-BLOK: get_next_difficulty — keyingi murakkablik darajasini aniqlash
 */
function getNextDifficulty(perf: UserPerformance): DifficultyLevel {
  const { is_correct, response_time_ms, streak_correct, streak_wrong, current_difficulty } = perf;

  // Pasaytirish shartlari
  if (streak_wrong >= STREAK_DOWN_THRESHOLD) {
    if (current_difficulty === 'hard') return 'medium';
    if (current_difficulty === 'medium') return 'easy';
    return 'easy';
  }

  // Juda sekin va xato
  if (response_time_ms > SLOW_RESPONSE_MS && !is_correct) {
    if (current_difficulty === 'hard') return 'medium';
    if (current_difficulty === 'medium') return 'easy';
    return 'easy';
  }

  // Oshirish shartlari
  if (streak_correct >= STREAK_UP_THRESHOLD && response_time_ms <= FAST_RESPONSE_MS) {
    if (current_difficulty === 'easy') return 'medium';
    if (current_difficulty === 'medium') return 'hard';
    return 'hard';
  }

  return current_difficulty;
}

/**
 * 9-BLOK: get_difficulty_profile — mavzuga mos profil olish
 */
function getDifficultyProfile(topicType: FormulaTopicType, level: DifficultyLevel): DifficultyProfile {
  switch (topicType) {
    case 'five':
      return FIVE_FORMULA_PROFILES[level];
    case 'ten':
      return TEN_FORMULA_PROFILES[level];
    case 'mix':
      return MIX_FORMULA_PROFILES[level];
    case 'basic':
    default:
      // Formulasiz uchun primary/fallback farqi yo'q
      return { primary_weight: 50, fallback_weight: 50 };
  }
}

// ==========================================
// 10-BLOK: WEIGHTED CHOICE FUNCTIONS
// ==========================================

/**
 * Weighted random group tanlash
 * @param groups - { name: string, weight: number, candidates: T[] }[]
 * @returns Tanlangan element yoki null
 */
function weightedGroupChoice<T>(
  groups: { name: string; weight: number; candidates: T[] }[]
): WeightedChoiceResult<T> | null {
  // Bo'sh guruhlarni filtrlash
  const available = groups.filter(g => g.candidates.length > 0);
  if (available.length === 0) return null;

  // Vaznlarni normalizatsiya
  const totalWeight = available.reduce((sum, g) => sum + g.weight, 0);
  if (totalWeight <= 0) {
    // Fallback: oddiy random
    const randomGroup = available[Math.floor(Math.random() * available.length)];
    const digit = randomGroup.candidates[Math.floor(Math.random() * randomGroup.candidates.length)];
    return {
      operand_digit: digit,
      formula_group: randomGroup.name as WeightedChoiceResult['formula_group'],
      is_primary: randomGroup.name === 'primary',
    };
  }

  // Weighted random selection
  let rand = Math.random() * totalWeight;
  for (const group of available) {
    rand -= group.weight;
    if (rand <= 0) {
      const digit = group.candidates[Math.floor(Math.random() * group.candidates.length)];
      return {
        operand_digit: digit,
        formula_group: group.name as WeightedChoiceResult['formula_group'],
        is_primary: group.name === 'primary',
      };
    }
  }

  // Fallback
  const lastGroup = available[available.length - 1];
  const digit = lastGroup.candidates[Math.floor(Math.random() * lastGroup.candidates.length)];
  return {
    operand_digit: digit,
    formula_group: lastGroup.name as WeightedChoiceResult['formula_group'],
    is_primary: lastGroup.name === 'primary',
  };
}

/**
 * 10-BLOK: 5-lik formula uchun weighted choice
 */
export function chooseForFiveFormula<T>(
  primaryCandidates: T[],
  fallbackFormulasisCandidates: T[],
  difficulty: DifficultyLevel
): WeightedChoiceResult<T> | null {
  const profile = FIVE_FORMULA_PROFILES[difficulty];
  return weightedGroupChoice([
    { name: 'primary', weight: profile.primary_weight, candidates: primaryCandidates },
    { name: 'fallback_formulasiz', weight: profile.fallback_weight, candidates: fallbackFormulasisCandidates },
  ]);
}

/**
 * 10-BLOK: 10-lik formula uchun weighted choice
 */
export function chooseForTenFormula<T>(
  primaryCandidates: T[],
  fallback5Candidates: T[],
  fallbackFormulasisCandidates: T[],
  difficulty: DifficultyLevel
): WeightedChoiceResult<T> | null {
  const profile = TEN_FORMULA_PROFILES[difficulty];
  return weightedGroupChoice([
    { name: 'primary', weight: profile.primary_weight, candidates: primaryCandidates },
    { name: 'fallback_5', weight: profile.fallback_5_weight || 25, candidates: fallback5Candidates },
    { name: 'fallback_formulasiz', weight: profile.fallback_formulasiz_weight || 25, candidates: fallbackFormulasisCandidates },
  ]);
}

/**
 * 10-BLOK: Mix formula uchun weighted choice
 */
export function chooseForMixFormula<T>(
  primaryCandidates: T[],
  fallback10Candidates: T[],
  fallback5Candidates: T[],
  fallbackFormulasisCandidates: T[],
  difficulty: DifficultyLevel
): WeightedChoiceResult<T> | null {
  const profile = MIX_FORMULA_PROFILES[difficulty];
  return weightedGroupChoice([
    { name: 'primary', weight: profile.primary_weight, candidates: primaryCandidates },
    { name: 'fallback_10', weight: profile.fallback_10_weight || 20, candidates: fallback10Candidates },
    { name: 'fallback_5', weight: profile.fallback_5_weight || 15, candidates: fallback5Candidates },
    { name: 'fallback_formulasiz', weight: profile.fallback_formulasiz_weight || 15, candidates: fallbackFormulasisCandidates },
  ]);
}

// ==========================================
// 11-BLOK: REACT HOOK
// ==========================================

export const useAdaptiveDifficulty = () => {
  const [level, setLevel] = useState<DifficultyLevel>('medium');

  // Performance tracking refs
  const streakCorrectRef = useRef(0);
  const streakWrongRef = useRef(0);
  const recentResultsRef = useRef<boolean[]>([]);
  const recentTimesRef = useRef<number[]>([]);
  const totalAnsweredRef = useRef(0);

  /**
   * 9-BLOK: Yangi javobni qayd etish va murakkablikni sozlash
   */
  const recordAnswer = useCallback((isCorrect: boolean, responseTimeMs: number) => {
    totalAnsweredRef.current++;

    // Streak yangilash
    if (isCorrect) {
      streakCorrectRef.current++;
      streakWrongRef.current = 0;
    } else {
      streakWrongRef.current++;
      streakCorrectRef.current = 0;
    }

    // Oxirgi natijalarni saqlash
    recentResultsRef.current.push(isCorrect);
    if (recentResultsRef.current.length > RECENT_WINDOW) {
      recentResultsRef.current = recentResultsRef.current.slice(-RECENT_WINDOW);
    }

    recentTimesRef.current.push(responseTimeMs);
    if (recentTimesRef.current.length > RECENT_WINDOW) {
      recentTimesRef.current = recentTimesRef.current.slice(-RECENT_WINDOW);
    }

    // O'rtacha javob vaqti
    const avgTime = recentTimesRef.current.length > 0
      ? recentTimesRef.current.reduce((a, b) => a + b, 0) / recentTimesRef.current.length
      : 5000;

    // 9-BLOK: getNextDifficulty chaqirish
    const perf: UserPerformance = {
      is_correct: isCorrect,
      response_time_ms: avgTime,
      streak_correct: streakCorrectRef.current,
      streak_wrong: streakWrongRef.current,
      current_difficulty: level,
    };

    const nextDifficulty = getNextDifficulty(perf);
    if (nextDifficulty !== level) {
      setLevel(nextDifficulty);
    }
  }, [level]);

  /**
   * 9-BLOK: Hozirgi profil olish (debug/UI uchun)
   */
  const getProfile = useCallback((topicType: FormulaTopicType): DifficultyProfile => {
    return getDifficultyProfile(topicType, level);
  }, [level]);

  /**
   * 10-BLOK: 5-lik formula uchun weighted choice wrapper
   * Generator ichida to'g'ridan-to'g'ri ishlatiladi
   */
  const chooseForFive = useCallback(<T,>(
    primaryCandidates: T[],
    fallbackFormulasisCandidates: T[]
  ): WeightedChoiceResult<T> | null => {
    return chooseForFiveFormula(primaryCandidates, fallbackFormulasisCandidates, level);
  }, [level]);

  /**
   * 10-BLOK: 10-lik formula uchun weighted choice wrapper
   */
  const chooseForTen = useCallback(<T,>(
    primaryCandidates: T[],
    fallback5Candidates: T[],
    fallbackFormulasisCandidates: T[]
  ): WeightedChoiceResult<T> | null => {
    return chooseForTenFormula(primaryCandidates, fallback5Candidates, fallbackFormulasisCandidates, level);
  }, [level]);

  /**
   * 10-BLOK: Mix formula uchun weighted choice wrapper
   */
  const chooseForMix = useCallback(<T,>(
    primaryCandidates: T[],
    fallback10Candidates: T[],
    fallback5Candidates: T[],
    fallbackFormulasisCandidates: T[]
  ): WeightedChoiceResult<T> | null => {
    return chooseForMixFormula(primaryCandidates, fallback10Candidates, fallback5Candidates, fallbackFormulasisCandidates, level);
  }, [level]);

  /**
   * Formulasiz uchun complexityBias asosida tanlash
   * easy → kichik raqamlar, hard → katta raqamlar
   */
  const selectByComplexity = useCallback((options: number[]): number => {
    if (options.length === 0) return 0;
    if (options.length === 1) return options[0];

    const sorted = [...options].sort((a, b) => a - b);

    // Difficulty ga qarab bias
    const bias = level === 'easy' ? 0.2 : level === 'hard' ? 0.8 : 0.5;

    // Weighted index: bias yuqori bo'lsa kattaroq indekslar tanlanadi
    const weightedIndex = Math.floor(Math.pow(Math.random(), 1 / (bias + 0.1)) * sorted.length);
    return sorted[Math.min(weightedIndex, sorted.length - 1)];
  }, [level]);

  /**
   * Reset — yangi mashq boshlanganda
   */
  const reset = useCallback(() => {
    streakCorrectRef.current = 0;
    streakWrongRef.current = 0;
    recentResultsRef.current = [];
    recentTimesRef.current = [];
    totalAnsweredRef.current = 0;
    setLevel('medium');
  }, []);

  /**
   * Performance snapshot — debug/UI uchun
   */
  const getPerformance = useCallback(() => {
    const results = recentResultsRef.current;
    const times = recentTimesRef.current;
    return {
      streakCorrect: streakCorrectRef.current,
      streakWrong: streakWrongRef.current,
      recentCorrectRate: results.length > 0
        ? results.filter(Boolean).length / results.length
        : 0,
      avgResponseTimeMs: times.length > 0
        ? times.reduce((a, b) => a + b, 0) / times.length
        : 0,
      totalAnswered: totalAnsweredRef.current,
    };
  }, []);

  return {
    // State
    level,

    // 9-BLOK
    recordAnswer,
    getProfile,
    getPerformance,
    reset,

    // 10-BLOK: Weighted choice — generator ichida ishlatiladi
    chooseForFive,
    chooseForTen,
    chooseForMix,

    // 11-BLOK: Helper
    selectByComplexity,
  };
};
