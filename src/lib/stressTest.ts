/**
 * 13-BLOK: Adaptive Stress Test
 * ==============================
 * sorobanEngine generatorlarini stress test qilish.
 */

import {
  generateExample,
  type ExampleConfig,
  type GeneratedExample,
  type StageType,
  type OperationType,
} from '@/lib/sorobanEngine';
import type { DifficultyLevel } from '@/hooks/useAdaptiveDifficulty';

export interface StressTestCase {
  name: string;
  config: ExampleConfig & { difficulty?: DifficultyLevel };
  repeatCount: number;
}

export interface StressTestResult {
  name: string;
  config: any;
  repeatCount: number;
  passed: number;
  failed: number;
  successRate: number;
  durationMs: number;
  errors: Array<{ iteration: number; error: string }>;
  sampleResults: Array<{
    terms: number[];
    answer: number;
    primarySteps: number;
    totalSteps: number;
  }>;
}

export function runSingleStressTest(testCase: StressTestCase): StressTestResult {
  const start = performance.now();
  let passed = 0;
  let failed = 0;
  const errors: StressTestResult['errors'] = [];
  const sampleResults: StressTestResult['sampleResults'] = [];

  for (let i = 1; i <= testCase.repeatCount; i++) {
    try {
      const example = generateExample(testCase.config);

      // Validate
      if (!example.verification.isValid) {
        throw new Error('Verification failed');
      }
      if (example.terms.length < 2) {
        throw new Error('Not enough terms');
      }

      passed++;

      // Save first 5 as samples
      if (sampleResults.length < 5) {
        sampleResults.push({
          terms: example.terms,
          answer: example.answer,
          primarySteps: example.verification.primarySteps,
          totalSteps: example.verification.totalSteps,
        });
      }
    } catch (e: any) {
      failed++;
      if (errors.length < 5) {
        errors.push({ iteration: i, error: e.message || String(e) });
      }
    }
  }

  const durationMs = Math.round(performance.now() - start);

  return {
    name: testCase.name,
    config: testCase.config,
    repeatCount: testCase.repeatCount,
    passed,
    failed,
    successRate: testCase.repeatCount > 0 ? Math.round((passed / testCase.repeatCount) * 100 * 100) / 100 : 0,
    durationMs,
    errors,
    sampleResults,
  };
}

export function buildDefaultStressTestCases(repeatCount: number = 50): StressTestCase[] {
  const cases: StressTestCase[] = [];
  const stages: StageType[] = ['formulasiz', '5', '10', 'mix'];
  const operations: OperationType[] = ['add', 'sub'];
  const digitsOptions = [1, 2, 3];

  for (const stage of stages) {
    for (const op of operations) {
      for (const digits of digitsOptions) {
        const mainFormula = stage === '5' ? 4 : stage === '10' ? 8 : stage === 'mix' ? 7 : null;
        cases.push({
          name: `${stage}_${op}_${digits}xona`,
          config: {
            operation: op,
            stage,
            digitsCount: digits,
            termsCount: 5,
            mainFormula,
            minPrimarySteps: stage === 'formulasiz' ? 0 : 1,
          },
          repeatCount,
        });
      }
    }
  }

  return cases;
}

export function runFullStressSuite(repeatCount: number = 50): {
  totalCases: number;
  totalRuns: number;
  totalPassed: number;
  totalFailed: number;
  overallSuccessRate: number;
  totalDurationMs: number;
  results: StressTestResult[];
} {
  const cases = buildDefaultStressTestCases(repeatCount);
  const results: StressTestResult[] = [];
  let totalPassed = 0;
  let totalFailed = 0;
  const suiteStart = performance.now();

  for (const testCase of cases) {
    const result = runSingleStressTest(testCase);
    results.push(result);
    totalPassed += result.passed;
    totalFailed += result.failed;
  }

  const totalRuns = totalPassed + totalFailed;
  return {
    totalCases: cases.length,
    totalRuns,
    totalPassed,
    totalFailed,
    overallSuccessRate: totalRuns > 0 ? Math.round((totalPassed / totalRuns) * 100 * 100) / 100 : 0,
    totalDurationMs: Math.round(performance.now() - suiteStart),
    results,
  };
}
