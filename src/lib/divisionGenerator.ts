/**
 * 22-BLOK: SOROBAN BO'LISH GENERATORI
 * =====================================
 * Qoldiqsiz bo'lish misollarini generatsiya qiladi.
 * 
 * Asosiy usul: dividend = divisor × quotient
 * Bu usul qoldiqsiz bo'lishni 100% kafolatlaydi.
 */

export type DivisionDifficulty = 'easy' | 'medium' | 'hard';

export interface DivisionConfig {
  dividendDigits: number;   // 1..7
  divisorDigits: number;    // 1..4
  quotientDigits: number;   // 1..7
  difficulty?: DivisionDifficulty;
  maxAttempts?: number;
}

export interface DivisionExample {
  dividend: number;
  divisor: number;
  quotient: number;
  answer: number;
  numbers: number[];
  formatted: string;
  verification: {
    isValid: boolean;
    isRemainderFree: boolean;
    dividendDigits: number;
    divisorDigits: number;
    quotientDigits: number;
  };
  config: DivisionConfig;
}

// ============= VALIDATION =============

function validateDivisionConfig(cfg: DivisionConfig): void {
  if (cfg.dividendDigits < 1 || cfg.dividendDigits > 7) {
    throw new Error('dividendDigits 1..7 oralig\'ida bo\'lishi kerak.');
  }
  if (cfg.divisorDigits < 1 || cfg.divisorDigits > 4) {
    throw new Error('divisorDigits 1..4 oralig\'ida bo\'lishi kerak.');
  }
  if (cfg.quotientDigits < 1 || cfg.quotientDigits > 7) {
    throw new Error('quotientDigits 1..7 oralig\'ida bo\'lishi kerak.');
  }
}

// ============= RANDOM HELPERS =============

function randomNumberWithDigitsAndDifficulty(
  digits: number,
  difficulty: DivisionDifficulty
): number {
  if (digits < 1) throw new Error('digits kamida 1 bo\'lishi kerak.');

  let low: number, high: number;
  if (digits === 1) {
    low = 1;
    high = 9;
  } else {
    low = Math.pow(10, digits - 1);
    high = Math.pow(10, digits) - 1;
  }

  if (difficulty === 'easy') {
    const mid = low + Math.floor((high - low) / 3);
    return Math.floor(Math.random() * (Math.max(low, mid) - low + 1)) + low;
  }

  if (difficulty === 'hard') {
    const mid = low + Math.floor(2 * (high - low) / 3);
    return Math.floor(Math.random() * (high - Math.min(mid, high) + 1)) + Math.min(mid, high);
  }

  // medium
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

// ============= FORMATTER =============

function formatDivision(dividend: number, divisor: number): string {
  const line1 = String(dividend);
  const line2 = '÷ ' + String(divisor);
  const width = Math.max(line1.length, line2.length);
  return [
    line1.padStart(width),
    line2.padStart(width),
    '-'.repeat(width),
  ].join('\n');
}

// ============= GENERATOR =============

export function generateDivisionExample(config: DivisionConfig): DivisionExample {
  validateDivisionConfig(config);

  const difficulty = config.difficulty || 'medium';
  const maxAttempts = config.maxAttempts || 5000;

  for (let i = 0; i < maxAttempts; i++) {
    const divisor = randomNumberWithDigitsAndDifficulty(config.divisorDigits, difficulty);
    const quotient = randomNumberWithDigitsAndDifficulty(config.quotientDigits, difficulty);
    const dividend = divisor * quotient;

    // Check dividend digits match exactly
    if (String(dividend).length !== config.dividendDigits) continue;
    // Max 7 digits
    if (String(dividend).length > 7) continue;

    const formatted = formatDivision(dividend, divisor);

    return {
      dividend,
      divisor,
      quotient,
      answer: quotient,
      numbers: [dividend, divisor],
      formatted,
      verification: {
        isValid: true,
        isRemainderFree: true,
        dividendDigits: String(dividend).length,
        divisorDigits: String(divisor).length,
        quotientDigits: String(quotient).length,
      },
      config,
    };
  }

  throw new Error('Berilgan parametrlar bilan qoldiqsiz bo\'lish misoli generatsiya qilib bo\'lmadi.');
}

// ============= DIFFICULTY RANGES =============

export const DIVISION_TABLE_RANGES: Record<string, { dividendDigits: number; divisorDigits: number; quotientDigits: number }> = {
  beginner:     { dividendDigits: 2, divisorDigits: 1, quotientDigits: 1 },  // 2÷1=1
  elementary:   { dividendDigits: 3, divisorDigits: 1, quotientDigits: 2 },  // 3÷1=2
  intermediate: { dividendDigits: 4, divisorDigits: 2, quotientDigits: 2 },  // 4÷2=2
  advanced:     { dividendDigits: 5, divisorDigits: 2, quotientDigits: 3 },  // 5÷2=3
  expert:       { dividendDigits: 6, divisorDigits: 3, quotientDigits: 3 },  // 6÷3=3
};

// ============= STRESS TEST =============

export function stressTestDivision(
  config: DivisionConfig,
  repeatCount: number = 1000
): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < repeatCount; i++) {
    try {
      const ex = generateDivisionExample(config);
      // Verify
      if (ex.divisor === 0) throw new Error('Divisor is 0');
      if (ex.dividend % ex.divisor !== 0) throw new Error('Has remainder');
      if (Math.floor(ex.dividend / ex.divisor) !== ex.quotient) throw new Error('Quotient mismatch');
      if (String(ex.dividend).length !== config.dividendDigits) throw new Error('Dividend digits mismatch');
      if (String(ex.divisor).length !== config.divisorDigits) throw new Error('Divisor digits mismatch');
      if (String(ex.quotient).length !== config.quotientDigits) throw new Error('Quotient digits mismatch');
      passed++;
    } catch (e: any) {
      failed++;
      if (errors.length < 5) errors.push(e.message);
    }
  }

  return { passed, failed, errors };
}
