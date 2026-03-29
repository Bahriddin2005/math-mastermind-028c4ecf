/**
 * 21-BLOK: SOROBAN KO'PAYTIRISH GENERATORI
 * ==========================================
 * Soroban metodologiyasiga mos ko'paytirish misollarini generatsiya qiladi.
 */

export interface MultiplicationConfig {
  multiplicandDigits: number;  // 1-5
  multiplierDigits: number;    // 1-5
  maxResultDigits?: number;    // default 10
}

export interface MultiplicationExample {
  a: number;
  b: number;
  answer: number;
  formatted: string;
  numbers: number[];
  verification: {
    isValid: boolean;
    resultDigits: number;
  };
}

function randomNumberWithDigits(digits: number): number {
  if (digits === 1) return Math.floor(Math.random() * 9) + 1;
  const start = Math.pow(10, digits - 1);
  const end = Math.pow(10, digits) - 1;
  return Math.floor(Math.random() * (end - start + 1)) + start;
}

function formatMultiplication(a: number, b: number, answer: number): string {
  const line1 = String(a);
  const line2 = '× ' + String(b);
  const answerStr = String(answer);
  const width = Math.max(line1.length, line2.length, answerStr.length);
  return [
    line1.padStart(width),
    line2.padStart(width),
    '-'.repeat(width),
  ].join('\n');
}

export function generateMultiplicationExample(config: MultiplicationConfig): MultiplicationExample {
  const maxResultDigits = config.maxResultDigits || 10;
  const maxAttempts = 200;

  for (let i = 0; i < maxAttempts; i++) {
    const a = randomNumberWithDigits(config.multiplicandDigits);
    const b = randomNumberWithDigits(config.multiplierDigits);
    const answer = a * b;
    const resultDigits = String(answer).length;

    if (resultDigits <= maxResultDigits) {
      return {
        a,
        b,
        answer,
        formatted: formatMultiplication(a, b, answer),
        numbers: [a, b],
        verification: {
          isValid: true,
          resultDigits,
        },
      };
    }
  }

  // Fallback: smaller numbers
  const a = randomNumberWithDigits(Math.min(config.multiplicandDigits, 2));
  const b = randomNumberWithDigits(1);
  const answer = a * b;
  return {
    a, b, answer,
    formatted: formatMultiplication(a, b, answer),
    numbers: [a, b],
    verification: { isValid: true, resultDigits: String(answer).length },
  };
}

/**
 * Difficulty-based table ranges for MultiplicationPractice
 */
export const MULTIPLICATION_TABLE_RANGES: Record<string, { multiplicandDigits: number; multiplierDigits: number }> = {
  beginner: { multiplicandDigits: 1, multiplierDigits: 1 },      // 1×1
  elementary: { multiplicandDigits: 2, multiplierDigits: 1 },     // 2×1
  intermediate: { multiplicandDigits: 3, multiplierDigits: 1 },   // 3×1
  advanced: { multiplicandDigits: 3, multiplierDigits: 2 },       // 3×2
  expert: { multiplicandDigits: 4, multiplierDigits: 2 },         // 4×2
};

/**
 * Generate multiple-choice options for a multiplication answer
 */
export function generateMultiplicationOptions(answer: number, count: number = 4): number[] {
  const options = new Set<number>([answer]);
  const range = Math.max(Math.floor(answer * 0.2), 10);

  while (options.size < count) {
    const offset = Math.floor(Math.random() * range * 2) - range;
    const wrong = answer + offset;
    if (wrong > 0 && wrong !== answer) {
      options.add(wrong);
    }
  }

  return Array.from(options).sort(() => Math.random() - 0.5);
}
