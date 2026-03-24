/**
 * SOROBAN MENTAL ARITHMETIC ENGINE v2
 * ====================================
 * Python algoritmiga asoslangan to'liq qayta yozilgan engine.
 * 
 * Asosiy xususiyatlar:
 * 1. Ustun mustaqilligi - har bir xona alohida state
 * 2. Headroom - carry/borrow uchun qo'shimcha ustunlar
 * 3. Stage tizimi - formulasiz, 5, 10, mix (primary + fallback)
 * 4. Verifikator - har bir generatsiya qilingan misol tekshiriladi
 * 5. Konfiguratsiya - operation, stage, digits_count, terms_count, main_formula
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
  digitsCount: number;      // 1..6
  termsCount: number;       // 3..25
  mainFormula: number | null; // null for formulasiz, 1-4 for 5, 1-9 for 10, 6-9 for mix
  headroom?: number;         // extra hidden columns for carry/borrow (default 3)
  maxAttempts?: number;      // default 3000
  minPrimarySteps?: number;  // default 1
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

// ============= YORDAMCHI FUNKSIYALAR =============

function numberToDigits(n: number, width: number): number[] {
  const s = String(Math.abs(n)).padStart(width, '0');
  return Array.from(s, ch => parseInt(ch, 10));
}

function digitsToNumber(digits: number[]): number {
  return parseInt(digits.map(String).join(''), 10) || 0;
}

function stripLeadingZeroes(digits: number[]): number[] {
  let i = 0;
  while (i < digits.length - 1 && digits[i] === 0) i++;
  return digits.slice(i);
}

function stateToInt(state: number[]): number {
  return digitsToNumber(stripLeadingZeroes(state));
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

function randomInitialForSub(digitsCount: number): number {
  const digits: number[] = [];
  for (let i = 0; i < digitsCount; i++) {
    digits.push(Math.floor(Math.random() * 5) + 5); // 5-9
  }
  return digitsToNumber(digits);
}

function makeInitialState(number: number, digitsCount: number, headroom: number): number[] {
  const totalWidth = digitsCount + headroom;
  const state = new Array(totalWidth).fill(0);
  const numDigits = numberToDigits(number, digitsCount);
  for (let i = 0; i < digitsCount; i++) {
    state[totalWidth - digitsCount + i] = numDigits[i];
  }
  return state;
}

function displayedDigitsFromState(state: number[], digitsCount: number): number[] {
  return state.slice(state.length - digitsCount);
}

// ============= CARRY / BORROW NORMALIZATION =============

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
    const need = Math.ceil(-state[pos] / 10);
    state[pos] += 10 * need;
    state[pos - 1] -= need;
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
  if (operation === 'add') {
    applyAddDigit(state, pos, operandDigit);
  } else {
    applySubDigit(state, pos, operandDigit);
  }
}

// ============= FORMULA KLASSIFIKATSIYASI =============

function isFormulasizAdd(currentDigit: number, operandDigit: number): boolean {
  return (FORMULASIZ_PLUS[currentDigit] || []).includes(operandDigit);
}

function isFormulasizSub(currentDigit: number, operandDigit: number): boolean {
  return (FORMULASIZ_MINUS[currentDigit] || []).includes(operandDigit);
}

function isSmall5Add(currentDigit: number, operandDigit: number): boolean {
  if (operandDigit < 1 || operandDigit > 4) return false;
  const low = 5 - operandDigit;
  return low <= currentDigit && currentDigit <= 4;
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

function isTenAdd(currentDigit: number, operandDigit: number): boolean {
  if (operandDigit < 1 || operandDigit > 9) return false;
  if (currentDigit + operandDigit < 10) return false;
  if (isMixAdd(currentDigit, operandDigit)) return false;
  return true;
}

function isTenSub(currentDigit: number, operandDigit: number, upperNonzero: boolean): boolean {
  if (operandDigit < 1 || operandDigit > 9) return false;
  if (!upperNonzero) return false;
  if (currentDigit >= operandDigit) return false;
  if (isMixSub(currentDigit, operandDigit, upperNonzero)) return false;
  return true;
}

function classifyAddStep(currentDigit: number, operandDigit: number): StepClassification {
  if (isFormulasizAdd(currentDigit, operandDigit)) return 'formulasiz';
  if (isSmall5Add(currentDigit, operandDigit)) return 'kichik_dost';
  if (isMixAdd(currentDigit, operandDigit)) return 'mix';
  if (isTenAdd(currentDigit, operandDigit)) return 'katta_dost';
  return 'unknown';
}

function classifySubStep(currentDigit: number, operandDigit: number, upperNonzero: boolean): StepClassification {
  if (isFormulasizSub(currentDigit, operandDigit)) return 'formulasiz';
  if (isSmall5Sub(currentDigit, operandDigit)) return 'kichik_dost';
  if (isMixSub(currentDigit, operandDigit, upperNonzero)) return 'mix';
  if (isTenSub(currentDigit, operandDigit, upperNonzero)) return 'katta_dost';
  return 'unknown';
}

function classifyStepInternal(
  operation: OperationType,
  currentDigit: number,
  operandDigit: number,
  upperNonzero: boolean
): StepClassification {
  if (operation === 'add') {
    return classifyAddStep(currentDigit, operandDigit);
  }
  return classifySubStep(currentDigit, operandDigit, upperNonzero);
}

// Public export
export const classifyStep = (
  currentValue: number,
  operandDigit: number,
  isAdd: boolean
): StepClassification => {
  const currentDigit = Math.abs(currentValue) % 10;
  const upperNonzero = Math.floor(Math.abs(currentValue) / 10) > 0;
  return classifyStepInternal(isAdd ? 'add' : 'sub', currentDigit, operandDigit, upperNonzero);
};

// ============= STAGE QOIDALARI =============

function stagePrimaryAndFallback(stage: StageType): { primary: string; fallback: string[] } {
  switch (stage) {
    case 'formulasiz': return { primary: 'formulasiz', fallback: [] };
    case '5': return { primary: 'kichik_dost', fallback: ['formulasiz'] };
    case '10': return { primary: 'katta_dost', fallback: ['kichik_dost', 'formulasiz'] };
    case 'mix': return { primary: 'mix', fallback: ['katta_dost', 'kichik_dost', 'formulasiz'] };
  }
}

function digitAllowedForStage(
  operation: OperationType,
  stage: StageType,
  mainFormula: number | null,
  currentDigit: number,
  operandDigit: number,
  upperNonzero: boolean
): { allowed: boolean; isPrimary: boolean; classified: StepClassification } {
  const classified = classifyStepInternal(operation, currentDigit, operandDigit, upperNonzero);
  if (classified === 'unknown') {
    return { allowed: false, isPrimary: false, classified };
  }

  const { primary, fallback } = stagePrimaryAndFallback(stage);

  if (stage === 'formulasiz') {
    const ok = classified === 'formulasiz';
    return { allowed: ok, isPrimary: ok, classified };
  }

  // Primary: stage ham to'g'ri, va operandDigit == mainFormula
  if (classified === primary && operandDigit === mainFormula) {
    return { allowed: true, isPrimary: true, classified };
  }

  // Fallback
  if (fallback.includes(classified)) {
    return { allowed: true, isPrimary: false, classified };
  }

  return { allowed: false, isPrimary: false, classified };
}

// ============= TERM BUILDER =============

function chooseOperandDigitForPosition(
  state: number[],
  pos: number,
  cfg: ExampleConfig
): { digit: number | null; isPrimary: boolean; classified: StepClassification | null } {
  const currentDigit = state[pos];
  const upperNonzero = pos > 0 ? state[pos - 1] > 0 : false;

  const primaryCandidates: number[] = [];
  const fallbackCandidates: { digit: number; classified: StepClassification }[] = [];

  for (let operandDigit = 1; operandDigit <= 9; operandDigit++) {
    const { allowed, isPrimary, classified } = digitAllowedForStage(
      cfg.operation, cfg.stage, cfg.mainFormula,
      currentDigit, operandDigit, upperNonzero
    );
    if (!allowed) continue;
    if (isPrimary) {
      primaryCandidates.push(operandDigit);
    } else {
      fallbackCandidates.push({ digit: operandDigit, classified });
    }
  }

  if (primaryCandidates.length > 0) {
    const chosen = primaryCandidates[Math.floor(Math.random() * primaryCandidates.length)];
    return { digit: chosen, isPrimary: true, classified: cfg.stage === 'formulasiz' ? 'formulasiz' : stagePrimaryAndFallback(cfg.stage).primary as StepClassification };
  }
  if (fallbackCandidates.length > 0) {
    const item = fallbackCandidates[Math.floor(Math.random() * fallbackCandidates.length)];
    return { digit: item.digit, isPrimary: false, classified: item.classified };
  }
  return { digit: null, isPrimary: false, classified: null };
}

function buildOneTerm(
  currentState: number[],
  cfg: ExampleConfig
): { termNumber: number | null; primarySteps: number; logs: StepLog[] } {
  const state = [...currentState];
  const displayedWidth = cfg.digitsCount;
  const totalWidth = state.length;
  const termDigits = new Array(displayedWidth).fill(0);
  let primarySteps = 0;
  const logs: StepLog[] = [];

  // Right to left (LSD -> MSD)
  for (let dispIndex = displayedWidth - 1; dispIndex >= 0; dispIndex--) {
    const pos = totalWidth - displayedWidth + dispIndex;
    const result = chooseOperandDigitForPosition(state, pos, cfg);

    if (result.digit === null) {
      return { termNumber: null, primarySteps: 0, logs: [] };
    }

    const beforeDigit = state[pos];
    const upperBefore = pos > 0 ? state[pos - 1] : 0;

    applyDigit(state, pos, result.digit, cfg.operation);

    const afterDigit = state[pos];
    const upperAfter = pos > 0 ? state[pos - 1] : 0;

    termDigits[dispIndex] = result.digit;

    if (result.isPrimary) primarySteps++;

    logs.push({
      termIndex: 0, // will be set later
      displayPos: dispIndex,
      statePos: pos,
      beforeDigit,
      operandDigit: result.digit,
      operation: cfg.operation,
      classified: result.classified || 'unknown',
      isPrimary: result.isPrimary,
      upperBefore,
      afterDigit,
      upperAfter,
    });
  }

  // 0 raqami bo'lmasligi kerak
  if (termDigits.some(d => d === 0)) {
    return { termNumber: null, primarySteps: 0, logs: [] };
  }

  return { termNumber: digitsToNumber(termDigits), primarySteps, logs };
}

// ============= VERIFIKATOR =============

export function verifyExample(terms: number[], cfg: ExampleConfig): VerificationResult {
  const errors: string[] = [];
  const stats: Record<string, number> = { formulasiz: 0, kichik_dost: 0, katta_dost: 0, mix: 0 };
  const formulaStats: Record<StepClassification, number> = {
    formulasiz: 0, kichik_dost: 0, katta_dost: 0, mix: 0, unknown: 0,
  };
  const allLogs: StepLog[] = [];
  let totalSteps = 0;
  let primarySteps = 0;

  if (terms.length !== cfg.termsCount) {
    errors.push('terms_count_mismatch');
    return { isValid: false, answer: 0, totalSteps: 0, primarySteps: 0, stats, steps: [], errors, formulaStats, primaryFormulaRatio: 0 };
  }

  // Check for zero digits
  for (let idx = 0; idx < terms.length; idx++) {
    if (hasZeroInDisplayed(terms[idx], cfg.digitsCount)) {
      errors.push(`zero_digit_found_in_term_${idx}`);
      return { isValid: false, answer: 0, totalSteps: 0, primarySteps: 0, stats, steps: [], errors, formulaStats, primaryFormulaRatio: 0 };
    }
  }

  const headroom = cfg.headroom ?? 3;
  const state = makeInitialState(terms[0], cfg.digitsCount, headroom);

  for (let termIndex = 1; termIndex < terms.length; termIndex++) {
    const termDigits = numberToDigits(terms[termIndex], cfg.digitsCount);

    for (let dispIndex = cfg.digitsCount - 1; dispIndex >= 0; dispIndex--) {
      const pos = state.length - cfg.digitsCount + dispIndex;
      const operandDigit = termDigits[dispIndex];
      const currentDigit = state[pos];
      const upperNonzero = pos > 0 ? state[pos - 1] > 0 : false;

      const classified = classifyStepInternal(cfg.operation, currentDigit, operandDigit, upperNonzero);

      if (classified === 'unknown') {
        errors.push(`invalid_step: term=${termIndex}, pos=${dispIndex}, cur=${currentDigit}, op=${operandDigit}`);
        return { isValid: false, answer: 0, totalSteps, primarySteps, stats, steps: allLogs, errors, formulaStats, primaryFormulaRatio: 0 };
      }

      const { allowed, isPrimary } = digitAllowedForStage(
        cfg.operation, cfg.stage, cfg.mainFormula,
        currentDigit, operandDigit, upperNonzero
      );

      if (!allowed) {
        errors.push(`topic_mismatch: ${classified} in ${cfg.stage} stage, term=${termIndex}, pos=${dispIndex}`);
        return { isValid: false, answer: 0, totalSteps, primarySteps, stats, steps: allLogs, errors, formulaStats, primaryFormulaRatio: 0 };
      }

      totalSteps++;
      stats[classified] = (stats[classified] || 0) + 1;
      formulaStats[classified]++;
      if (isPrimary) primarySteps++;

      const beforeDigit = state[pos];
      const upperBefore = pos > 0 ? state[pos - 1] : 0;
      applyDigit(state, pos, operandDigit, cfg.operation);

      allLogs.push({
        termIndex,
        displayPos: dispIndex,
        statePos: pos,
        beforeDigit,
        operandDigit,
        operation: cfg.operation,
        classified,
        isPrimary,
        upperBefore,
        afterDigit: state[pos],
        upperAfter: pos > 0 ? state[pos - 1] : 0,
      });
    }
  }

  // Verify answer
  const plainAnswer = applyTermsPlain(terms, cfg.operation);
  const simulatedAnswer = stateToInt(state);

  if (plainAnswer !== simulatedAnswer) {
    errors.push(`answer_mismatch: plain=${plainAnswer}, simulated=${simulatedAnswer}`);
  }

  if (cfg.stage !== 'formulasiz' && primarySteps < (cfg.minPrimarySteps ?? 1)) {
    errors.push(`primary_formula_not_used_enough: ${primarySteps}`);
  }

  const primaryFormulaRatio = totalSteps > 0 ? primarySteps / totalSteps : 0;

  return {
    isValid: errors.length === 0,
    answer: simulatedAnswer,
    totalSteps,
    primarySteps,
    stats,
    steps: allLogs,
    errors,
    formulaStats,
    primaryFormulaRatio,
  };
}

function applyTermsPlain(terms: number[], operation: OperationType): number {
  let result = terms[0];
  for (let i = 1; i < terms.length; i++) {
    if (operation === 'add') {
      result += terms[i];
    } else {
      result -= terms[i];
    }
  }
  return result;
}

// ============= GENERATOR =============

export function generateExample(cfg: ExampleConfig): GeneratedExample {
  const headroom = cfg.headroom ?? 3;
  const maxAttempts = cfg.maxAttempts ?? 3000;

  for (let _attempt = 0; _attempt < maxAttempts; _attempt++) {
    try {
      const firstTerm = cfg.operation === 'add'
        ? randomNonZeroNumber(cfg.digitsCount)
        : randomInitialForSub(cfg.digitsCount);

      let currentState = makeInitialState(firstTerm, cfg.digitsCount, headroom);
      const terms = [firstTerm];
      const allStepLogs: StepLog[] = [];
      let totalPrimarySteps = 0;
      let ok = true;

      for (let termIndex = 1; termIndex < cfg.termsCount; termIndex++) {
        let success = false;

        for (let _retry = 0; _retry < 200; _retry++) {
          const { termNumber, primarySteps, logs } = buildOneTerm(currentState, cfg);
          if (termNumber === null) continue;

          // Real apply to state
          const trialState = [...currentState];
          const termDigits = numberToDigits(termNumber, cfg.digitsCount);
          for (let dispIndex = cfg.digitsCount - 1; dispIndex >= 0; dispIndex--) {
            const pos = trialState.length - cfg.digitsCount + dispIndex;
            applyDigit(trialState, pos, termDigits[dispIndex], cfg.operation);
          }

          // Check no negative digits in state
          if (trialState.some(d => d < 0)) continue;

          // Check result doesn't exceed digits count
          const resultNum = stateToInt(trialState);
          if (String(resultNum).length > cfg.digitsCount + headroom) continue;

          currentState = trialState;
          terms.push(termNumber);
          totalPrimarySteps += primarySteps;

          for (const item of logs) {
            item.termIndex = termIndex;
          }
          allStepLogs.push(...logs);
          success = true;
          break;
        }

        if (!success) {
          ok = false;
          break;
        }
      }

      if (!ok) continue;

      const verification = verifyExample(terms, cfg);
      if (!verification.isValid) continue;

      if (cfg.stage !== 'formulasiz' && verification.primarySteps < (cfg.minPrimarySteps ?? 1)) continue;

      const answer = applyTermsPlain(terms, cfg.operation);

      return {
        config: cfg,
        terms,
        answer,
        stepLogs: allStepLogs,
        verification,
        formatted: formatVerticalExample(terms, answer, cfg.operation),
      };
    } catch {
      continue;
    }
  }

  throw new Error('Berilgan parametrlarda misol generatsiya qilib bo\'lmadi.');
}

// ============= FORMATTER =============

function formatVerticalExample(terms: number[], answer: number, operation: OperationType): string {
  const width = Math.max(String(Math.abs(answer)).length, ...terms.map(t => String(t).length));
  const lines: string[] = [];
  lines.push(String(terms[0]).padStart(width));
  const sign = operation === 'add' ? '+' : '-';
  for (let i = 1; i < terms.length; i++) {
    lines.push(sign + String(terms[i]).padStart(width - 1));
  }
  lines.push('-'.repeat(width));
  lines.push(String(answer).padStart(width));
  return lines.join('\n');
}

// ============= MIXED ADD/SUB GENERATOR =============
// NumberTrainer uchun - bitta misolda ham qo'shish ham ayirish aralashgan

export function generateMixedProblem(config: {
  digitsCount: number;
  termsCount: number; // boshlang'ich son ham shu ichida
  stage: StageType;
  mainFormula: number | null;
  ensurePositive?: boolean;
}): { startValue: number; sequence: number[]; answer: number } | null {
  const { digitsCount, termsCount, stage, mainFormula, ensurePositive = true } = config;
  const headroom = 3;
  const maxAttempts = 500;

  for (let _attempt = 0; _attempt < maxAttempts; _attempt++) {
    try {
      const firstTerm = randomNonZeroNumber(digitsCount);
      let currentState = makeInitialState(firstTerm, digitsCount, headroom);
      const sequence: number[] = [];
      let ok = true;

      for (let termIndex = 1; termIndex < termsCount; termIndex++) {
        let success = false;

        // Randomly choose add or sub for this term
        const operation: OperationType = Math.random() > 0.4 ? 'add' : 'sub';

        for (let _retry = 0; _retry < 200; _retry++) {
          const termDigits = new Array(digitsCount).fill(0);
          let termValid = true;

          // Build term column by column (right to left)
          const trialState = [...currentState];

          for (let dispIndex = digitsCount - 1; dispIndex >= 0; dispIndex--) {
            const pos = trialState.length - digitsCount + dispIndex;
            const currentDigit = trialState[pos];
            const upperNonzero = pos > 0 ? trialState[pos - 1] > 0 : false;

            // Find allowed digits for this position
            const candidates: number[] = [];
            for (let d = 1; d <= 9; d++) {
              const { allowed } = digitAllowedForStage(
                operation, stage, mainFormula,
                currentDigit, d, upperNonzero
              );
              if (allowed) candidates.push(d);
            }

            if (candidates.length === 0) {
              termValid = false;
              break;
            }

            const chosen = candidates[Math.floor(Math.random() * candidates.length)];
            termDigits[dispIndex] = chosen;
            applyDigit(trialState, pos, chosen, operation);
          }

          if (!termValid) continue;
          if (termDigits.some(d => d === 0)) continue;

          // Check no negative digits in state
          if (trialState.some(d => d < 0)) continue;

          const resultNum = stateToInt(trialState);

          // Ensure positive result
          if (ensurePositive && resultNum < 0) continue;

          // Don't exceed digit count too much
          if (String(Math.abs(resultNum)).length > digitsCount + headroom) continue;

          const termNumber = digitsToNumber(termDigits);
          const signedDelta = operation === 'add' ? termNumber : -termNumber;

          currentState = trialState;
          sequence.push(signedDelta);
          success = true;
          break;
        }

        if (!success) {
          ok = false;
          break;
        }
      }

      if (!ok || sequence.length < termsCount - 1) continue;

      const answer = stateToInt(currentState);

      // Quick verify: no negative answer if ensurePositive
      if (ensurePositive && answer < 0) continue;

      return { startValue: firstTerm, sequence, answer };
    } catch {
      continue;
    }
  }

  return null;
}

// ============= LEGACY COMPATIBILITY =============

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

/**
 * Map legacy formula type to new stage system
 */
function legacyToStage(formulaType: string): { stage: StageType; mainFormula: number | null } {
  switch (formulaType) {
    case 'oddiy':
    case 'formulasiz':
    case 'basic':
      return { stage: 'formulasiz', mainFormula: null };
    case 'formula5':
    case 'kichik_dost':
    case 'small_friend_1':
    case 'small_friend_2':
      return { stage: '5', mainFormula: null }; // will pick random
    case 'formula10plus':
    case 'katta_dost':
    case 'big_friend_3':
    case 'big_friend_4':
      return { stage: '10', mainFormula: null }; // will pick random
    case 'hammasi':
    case 'mixed':
    case 'mix':
      return { stage: 'mix', mainFormula: null }; // will pick random
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

/**
 * Legacy interface: generateProblem
 * Eski komponentlar bilan moslik uchun
 */
export interface ProblemConfig {
  digitCount: number;
  operationCount: number;
  allowedFormulas: FormulaCategory[];
  ensurePositiveResult?: boolean;
}

export const generateProblem = (config: ProblemConfig): GeneratedProblem => {
  const { digitCount, operationCount, allowedFormulas } = config;

  // Determine stage from allowedFormulas
  let stage: StageType = 'formulasiz';
  if (allowedFormulas.includes('katta_dost') && allowedFormulas.includes('kichik_dost')) {
    stage = 'mix';
  } else if (allowedFormulas.includes('katta_dost')) {
    stage = '10';
  } else if (allowedFormulas.includes('kichik_dost')) {
    stage = '5';
  }

  const mainFormula = pickMainFormula(stage);

  // Use mixed generator (both add and sub in same problem)
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

  // Absolute fallback
  const start = randomNonZeroNumber(digitCount);
  return {
    startValue: start,
    operations: [],
    finalAnswer: start,
    sequence: [],
  };
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
  return {
    startValue: problem.startValue,
    numbers: problem.sequence,
    answer: problem.finalAnswer,
  };
};

// Legacy helper exports
export const numberToColumns = (num: number): ColumnState[] => {
  if (num === 0) return [{ digit: 0 }];
  const columns: ColumnState[] = [];
  let n = Math.abs(num);
  while (n > 0) {
    columns.push({ digit: n % 10 });
    n = Math.floor(n / 10);
  }
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
  if (isAdd) return isTenAdd(currentDigit, delta) || isMixAdd(currentDigit, delta);
  return isTenSub(currentDigit, delta, upperNonzero) || isMixSub(currentDigit, delta, upperNonzero);
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
    const addClass = classifyStepInternal('add', currentDigit, delta, upperNonzero);
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
    const subClass = classifyStepInternal('sub', currentDigit, delta, upperNonzero);
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
  if (c === 'mix') return 'katta_dost'; // mix uses both 5 and 10, map to katta_dost for legacy
  return c;
}

export const applyOperation = (currentValue: number, op: AllowedOperation): number => {
  return op.isAdd ? currentValue + op.delta : currentValue - op.delta;
};

/**
 * Verifikatsiyadan o'tgan misol generatsiya qilish
 */
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

  // Fallback
  const fallback = generateProblem(config);
  const fallbackVerification = verifyProblem(fallback.startValue, fallback.sequence, stage);
  return { problem: fallback, verification: fallbackVerification };
};

/**
 * Legacy verifier
 */
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

    const classification = classifyStepInternal(
      isAdd ? 'add' : 'sub', currentDigit, absDelta, upperNonzero
    );
    formulaStats[classification]++;

    let isValid = true;
    let error: string | undefined;

    if (classification === 'unknown') {
      isValid = false;
      error = `unknown_operation: ${isAdd ? '+' : '-'}${absDelta} at digit ${currentDigit}`;
    }

    if (expectedStage && classification !== 'unknown') {
      const allowed = getStageAllowedClassifications(expectedStage);
      if (!allowed.includes(classification)) {
        isValid = false;
        error = `topic_mismatch: ${classification} in ${expectedStage}`;
      }
    }

    const isCarry = classification === 'katta_dost' || classification === 'mix';
    if (isCarry && lastWasCarry) {
      isValid = false;
      error = 'consecutive_carry';
    }

    if (expectedStage === 'formulasiz' && isCarry) {
      isValid = false;
      error = 'carry_used_in_formulasiz';
    }

    const resultValue = currentValue + delta;
    if (resultValue < 0) {
      // Not necessarily an error for all modes
    }

    if (absDelta >= 10) {
      if (String(absDelta).includes('0')) {
        isValid = false;
        error = 'zero_digit_found';
      }
    }

    if (error && !errors.includes(error)) errors.push(error);

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

    currentValue = resultValue;
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
    case 'formulasiz':
    case 'oddiy':
      return ['formulasiz'];
    case 'kichik_dost':
    case 'formula5':
    case '5':
      return ['formulasiz', 'kichik_dost'];
    case 'katta_dost':
    case 'formula10plus':
    case '10':
      return ['formulasiz', 'kichik_dost', 'katta_dost'];
    case 'mix':
    case 'hammasi':
      return ['formulasiz', 'kichik_dost', 'katta_dost', 'mix'];
    default:
      return ['formulasiz', 'kichik_dost', 'katta_dost', 'mix'];
  }
}

function getStagePrimaryClassification(stage: string): StepClassification | null {
  switch (stage) {
    case 'formulasiz':
    case 'oddiy':
      return 'formulasiz';
    case 'kichik_dost':
    case 'formula5':
    case '5':
      return 'kichik_dost';
    case 'katta_dost':
    case 'formula10plus':
    case '10':
      return 'katta_dost';
    case 'mix':
    case 'hammasi':
      return 'mix';
    default:
      return null;
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
