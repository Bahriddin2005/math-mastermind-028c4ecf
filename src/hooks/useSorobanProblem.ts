/**
 * Soroban Problem Generator Hook
 * 
 * Bu hook yapon soroban metodologiyasiga asoslangan misollar generatsiya qiladi.
 * Asosiy xususiyatlar:
 * - Ustun mustaqilligi (har bir xona alohida state)
 * - Katta do'st cheklovi (ketma-ket 2 ta katta do'st yo'q)
 * - Mix formula qoidalari
 */

import { useCallback, useRef } from 'react';
import {
  generateProblem,
  getLegacyFormulas,
  FormulaCategory,
  GeneratedProblem,
  getAvailableOperations,
  applyOperation,
  AllowedOperation,
} from '@/lib/sorobanEngine';

// Legacy formula type mapping
export type LegacyFormulaType = 
  | 'oddiy' 
  | 'formula5' 
  | 'formula10plus' 
  | 'hammasi'
  | 'basic'
  | 'small_friend_1'
  | 'small_friend_2'
  | 'big_friend_3'
  | 'big_friend_4'
  | 'mixed'
  | 'formulasiz'
  | 'kichik_dost'
  | 'katta_dost'
  | 'mix';

interface UseSorobanProblemOptions {
  digitCount: number;
  formulaType: LegacyFormulaType;
  ensurePositive?: boolean;
}

interface ProblemResult {
  startValue: number;
  numbers: number[];
  answer: number;
}

/**
 * Soddalashtirilgan hook - to'g'ridan-to'g'ri engine funksiyalarini chaqiradi
 */
export const useSorobanProblem = (options: UseSorobanProblemOptions) => {
  const { digitCount, formulaType, ensurePositive = true } = options;
  
  // Running result tracking
  const runningResultRef = useRef(0);
  const lastFormulaRef = useRef<FormulaCategory | null>(null);
  
  /**
   * Yangi misol generatsiya qilish
   */
  const generateNewProblem = useCallback((operationCount: number): ProblemResult => {
    const allowedFormulas = getLegacyFormulas(formulaType);
    
    const problem = generateProblem({
      digitCount,
      operationCount,
      allowedFormulas,
      ensurePositiveResult: ensurePositive,
    });
    
    runningResultRef.current = problem.finalAnswer;
    
    return {
      startValue: problem.startValue,
      numbers: problem.sequence,
      answer: problem.finalAnswer,
    };
  }, [digitCount, formulaType, ensurePositive]);
  
  /**
   * Joriy holatda keyingi sonni generatsiya qilish (incremental)
   * Bu NumberTrainer va AbacusFlashCard uchun mavjud logikani saqlash uchun
   */
  const generateNextNumber = useCallback((): number | null => {
    const currentValue = runningResultRef.current;
    const allowedFormulas = getLegacyFormulas(formulaType);
    
    // Mumkin bo'lgan amallarni olish
    let availableOps = getAvailableOperations(
      currentValue, 
      allowedFormulas, 
      lastFormulaRef.current
    );
    
    // Natija musbat bo'lishi kerak
    if (ensurePositive) {
      availableOps = availableOps.filter(op => {
        const newValue = applyOperation(currentValue, op);
        return newValue >= 0 && newValue < Math.pow(10, digitCount + 1);
      });
    }
    
    if (availableOps.length === 0) return null;
    
    // Katta do'stni kamroq ishlatish uchun weighted selection
    const nonCarryOps = availableOps.filter(op => !op.isCarry);
    const carryOps = availableOps.filter(op => op.isCarry);
    
    let selectedOp: AllowedOperation;
    
    if (nonCarryOps.length > 0 && Math.random() > 0.25) {
      selectedOp = nonCarryOps[Math.floor(Math.random() * nonCarryOps.length)];
    } else if (carryOps.length > 0) {
      selectedOp = carryOps[Math.floor(Math.random() * carryOps.length)];
    } else {
      selectedOp = availableOps[Math.floor(Math.random() * availableOps.length)];
    }
    
    // Ko'p xonali misollar uchun delta ni kengaytirish
    let finalDelta = selectedOp.delta;
    if (digitCount > 1 && !selectedOp.isCarry) {
      const multiplier = Math.pow(10, Math.floor(Math.random() * digitCount));
      finalDelta = selectedOp.delta * Math.min(multiplier, Math.pow(10, digitCount - 1));
    }
    
    const signedDelta = selectedOp.isAdd ? finalDelta : -finalDelta;
    runningResultRef.current = currentValue + signedDelta;
    lastFormulaRef.current = selectedOp.formulaType;
    
    return signedDelta;
  }, [digitCount, formulaType, ensurePositive]);
  
  /**
   * Running result ni o'rnatish
   */
  const setRunningResult = useCallback((value: number) => {
    runningResultRef.current = value;
    lastFormulaRef.current = null;
  }, []);
  
  /**
   * Joriy running result qiymatini olish
   */
  const getRunningResult = useCallback(() => {
    return runningResultRef.current;
  }, []);
  
  /**
   * Reset - yangi misolni boshlash uchun
   */
  const reset = useCallback(() => {
    runningResultRef.current = 0;
    lastFormulaRef.current = null;
  }, []);
  
  return {
    generateNewProblem,
    generateNextNumber,
    setRunningResult,
    getRunningResult,
    reset,
  };
};

// AllowedOperation tipini export qilish
export type { AllowedOperation };
