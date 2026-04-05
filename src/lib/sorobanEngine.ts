/**
 * SOROBAN MENTAL ARITHMETIC ENGINE v3
 * ====================================
 * Python algoritmiga 1:1 mos keluvchi engine.
 * 
 * 5 ta blok:
 * 1. Formulasiz qo'shish/ayirish
 * 2. 5-lik formula (kichik do'st)
 * 3. 10-lik formula (katta do'st) 
 * 4. Mix (aralash) formula
 * 
 * 9-11 BLOK: Adaptive Difficulty integratsiyasi
 * - chooseForFiveFormula, chooseForTenFormula, chooseForMixFormula
 * - difficulty parametri orqali weighted choice
 * 
 * Har bir blok o'zining:
 * - Klassifikatsiya funksiyasi
 * - Generator funksiyasi
 * - Verifikator funksiyasi
 * ga ega.
 */

import {
  type DifficultyLevel,
  chooseForFiveFormula,
  chooseForTenFormula,
} from '@/hooks/useAdaptiveDifficulty';

// ============= TYPES =============

export type FormulaCategory = 'formulasiz' | 'kichik_dost' | 'katta_dost' | 'mix';
export type StepClassification = 'formulasiz' | 'kichik_dost' | 'katta_dost' | 'mix' | 'unknown';
export type FormulaType = FormulaCategory | string;

export type StageType = 'formulasiz' | '5' | '10' | 'mix';
export type OperationType = 'add' | 'sub';

export interface ExampleConfig {
  operation: OperationType;
  stage: StageType;
  digitsCount: number;
  termsCount: number;
  mainFormula: number | null;
  headroom?: number;
  maxAttempts?: number;
  minPrimarySteps?: number;
}

export interface StepLog {
  termIndex: number;
  displayPos: number;
  statePos: number;
  beforeDigit: number;
  operandDigit: number;
  operation: OperationType;
  classified: StepClassification;
  isPrimary: boolean;
  upperBefore: number;
  afterDigit: number;
  upperAfter: number;
}

export interface VerificationResult {
  isValid: boolean;
  answer: number;
  totalSteps: number;
  primarySteps: number;
  stats: Record<string, number>;
  steps: StepLog[];
  errors: string[];
  formulaStats: Record<StepClassification, number>;
  primaryFormulaRatio: number;
}

export interface GeneratedExample {
  config: ExampleConfig;
  terms: number[];
  answer: number;
  stepLogs: StepLog[];
  verification: VerificationResult;
  formatted: string;
}

// Legacy compatibility types
export interface ColumnState { digit: number; }
export interface SorobanState { columns: ColumnState[]; value: number; }
export interface Operation {
  delta: number;
  isAdd: boolean;
  formulaType: FormulaCategory;
  isCarry: boolean;
}
export interface GeneratedProblem {
  startValue: number;
  operations: Operation[];
  finalAnswer: number;
  sequence: number[];
}
export interface AllowedOperation {
  delta: number;
  isAdd: boolean;
  formulaType: FormulaCategory;
  isCarry: boolean;
}

// ============= FORMULA JADVALLARI =============

const FORMULASIZ_PLUS: Record<number, number[]> = {
  0: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  1: [1, 2, 3, 5, 6, 7, 8],
  2: [1, 2, 5, 6, 7],
  3: [1, 5, 6],
  4: [5],
  5: [1, 2, 3, 4],
  6: [1, 2, 3],
  7: [1, 2],
  8: [1],
  9: [],
};

const FORMULASIZ_MINUS: Record<number, number[]> = {
  0: [],
  1: [1],
  2: [1, 2],
  3: [1, 2, 3],
  4: [1, 2, 3, 4],
  5: [5],
  6: [1, 5, 6],
  7: [1, 2, 5, 7],
  8: [1, 2, 3, 5, 8],
  9: [1, 2, 3, 4, 5, 6, 7, 8, 9],
};

// 10-lik formula uchun aniq jadvallar (Python dan 1:1)
// Kalit: operand_digit, qiymat: current_digit lar to'plami
const TEN_ADD_ALLOWED: Record<number, Record<string, Set<number>>> = {
  1: { 'false': new Set([9]), 'true': new Set([9]) },
  2: { 'false': new Set([8, 9]), 'true': new Set([8, 9]) },
  3: { 'false': new Set([7, 8, 9]), 'true': new Set([7, 8, 9]) },
  4: { 'false': new Set([6, 7, 8, 9]), 'true': new Set([6, 7, 8, 9]) },
  5: { 'false': new Set([5, 6, 7, 8, 9]), 'true': new Set([5, 6, 7, 8, 9]) },
  6: { 'false': new Set([4, 9]), 'true': new Set([4, 9]) },
  7: { 'false': new Set([3, 4, 8, 9]), 'true': new Set([3, 4, 8, 9]) },
  8: { 'false': new Set([2, 3, 4, 7, 8, 9]), 'true': new Set([2, 3, 4, 7, 8, 9]) },
  9: { 'false': new Set([1, 2, 3, 4, 6, 7, 8, 9]), 'true': new Set([1, 2, 3, 4, 6, 7, 8, 9]) },
};

const TEN_SUB_ALLOWED: Record<number, Record<string, Set<number>>> = {
  1: { 'false': new Set(), 'true': new Set([0]) },
  2: { 'false': new Set(), 'true': new Set([0, 1]) },
  3: { 'false': new Set(), 'true': new Set([0, 1, 2]) },
  4: { 'false': new Set(), 'true': new Set([0, 1, 2, 3]) },
  5: { 'false': new Set(), 'true': new Set([0, 1, 2, 3, 4]) },
  6: { 'false': new Set(), 'true': new Set([0, 5]) },
  7: { 'false': new Set(), 'true': new Set([0, 1, 5, 6]) },
  8: { 'false': new Set(), 'true': new Set([0, 1, 2, 5, 6, 7]) },
  9: { 'false': new Set(), 'true': new Set([0, 1, 2, 3, 5, 6, 7, 8]) },
};

// ============= YORDAMCHI FUNKSIYALAR =============

function numberToDigits(n: number, width: number): number[] {
  const s = String(Math.abs(n)).padStart(width, '0');
  return Array.from(s, ch => parseInt(ch, 10));
}

function digitsToNumber(digits: number[]): number {
  return parseInt(digits.map(String).join(''), 10) || 0;
}

function hasZeroInDisplayed(n: number, digitsCount: number): boolean {
  const digits = numberToDigits(n, digitsCount);
  return digits.some(d => d === 0);
}

function randomNonZeroNumber(digitsCount: number): number {
  const digits: number[] = [];
  for (let i = 0; i < digitsCount; i++) {
    digits.push(Math.floor(Math.random() * 9) + 1);
  }
  return digitsToNumber(digits);
}

/** Formulasiz qo'shish uchun kichik boshlang'ich son (1-4 har ustunda) */
function randomSmallNumber(digitsCount: number): number {
  const digits: number[] = [];
  for (let i = 0; i < digitsCount; i++) {
    digits.push(Math.floor(Math.random() * 4) + 1); // 1-4
  }
  return digitsToNumber(digits);
}

function randomInitialForSub(digitsCount: number): number {
  const digits: number[] = [];
  for (let i = 0; i < digitsCount; i++) {
    digits.push(Math.floor(Math.random() * 5) + 5); // 5-9
  }
  return digitsToNumber(digits);
}

function plainApply(numbers: number[], operation: OperationType): number {
  let result = numbers[0];
  for (let i = 1; i < numbers.length; i++) {
    if (operation === 'add') result += numbers[i];
    else result -= numbers[i];
  }
  return result;
}

// ============= STATE MANAGEMENT =============

function normalizeCarryUp(state: number[], pos: number): void {
  while (pos > 0 && state[pos] >= 10) {
    const carry = Math.floor(state[pos] / 10);
    state[pos] %= 10;
    state[pos - 1] += carry;
    pos--;
  }
}

function normalizeBorrowUp(state: number[], pos: number): void {
  while (pos > 0 && state[pos] < 0) {
    state[pos] += 10;
    state[pos - 1] -= 1;
    pos--;
  }
}

function applyAddDigit(state: number[], pos: number, operandDigit: number): void {
  state[pos] += operandDigit;
  normalizeCarryUp(state, pos);
}

function applySubDigit(state: number[], pos: number, operandDigit: number): void {
  state[pos] -= operandDigit;
  normalizeBorrowUp(state, pos);
}

function applyDigit(state: number[], pos: number, operandDigit: number, operation: OperationType): void {
  if (operation === 'add') applyAddDigit(state, pos, operandDigit);
  else applySubDigit(state, pos, operandDigit);
}

// ============= GENERIC CLASSIFICATION (for legacy/display) =============

function isFormulasizAdd(currentDigit: number, operandDigit: number): boolean {
  return (FORMULASIZ_PLUS[currentDigit] || []).includes(operandDigit);
}

function isFormulasizSub(currentDigit: number, operandDigit: number): boolean {
  return (FORMULASIZ_MINUS[currentDigit] || []).includes(operandDigit);
}

function isSmall5Add(currentDigit: number, operandDigit: number): boolean {
  if (operandDigit < 1 || operandDigit > 4) return false;
  return (5 - operandDigit) <= currentDigit && currentDigit <= 4;
}

function isSmall5Sub(currentDigit: number, operandDigit: number): boolean {
  if (operandDigit < 1 || operandDigit > 4) return false;
  return 5 <= currentDigit && currentDigit <= (4 + operandDigit);
}

function isMixAdd(currentDigit: number, operandDigit: number): boolean {
  if (operandDigit < 6 || operandDigit > 9) return false;
  const high = 14 - operandDigit;
  return 5 <= currentDigit && currentDigit <= high;
}

function isMixSub(currentDigit: number, operandDigit: number, upperNonzero: boolean): boolean {
  if (operandDigit < 6 || operandDigit > 9) return false;
  if (!upperNonzero) return false;
  const low = operandDigit - 5;
  return low <= currentDigit && currentDigit <= 4;
}

function isPrimaryTenAdd(currentDigit: number, operandDigit: number, _upperNonzero: boolean): boolean {
  const table = TEN_ADD_ALLOWED[operandDigit];
  if (!table) return false;
  return table[String(_upperNonzero)].has(currentDigit);
}

function isPrimaryTenSub(currentDigit: number, operandDigit: number, upperNonzero: boolean): boolean {
  const table = TEN_SUB_ALLOWED[operandDigit];
  if (!table) return false;
  return table[String(upperNonzero)].has(currentDigit);
}

// Generic classification for display/legacy
function classifyStepGeneric(
  operation: OperationType,
  currentDigit: number,
  operandDigit: number,
  upperNonzero: boolean
): StepClassification {
  if (operation === 'add') {
    if (isFormulasizAdd(currentDigit, operandDigit)) return 'formulasiz';
    if (isSmall5Add(currentDigit, operandDigit)) return 'kichik_dost';
    if (isMixAdd(currentDigit, operandDigit)) return 'mix';
    if (isPrimaryTenAdd(currentDigit, operandDigit, upperNonzero)) return 'katta_dost';
    return 'unknown';
  }
  if (isFormulasizSub(currentDigit, operandDigit)) return 'formulasiz';
  if (isSmall5Sub(currentDigit, operandDigit)) return 'kichik_dost';
  if (isMixSub(currentDigit, operandDigit, upperNonzero)) return 'mix';
  if (isPrimaryTenSub(currentDigit, operandDigit, upperNonzero)) return 'katta_dost';
  return 'unknown';
}

// Public export
export const classifyStep = (
  currentValue: number,
  operandDigit: number,
  isAdd: boolean
): StepClassification => {
  const currentDigit = Math.abs(currentValue) % 10;
  const upperNonzero = Math.floor(Math.abs(currentValue) / 10) > 0;
  return classifyStepGeneric(isAdd ? 'add' : 'sub', currentDigit, operandDigit, upperNonzero);
};

// =============================================
// BLOK 1: FORMULASIZ GENERATOR
// =============================================

interface FormulasizResult {
  numbers: number[];
  answer: number;
  ok: boolean;
}

function generateFormulasiz(
  operation: OperationType,
  digitsCount: number,
  termsCount: number,
  maxAttempts: number = 100
): FormulasizResult | null {
  // Ko'p hadli sof add/sub imkonsiz — aralash ishlatamiz
  if (termsCount > 4) {
    return generateFormulasizMixed(digitsCount, termsCount, maxAttempts);
  }

  const table = operation === 'add' ? FORMULASIZ_PLUS : FORMULASIZ_MINUS;

  for (let _attempt = 0; _attempt < maxAttempts; _attempt++) {
    const firstNumber = operation === 'add'
      ? randomSmallNumber(digitsCount)
      : randomInitialForSub(digitsCount);

    const numbers = [firstNumber];
    let currentValue = firstNumber;
    let ok = true;

    for (let t = 1; t < termsCount; t++) {
      const cd = numberToDigits(currentValue, digitsCount);
      const td: number[] = [];
      let valid = true;

      for (const d of cd) {
        const allowed = table[d] || [];
        if (!allowed.length) { valid = false; break; }
        td.push(allowed[Math.floor(Math.random() * allowed.length)]);
      }
      if (!valid) { ok = false; break; }

      const term = digitsToNumber(td);
      if (hasZeroInDisplayed(term, digitsCount)) { ok = false; break; }
      if (numbers.length > 0 && term === numbers[numbers.length - 1]) { ok = false; break; }
      const next = operation === 'add' ? currentValue + term : currentValue - term;
      if (next < 0 || String(next).length > digitsCount) { ok = false; break; }

      numbers.push(term);
      currentValue = next;
    }

    if (!ok || numbers.length !== termsCount) continue;
    return { numbers, answer: currentValue, ok: true };
  }
  return null;
}

function generateFormulasizMixed(
  digitsCount: number,
  termsCount: number,
  maxAttempts: number = 100
): FormulasizResult | null {
  for (let _attempt = 0; _attempt < maxAttempts; _attempt++) {
    const firstNumber = randomNonZeroNumber(digitsCount);
    const signedTerms: number[] = [];
    let currentValue = firstNumber;
    let ok = true;

    for (let t = 1; t < termsCount; t++) {
      const digits = numberToDigits(currentValue, digitsCount);
      const avg = digits.reduce((a, b) => a + b, 0) / digitsCount;
      
      // Muvozanatli tanlash: avg yuqori bo'lsa ayirish, past bo'lsa qo'shish, o'rtada 50/50
      let op: OperationType;
      if (avg >= 6) {
        op = 'sub';
      } else if (avg <= 2) {
        op = 'add';
      } else {
        op = Math.random() > 0.5 ? 'add' : 'sub';
      }
      const table = op === 'add' ? FORMULASIZ_PLUS : FORMULASIZ_MINUS;
      const cd = numberToDigits(currentValue, digitsCount);
      const td: number[] = [];
      let valid = true;

      for (const d of cd) {
        const allowed = table[d] || [];
        if (!allowed.length) { valid = false; break; }
        td.push(allowed[Math.floor(Math.random() * allowed.length)]);
      }
      if (!valid) { ok = false; break; }

      const term = digitsToNumber(td);
      if (hasZeroInDisplayed(term, digitsCount)) { ok = false; break; }
      const signedVal = op === 'add' ? term : -term;
      const prevAbs = signedTerms.length > 0 ? Math.abs(signedTerms[signedTerms.length - 1]) : null;
      if (prevAbs !== null && term === prevAbs) { ok = false; break; }
      const next = op === 'add' ? currentValue + term : currentValue - term;
      if (next < 0 || String(next).length > digitsCount) { ok = false; break; }

      signedTerms.push(signedVal);
      currentValue = next;
    }

    if (!ok || signedTerms.length !== termsCount - 1) continue;
    return { numbers: [firstNumber, ...signedTerms], answer: currentValue, ok: true };
  }
  return null;
}

function verifyFormulasiz(
  numbers: number[],
  operation: OperationType,
  digitsCount: number,
  termsCount: number
): { ok: boolean; answer?: number; error?: string } {
  if (numbers.length !== termsCount) return { ok: false, error: 'terms_count' };

  const table = operation === 'add' ? FORMULASIZ_PLUS : FORMULASIZ_MINUS;
  let current = numbers[0];

  for (let i = 1; i < numbers.length; i++) {
    if (hasZeroInDisplayed(numbers[i], digitsCount)) return { ok: false, error: 'zero_digit' };

    const cd = numberToDigits(current, digitsCount);
    const td = numberToDigits(numbers[i], digitsCount);

    for (let pos = 0; pos < digitsCount; pos++) {
      if (!(table[cd[pos]] || []).includes(td[pos])) {
        return { ok: false, error: 'not_formulasiz' };
      }
    }

    const nextVal = operation === 'add' ? current + numbers[i] : current - numbers[i];
    if (nextVal < 0) return { ok: false, error: 'negative_result' };
    if (String(nextVal).length > digitsCount) return { ok: false, error: 'overflow' };
    current = nextVal;
  }

  return { ok: true, answer: current };
}

// =============================================
// BLOK 2: 5-LIK FORMULA GENERATOR
// =============================================

function classifyFiveStageStep(
  operation: OperationType,
  currentDigit: number,
  operandDigit: number
): string | null {
  if (operation === 'add') {
    if (isSmall5Add(currentDigit, operandDigit)) return '5';
    // 5-lik modeda mix formulani aniq chiqarib tashlash
    if (isMixAdd(currentDigit, operandDigit)) return null;
    if (isFormulasizAdd(currentDigit, operandDigit)) return 'formulasiz';
    return null;
  }
  if (isSmall5Sub(currentDigit, operandDigit)) return '5';
  // Mix sub uchun: formulasiz jadvallar mix bilan overlap qilmaydi,
  // lekin xavfsizlik uchun operand 6-9 va digit 1-4 ni tekshiramiz
  if (operandDigit >= 6 && operandDigit <= 9 && currentDigit >= 1 && currentDigit <= 4) return null
  }
  if (isSmall5Sub(currentDigit, operandDigit)) return '5';
  // Mix sub uchun: formulasiz jadvallar mix bilan overlap qilmaydi,
  // lekin xavfsizlik uchun operand 6-9 va digit 1-4 ni tekshiramiz
  if (operandDigit >= 6 && operandDigit <= 9 && currentDigit >= 1 && currentDigit <= 4) return null;
  if (isFormulasizSub(currentDigit, operandDigit)) return 'formulasiz';
  return null;
}

function chooseFiveFormulaDigit(
  currentDigit: number,
  operation: OperationType,
  mainFormula: number,
  difficulty: DifficultyLevel = 'medium'
): { operandDigit: number; classified: string; isPrimary: boolean } | null {
  const primaryCandidates: number[] = [];
  const fallbackCandidates: number[] = [];

  for (let d = 1; d <= 9; d++) {
    const classified = classifyFiveStageStep(operation, currentDigit, d);
    if (classified === null) continue;

    if (classified === '5' && d === mainFormula) {
      primaryCandidates.push(d);
    } else if (classified === 'formulasiz') {
      fallbackCandidates.push(d);
    }
  }

  // 10-BLOK: Weighted choice — difficulty ga qarab primary/fallback nisbati
  const weighted = chooseForFiveFormula(primaryCandidates, fallbackCandidates, difficulty);
  if (weighted) {
    return {
      operandDigit: weighted.operand_digit,
      classified: weighted.is_primary ? '5' : 'formulasiz',
      isPrimary: weighted.is_primary,
    };
  }

  // Fallback: agar weighted null bo'lsa, oddiy random
  if (primaryCandidates.length > 0) {
    const chosen = primaryCandidates[Math.floor(Math.random() * primaryCandidates.length)];
    return { operandDigit: chosen, classified: '5', isPrimary: true };
  }
  if (fallbackCandidates.length > 0) {
    const chosen = fallbackCandidates[Math.floor(Math.random() * fallbackCandidates.length)];
    return { operandDigit: chosen, classified: 'formulasiz', isPrimary: false };
  }
  return null;
}

/** 5-lik formula uchun aqlli boshlang'ich son */
function smartInitialForFive(operation: OperationType, mainFormula: number, digitsCount: number): number {
  const digits: number[] = [];
  for (let i = 0; i < digitsCount; i++) {
    if (operation === 'add') {
      // +N formulasi ishlashi uchun currentDigit (5-N)..4 oralig'ida bo'lishi kerak
      const low = Math.max(1, 5 - mainFormula);
      digits.push(low + Math.floor(Math.random() * (4 - low + 1)));
    } else {
      // -N formulasi ishlashi uchun currentDigit 5..(4+N) oralig'ida bo'lishi kerak
      const high = Math.min(9, 4 + mainFormula);
      digits.push(5 + Math.floor(Math.random() * (high - 5 + 1)));
    }
  }
  return digitsToNumber(digits);
}

function generateFiveFor1000,
  minPrimarySteps: number = 1,
  difficulty: DifficultyLevel = 'medium'
): FormulasizResult | null {
  // 5-lik formulada DOIMO oscillatsiya kerak:
  // +N (primary) → digit yuqoriga → -formulasiz → digit pastga → +N (primary) ...
  // Shuning uchun har doim aralash add/sub ishlatamiz

  for (let _attempt = 0; _attempt < maxAttempts; _attempt++) {
    const firstNumber = smartInitialForFive(operation, mainFormula, digitsCount);
    const numbers: number[] = [firstNumber];
    let currentValue = firstNumber;
    let ok = true;

    for (let termIndex = 1; termIndex < termsCount; termIndex++) {
      const currentDigits = numberToDigits(currentValue, digitsCount);
      const avg = currentDigits.reduce((a, b) => a + b, 0) / digitsCount;

      // Aqlli steering: primaryga qarab yo'naltirish
      // +N primary uchun digit (5-N)..4 kerak → digit >= 5 bo'lsa sub, < 5 bo'lsa add
      // -N primary uchun digit 5..(4+N) kerak → digit <= 4 bo'lsa add, > 4 bo'lsa sub
      let curOp: OperationType;
      if (operation === 'add') {
        curOp = avg >= 5 ? 'sub' : 'add';
      } else {
        curOp = avg <= 4 ? 'add' : 'sub';
      }

      let built = false;
      for (let _retry = 0; _retry < 30; _retry++) {
        const curDigits = numberToDigits(currentValue, digitsCount);
        const termDigits: number[] = [];
        let termValid = true;

        for (const digit of curDigits) {
          const choice = chooseFiveFormulaDigit(digit, curOp, mainFormula, difficulty);
          if (!choice) { termValid = false; break; }
          termDigits.push(choice.operandDigit);
        }
        if (!termValid) continue;

        const term = digitsToNumber(termDigits);
        if (hasZeroInDisplayed(term, digitsCount)) continue;

        // Signed term: + yoki - belgisi bilan
        const signedVal = curOp === 'add' ? term : -term;
        const prevAbs = numbers.length > 1 ? Math.abs(numbers[numbers.length - 1]) : null;
        if (prevAbs !== null && term === prevAbs) continue;

        const nextValue = curOp === 'add' ? currentValue + term : currentValue - term;
        if (nextValue < 0 || String(nextValue).length > digitsCount) continue;

        numbers.push(signedVal);
        currentValue = nextValue;
        built = true;
        break;
      }

      if (!built) { ok = false; break; }
    }

    if (!ok || numbers.length !== termsCount) continue;

    // Verifikatsiya: barcha qadamlar 5-lik yoki formulasiz, yetarli primary
    let val = numbers[0];
    let valid = true;
    let primaryCount = 0;
    for (let i = 1; i < numbers.length; i++) {
      const signed = numbers[i];
      const term = Math.abs(signed);
      const termOp: OperationType = signed >= 0 ? 'add' : 'sub';
      const cd = numberToDigits(val, digitsCount);
      const td = numberToDigits(term, digitsCount);
      for (let p = 0; p < digitsCount; p++) {
        const cl = classifyFiveStageStep(termOp, cd[p], td[p]);
        if (cl === null) { valid = false; break; }
        if (cl === '5' && td[p] === mainFormula) primaryCount++;
      }
      if (!valid) break;
      val = termOp === 'add' ? val + term : val - term;
      if (val < 0) { valid = false; break; }
    }
    if (!valid || primaryCount < minPrimarySteps) continue;
    return { numbers, answer: val
  return null;
}

function verifyFiveFormula(
  numbers: number[],
  operation: OperationType,
  mainFormula: number,
  digitsCount: number,
  termsCount: number,
  minPrimarySteps: number = 1
): { ok: boolean; answer?: number; primarySteps?: number; error?: string } {
  if (numbers.length !== termsCount) return { ok: false, error: 'terms_count' };

  let currentValue = numbers[0];
  let primarySteps = 0;

  for (let i = 1; i < numbers.length; i++) {
    if (hasZeroInDisplayed(numbers[i], digitsCount)) return { ok: false, error: 'zero_digit' };

    const cd = numberToDigits(currentValue, digitsCount);
    const td = numberToDigits(numbers[i], digitsCount);

    for (let pos = 0; pos < digitsCount; pos++) {
      const classified = classifyFiveStageStep(operation, cd[pos], td[pos]);
      if (classified === null) return { ok: false, error: 'invalid_step' };

      // 5-lik stage'da faqat mainFormula yoki formulasiz bo'lishi kerak
      if (classified === '5' && td[pos] !== mainFormula) {
        return { ok: false, error: 'unexpected_other_5_formula' };
      }

      if (classified === '5' && td[pos] === mainFormula) primarySteps++;
    }

    const nextValue = operation === 'add' ? currentValue + numbers[i] : currentValue - numbers[i];
    if (nextValue < 0) return { ok: false, error: 'negative_result' };
    if (String(nextValue).length > digitsCount) return { ok: false, error: 'overflow' };
    currentValue = nextValue;
  }

  if (primarySteps < minPrimarySteps) return { ok: false, error: 'not_enough_primary' };

  return { ok: true, answer: currentValue, primarySteps };
}

// =============================================
// BLOK 3: 10-LIK FORMULA GENERATOR
// =============================================

function classifyTenStageStep(
  operation: OperationType,
  currentDigit: number,
  operandDigit: number,
  upperNonzero: boolean,
  mainFormula: number
): string | null {
  if (operation === 'add') {
    if (operandDigit === mainFormula && isPrimaryTenAdd(currentDigit, operandDigit, upperNonzero)) {
      return '10_primary';
    }
    // Mix formulani aniq chiqarib tashlash — 10-lik modeda mix bo'lmasligi kerak
    if (isMixAdd(currentDigit, operandDigit)) return null;
    if (isSmall5Add(currentDigit, operandDigit)) return '5_fallback';
    if (isFormulasizAdd(currentDigit, operandDigit)) return 'formulasiz_fallback';
    return null;
  }

  if (operandDigit === mainFormula && isPrimaryTenSub(currentDigit, operandDigit, upperNonzero)) {
    return '10_primary';
  }
  // Mix formulani aniq chiqarib tashlash — 10-lik modeda mix bo'lmasligi kerak
  if (isMixSub(currentDigit, operandDigit, upperNonzero)) return null;
  if (isSmall5Sub(currentDigit, operandDigit)) return '5_fallback';
  if (isFormulasizSub(currentDigit, operandDigit)) return 'formulasiz_fallback';
  return null;
}

function chooseTenFormulaDigit(
  state: number[],
  pos: number,
  operation: OperationType,
  mainFormula: number,
  difficulty: DifficultyLevel = 'medium'
): { operandDigit: number; formula: string; isPrimary: boolean } | null {
  const currentDigit = state[pos];
  const upperNonzero = pos > 0 ? state[pos - 1] > 0 : false;

  const primary: number[] = [];
  const fallback5: number[] = [];
  const fallbackFormulasiz: number[] = [];

  for (let d = 1; d <= 9; d++) {
    const classified = classifyTenStageStep(operation, currentDigit, d, upperNonzero, mainFormula);
    if (classified === null) continue;
    if (classified === '10_primary') primary.push(d);
    else if (classified === '5_fallback') fallback5.push(d);
    else if (classified === 'formulasiz_fallback') fallbackFormulasiz.push(d);
  }

  // 10-BLOK: Weighted choice — difficulty ga qarab primary/fallback nisbati
  const weighted = chooseForTenFormula(primary, fallback5, fallbackFormulasiz, difficulty);
  if (weighted) {
    const isPrimary = weighted.formula_group === 'primary';
    let formula = 'formulasiz_fallback';
    if (isPrimary) formula = '10_primary';
    else if (weighted.formula_group === 'fallback_5') formula = '5_fallback';
    return { operandDigit: weighted.operand_digit, formula, isPrimary };
  }

  // Fallback: oddiy random
  const allOptions = [
    ...primary.map(d => ({ d, formula: '10_primary', isPrimary: true })),
    ...fallback5.map(d => ({ d, formula: '5_fallback', isPrimary: false })),
    ...fallbackFormulasiz.map(d => ({ d, formula: 'formulasiz_fallback', isPrimary: false })),
  ];
  if (allOptions.length === 0) return null;
  const pick = allOptions[Math.floor(Math.random() * allOptions.length)];
  return { operandDigit: pick.d, formula: pick.formula, isPrimary: pick.isPrimary };
}

function generateTenFormula(
  operation: OperationType,
  mainFormula: number,
  digitsCount: number,
  termsCount: number,
  maxAttempts: number = 1000,
  minPrimarySteps: number = 1,
  difficulty: DifficultyLevel = 'medium'
): FormulasizResult | null {
  const needMixed = termsCount > 4;
  // 10-lik formulada carry/borrow bo'lgani uchun natija digitsCount + 1 xonalik bo'lishi mumkin
  const stateWidth = digitsCount + 1;

  for (let _attempt = 0; _attempt < maxAttempts; _attempt++) {
    const firstNumber = randomNonZeroNumber(digitsCount);
    const numbers = [firstNumber];
    const signs: (1 | -1)[] = [];
    let currentValue = firstNumber;
    let ok = true;

    for (let termIndex = 1; termIndex < termsCount; termIndex++) {
      let curOp = operation;
      if (needMixed) {
        const avg = numberToDigits(currentValue, stateWidth).reduce((a, b) => a + b, 0) / stateWidth;
        curOp = (operation === 'add' ? (avg >= 6 ? 'sub' : 'add') : (avg <= 3 ? 'add' : 'sub'));
      }

      let built = false;
      for (let _retry = 0; _retry < 50; _retry++) {
        const state = numberToDigits(currentValue, stateWidth);
        const termDigits = new Array(digitsCount).fill(0);
        let termValid = true;

        // pos: stateWidth-1 dan 1 gacha (0-pozitsiya carry uchun)
        for (let pos = stateWidth - 1; pos >= 1; pos--) {
          const choice = chooseTenFormulaDigit(state, pos, curOp, mainFormula, difficulty);
          if (!choice) { termValid = false; break; }
          termDigits[pos - 1] = choice.operandDigit;
          applyDigit(state, pos, choice.operandDigit, curOp);
        }
        if (!termValid) continue;

        const term = digitsToNumber(termDigits);
        if (hasZeroInDisplayed(term, digitsCount)) continue;
        // Carry pozitsiyasi overflow/underflow tekshiruvi
        if (state[0] >= 10 || state[0] < 0) continue;

        const nextValue = digitsToNumber(state);
        // Natija digitsCount + 1 xonalik bo'lishi mumkin (carry tufayli)
        if (nextValue < 0 || String(nextValue).length > stateWidth) continue;

        // Ketma-ket bir xil son bo'lmasin
        const newVal = needMixed ? (curOp === 'add' ? term : -term) : term;
        const prevAbs = numbers.length > 1 ? Math.abs(numbers[numbers.length - 1]) : null;
        if (prevAbs !== null && term === prevAbs) continue;

        if (needMixed) {
          numbers.push(newVal);
          signs.push(curOp === 'add' ? 1 : -1);
        } else {
          numbers.push(term);
        }
        currentValue = nextValue;
        built = true;
        break;
      }

      if (!built) { ok = false; break; }
    }

    if (!ok || numbers.length !== termsCount) continue;

    if (!needMixed) {
      const verified = verifyTenFormula(numbers, operation, mainFormula, digitsCount, termsCount, minPrimarySteps);
      if (!verified.ok) continue;
      return { numbers, answer: verified.answer!, ok: true };
    }

    // Mixed verification
    let val = numbers[0], valid = true, pCount = 0;
    const simSt = numberToDigits(numbers[0], stateWidth);
    for (let i = 1; i < numbers.length; i++) {
      const signed = numbers[i];
      const term = Math.abs(signed);
      const termOp: OperationType = signed >= 0 ? 'add' : 'sub';
      const td = numberToDigits(term, digitsCount);
      for (let pos = stateWidth - 1; pos >= 1; pos--) {
        const un = simSt[pos - 1] > 0;
        const cl = classifyTenStageStep(termOp, simSt[pos], td[pos - 1], un, mainFormula);
        if (cl === null) { valid = false; break; }
        if (cl === '10_primary') pCount++;
        applyDigit(simSt, pos, td[pos - 1], termOp);
      }
      if (!valid) break;
      val = digitsToNumber(simSt);
      if (val < 0) { valid = false; break; }
    }
    if (!valid || pCount < minPrimarySteps) continue;
    return { numbers, answer: val, ok: true };
  }
  return null;
}

function verifyTenFormula(
  numbers: number[],
  operation: OperationType,
  mainFormula: number,
  digitsCount: number,
  termsCount: number,
  minPrimarySteps: number = 1
): { ok: boolean; answer?: number; primarySteps?: number; error?: string } {
  if (numbers.length !== termsCount) return { ok: false, error: 'terms_count' };
  const stateWidth = digitsCount + 1;

  for (let idx = 0; idx < numbers.length; idx++) {
    if (hasZeroInDisplayed(numbers[idx], digitsCount)) return { ok: false, error: 'zero_digit' };
  }

  const state = numberToDigits(numbers[0], stateWidth);
  let primarySteps = 0;

  for (let termIndex = 1; termIndex < numbers.length; termIndex++) {
    const termDigits = numberToDigits(numbers[termIndex], digitsCount);

    for (let pos = stateWidth - 1; pos >= 1; pos--) {
      const currentDigit = state[pos];
      const upperNonzero = state[pos - 1] > 0;
      const operandDigit = termDigits[pos - 1];

      const classified = classifyTenStageStep(operation, currentDigit, operandDigit, upperNonzero, mainFormula);
      if (classified === null) return { ok: false, error: 'invalid_step' };

      if (classified === '10_primary') primarySteps++;
      applyDigit(state, pos, operandDigit, operation);
    }

    const currentValue = digitsToNumber(state);
    if (currentValue < 0) return { ok: false, error: 'negative_result' };
    // 10-lik formulada natija digitsCount + 1 xonalik bo'lishi mumkin
    if (String(currentValue).length > stateWidth) return { ok: false, error: 'overflow' };
  }

  const answer = digitsToNumber(state);
  const plainAnswer = plainApply(numbers, operation);
  if (plainAnswer !== answer) return { ok: false, error: 'answer_mismatch' };
  if (primarySteps < minPrimarySteps) return { ok: false, error: 'not_enough_primary' };

  return { ok: true, answer, primarySteps };
}

// =============================================
// BLOK 4: MIX (ARALASH) FORMULA GENERATOR
// =============================================

function classifyMixStageStep(
  operation: OperationType,
  currentDigit: number,
  operandDigit: number,
  upperNonzero: boolean,
  mainFormula: number
): string | null {
  if (operation === 'add') {
    // Mix primary: asosiy formula operandi
    if (operandDigit === mainFormula && isMixAdd(currentDigit, operandDigit)) return 'mix_primary';
    // Mix secondary: boshqa mix operandlar (6-9)
    if (operandDigit !== mainFormula && isMixAdd(currentDigit, operandDigit)) return 'mix_secondary';
    // Faqat formulasiz (5-lik va 10-lik chiqarib tashlandi)
    if (isFormulasizAdd(currentDigit, operandDigit)) return 'formulasiz_fallback';
    return null;
  }

  if (operandDigit === mainFormula && isMixSub(currentDigit, operandDigit, upperNonzero)) return 'mix_primary';
  if (operandDigit !== mainFormula && isMixSub(currentDigit, operandDigit, upperNonzero)) return 'mix_secondary';
  if (isFormulasizSub(currentDigit, operandDigit)) return 'formulasiz_fallback';
  return null;
}

function chooseMixFormulaDigit(
  state: number[],
  pos: number,
  operation: OperationType,
  mainFormula: number,
  _difficulty: DifficultyLevel = 'medium'
): { operandDigit: number; formula: string; isPrimary: boolean } | null {
  const currentDigit = state[pos];
  const upperNonzero = pos > 0 ? state[pos - 1] > 0 : false;

  const primary: number[] = [];
  const secondary: number[] = [];
  const fallbackFormulasiz: number[] = [];

  for (let d = 1; d <= 9; d++) {
    const classified = classifyMixStageStep(operation, currentDigit, d, upperNonzero, mainFormula);
    if (classified === null) continue;
    if (classified === 'mix_primary') primary.push(d);
    else if (classified === 'mix_secondary') secondary.push(d);
    else if (classified === 'formulasiz_fallback') fallbackFormulasiz.push(d);
  }

  // Mix primary eng yuqori ustuvorlik
  if (primary.length > 0) {
    const d = primary[Math.floor(Math.random() * primary.length)];
    return { operandDigit: d, formula: 'mix_primary', isPrimary: true };
  }
  // Mix secondary (boshqa mix operandlar 6-9)
  if (secondary.length > 0) {
    const d = secondary[Math.floor(Math.random() * secondary.length)];
    return { operandDigit: d, formula: 'mix_secondary', isPrimary: false };
  }
  // Formulasiz faqat (5-lik va 10-lik YO'Q)
  if (fallbackFormulasiz.length > 0) {
    const d = fallbackFormulasiz[Math.floor(Math.random() * fallbackFormulasiz.length)];
    return { operandDigit: d, formula: 'formulasiz_fallback', isPrimary: false };
  }
  return null;
}

function generateMixFormula(
  operation: OperationType,
  mainFormula: number,
  digitsCount: number,
  termsCount: number,
  maxAttempts: number = 1000,
  minPrimarySteps: number = 1,
  difficulty: DifficultyLevel = 'medium'
): FormulasizResult | null {
  // Mix formulada DOIMO oscillatsiya kerak:
  // mix ADD (digit 5+) → digit 1-4 → mix SUB (digit 1-4, upper>0) → digit 5+ → ...
  // Carry/borrow uchun stateWidth = digitsCount + 1
  const stateWidth = digitsCount + 1;

  for (let _attempt = 0; _attempt < maxAttempts; _attempt++) {
    // Smart initial: DOIMO digit 5+ bilan boshlaymiz
    // Mix ADD: digit 5+ da ishlaydi → carry hosil qiladi → upper > 0
    // Mix SUB: digit 1-4, upper > 0 kerak → ADD dan keyin tabiiy hosil bo'ladi
    const firstDigits: number[] = [];
    for (let i = 0; i < digitsCount; i++) {
      const low = 5;
      const high = Math.min(8, 14 - mainFormula);
      firstDigits.push(low + Math.floor(Math.random() * (high - low + 1)));
    }
    const firstNumber = digitsToNumber(firstDigits);
    if (firstNumber <= 0 || hasZeroInDisplayed(firstNumber, digitsCount)) continue;

    const numbers: number[] = [firstNumber];
    let currentValue = firstNumber;
    let ok = true;

    for (let termIndex = 1; termIndex < termsCount; termIndex++) {
      const currentDigits = numberToDigits(currentValue, stateWidth);
      // Asosiy digitlar (carry pozitsiyasidan tashqari)
      const mainDigits = currentDigits.slice(1);
      const avg = mainDigits.reduce((a, b) => a + b, 0) / digitsCount;

      // Oscillatsiya: digit 5+ → ADD (mix add ishlaydi), digit <5 → SUB (mix sub ishlaydi)
      const curOp: OperationType = avg >= 5 ? 'add' : 'sub';

      let built = false;
      for (let _retry = 0; _retry < 30; _retry++) {
        const state = numberToDigits(currentValue, stateWidth);
        const termDigits = new Array(digitsCount).fill(0);
        let termValid = true;

        // pos: stateWidth-1 dan 1 gacha (0-pozitsiya carry/borrow uchun)
        for (let pos = stateWidth - 1; pos >= 1; pos--) {
          const choice = chooseMixFormulaDigit(state, pos, curOp, mainFormula, difficulty);
          if (!choice) { termValid = false; break; }
          termDigits[pos - 1] = choice.operandDigit;
          applyDigit(state, pos, choice.operandDigit, curOp);
        }
        if (!termValid) continue;

        const term = digitsToNumber(termDigits);
        if (hasZeroInDisplayed(term, digitsCount)) continue;
        if (state[0] >= 10 || state[0] < 0) continue;

        const nextValue = digitsToNumber(state);
        if (nextValue < 0 || String(nextValue).length > stateWidth) continue;

        const signedVal = curOp === 'add' ? term : -term;
        const prevAbs = numbers.length > 1 ? Math.abs(numbers[numbers.length - 1]) : null;
        if (prevAbs !== null && term === prevAbs) continue;

        numbers.push(signedVal);
        currentValue = nextValue;
        built = true;
        break;
      }

      if (!built) { ok = false; break; }
    }

    if (!ok || numbers.length !== termsCount) continue;

    // Verifikatsiya
    let val = numbers[0], valid = true, pCount = 0;
    const simSt = numberToDigits(numbers[0], stateWidth);
    for (let i = 1; i < numbers.length; i++) {
      const signed = numbers[i];
      const term = Math.abs(signed);
      const termOp: OperationType = signed >= 0 ? 'add' : 'sub';
      const td = numberToDigits(term, digitsCount);
      for (let pos = stateWidth - 1; pos >= 1; pos--) {
        const un = simSt[pos - 1] > 0;
        const cl = classifyMixStageStep(termOp, simSt[pos], td[pos - 1], un, mainFormula);
        if (cl === null) { valid = false; break; }
        if (cl === 'mix_primary') pCount++;
        applyDigit(simSt, pos, td[pos - 1], termOp);
      }
      if (!valid) break;
      val = digitsToNumber(simSt);
      if (val < 0) { valid = false; break; }
    }
    if (!valid || pCount < minPrimarySteps) continue;
    return { numbers, answer: val, ok: true };
  }
  return null;
}

function verifyMixFormula(
  numbers: number[],
  _operation: OperationType,
  mainFormula: number,
  digitsCount: number,
  termsCount: number,
  minPrimarySteps: number = 1
): { ok: boolean; answer?: number; primarySteps?: number; error?: string } {
  if (numbers.length !== termsCount) return { ok: false, error: 'terms_count' };
  const stateWidth = digitsCount + 1;

  for (let idx = 0; idx < numbers.length; idx++) {
    if (hasZeroInDisplayed(Math.abs(numbers[idx]), digitsCount)) return { ok: false, error: 'zero_digit' };
  }

  const state = numberToDigits(numbers[0], stateWidth);
  let primarySteps = 0;

  for (let termIndex = 1; termIndex < numbers.length; termIndex++) {
    const signed = numbers[termIndex];
    const term = Math.abs(signed);
    const termOp: OperationType = signed >= 0 ? 'add' : 'sub';
    const termDigits = numberToDigits(term, digitsCount);

    for (let pos = stateWidth - 1; pos >= 1; pos--) {
      const currentDigit = state[pos];
      const upperNonzero = state[pos - 1] > 0;
      const operandDigit = termDigits[pos - 1];

      const classified = classifyMixStageStep(termOp, currentDigit, operandDigit, upperNonzero, mainFormula);
      if (classified === null) return { ok: false, error: 'invalid_step' };

      if (classified === 'mix_primary') primarySteps++;
      applyDigit(state, pos, operandDigit, termOp);
    }

    const currentValue = digitsToNumber(state);
    if (currentValue < 0) return { ok: false, error: 'negative_result' };
    if (String(currentValue).length > stateWidth) return { ok: false, error: 'overflow' };
  }

  const answer = digitsToNumber(state);
  // Signed termlar bilan tekshirish
  let checkVal = numbers[0];
  for (let i = 1; i < numbers.length; i++) { checkVal += numbers[i]; }
  if (checkVal !== answer) return { ok: false, error: 'answer_mismatch' };
  if (primarySteps < minPrimarySteps) return { ok: false, error: 'not_enough_primary' };

  return { ok: true, answer, primarySteps };
}

// =============================================
// UNIFIED GENERATOR (dispatches to correct block)
// =============================================

export function generateExample(cfg: ExampleConfig): GeneratedExample {
  const {
    operation, stage, digitsCount, termsCount, mainFormula,
    minPrimarySteps = 1
  } = cfg;

  let result: FormulasizResult | null = null;

  // Har bir generator o'zining default maxAttempts qiymatidan foydalanadi
  switch (stage) {
    case 'formulasiz':
      result = generateFormulasiz(operation, digitsCount, termsCount);
      break;
    case '5':
      result = generateFiveFormula(operation, mainFormula!, digitsCount, termsCount, undefined, minPrimarySteps);
      break;
    case '10':
      result = generateTenFormula(operation, mainFormula!, digitsCount, termsCount, undefined, minPrimarySteps);
      break;
    case 'mix':
      result = generateMixFormula(operation, mainFormula!, digitsCount, termsCount, undefined, minPrimarySteps);
      break;
  }

  if (!result) {
    throw new Error('Berilgan parametrlarda misol generatsiya qilib bo\'lmadi.');
  }

  const answer = result.answer;

  // Step-by-step logging va admin preview uchun
  const stepLogs: StepLog[] = [];
  const formulaStats: Record<string, number> = {
    formulasiz: 0, kichik_dost: 0, katta_dost: 0, mix: 0, unknown: 0,
  };
  let primarySteps = 0;

  // Re-simulate to build step logs
  if (stage !== 'formulasiz') {
    // 10-lik va mix formulada carry uchun 1 qo'shimcha pozitsiya kerak
    const headroom = (stage === '10' || stage === 'mix') ? 1 : 0;
    const simStateWidth = digitsCount + headroom;
    const simState = numberToDigits(result.numbers[0], simStateWidth);
    // Signed termlar bor-yo'qligini aniqlash (5-lik, 10-lik, mix mixed modeda)
    const hasMixedSigns = result.numbers.slice(1).some(n => n < 0);
    for (let termIdx = 1; termIdx < result.numbers.length; termIdx++) {
      const rawTerm = result.numbers[termIdx];
      // Signed term: sign = operation, unsigned: config operation
      const termOp: OperationType = hasMixedSigns
        ? (rawTerm >= 0 ? 'add' : 'sub')
        : operation;
      const termDigits = numberToDigits(Math.abs(rawTerm), digitsCount);
      for (let pos = simStateWidth - 1; pos >= headroom; pos--) {
        const tdIdx = pos - headroom;
        const currentDigit = simState[pos];
        const operandDigit = termDigits[tdIdx];
        const upperNonzero = pos > 0 ? simState[pos - 1] > 0 : false;
        const upperBefore = pos > 0 ? simState[pos - 1] : 0;

        let formula: string;
        let isPrimary = false;

        if (stage === '5') {
          const cl = classifyFiveStageStep(termOp, currentDigit, operandDigit);
          formula = cl || 'unknown';
          isPrimary = cl === '5' && operandDigit === mainFormula;
        } else if (stage === '10') {
          const cl = classifyTenStageStep(termOp, currentDigit, operandDigit, upperNonzero, mainFormula!);
          formula = cl || 'unknown';
          isPrimary = cl === '10_primary';
        } else {
          const cl = classifyMixStageStep(termOp, currentDigit, operandDigit, upperNonzero, mainFormula!);
          formula = cl || 'unknown';
          isPrimary = cl === 'mix_primary';
        }

        if (isPrimary) primarySteps++;
        const genericCl = classifyStepGeneric(termOp, currentDigit, operandDigit, upperNonzero);
        formulaStats[genericCl] = (formulaStats[genericCl] || 0) + 1;

        applyDigit(simState, pos, operandDigit, termOp);

        stepLogs.push({
          termIndex: termIdx,
          displayPos: tdIdx,
          statePos: pos,
          beforeDigit: currentDigit,
          operandDigit,
          operation: termOp,
          classified: genericCl,
          isPrimary,
          upperBefore,
          afterDigit: simState[pos],
          upperAfter: pos > 0 ? simState[pos - 1] : 0,
        });
      }
    }
  }

  const totalSteps = (result.numbers.length - 1) * digitsCount;
  const verification: VerificationResult = {
    isValid: true,
    answer,
    totalSteps,
    primarySteps,
    stats: formulaStats,
    steps: stepLogs,
    errors: [],
    formulaStats: formulaStats as any,
    primaryFormulaRatio: totalSteps > 0 ? primarySteps / totalSteps : 0,
  };

  return {
    config: cfg,
    terms: result.numbers,
    answer,
    stepLogs,
    veriabsNumbers = numbers.map(n => Math.abs(n));
  const width = Math.max(String(Math.abs(answer)).length, ...absNumbers.map(t => String(t).length)) + 1;
  const hasMixedSigns = numbers.slice(1).some(n => n < 0);
  const lines: string[] = [];
  lines.push(String(numbers[0]).padStart(width));
  for (let i = 1; i < numbers.length; i++) {
    let sign: string;
    if (hasMixedSigns) {
      sign = numbers[i] >= 0 ? '+' : '-';
    } else {
      sign = operation === 'add' ? '+' : '-';
    }
    lines.push(sign + String(Math.abs(numbers[i]) number[], answer: number, operation: OperationType): string {
  const absNumbers = numbers.map(n => Math.abs(n));
  const width = Math.max(String(Math.abs(answer)).length, ...absNumbers.map(t => String(t).length)) + 1;
  const hasMixedSigns = numbers.slice(1).some(n => n < 0);
  const lines: string[] = [];
  lines.push(String(numbers[0]).padStart(width));
  for (let i = 1; i < numbers.length; i++) {
    let sign: string;
    if (hasMixedSigns) {
      sign = numbers[i] >= 0 ? '+' : '-';
    } else {
      sign = operation === 'add' ? '+' : '-';
    }
    lines.push(sign + String(Math.abs(numbers[i])).padStart(width - 1));
  }
  lines.push('-'.repeat(width));
  lines.push(String(answer).padStart(width));
  return lines.join('\n');
}

// =============================================
// MIXED ADD/SUB GENERATOR (NumberTrainer uchun)
// Bitta misolda ham qo'shish ham ayirish aralashgan
// =============================================

export function generateMixedProblem(config: {
  digitsCount: number;
  termsCount: number;
  stage: StageType;
  mainFormula: number | null;
  ensurePositive?: boolean;
}): { startValue: number; sequence: number[]; answer: number } | null {
  const { digitsCount, termsCount, stage, mainFormula, ensurePositive = true } = config;
  const maxAttempts = 500;

  for (let _attempt = 0; _attempt < maxAttempts; _attempt++) {
    try {
      const firstTerm = randomNonZeroNumber(digitsCount);
      const sequence: number[] = [];
      let currentValue = firstTerm;
      let ok = true;

      for (let termIndex = 1; termIndex < termsCount; termIndex++) {
        let success = false;
        const operation: OperationType = Math.random() > 0.4 ? 'add' : 'sub';

        for (let _retry = 0; _retry < 200; _retry++) {
          const state = numberToDigits(currentValue, digitsCount);
          const termDigits = new Array(digitsCount).fill(0);
          let termValid = true;

          // Build term column by column (right to left)
          for (let pos = digitsCount - 1; pos >= 0; pos--) {
            const candidates: number[] = [];
            const currentDigit = state[pos];
            const upperNonzero = pos > 0 ? state[pos - 1] > 0 : false;

            for (let d = 1; d <= 9; d++) {
              let allowed = false;
              switch (stage) {
                case 'formulasiz':
                  if (operation === 'add') allowed = isFormulasizAdd(currentDigit, d);
                  else allowed = isFormulasizSub(currentDigit, d);
                  break;
                case '5': {
                  const c = classifyFiveStageStep(operation, currentDigit, d);
                  allowed = c !== null;
                  break;
                }
                case '10': {
                  const c = classifyTenStageStep(operation, currentDigit, d, upperNonzero, mainFormula || 1);
                  allowed = c !== null;
                  break;
                }
                case 'mix': {
                  const c = classifyMixStageStep(operation, currentDigit, d, upperNonzero, mainFormula || 6);
                  allowed = c !== null;
                  break;
                }
              }
              if (allowed) candidates.push(d);
            }

            if (candidates.length === 0) { termValid = false; break; }
            const chosen = candidates[Math.floor(Math.random() * candidates.length)];
            termDigits[pos] = chosen;
            applyDigit(state, pos, chosen, operation);
          }

          if (!termValid) continue;
          if (termDigits.some(d => d === 0)) continue;
          if (state[0] >= 10 || state[0] < 0) continue;

          const resultNum = digitsToNumber(state);
          if (ensurePositive && resultNum < 0) continue;
          if (String(Math.abs(resultNum)).length > digitsCount + 3) continue;

          const termNumber = digitsToNumber(termDigits);
          const signedDelta = operation === 'add' ? termNumber : -termNumber;

          currentValue = resultNum;
          sequence.push(signedDelta);
          success = true;
          break;
        }

        if (!success) { ok = false; break; }
      }

      if (!ok || sequence.length < termsCount - 1) continue;
      if (ensurePositive && currentValue < 0) continue;

      return { startValue: firstTerm, sequence, answer: currentValue };
    } catch { continue; }
  }
  return null;
}

// =============================================
// LEGACY COMPATIBILITY LAYER
// =============================================

export const LEGACY_FORMULA_MAPPING: Record<string, FormulaCategory[]> = {
  'oddiy': ['formulasiz'],
  'formula5': ['kichik_dost'],
  'formula10plus': ['katta_dost'],
  'hammasi': ['formulasiz', 'kichik_dost', 'katta_dost'],
  'basic': ['formulasiz'],
  'small_friend_1': ['kichik_dost'],
  'small_friend_2': ['kichik_dost'],
  'big_friend_3': ['katta_dost'],
  'big_friend_4': ['katta_dost'],
  'mixed': ['formulasiz', 'kichik_dost', 'katta_dost'],
  'formulasiz': ['formulasiz'],
  'kichik_dost': ['kichik_dost'],
  'katta_dost': ['katta_dost'],
  'mix': ['formulasiz', 'kichik_dost', 'katta_dost'],
};

export const getLegacyFormulas = (legacyType: string): FormulaCategory[] => {
  return LEGACY_FORMULA_MAPPING[legacyType] || ['formulasiz'];
};

function legacyToStage(formulaType: string): { stage: StageType; mainFormula: number | null } {
  switch (formulaType) {
    case 'oddiy': case 'formulasiz': case 'basic':
      return { stage: 'formulasiz', mainFormula: null };
    case 'formula5': case 'kichik_dost': case 'small_friend_1': case 'small_friend_2':
      return { stage: '5', mainFormula: null };
    case 'formula10plus': case 'katta_dost': case 'big_friend_3': case 'big_friend_4':
      return { stage: '10', mainFormula: null };
    case 'hammasi': case 'mixed': case 'mix':
      return { stage: 'mix', mainFormula: null };
    default:
      return { stage: 'formulasiz', mainFormula: null };
  }
}

function pickMainFormula(stage: StageType): number | null {
  switch (stage) {
    case 'formulasiz': return null;
    case '5': return [1, 2, 3, 4][Math.floor(Math.random() * 4)];
    case '10': return Math.floor(Math.random() * 9) + 1;
    case 'mix': return [6, 7, 8, 9][Math.floor(Math.random() * 4)];
  }
}

export interface ProblemConfig {
  digitCount: number;
  operationCount: number;
  allowedFormulas: FormulaCategory[];
  ensurePositiveResult?: boolean;
  difficulty?: DifficultyLevel;
}

export const generateProblem = (config: ProblemConfig): GeneratedProblem => {
  const { digitCount, operationCount, allowedFormulas, difficulty = 'medium' } = config;

  let stage: StageType = 'formulasiz';
  if (allowedFormulas.includes('katta_dost') && allowedFormulas.includes('kichik_dost')) {
    stage = 'mix';
  } else if (allowedFormulas.includes('katta_dost')) {
    stage = '10';
  } else if (allowedFormulas.includes('kichik_dost')) {
    stage = '5';
  }

  const mainFormula = pickMainFormula(stage);

  // Ixtisoslashtirilgan generatorlardan foydalanish
  let specializedResult: FormulasizResult | null = null;

  switch (stage) {
    case 'formulasiz': {
      // Formulasiz uchun doim aralash (mixed) generator — pure add faqat 9 ga olib boradi
      specializedResult = generateFormulasizMixed(digitCount, operationCount, 500);
      break;
    }
    case '5': {
      const mf = mainFormula ?? ([1, 2, 3, 4][Math.floor(Math.random() * 4)]);
      const op: OperationType = Math.random() > 0.5 ? 'add' : 'sub';
      specializedResult = generateFiveFormula(op, mf, digitCount, operationCount, 500, 1, difficulty);
      break;
    }
    case '10': {
      const mf = mainFormula ?? (Math.floor(Math.random() * 9) + 1);
      const op: OperationType = Math.random() > 0.5 ? 'add' : 'sub';
      specializedResult = generateTenFormula(op, mf, digitCount, operationCount, 1000, 1, difficulty);
      break;
    }
    case 'mix': {
      const mf = mainFormula ?? ([6, 7, 8, 9][Math.floor(Math.random() * 4)]);
      const op: OperationType = Math.random() > 0.5 ? 'add' : 'sub';
      specializedResult = generateMixFormula(op, mf, digitCount, operationCount, 1000, 1, difficulty);
      break;
    }
  }

  // Ixtisoslashtirilgan generator natijasini GeneratedProblem formatiga o'girish
  if (specializedResult && specializedResult.ok && specializedResult.numbers.length >= 2) {
    const startValue = specializedResult.numbers[0];
    const restNumbers = specializedResult.numbers.slice(1);
    
    // numbers[1..] signed bo'lishi mumkin (mixed mode) yoki unsigned (pure add/sub)
    const hasSigned = restNumbers.some(n => n < 0);

    let sequence: number[];
    if (hasSigned) {
      sequence = restNumbers;
    } else {
      // Unsigned bo'lsa, answer bo'yicha qaysi operation ekanini aniqlab signed ga aylantiramiz
      // (oldin bu joy hammasini musbat qilgani uchun noto'g'ri sign chiqayotgan edi)
      const sumRest = restNumbers.reduce((sum, n) => sum + n, 0);
      const inferredOp: OperationType = specializedResult.answer === startValue - sumRest ? 'sub' : 'add';
      sequence = restNumbers.map(n => (inferredOp === 'add' ? n : -n));
    }
    
    return {
      startValue,
      operations: sequence.map(delta => ({
        delta: Math.abs(delta),
        isAdd: delta > 0,
        formulaType: 'formulasiz' as FormulaCategory,
        isCarry: false,
      })),
      finalAnswer: specializedResult.answer,
      sequence,
    };
  }

  // Fallback: generateMixedProblem
  const result = generateMixedProblem({
    digitsCount: digitCount,
    termsCount: operationCount,
    stage,
    mainFormula,
    ensurePositive: config.ensurePositiveResult ?? true,
  });

  if (result) {
    return {
      startValue: result.startValue,
      operations: result.sequence.map(delta => ({
        delta: Math.abs(delta),
        isAdd: delta > 0,
        formulaType: 'formulasiz' as FormulaCategory,
        isCarry: false,
      })),
      finalAnswer: result.answer,
      sequence: result.sequence,
    };
  }

  const start = randomNonZeroNumber(digitCount);
  return { startValue: start, operations: [], finalAnswer: start, sequence: [] };
};

export const generateLegacyProblem = (
  formulaType: string,
  digitCount: number,
  problemCount: number
): { startValue: number; numbers: number[]; answer: number } => {
  const problem = generateProblem({
    digitCount,
    operationCount: problemCount,
    allowedFormulas: getLegacyFormulas(formulaType),
    ensurePositiveResult: true,
  });
  return { startValue: problem.startValue, numbers: problem.sequence, answer: problem.finalAnswer };
};

// Legacy helper exports
export const numberToColumns = (num: number): ColumnState[] => {
  if (num === 0) return [{ digit: 0 }];
  const columns: ColumnState[] = [];
  let n = Math.abs(num);
  while (n > 0) { columns.push({ digit: n % 10 }); n = Math.floor(n / 10); }
  return columns;
};

export const columnsToNumber = (columns: ColumnState[]): number => {
  return columns.reduce((sum, col, i) => sum + col.digit * Math.pow(10, i), 0);
};

export const createState = (value: number): SorobanState => ({
  columns: numberToColumns(value),
  value,
});

export const isFormulasizAllowed = (currentDigit: number, delta: number, isAdd: boolean): boolean => {
  if (isAdd) return (FORMULASIZ_PLUS[currentDigit] || []).includes(delta);
  return (FORMULASIZ_MINUS[currentDigit] || []).includes(delta);
};

export const isKichikDostAllowed = (currentDigit: number, delta: number, isAdd: boolean): boolean => {
  if (isAdd) return isSmall5Add(currentDigit, delta);
  return isSmall5Sub(currentDigit, delta);
};

export const isKattaDostAllowed = (currentValue: number, delta: number, isAdd: boolean): boolean => {
  const currentDigit = Math.abs(currentValue) % 10;
  const upperNonzero = Math.floor(Math.abs(currentValue) / 10) > 0;
  if (isAdd) return isPrimaryTenAdd(currentDigit, delta, upperNonzero);
  return isPrimaryTenSub(currentDigit, delta, upperNonzero);
};

function classificationToCategory(c: StepClassification): FormulaCategory | null {
  if (c === 'unknown') return null;
  return c;
}

function isClassificationAllowedForFormulas(
  classification: StepClassification,
  allowedFormulas: FormulaCategory[]
): boolean {
  if (classification === 'unknown') return false;
  if (classification === 'mix') {
    return allowedFormulas.includes('mix') || (
      allowedFormulas.includes('katta_dost') && allowedFormulas.includes('kichik_dost')
    );
  }

  const category = classificationToCategory(classification);
  return category ? allowedFormulas.includes(category) : false;
}

export const getAvailableOperations = (
  currentValue: number,
  allowedFormulas: FormulaCategory[],
  lastFormulaType: FormulaCategory | null = null
): AllowedOperation[] => {
  const operations: AllowedOperation[] = [];
  const currentDigit = Math.abs(currentValue) % 10;
  const upperNonzero = Math.floor(Math.abs(currentValue) / 10) > 0;

  for (let delta = 1; delta <= 9; delta++) {
    const addClass = classifyStepGeneric('add', currentDigit, delta, upperNonzero);
    if (isClassificationAllowedForFormulas(addClass, allowedFormulas)) {
      const category = classificationToCategory(addClass);
      if (category) {
        const isCarry = addClass === 'katta_dost' || addClass === 'mix';
        if (!isCarry || lastFormulaType !== 'katta_dost') {
          operations.push({ delta, isAdd: true, formulaType: category, isCarry });
        }
      }
    }

    const subClass = classifyStepGeneric('sub', currentDigit, delta, upperNonzero);
    if (isClassificationAllowedForFormulas(subClass, allowedFormulas)) {
      const category = classificationToCategory(subClass);
      if (category) {
        const isCarry = subClass === 'katta_dost' || subClass === 'mix';
        if (!isCarry || lastFormulaType !== 'katta_dost') {
          operations.push({ delta, isAdd: false, formulaType: category, isCarry });
        }
      }
    }
  }

  return operations;
};

export const applyOperation = (currentValue: number, op: AllowedOperation): number => {
  return op.isAdd ? currentValue + op.delta : currentValue - op.delta;
};

function getVerificationWidth(currentValue: number, delta: number): number {
  const nextValue = delta >= 0 ? currentValue + delta : currentValue + delta;
  return Math.max(
    1,
    String(Math.abs(currentValue)).length,
    String(Math.abs(delta)).length,
    String(Math.abs(nextValue)).length
  );
}

function aggregateStepClassification(classifications: StepClassification[]): StepClassification {
  if (classifications.length === 0) return 'unknown';
  if (classifications.includes('unknown')) return 'unknown';
  if (classifications.includes('mix')) return 'mix';
  if (classifications.includes('katta_dost')) return 'katta_dost';
  if (classifications.includes('kichik_dost')) return 'kichik_dost';
  return 'formulasiz';
}

function verifySingleSequenceStep(currentValue: number, delta: number): {
  nextValue: number;
  classifications: StepClassification[];
  aggregate: StepClassification;
  isCarry: boolean;
  logs: StepLog[];
  errors: string[];
} {
  const operation: OperationType = delta >= 0 ? 'add' : 'sub';
  const absDelta = Math.abs(delta);
  const width = getVerificationWidth(currentValue, delta);
  const state = numberToDigits(currentValue, width);
  const termDigits = numberToDigits(absDelta, width);
  const logs: StepLog[] = [];
  const classifications: StepClassification[] = [];
  const errors: string[] = [];

  for (let pos = width - 1; pos >= 0; pos--) {
    const operandDigit = termDigits[pos];
    if (operandDigit === 0) continue;

    const beforeDigit = state[pos];
    const upperBefore = pos > 0 ? state[pos - 1] : 0;
    const classified = classifyStepGeneric(operation, beforeDigit, operandDigit, upperBefore > 0);

    classifications.push(classified);
    if (classified === 'unknown') {
      errors.push(`unknown_operation: ${operation === 'add' ? '+' : '-'}${operandDigit} at digit ${beforeDigit}`);
    }

    applyDigit(state, pos, operandDigit, operation);

    logs.push({
      termIndex: 0,
      displayPos: width - 1 - pos,
      statePos: pos,
      beforeDigit,
      operandDigit,
      operation,
      classified,
      isPrimary: false,
      upperBefore,
      afterDigit: state[pos],
      upperAfter: pos > 0 ? state[pos - 1] : 0,
    });
  }

  const computedNextValue = operation === 'add' ? currentValue + absDelta : currentValue - absDelta;
  const stateIsBroken = state.some(d => d < 0 || d > 9);
  const stateValue = stateIsBroken ? computedNextValue : digitsToNumber(state);

  if (stateValue !== computedNextValue) {
    errors.push(`state_mismatch: expected ${computedNextValue}, got ${stateValue}`);
  }

  return {
    nextValue: computedNextValue,
    classifications,
    aggregate: aggregateStepClassification(classifications),
    isCarry: classifications.some(c => c === 'katta_dost' || c === 'mix'),
    logs,
    errors,
  };
}

export const generateVerifiedProblem = (
  config: ProblemConfig,
  stage?: string,
  maxRetries: number = 15
): { problem: GeneratedProblem; verification: VerificationResult } | null => {
  for (let i = 0; i < maxRetries; i++) {
    const problem = generateProblem(config);
    if (problem.sequence.length < config.operationCount - 1) continue;

    const verification = verifyProblem(problem.startValue, problem.sequence, stage);
    if (verification.isValid) {
      return { problem, verification };
    }
  }

  return null;
};

export const verifyProblem = (
  startValue: number,
  sequence: number[],
  expectedStage?: string
): VerificationResult => {
  const steps: StepLog[] = [];
  const errors: string[] = [];
  const formulaStats: Record<StepClassification, number> = {
    formulasiz: 0,
    kichik_dost: 0,
    katta_dost: 0,
    mix: 0,
    unknown: 0,
  };

  let currentValue = startValue;
  let lastWasCarry = false;
  let primarySteps = 0;
  const primaryClass = expectedStage ? getStagePrimaryClassification(expectedStage) : null;
  const allowedClassifications = expectedStage ? getStageAllowedClassifications(expectedStage) : null;

  for (let i = 0; i < sequence.length; i++) {
    const delta = sequence[i];
    const stepResult = verifySingleSequenceStep(currentValue, delta);

    if (i > 0 && Math.abs(delta) === Math.abs(sequence[i - 1])) {
      errors.push(`consecutive_duplicate: ${Math.abs(delta)}`);
    }

    for (const step of stepResult.logs) {
      steps.push({
        ...step,
        termIndex: i,
        isPrimary: primaryClass ? step.classified === primaryClass : false,
      });
      formulaStats[step.classified]++;

      if (allowedClassifications && step.classified !== 'unknown' && !allowedClassifications.includes(step.classified)) {
        errors.push(`topic_mismatch: ${step.classified} in ${expectedStage}`);
      }

      if (primaryClass && step.classified === primaryClass) {
        primarySteps++;
      }
    }

    errors.push(...stepResult.errors);

    if (stepResult.isCarry && lastWasCarry) {
      errors.push('consecutive_carry');
    }

    if ((expectedStage === 'formulasiz' || expectedStage === 'oddiy') && stepResult.isCarry) {
      errors.push('carry_used_in_formulasiz');
    }

    currentValue = stepResult.nextValue;
    lastWasCarry = stepResult.isCarry;
  }

  const uniqueErrors = [...new Set(errors)];
  const primaryFormulaRatio = steps.length > 0 ? primarySteps / steps.length : 0;

  return {
    isValid: uniqueErrors.length === 0,
    answer: currentValue,
    totalSteps: steps.length,
    primarySteps,
    stats: formulaStats as unknown as Record<string, number>,
    steps,
    errors: uniqueErrors,
    formulaStats,
    primaryFormulaRatio,
  };
};

function getStageAllowedClassifications(stage: string): StepClassification[] {
  switch (stage) {
    case 'formulasiz': case 'oddiy':
      return ['formulasiz'];
    case 'kichik_dost': case 'formula5': case '5':
      return ['formulasiz', 'kichik_dost'];
    case 'katta_dost': case 'formula10plus': case '10':
      return ['formulasiz', 'kichik_dost', 'katta_dost'];
    case 'mix': case 'hammasi':
      return ['formulasiz', 'kichik_dost', 'katta_dost', 'mix'];
    default:
      return ['formulasiz', 'kichik_dost', 'katta_dost', 'mix'];
  }
}

function getStagePrimaryClassification(stage: string): StepClassification | null {
  switch (stage) {
    case 'formulasiz': case 'oddiy': return 'formulasiz';
    case 'kichik_dost': case 'formula5': case '5': return 'kichik_dost';
    case 'katta_dost': case 'formula10plus': case '10': return 'katta_dost';
    case 'mix': case 'hammasi': return 'mix';
    default: return null;
  }
}

export const validateProblemSequence = (
  sequence: number[],
  allowedFormulas: FormulaCategory[]
): { isValid: boolean; errors: string[] } => {
  if (sequence.length < 2) {
    return { isValid: false, errors: ['Kamida 2 ta son bo\'lishi kerak'] };
  }
  const verification = verifyProblem(sequence[0], sequence.slice(1));
  const errors: string[] = [];
  for (const step of verification.steps) {
    if (step.classified === 'unknown') {
      errors.push(`${step.termIndex + 1}-amal ruxsat etilmagan`);
    }
  }
  return { isValid: errors.length === 0, errors };
};

export const FORMULA_LABELS: Record<string, { label: string; icon: string; description: string }> = {
  formulasiz: { label: 'Formulasiz', icon: '📘', description: 'Oddiy qo\'shish va ayirish amallari' },
  kichik_dost: { label: 'Kichik do\'st (5)', icon: '🔢', description: '+4/-4, +3/-3, +2/-2, +1/-1 formulalari' },
  katta_dost: { label: 'Katta do\'st (10)', icon: '🔟', description: '+9/-9 dan +1/-1 gacha formulalar' },
  mix: { label: 'Mix (Aralash)', icon: '🎯', description: 'Barcha formulalar aralashtirilgan holda' },
};
