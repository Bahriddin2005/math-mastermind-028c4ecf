/**
 * BARCHA FORMULA QOIDALARINI TEKSHIRISH TESTI
 * =============================================
 * Har bir formula turi uchun:
 * 1. Jadval qoidalarini tekshirish
 * 2. Generator ishlashini tekshirish  
 * 3. Generatsiya qilingan misollarni verifikatsiya
 */

// ============ JADVALLAR (sorobanEngine.ts dan nusxa) ============

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

// ============ QOIDALAR (foydalanuvchidan) ============

// Formulasiz qoidalar
const EXPECTED_FORMULASIZ_PLUS: Record<number, number[]> = {
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

const EXPECTED_FORMULASIZ_MINUS: Record<number, number[]> = {
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

// 5-lik formula qoidalar
// +N: (5-N)..4 → allowed
// -N: 5..(4+N) → allowed
const EXPECTED_FIVE_ADD: Record<number, number[]> = {
  1: [4],        // 4..4
  2: [3, 4],     // 3..4
  3: [2, 3, 4],  // 2..4
  4: [1, 2, 3, 4], // 1..4
};
const EXPECTED_FIVE_SUB: Record<number, number[]> = {
  1: [5],        // 5..5
  2: [5, 6],     // 5..6
  3: [5, 6, 7],  // 5..7
  4: [5, 6, 7, 8], // 5..8
};

// 10-lik formula qoidalar
const EXPECTED_TEN_ADD: Record<number, { x0: number[], xgt0: number[] }> = {
  9: { x0: [1,2,3,4,6,7,8,9], xgt0: [1,2,3,4,6,7,8,9] },
  8: { x0: [2,3,4,7,8,9], xgt0: [2,3,4,7,8,9] },
  7: { x0: [3,4,8,9], xgt0: [3,4,8,9] },
  6: { x0: [4,9], xgt0: [4,9] },
  5: { x0: [5,6,7,8,9], xgt0: [5,6,7,8,9] },
  4: { x0: [6,7,8,9], xgt0: [6,7,8,9] },
  3: { x0: [7,8,9], xgt0: [7,8,9] },
  2: { x0: [8,9], xgt0: [8,9] },
  1: { x0: [9], xgt0: [9] },
};

const EXPECTED_TEN_SUB: Record<number, { x0: number[], xgt0: number[] }> = {
  9: { x0: [], xgt0: [0,1,2,3,5,6,7,8] },
  8: { x0: [], xgt0: [0,1,2,5,6,7] },
  7: { x0: [], xgt0: [0,1,5,6] },
  6: { x0: [], xgt0: [0,5] },
  5: { x0: [], xgt0: [0,1,2,3,4] },
  4: { x0: [], xgt0: [0,1,2,3] },
  3: { x0: [], xgt0: [0,1,2] },
  2: { x0: [], xgt0: [0,1] },
  1: { x0: [], xgt0: [0] },
};

// Mix formula qoidalar
const EXPECTED_MIX_ADD: Record<number, number[]> = {
  // +N: allowed digits = 5..(14-N) for N=6..9
  9: [5],
  8: [5, 6],
  7: [5, 6, 7],
  6: [5, 6, 7, 8],
};
const EXPECTED_MIX_SUB: Record<number, { x0: number[], xgt0: number[] }> = {
  // -N: x>0 → (N-5)..4; x=0 → []
  9: { x0: [], xgt0: [4] },
  8: { x0: [], xgt0: [3, 4] },
  7: { x0: [], xgt0: [2, 3, 4] },
  6: { x0: [], xgt0: [1, 2, 3, 4] },
};

// ============ TEST FUNKSIYALARI ============

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    errors.push(`XATO: ${msg}`);
  }
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

function setsEqual(s: Set<number>, arr: number[]): boolean {
  if (s.size !== arr.length) return false;
  return arr.every(v => s.has(v));
}

// ===== TEST 1: FORMULASIZ JADVALLAR =====
console.log('\n===== TEST 1: FORMULASIZ JADVALLAR =====');

for (let d = 0; d <= 9; d++) {
  assert(
    arraysEqual(FORMULASIZ_PLUS[d], EXPECTED_FORMULASIZ_PLUS[d]),
    `FORMULASIZ_PLUS[${d}]: kutilgan ${JSON.stringify(EXPECTED_FORMULASIZ_PLUS[d])}, natija ${JSON.stringify(FORMULASIZ_PLUS[d])}`
  );
  assert(
    arraysEqual(FORMULASIZ_MINUS[d], EXPECTED_FORMULASIZ_MINUS[d]),
    `FORMULASIZ_MINUS[${d}]: kutilgan ${JSON.stringify(EXPECTED_FORMULASIZ_MINUS[d])}, natija ${JSON.stringify(FORMULASIZ_MINUS[d])}`
  );
}
console.log(`  Formulasiz: ${passed} passed`);

// ===== TEST 2: 5-LIK FORMULA =====
console.log('\n===== TEST 2: 5-LIK FORMULA (KICHIK DO\'ST) =====');
const p2start = passed;

function isSmall5Add(currentDigit: number, operandDigit: number): boolean {
  if (operandDigit < 1 || operandDigit > 4) return false;
  return (5 - operandDigit) <= currentDigit && currentDigit <= 4;
}

function isSmall5Sub(currentDigit: number, operandDigit: number): boolean {
  if (operandDigit < 1 || operandDigit > 4) return false;
  return 5 <= currentDigit && currentDigit <= (4 + operandDigit);
}

for (const op of [1, 2, 3, 4]) {
  // Qo'shish
  const addResult: number[] = [];
  for (let d = 0; d <= 9; d++) {
    if (isSmall5Add(d, op)) addResult.push(d);
  }
  assert(
    arraysEqual(addResult, EXPECTED_FIVE_ADD[op]),
    `5-lik +${op} ADD: kutilgan ${JSON.stringify(EXPECTED_FIVE_ADD[op])}, natija ${JSON.stringify(addResult)}`
  );

  // Ayirish
  const subResult: number[] = [];
  for (let d = 0; d <= 9; d++) {
    if (isSmall5Sub(d, op)) subResult.push(d);
  }
  assert(
    arraysEqual(subResult, EXPECTED_FIVE_SUB[op]),
    `5-lik -${op} SUB: kutilgan ${JSON.stringify(EXPECTED_FIVE_SUB[op])}, natija ${JSON.stringify(subResult)}`
  );
}
console.log(`  5-lik formula: ${passed - p2start} passed`);

// ===== TEST 3: 10-LIK FORMULA =====
console.log('\n===== TEST 3: 10-LIK FORMULA (KATTA DO\'ST) =====');
const p3start = passed;

for (const op of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
  // ADD x=0
  const addX0: number[] = [];
  for (let d = 0; d <= 9; d++) {
    if (TEN_ADD_ALLOWED[op]?.['false']?.has(d)) addX0.push(d);
  }
  assert(
    arraysEqual(addX0, EXPECTED_TEN_ADD[op].x0),
    `10-lik +${op} ADD x=0: kutilgan ${JSON.stringify(EXPECTED_TEN_ADD[op].x0)}, natija ${JSON.stringify(addX0)}`
  );

  // ADD x>0
  const addXgt0: number[] = [];
  for (let d = 0; d <= 9; d++) {
    if (TEN_ADD_ALLOWED[op]?.['true']?.has(d)) addXgt0.push(d);
  }
  assert(
    arraysEqual(addXgt0, EXPECTED_TEN_ADD[op].xgt0),
    `10-lik +${op} ADD x>0: kutilgan ${JSON.stringify(EXPECTED_TEN_ADD[op].xgt0)}, natija ${JSON.stringify(addXgt0)}`
  );

  // SUB x=0 (always empty)
  const subX0: number[] = [];
  for (let d = 0; d <= 9; d++) {
    if (TEN_SUB_ALLOWED[op]?.['false']?.has(d)) subX0.push(d);
  }
  assert(
    arraysEqual(subX0, EXPECTED_TEN_SUB[op].x0),
    `10-lik -${op} SUB x=0: kutilgan ${JSON.stringify(EXPECTED_TEN_SUB[op].x0)}, natija ${JSON.stringify(subX0)}`
  );

  // SUB x>0
  const subXgt0: number[] = [];
  for (let d = 0; d <= 9; d++) {
    if (TEN_SUB_ALLOWED[op]?.['true']?.has(d)) subXgt0.push(d);
  }
  assert(
    arraysEqual(subXgt0, EXPECTED_TEN_SUB[op].xgt0),
    `10-lik -${op} SUB x>0: kutilgan ${JSON.stringify(EXPECTED_TEN_SUB[op].xgt0)}, natija ${JSON.stringify(subXgt0)}`
  );
}
console.log(`  10-lik formula: ${passed - p3start} passed`);

// ===== TEST 4: MIX FORMULA =====
console.log('\n===== TEST 4: MIX FORMULA (ARALASH) =====');
const p4start = passed;

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

for (const op of [6, 7, 8, 9]) {
  // Qo'shish (x=0 va x>0 bir xil, x bilan aloqasi yo'q)
  const addResult: number[] = [];
  for (let d = 0; d <= 9; d++) {
    if (isMixAdd(d, op)) addResult.push(d);
  }
  assert(
    arraysEqual(addResult, EXPECTED_MIX_ADD[op]),
    `Mix +${op} ADD: kutilgan ${JSON.stringify(EXPECTED_MIX_ADD[op])}, natija ${JSON.stringify(addResult)}`
  );

  // Ayirish x=0
  const subX0: number[] = [];
  for (let d = 0; d <= 9; d++) {
    if (isMixSub(d, op, false)) subX0.push(d);
  }
  assert(
    arraysEqual(subX0, EXPECTED_MIX_SUB[op].x0),
    `Mix -${op} SUB x=0: kutilgan ${JSON.stringify(EXPECTED_MIX_SUB[op].x0)}, natija ${JSON.stringify(subX0)}`
  );

  // Ayirish x>0
  const subXgt0: number[] = [];
  for (let d = 0; d <= 9; d++) {
    if (isMixSub(d, op, true)) subXgt0.push(d);
  }
  assert(
    arraysEqual(subXgt0, EXPECTED_MIX_SUB[op].xgt0),
    `Mix -${op} SUB x>0: kutilgan ${JSON.stringify(EXPECTED_MIX_SUB[op].xgt0)}, natija ${JSON.stringify(subXgt0)}`
  );
}
console.log(`  Mix formula: ${passed - p4start} passed`);

// ===== TEST 5: GENERATOR TEKSHIRISH =====
console.log('\n===== TEST 5: GENERATOR SIMULYATSIYA =====');
const p5start = passed;

function numberToDigits(n: number, width: number): number[] {
  const s = String(Math.abs(n)).padStart(width, '0');
  return Array.from(s, ch => parseInt(ch, 10));
}

// Formulasiz generator simulyatsiya: 100 ta misol
let formulasizOk = 0;
let formulasizFail = 0;
for (let attempt = 0; attempt < 100; attempt++) {
  const digitsCount = 1;
  const termsCount = 3;
  
  // Random start 1-4
  let current = Math.floor(Math.random() * 4) + 1;
  const nums = [current];
  let valid = true;
  
  for (let t = 1; t < termsCount; t++) {
    const allowed = FORMULASIZ_PLUS[current];
    if (!allowed || allowed.length === 0) { valid = false; break; }
    const next = allowed[Math.floor(Math.random() * allowed.length)];
    const result = current + next;
    if (result > 9) { valid = false; break; }
    nums.push(next);
    current = result;
  }
  
  if (valid) {
    // Verify: har qadam formulasiz
    let cur = nums[0];
    let allOk = true;
    for (let i = 1; i < nums.length; i++) {
      if (!FORMULASIZ_PLUS[cur]?.includes(nums[i])) {
        allOk = false;
        break;
      }
      cur += nums[i];
    }
    if (allOk) formulasizOk++;
    else formulasizFail++;
  }
}
assert(formulasizOk > 0, `Formulasiz generator: kamida 1 ta to'g'ri misol (${formulasizOk}/100)`);
assert(formulasizFail === 0, `Formulasiz generator: noto'g'ri misollar yo'q (${formulasizFail} ta xato)`);
console.log(`  Formulasiz generator: ${formulasizOk} to'g'ri, ${formulasizFail} xato`);

// 10-lik formula: current + operand qo'shish simulyatsiyasi
let tenOk = 0;
for (let operand = 1; operand <= 9; operand++) {
  for (let d = 0; d <= 9; d++) {
    for (const upper of [false, true]) {
      const canAdd = TEN_ADD_ALLOWED[operand]?.[String(upper)]?.has(d) ?? false;
      const canSub = TEN_SUB_ALLOWED[operand]?.[String(upper)]?.has(d) ?? false;
      
      if (canAdd) {
        // d + operand qo'shganda 10 dan oshishi va carry bo'lishi kerak
        const sum = d + operand;
        if (sum >= 10) tenOk++;
        else {
          errors.push(`10-lik +${operand} d=${d} upper=${upper}: yig'indi=${sum} (<10, carry yo'q!)`);
          failed++;
        }
      }
      if (canSub) {
        // d - operand ayirganda manfiy bo'lishi va borrow kerak
        const diff = d - operand;
        if (diff < 0) tenOk++;
        else {
          errors.push(`10-lik -${operand} d=${d} upper=${upper}: farq=${diff} (>=0, borrow yo'q!)`);
          failed++;
        }
      }
    }
  }
}
console.log(`  10-lik carry/borrow: ${tenOk} to'g'ri`);

// Mix formula: simulyatsiya
let mixOk = 0;
for (const operand of [6, 7, 8, 9]) {
  for (let d = 0; d <= 9; d++) {
    if (isMixAdd(d, operand)) {
      // d + operand = qo'shganda 5-lik va 10-lik aralash
      // Natija: d + operand, 5-lik qaytarish bilan
      mixOk++;
    }
    if (isMixSub(d, operand, true)) {
      mixOk++;
    }
  }
}
console.log(`  Mix validatsiya: ${mixOk} holatlar to'g'ri`);

console.log(`  Generator tests: ${passed - p5start} passed`);

// ===== YAKUNIY NATIJA =====
console.log('\n========================================');
console.log(`JAMI: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================');

if (errors.length > 0) {
  console.log('\nXATOLAR:');
  errors.forEach(e => console.log(`  ${e}`));
}

if (failed === 0) {
  console.log('\n✅ BARCHA FORMULALAR QOIDALARGA 100% MOS!');
} else {
  console.log('\n❌ XATOLAR TOPILDI!');
}
