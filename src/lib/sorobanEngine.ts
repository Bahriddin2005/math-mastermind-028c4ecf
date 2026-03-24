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
 * Har bir blok o'zining:
 * - Klassifikatsiya funksiyasi
 * - Generator funksiyasi
 * - Verifikator funksiyasi
 * ga ega.
 */

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
  7: [1, 2, 5, 6, 7],
  8: [1, 2, 3, 5, 6, 7, 8],
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
  const low = 10 - operandDigit;
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
      const avg = numberToDigits(currentValue, digitsCount).reduce((a, b) => a + b, 0) / digitsCount;
      const op: OperationType = avg >= 5 ? 'sub' : (Math.random() > 0.4 ? 'add' : 'sub');
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
      const next = op === 'add' ? currentValue + term : currentValue - term;
      if (next < 0 || String(next).length > digitsCount) { ok = false; break; }

      signedTerms.push(op === 'add' ? term : -term);
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
    if (isFormulasizAdd(currentDigit, operandDigit)) return 'formulasiz';
    return null;
  }
  if (isSmall5Sub(currentDigit, operandDigit)) return '5';
  if (isFormulasizSub(currentDigit, operandDigit)) return 'formulasiz';
  return null;
}

function chooseFiveFormulaDigit(
  currentDigit: number,
  operation: OperationType,
  mainFormula: number
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

function generateFiveFormula(
  operation: OperationType,
  mainFormula: number,
  digitsCount: number,
  termsCount: number,
  maxAttempts: number = 200,
  minPrimarySteps: number = 1
): FormulasizResult | null {
  for (let _attempt = 0; _attempt < maxAttempts; _attempt++) {
    const firstNumber = smartInitialForFive(operation, mainFormula, digitsCount);
    const numbers = [firstNumber];
    let currentValue = firstNumber;
    let ok = true;

    for (let termIndex = 1; termIndex < termsCount; termIndex++) {
      const currentDigits = numberToDigits(currentValue, digitsCount);
      const termDigits: number[] = [];
      let termValid = true;

      for (const digit of currentDigits) {
        const choice = chooseFiveFormulaDigit(digit, operation, mainFormula);
        if (!choice) { termValid = false; break; }
        termDigits.push(choice.operandDigit);
      }
      if (!termValid) { ok = false; break; }

      const term = digitsToNumber(termDigits);
      if (hasZeroInDisplayed(term, digitsCount)) { ok = false; break; }

      const nextValue = operation === 'add' ? currentValue + term : currentValue - term;
      if (nextValue < 0 || String(nextValue).length > digitsCount) { ok = false; break; }

      numbers.push(term);
      currentValue = nextValue;
    }

    if (!ok || numbers.length !== termsCount) continue;

    const verified = verifyFiveFormula(numbers, operation, mainFormula, digitsCount, termsCount, minPrimarySteps);
    if (!verified.ok) continue;

    return { numbers, answer: verified.answer!, ok: true };
  }
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
    if (isSmall5Add(currentDigit, operandDigit)) return '5_fallback';
    if (isFormulasizAdd(currentDigit, operandDigit)) return 'formulasiz_fallback';
    return null;
  }

  if (operandDigit === mainFormula && isPrimaryTenSub(currentDigit, operandDigit, upperNonzero)) {
    return '10_primary';
  }
  if (isSmall5Sub(currentDigit, operandDigit)) return '5_fallback';
  if (isFormulasizSub(currentDigit, operandDigit)) return 'formulasiz_fallback';
  return null;
}

function chooseTenFormulaDigit(
  state: number[],
  pos: number,
  operation: OperationType,
  mainFormula: number
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

  if (primary.length > 0) {
    return { operandDigit: primary[Math.floor(Math.random() * primary.length)], formula: '10_primary', isPrimary: true };
  }
  if (fallback5.length > 0) {
    return { operandDigit: fallback5[Math.floor(Math.random() * fallback5.length)], formula: '5_fallback', isPrimary: false };
  }
  if (fallbackFormulasiz.length > 0) {
    return { operandDigit: fallbackFormulasiz[Math.floor(Math.random() * fallbackFormulasiz.length)], formula: 'formulasiz_fallback', isPrimary: false };
  }
  return null;
}

function generateTenFormula(
  operation: OperationType,
  mainFormula: number,
  digitsCount: number,
  termsCount: number,
  maxAttempts: number = 200,
  minPrimarySteps: number = 1
): FormulasizResult | null {
  for (let _attempt = 0; _attempt < maxAttempts; _attempt++) {
    const firstNumber = randomNonZeroNumber(digitsCount);
    const numbers = [firstNumber];
    let currentValue = firstNumber;
    let ok = true;

    for (let termIndex = 1; termIndex < termsCount; termIndex++) {
      const state = numberToDigits(currentValue, digitsCount);
      const termDigits = new Array(digitsCount).fill(0);
      let termValid = true;

      for (let pos = digitsCount - 1; pos >= 0; pos--) {
        const choice = chooseTenFormulaDigit(state, pos, operation, mainFormula);
        if (!choice) { termValid = false; break; }
        termDigits[pos] = choice.operandDigit;
        applyDigit(state, pos, choice.operandDigit, operation);
      }
      if (!termValid) { ok = false; break; }

      const term = digitsToNumber(termDigits);
      if (hasZeroInDisplayed(term, digitsCount)) { ok = false; break; }
      if (state[0] >= 10 || state[0] < 0) { ok = false; break; }

      const nextValue = digitsToNumber(state);
      if (nextValue < 0 || String(nextValue).length > digitsCount) { ok = false; break; }

      numbers.push(term);
      currentValue = nextValue;
    }

    if (!ok || numbers.length !== termsCount) continue;

    const verified = verifyTenFormula(numbers, operation, mainFormula, digitsCount, termsCount, minPrimarySteps);
    if (!verified.ok) continue;

    return { numbers, answer: verified.answer!, ok: true };
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

  for (let idx = 0; idx < numbers.length; idx++) {
    if (hasZeroInDisplayed(numbers[idx], digitsCount)) return { ok: false, error: 'zero_digit' };
  }

  const state = numberToDigits(numbers[0], digitsCount);
  let primarySteps = 0;

  for (let termIndex = 1; termIndex < numbers.length; termIndex++) {
    const termDigits = numberToDigits(numbers[termIndex], digitsCount);

    for (let pos = digitsCount - 1; pos >= 0; pos--) {
      const currentDigit = state[pos];
      const upperNonzero = pos > 0 ? state[pos - 1] > 0 : false;
      const operandDigit = termDigits[pos];

      const classified = classifyTenStageStep(operation, currentDigit, operandDigit, upperNonzero, mainFormula);
      if (classified === null) return { ok: false, error: 'invalid_step' };

      if (classified === '10_primary') primarySteps++;
      applyDigit(state, pos, operandDigit, operation);
    }

    const currentValue = digitsToNumber(state);
    if (currentValue < 0) return { ok: false, error: 'negative_result' };
    if (String(currentValue).length > digitsCount) return { ok: false, error: 'overflow' };
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
    if (operandDigit === mainFormula && isMixAdd(currentDigit, operandDigit)) return 'mix_primary';
    if (isPrimaryTenAdd(currentDigit, operandDigit, upperNonzero)) return '10_fallback';
    if (isSmall5Add(currentDigit, operandDigit)) return '5_fallback';
    if (isFormulasizAdd(currentDigit, operandDigit)) return 'formulasiz_fallback';
    return null;
  }

  if (operandDigit === mainFormula && isMixSub(currentDigit, operandDigit, upperNonzero)) return 'mix_primary';
  if (isPrimaryTenSub(currentDigit, operandDigit, upperNonzero)) return '10_fallback';
  if (isSmall5Sub(currentDigit, operandDigit)) return '5_fallback';
  if (isFormulasizSub(currentDigit, operandDigit)) return 'formulasiz_fallback';
  return null;
}

function chooseMixFormulaDigit(
  state: number[],
  pos: number,
  operation: OperationType,
  mainFormula: number
): { operandDigit: number; formula: string; isPrimary: boolean } | null {
  const currentDigit = state[pos];
  const upperNonzero = pos > 0 ? state[pos - 1] > 0 : false;

  const primary: number[] = [];
  const fallback10: number[] = [];
  const fallback5: number[] = [];
  const fallbackFormulasiz: number[] = [];

  for (let d = 1; d <= 9; d++) {
    const classified = classifyMixStageStep(operation, currentDigit, d, upperNonzero, mainFormula);
    if (classified === null) continue;
    if (classified === 'mix_primary') primary.push(d);
    else if (classified === '10_fallback') fallback10.push(d);
    else if (classified === '5_fallback') fallback5.push(d);
    else if (classified === 'formulasiz_fallback') fallbackFormulasiz.push(d);
  }

  if (primary.length > 0) {
    return { operandDigit: primary[Math.floor(Math.random() * primary.length)], formula: 'mix_primary', isPrimary: true };
  }
  if (fallback10.length > 0) {
    return { operandDigit: fallback10[Math.floor(Math.random() * fallback10.length)], formula: '10_fallback', isPrimary: false };
  }
  if (fallback5.length > 0) {
    return { operandDigit: fallback5[Math.floor(Math.random() * fallback5.length)], formula: '5_fallback', isPrimary: false };
  }
  if (fallbackFormulasiz.length > 0) {
    return { operandDigit: fallbackFormulasiz[Math.floor(Math.random() * fallbackFormulasiz.length)], formula: 'formulasiz_fallback', isPrimary: false };
  }
  return null;
}

function generateMixFormula(
  operation: OperationType,
  mainFormula: number,
  digitsCount: number,
  termsCount: number,
  maxAttempts: number = 7000,
  minPrimarySteps: number = 1
): FormulasizResult | null {
  for (let _attempt = 0; _attempt < maxAttempts; _attempt++) {
    try {
      const firstNumber = operation === 'add'
        ? randomNonZeroNumber(digitsCount)
        : randomInitialForSub(digitsCount);

      const numbers = [firstNumber];
      let currentValue = firstNumber;
      let success = true;

      for (let termIndex = 1; termIndex < termsCount; termIndex++) {
        let built = false;

        for (let _retry = 0; _retry < 500; _retry++) {
          try {
            const state = numberToDigits(currentValue, digitsCount);
            const termDigits = new Array(digitsCount).fill(0);
            let termValid = true;

            for (let pos = digitsCount - 1; pos >= 0; pos--) {
              const choice = chooseMixFormulaDigit(state, pos, operation, mainFormula);
              if (!choice) { termValid = false; break; }
              termDigits[pos] = choice.operandDigit;
              applyDigit(state, pos, choice.operandDigit, operation);
            }
            if (!termValid) continue;

            const term = digitsToNumber(termDigits);
            if (hasZeroInDisplayed(term, digitsCount)) continue;
            if (state[0] >= 10 || state[0] < 0) continue;

            const nextValue = digitsToNumber(state);
            if (nextValue < 0) continue;
            if (String(nextValue).length > digitsCount) continue;

            numbers.push(term);
            currentValue = nextValue;
            built = true;
            break;
          } catch { continue; }
        }

        if (!built) { success = false; break; }
      }

      if (!success) continue;

      const verified = verifyMixFormula(numbers, operation, mainFormula, digitsCount, termsCount, minPrimarySteps);
      if (!verified.ok) continue;

      return { numbers, answer: verified.answer!, ok: true };
    } catch { continue; }
  }
  return null;
}

function verifyMixFormula(
  numbers: number[],
  operation: OperationType,
  mainFormula: number,
  digitsCount: number,
  termsCount: number,
  minPrimarySteps: number = 1
): { ok: boolean; answer?: number; primarySteps?: number; error?: string } {
  if (numbers.length !== termsCount) return { ok: false, error: 'terms_count' };

  for (let idx = 0; idx < numbers.length; idx++) {
    if (hasZeroInDisplayed(numbers[idx], digitsCount)) return { ok: false, error: 'zero_digit' };
  }

  const state = numberToDigits(numbers[0], digitsCount);
  let primarySteps = 0;

  for (let termIndex = 1; termIndex < numbers.length; termIndex++) {
    const termDigits = numberToDigits(numbers[termIndex], digitsCount);

    for (let pos = digitsCount - 1; pos >= 0; pos--) {
      const currentDigit = state[pos];
      const upperNonzero = pos > 0 ? state[pos - 1] > 0 : false;
      const operandDigit = termDigits[pos];

      const classified = classifyMixStageStep(operation, currentDigit, operandDigit, upperNonzero, mainFormula);
      if (classified === null) return { ok: false, error: 'invalid_step' };

      if (classified === 'mix_primary') primarySteps++;
      applyDigit(state, pos, operandDigit, operation);
    }

    const currentValue = digitsToNumber(state);
    if (currentValue < 0) return { ok: false, error: 'negative_result' };
    if (String(currentValue).length > digitsCount) return { ok: false, error: 'overflow' };
  }

  const answer = digitsToNumber(state);
  const plainAnswer = plainApply(numbers, operation);
  if (plainAnswer !== answer) return { ok: false, error: 'answer_mismatch' };
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
  const verification: VerificationResult = {
    isValid: true,
    answer,
    totalSteps: (termsCount - 1) * digitsCount,
    primarySteps: 0,
    stats: {},
    steps: [],
    errors: [],
    formulaStats: { formulasiz: 0, kichik_dost: 0, katta_dost: 0, mix: 0, unknown: 0 },
    primaryFormulaRatio: 0,
  };

  return {
    config: cfg,
    terms: result.numbers,
    answer,
    stepLogs: [],
    verification,
    formatted: formatVerticalExample(result.numbers, answer, operation),
  };
}

function formatVerticalExample(numbers: number[], answer: number, operation: OperationType): string {
  const width = Math.max(String(Math.abs(answer)).length, ...numbers.map(t => String(t).length));
  const lines: string[] = [];
  lines.push(String(numbers[0]).padStart(width));
  const sign = operation === 'add' ? '+' : '-';
  for (let i = 1; i < numbers.length; i++) {
    lines.push(sign + String(numbers[i]).padStart(width - 1));
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
}

export const generateProblem = (config: ProblemConfig): GeneratedProblem => {
  const { digitCount, operationCount, allowedFormulas } = config;

  let stage: StageType = 'formulasiz';
  if (allowedFormulas.includes('katta_dost') && allowedFormulas.includes('kichik_dost')) {
    stage = 'mix';
  } else if (allowedFormulas.includes('katta_dost')) {
    stage = '10';
  } else if (allowedFormulas.includes('kichik_dost')) {
    stage = '5';
  }

  const mainFormula = pickMainFormula(stage);

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
  if (isAdd) return isPrimaryTenAdd(currentDigit, delta, upperNonzero) || isMixAdd(currentDigit, delta);
  return isPrimaryTenSub(currentDigit, delta, upperNonzero) || isMixSub(currentDigit, delta, upperNonzero);
};

export const getAvailableOperations = (
  currentValue: number,
  allowedFormulas: FormulaCategory[],
  lastFormulaType: FormulaCategory | null = null
): AllowedOperation[] => {
  const operations: AllowedOperation[] = [];
  const currentDigit = Math.abs(currentValue) % 10;
  const upperNonzero = Math.floor(Math.abs(currentValue) / 10) > 0;

  for (let delta = 1; delta <= 9; delta++) {
    // Add
    const addClass = classifyStepGeneric('add', currentDigit, delta, upperNonzero);
    if (addClass !== 'unknown') {
      const cat = classificationToCategory(addClass);
      if (cat && allowedFormulas.includes(cat)) {
        const isCarry = addClass === 'katta_dost' || addClass === 'mix';
        if (!isCarry || lastFormulaType !== 'katta_dost') {
          operations.push({ delta, isAdd: true, formulaType: cat, isCarry });
        }
      }
    }
    // Sub
    const subClass = classifyStepGeneric('sub', currentDigit, delta, upperNonzero);
    if (subClass !== 'unknown') {
      const cat = classificationToCategory(subClass);
      if (cat && allowedFormulas.includes(cat)) {
        const isCarry = subClass === 'katta_dost' || subClass === 'mix';
        if (!isCarry || lastFormulaType !== 'katta_dost') {
          operations.push({ delta, isAdd: false, formulaType: cat, isCarry });
        }
      }
    }
  }
  return operations;
};

function classificationToCategory(c: StepClassification): FormulaCategory | null {
  if (c === 'unknown') return null;
  if (c === 'mix') return 'katta_dost';
  return c;
}

export const applyOperation = (currentValue: number, op: AllowedOperation): number => {
  return op.isAdd ? currentValue + op.delta : currentValue - op.delta;
};

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

  const fallback = generateProblem(config);
  const fallbackVerification = verifyProblem(fallback.startValue, fallback.sequence, stage);
  return { problem: fallback, verification: fallbackVerification };
};

export const verifyProblem = (
  startValue: number,
  sequence: number[],
  expectedStage?: string
): VerificationResult => {
  const steps: StepLog[] = [];
  const errors: string[] = [];
  const formulaStats: Record<StepClassification, number> = {
    formulasiz: 0, kichik_dost: 0, katta_dost: 0, mix: 0, unknown: 0,
  };

  let currentValue = startValue;
  let lastWasCarry = false;

  for (let i = 0; i < sequence.length; i++) {
    const delta = sequence[i];
    const isAdd = delta > 0;
    const absDelta = Math.abs(delta);
    const currentDigit = Math.abs(currentValue) % 10;
    const upperNonzero = Math.floor(Math.abs(currentValue) / 10) > 0;

    const classification = classifyStepGeneric(isAdd ? 'add' : 'sub', currentDigit, absDelta, upperNonzero);
    formulaStats[classification]++;

    if (classification === 'unknown') {
      errors.push(`unknown_operation: ${isAdd ? '+' : '-'}${absDelta} at digit ${currentDigit}`);
    }

    if (expectedStage && classification !== 'unknown') {
      const allowed = getStageAllowedClassifications(expectedStage);
      if (!allowed.includes(classification)) {
        errors.push(`topic_mismatch: ${classification} in ${expectedStage}`);
      }
    }

    const isCarry = classification === 'katta_dost' || classification === 'mix';
    if (isCarry && lastWasCarry) {
      errors.push('consecutive_carry');
    }

    if (expectedStage === 'formulasiz' && isCarry) {
      errors.push('carry_used_in_formulasiz');
    }

    steps.push({
      termIndex: i,
      displayPos: 0,
      statePos: 0,
      beforeDigit: currentDigit,
      operandDigit: absDelta,
      operation: isAdd ? 'add' : 'sub',
      classified: classification,
      isPrimary: false,
      upperBefore: 0,
      afterDigit: 0,
      upperAfter: 0,
    });

    currentValue += delta;
    lastWasCarry = isCarry;
  }

  let primaryFormulaRatio = 0;
  if (expectedStage && steps.length > 0) {
    const primaryClass = getStagePrimaryClassification(expectedStage);
    if (primaryClass) {
      primaryFormulaRatio = (formulaStats[primaryClass] || 0) / steps.length;
    }
  }

  return {
    isValid: errors.length === 0,
    answer: currentValue,
    totalSteps: steps.length,
    primarySteps: 0,
    stats: formulaStats as unknown as Record<string, number>,
    steps,
    errors,
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
