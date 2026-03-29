/**
 * Adaptive Difficulty Hook
 * 
 * O'quvchining natijasiga qarab misol murakkabligini boshqaradi.
 * 
 * MUHIM: Bu hook mavzuni, formulani, xonalar sonini, hadlar sonini O'ZGARTIRMAYDI.
 * Faqat shu mavzu ICHIDA primary/fallback operatsiyalar nisbatini sozlaydi.
 * 
 * 3 daraja:
 *   easy   → primary 20%, fallback 80% (soddaroq misollar)
 *   medium → primary 50%, fallback 50% (muvozanatli)
 *   hard   → primary 80%, fallback 20% (murakkabroq misollar)
 */

import { useCallback, useRef, useState } from 'react';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface DifficultyWeights {
  /** Primary (asosiy formula) operatsiyalar tanlash ehtimolligi (0-1) */
  primaryWeight: number;
  /** Katta raqamlarni tanlash ehtimolligi (0-1) */
  complexityBias: number;
  /** Katta do'st (carry) operatsiyalari ehtimolligi (0-1) */
  carryProbability: number;
}

interface PerformanceSnapshot {
  streakCorrect: number;
  streakWrong: number;
  recentCorrectRate: number;
  avgResponseTimeMs: number;
  totalAnswered: number;
}

interface AdaptiveDifficultyState {
  level: DifficultyLevel;
  weights: DifficultyWeights;
  performance: PerformanceSnapshot;
}

const DIFFICULTY_PROFILES: Record<DifficultyLevel, DifficultyWeights> = {
  easy: {
    primaryWeight: 0.2,
    complexityBias: 0.2,
    carryProbability: 0.15,
  },
  medium: {
    primaryWeight: 0.5,
    complexityBias: 0.5,
    carryProbability: 0.25,
  },
  hard: {
    primaryWeight: 0.8,
    complexityBias: 0.8,
    carryProbability: 0.45,
  },
};

// Threshold values
const STREAK_UP_THRESHOLD = 4;       // 4 ta ketma-ket to'g'ri → murakkablik oshadi
const STREAK_DOWN_THRESHOLD = 2;     // 2 ta ketma-ket xato → murakkablik pasayadi
const FAST_RESPONSE_MS = 3000;       // 3 soniyadan tez = yaxshi
const SLOW_RESPONSE_MS = 8000;       // 8 soniyadan sekin = qiyinlanyapti
const RECENT_WINDOW = 10;            // Oxirgi 10 ta javobni tahlil qilish

export const useAdaptiveDifficulty = () => {
  const [level, setLevel] = useState<DifficultyLevel>('medium');
  
  // Performance tracking refs
  const streakCorrectRef = useRef(0);
  const streakWrongRef = useRef(0);
  const recentResultsRef = useRef<boolean[]>([]);
  const recentTimesRef = useRef<number[]>([]);
  const totalAnsweredRef = useRef(0);

  /**
   * Yangi javobni qayd etish va murakkablikni sozlash
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

    // Murakkablikni baholash
    setLevel(prev => {
      const correctRate = recentResultsRef.current.length > 0
        ? recentResultsRef.current.filter(Boolean).length / recentResultsRef.current.length
        : 0.5;
      
      const avgTime = recentTimesRef.current.length > 0
        ? recentTimesRef.current.reduce((a, b) => a + b, 0) / recentTimesRef.current.length
        : 5000;

      // Oshirish shartlari:
      // 1) Ketma-ket to'g'ri javoblar ko'p
      // 2) Tez javob bermoqda
      // 3) Oxirgi natijalar yaxshi
      if (
        streakCorrectRef.current >= STREAK_UP_THRESHOLD &&
        avgTime <= FAST_RESPONSE_MS &&
        correctRate >= 0.8
      ) {
        if (prev === 'easy') return 'medium';
        if (prev === 'medium') return 'hard';
        return prev;
      }

      // Pasaytirish shartlari:
      // 1) Ketma-ket xatolar
      // 2) Sekin javob bermoqda
      // 3) Oxirgi natijalar yomon
      if (
        streakWrongRef.current >= STREAK_DOWN_THRESHOLD ||
        (correctRate < 0.4 && recentResultsRef.current.length >= 5) ||
        (avgTime > SLOW_RESPONSE_MS && correctRate < 0.6)
      ) {
        if (prev === 'hard') return 'medium';
        if (prev === 'medium') return 'easy';
        return prev;
      }

      return prev;
    });
  }, []);

  /**
   * Hozirgi murakkablik darajasining vaznlarini olish
   */
  const getWeights = useCallback((): DifficultyWeights => {
    return DIFFICULTY_PROFILES[level];
  }, [level]);

  /**
   * Weighted random tanlash - primary yoki fallback operatsiyani tanlash
   * @param primaryOps - Asosiy (murakkab) operatsiyalar
   * @param fallbackOps - Osonroq operatsiyalar
   * @returns Tanlangan operatsiya
   */
  const selectWeighted = useCallback(<T>(primaryOps: T[], fallbackOps: T[]): T | null => {
    const weights = DIFFICULTY_PROFILES[level];
    
    if (primaryOps.length === 0 && fallbackOps.length === 0) return null;
    if (primaryOps.length === 0) return fallbackOps[Math.floor(Math.random() * fallbackOps.length)];
    if (fallbackOps.length === 0) return primaryOps[Math.floor(Math.random() * primaryOps.length)];

    // Primary weight asosida tanlash
    if (Math.random() < weights.primaryWeight) {
      return primaryOps[Math.floor(Math.random() * primaryOps.length)];
    } else {
      return fallbackOps[Math.floor(Math.random() * fallbackOps.length)];
    }
  }, [level]);

  /**
   * Carry (katta do'st) operatsiyasini tanlash kerakmi
   */
  const shouldSelectCarry = useCallback((): boolean => {
    return Math.random() < DIFFICULTY_PROFILES[level].carryProbability;
  }, [level]);

  /**
   * Murakkablik darajasiga qarab kattaroq yoki kichikroq raqamni tanlash
   * @param options - Mumkin bo'lgan raqamlar
   * @returns Tanlangan raqam
   */
  const selectByComplexity = useCallback((options: number[]): number => {
    if (options.length === 0) return 0;
    if (options.length === 1) return options[0];

    const sorted = [...options].sort((a, b) => a - b);
    const weights = DIFFICULTY_PROFILES[level];

    // complexityBias: 0 = kichik raqamlar, 1 = katta raqamlar
    // Weighted index selection
    const bias = weights.complexityBias;
    const weightedIndex = Math.floor(Math.pow(Math.random(), 1 / (bias + 0.1)) * sorted.length);
    const clampedIndex = Math.min(weightedIndex, sorted.length - 1);

    return sorted[clampedIndex];
  }, [level]);

  /**
   * Reset - yangi mashq boshlanganda
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
   * Hozirgi performance snapshot
   */
  const getPerformance = useCallback((): PerformanceSnapshot => {
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
    level,
    getWeights,
    recordAnswer,
    selectWeighted,
    shouldSelectCarry,
    selectByComplexity,
    getPerformance,
    reset,
  };
};
