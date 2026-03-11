/**
 * YAPON SOROBAN MENTAL ARITHMETIC ENGINE
 * =====================================
 * 
 * Bu engine yapon maktabi metodologiyasiga asoslangan:
 * 1. SON emas, HOLAT (state) bilan ishlaydi
 * 2. Har ustun mustaqil
 * 3. Har amal oldindan tekshiriladi
 * 4. Carry (katta do'st) - cheklangan exception
 * 5. Random faqat variant tanlashda, natijada emas
 * 
 * Ko'p xonali misol = ko'p ustunli bitta xonali mantiqning sinxron ishlashi
 */

// ============= FORMULA TURLARI =============
export type FormulaCategory = 'formulasiz' | 'kichik_dost' | 'katta_dost' | 'mix';
export type FormulaType = 
  | 'formulasiz' 
  | 'kichik_dost_1' 
  | 'kichik_dost_2' 
  | 'kichik_dost_3'
  | 'kichik_dost_4'
  | 'katta_dost_1'
  | 'katta_dost_2'
  | 'katta_dost_3'
  | 'katta_dost_4'
  | 'katta_dost_5'
  | 'katta_dost_6'
  | 'katta_dost_7'
  | 'katta_dost_8'
  | 'katta_dost_9'
  | 'mix';

// ============= FORMULASIZ QOIDALAR =============
// Har bir natija uchun qo'shish/ayirish mumkin bo'lgan sonlar
// Bu jadval: HECH QANDAY formula ishlatmasdan oddiy amallar
const RULES_FORMULASIZ: Record<number, { add: number[]; subtract: number[] }> = {
  0: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [] },
  1: { add: [1, 2, 3, 5, 6, 7, 8], subtract: [1] },
  2: { add: [1, 2, 5, 6, 7], subtract: [1, 2] },
  3: { add: [1, 5, 6], subtract: [1, 2, 3] },
  4: { add: [5], subtract: [1, 2, 3, 4] },
  5: { add: [1, 2, 3, 4], subtract: [5] },
  6: { add: [1, 2, 3], subtract: [1, 5, 6] },
  7: { add: [1, 2], subtract: [1, 2, 5, 7] },
  8: { add: [1], subtract: [1, 2, 3, 5, 8] },
  9: { add: [], subtract: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
};

// ============= KICHIK DO'ST (FORMULA 5) QOIDALARI =============
// +4/-4: 4+1=5 yoki 5-1=4 formulasi
const RULES_KICHIK_DOST_1: Record<number, { add: number[]; subtract: number[] }> = {
  0: { add: [], subtract: [] },
  1: { add: [], subtract: [] },
  2: { add: [], subtract: [] },
  3: { add: [], subtract: [] },
  4: { add: [1], subtract: [] },
  5: { add: [], subtract: [1] },
  6: { add: [], subtract: [] },
  7: { add: [], subtract: [] },
  8: { add: [], subtract: [] },
  9: { add: [], subtract: [] },
};

// +3/-3: 3+2=5 yoki 5-2=3 formulasi
const RULES_KICHIK_DOST_2: Record<number, { add: number[]; subtract: number[] }> = {
  0: { add: [], subtract: [] },
  1: { add: [], subtract: [] },
  2: { add: [], subtract: [] },
  3: { add: [2], subtract: [] },
  4: { add: [], subtract: [] },
  5: { add: [], subtract: [2] },
  6: { add: [], subtract: [] },
  7: { add: [], subtract: [] },
  8: { add: [], subtract: [] },
  9: { add: [], subtract: [] },
};

// +2/-2: 2+3=5 yoki 5-3=2 formulasi
const RULES_KICHIK_DOST_3: Record<number, { add: number[]; subtract: number[] }> = {
  0: { add: [], subtract: [] },
  1: { add: [], subtract: [] },
  2: { add: [3], subtract: [] },
  3: { add: [], subtract: [] },
  4: { add: [], subtract: [] },
  5: { add: [], subtract: [] },
  6: { add: [], subtract: [3] },
  7: { add: [], subtract: [] },
  8: { add: [], subtract: [] },
  9: { add: [], subtract: [] },
};

// +1/-1: 1+4=5 yoki 5-4=1 formulasi
const RULES_KICHIK_DOST_4: Record<number, { add: number[]; subtract: number[] }> = {
  0: { add: [], subtract: [] },
  1: { add: [4], subtract: [] },
  2: { add: [], subtract: [] },
  3: { add: [], subtract: [] },
  4: { add: [], subtract: [] },
  5: { add: [], subtract: [] },
  6: { add: [], subtract: [] },
  7: { add: [], subtract: [4] },
  8: { add: [], subtract: [] },
  9: { add: [], subtract: [] },
};

// ============= KATTA DO'ST (FORMULA 10) QOIDALARI =============
/**
 * Siz bergan jadvallar asosida:
 * - xN = birliklar raqami (N)
 * - X=0 degani o'nliklar 0 (masalan: 0, 1, 2, ... 9)
 * - X>0 degani o'nliklar 0 dan katta (masalan: 10, 11, 12, ... 19, 20, ...)
 * 
 * Katta do'st qo'shishda: +N → +10 -komplement
 * Katta do'st ayirishda: -N → -10 +komplement
 */

/**
 * KATTA DO'ST +9/-9 QOIDASI
 * Jadvalingizga to'liq mos:
 */
const getBigFriendRules_9 = (tens: number, ones: number): { canAdd: boolean; canSubtract: boolean } => {
  const hasHigherTens = tens > 0;
  
  switch (ones) {
    case 0: return { canAdd: false, canSubtract: hasHigherTens };          // x0: qo'sh ❌, ayir X>0
    case 1: return { canAdd: true, canSubtract: hasHigherTens };           // x1: qo'sh ✅, ayir X>0
    case 2: return { canAdd: true, canSubtract: hasHigherTens };           // x2: qo'sh ✅, ayir X>0
    case 3: return { canAdd: true, canSubtract: hasHigherTens };           // x3: qo'sh ✅, ayir X>0
    case 4: return { canAdd: hasHigherTens, canSubtract: false };          // x4: qo'sh X>0, ayir ❌
    case 5: return { canAdd: false, canSubtract: hasHigherTens };          // x5: qo'sh ❌, ayir X>0
    case 6: return { canAdd: true, canSubtract: hasHigherTens };           // x6: qo'sh ✅, ayir X>0
    case 7: return { canAdd: true, canSubtract: hasHigherTens };           // x7: qo'sh ✅, ayir X>0
    case 8: return { canAdd: true, canSubtract: hasHigherTens };           // x8: qo'sh ✅, ayir X>0
    case 9: return { canAdd: hasHigherTens, canSubtract: false };          // x9: qo'sh X>0, ayir ❌
    default: return { canAdd: false, canSubtract: false };
  }
};

/**
 * KATTA DO'ST +8/-8 QOIDASI
 */
const getBigFriendRules_8 = (tens: number, ones: number): { canAdd: boolean; canSubtract: boolean } => {
  const hasHigherTens = tens > 0;
  
  switch (ones) {
    case 0: return { canAdd: false, canSubtract: hasHigherTens };          // x0: qo'sh ❌, ayir X>0
    case 1: return { canAdd: false, canSubtract: hasHigherTens };          // x1: qo'sh ❌, ayir X>0
    case 2: return { canAdd: true, canSubtract: hasHigherTens };           // x2: qo'sh ✅, ayir X>0
    case 3: return { canAdd: hasHigherTens, canSubtract: false };          // x3: qo'sh X>0, ayir ❌
    case 4: return { canAdd: hasHigherTens, canSubtract: false };          // x4: qo'sh X>0, ayir ❌
    case 5: return { canAdd: false, canSubtract: hasHigherTens };          // x5: qo'sh ❌, ayir X>0
    case 6: return { canAdd: false, canSubtract: hasHigherTens };          // x6: qo'sh ❌, ayir X>0
    case 7: return { canAdd: true, canSubtract: hasHigherTens };           // x7: qo'sh ✅, ayir X>0
    case 8: return { canAdd: hasHigherTens, canSubtract: false };          // x8: qo'sh X>0, ayir ❌
    case 9: return { canAdd: hasHigherTens, canSubtract: false };          // x9: qo'sh X>0, ayir ❌
    default: return { canAdd: false, canSubtract: false };
  }
};

/**
 * KATTA DO'ST +7/-7 QOIDASI
 */
const getBigFriendRules_7 = (tens: number, ones: number): { canAdd: boolean; canSubtract: boolean } => {
  const hasHigherTens = tens > 0;
  
  switch (ones) {
    case 0: return { canAdd: false, canSubtract: hasHigherTens };          // x0: qo'sh ❌, ayir X>0
    case 1: return { canAdd: false, canSubtract: hasHigherTens };          // x1: qo'sh ❌, ayir X>0
    case 2: return { canAdd: false, canSubtract: false };                  // x2: qo'sh ❌, ayir ❌
    case 3: return { canAdd: true, canSubtract: false };                   // x3: qo'sh ✅, ayir ❌
    case 4: return { canAdd: true, canSubtract: false };                   // x4: qo'sh ✅, ayir ❌
    case 5: return { canAdd: false, canSubtract: hasHigherTens };          // x5: qo'sh ❌, ayir X>0
    case 6: return { canAdd: false, canSubtract: hasHigherTens };          // x6: qo'sh ❌, ayir X>0
    case 7: return { canAdd: false, canSubtract: false };                  // x7: qo'sh ❌, ayir ❌
    case 8: return { canAdd: true, canSubtract: false };                   // x8: qo'sh ✅, ayir ❌
    case 9: return { canAdd: true, canSubtract: false };                   // x9: qo'sh ✅, ayir ❌
    default: return { canAdd: false, canSubtract: false };
  }
};

/**
 * KATTA DO'ST +6/-6 QOIDASI
 */
const getBigFriendRules_6 = (tens: number, ones: number): { canAdd: boolean; canSubtract: boolean } => {
  const hasHigherTens = tens > 0;
  
  switch (ones) {
    case 0: return { canAdd: false, canSubtract: hasHigherTens };          // x0: qo'sh ❌, ayir X>0
    case 1: return { canAdd: false, canSubtract: false };                  // x1: qo'sh ❌, ayir ❌
    case 2: return { canAdd: false, canSubtract: false };                  // x2: qo'sh ❌, ayir ❌
    case 3: return { canAdd: false, canSubtract: false };                  // x3: qo'sh ❌, ayir ❌
    case 4: return { canAdd: true, canSubtract: false };                   // x4: qo'sh ✅, ayir ❌
    case 5: return { canAdd: false, canSubtract: hasHigherTens };          // x5: qo'sh ❌, ayir X>0
    case 6: return { canAdd: false, canSubtract: false };                  // x6: qo'sh ❌, ayir ❌
    case 7: return { canAdd: false, canSubtract: false };                  // x7: qo'sh ❌, ayir ❌
    case 8: return { canAdd: false, canSubtract: false };                  // x8: qo'sh ❌, ayir ❌
    case 9: return { canAdd: true, canSubtract: false };                   // x9: qo'sh ✅, ayir ❌
    default: return { canAdd: false, canSubtract: false };
  }
};

/**
 * KATTA DO'ST +5/-5 QOIDASI
 */
const getBigFriendRules_5 = (tens: number, ones: number): { canAdd: boolean; canSubtract: boolean } => {
  const hasHigherTens = tens > 0;
  
  switch (ones) {
    case 0: return { canAdd: false, canSubtract: hasHigherTens };          // x0: qo'sh ❌, ayir X>0
    case 1: return { canAdd: false, canSubtract: hasHigherTens };          // x1: qo'sh ❌, ayir X>0
    case 2: return { canAdd: false, canSubtract: hasHigherTens };          // x2: qo'sh ❌, ayir X>0
    case 3: return { canAdd: false, canSubtract: hasHigherTens };          // x3: qo'sh ❌, ayir X>0
    case 4: return { canAdd: false, canSubtract: hasHigherTens };          // x4: qo'sh ❌, ayir X>0
    case 5: return { canAdd: true, canSubtract: false };                   // x5: qo'sh ✅, ayir ❌
    case 6: return { canAdd: true, canSubtract: false };                   // x6: qo'sh ✅, ayir ❌
    case 7: return { canAdd: true, canSubtract: false };                   // x7: qo'sh ✅, ayir ❌
    case 8: return { canAdd: true, canSubtract: false };                   // x8: qo'sh ✅, ayir ❌
    case 9: return { canAdd: true, canSubtract: false };                   // x9: qo'sh ✅, ayir ❌
    default: return { canAdd: false, canSubtract: false };
  }
};

/**
 * KATTA DO'ST +4/-4 QOIDASI
 */
const getBigFriendRules_4 = (tens: number, ones: number): { canAdd: boolean; canSubtract: boolean } => {
  const hasHigherTens = tens > 0;
  
  switch (ones) {
    case 0: return { canAdd: false, canSubtract: hasHigherTens };          // x0: qo'sh ❌, ayir X>0
    case 1: return { canAdd: false, canSubtract: hasHigherTens };          // x1: qo'sh ❌, ayir X>0
    case 2: return { canAdd: false, canSubtract: hasHigherTens };          // x2: qo'sh ❌, ayir X>0
    case 3: return { canAdd: false, canSubtract: hasHigherTens };          // x3: qo'sh ❌, ayir X>0
    case 4: return { canAdd: false, canSubtract: false };                  // x4: qo'sh ❌, ayir ❌
    case 5: return { canAdd: false, canSubtract: false };                  // x5: qo'sh ❌, ayir ❌
    case 6: return { canAdd: true, canSubtract: false };                   // x6: qo'sh ✅, ayir ❌
    case 7: return { canAdd: true, canSubtract: false };                   // x7: qo'sh ✅, ayir ❌
    case 8: return { canAdd: true, canSubtract: false };                   // x8: qo'sh ✅, ayir ❌
    case 9: return { canAdd: true, canSubtract: false };                   // x9: qo'sh ✅, ayir ❌
    default: return { canAdd: false, canSubtract: false };
  }
};

/**
 * KATTA DO'ST +3/-3 QOIDASI
 */
const getBigFriendRules_3 = (tens: number, ones: number): { canAdd: boolean; canSubtract: boolean } => {
  const hasHigherTens = tens > 0;
  
  switch (ones) {
    case 0: return { canAdd: false, canSubtract: hasHigherTens };          // x0: qo'sh ❌, ayir X>0
    case 1: return { canAdd: false, canSubtract: hasHigherTens };          // x1: qo'sh ❌, ayir X>0
    case 2: return { canAdd: false, canSubtract: hasHigherTens };          // x2: qo'sh ❌, ayir X>0
    case 3: return { canAdd: false, canSubtract: false };                  // x3: qo'sh ❌, ayir ❌
    case 4: return { canAdd: false, canSubtract: false };                  // x4: qo'sh ❌, ayir ❌
    case 5: return { canAdd: false, canSubtract: false };                  // x5: qo'sh ❌, ayir ❌
    case 6: return { canAdd: false, canSubtract: false };                  // x6: qo'sh ❌, ayir ❌
    case 7: return { canAdd: true, canSubtract: false };                   // x7: qo'sh ✅, ayir ❌
    case 8: return { canAdd: true, canSubtract: false };                   // x8: qo'sh ✅, ayir ❌
    case 9: return { canAdd: true, canSubtract: false };                   // x9: qo'sh ✅, ayir ❌
    default: return { canAdd: false, canSubtract: false };
  }
};

/**
 * KATTA DO'ST +2/-2 QOIDASI
 */
const getBigFriendRules_2 = (tens: number, ones: number): { canAdd: boolean; canSubtract: boolean } => {
  const hasHigherTens = tens > 0;
  
  switch (ones) {
    case 0: return { canAdd: false, canSubtract: hasHigherTens };          // x0: qo'sh ❌, ayir X>0
    case 1: return { canAdd: false, canSubtract: hasHigherTens };          // x1: qo'sh ❌, ayir X>0
    case 2: return { canAdd: false, canSubtract: false };                  // x2: qo'sh ❌, ayir ❌
    case 3: return { canAdd: false, canSubtract: false };                  // x3: qo'sh ❌, ayir ❌
    case 4: return { canAdd: false, canSubtract: false };                  // x4: qo'sh ❌, ayir ❌
    case 5: return { canAdd: false, canSubtract: false };                  // x5: qo'sh ❌, ayir ❌
    case 6: return { canAdd: false, canSubtract: false };                  // x6: qo'sh ❌, ayir ❌
    case 7: return { canAdd: false, canSubtract: false };                  // x7: qo'sh ❌, ayir ❌
    case 8: return { canAdd: true, canSubtract: false };                   // x8: qo'sh ✅, ayir ❌
    case 9: return { canAdd: true, canSubtract: false };                   // x9: qo'sh ✅, ayir ❌
    default: return { canAdd: false, canSubtract: false };
  }
};

/**
 * KATTA DO'ST +1/-1 QOIDASI
 */
const getBigFriendRules_1 = (tens: number, ones: number): { canAdd: boolean; canSubtract: boolean } => {
  const hasHigherTens = tens > 0;
  
  switch (ones) {
    case 0: return { canAdd: false, canSubtract: hasHigherTens };          // x0: qo'sh ❌, ayir X>0
    case 1: return { canAdd: false, canSubtract: false };                  // x1: qo'sh ❌, ayir ❌
    case 2: return { canAdd: false, canSubtract: false };                  // x2: qo'sh ❌, ayir ❌
    case 3: return { canAdd: false, canSubtract: false };                  // x3: qo'sh ❌, ayir ❌
    case 4: return { canAdd: false, canSubtract: false };                  // x4: qo'sh ❌, ayir ❌
    case 5: return { canAdd: false, canSubtract: false };                  // x5: qo'sh ❌, ayir ❌
    case 6: return { canAdd: false, canSubtract: false };                  // x6: qo'sh ❌, ayir ❌
    case 7: return { canAdd: false, canSubtract: false };                  // x7: qo'sh ❌, ayir ❌
    case 8: return { canAdd: false, canSubtract: false };                  // x8: qo'sh ❌, ayir ❌
    case 9: return { canAdd: true, canSubtract: false };                   // x9: qo'sh ✅, ayir ❌
    default: return { canAdd: false, canSubtract: false };
  }
};

// ============= USTUN (STATE) STRUKTURASI =============
export interface ColumnState {
  digit: number; // 0-9
}

export interface SorobanState {
  columns: ColumnState[]; // O'ngdan chapga: [birlik, o'nlik, yuzlik, ...]
  value: number; // Joriy qiymat
}

export interface Operation {
  delta: number; // Qo'shiladigan/ayiriladigan son (musbat)
  isAdd: boolean; // Qo'shish (true) yoki ayirish (false)
  formulaType: FormulaCategory; // Qaysi formula ishlatildi
  isCarry: boolean; // Katta do'st ishlatildimi?
}

export interface GeneratedProblem {
  startValue: number;
  operations: Operation[];
  finalAnswer: number;
  sequence: number[]; // Ekranda ko'rsatiladigan sonlar ketma-ketligi
}

// ============= YORDAMCHI FUNKSIYALAR =============

/**
 * Sonni ustunlarga ajratish
 */
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

/**
 * Ustunlardan songa aylantirish
 */
export const columnsToNumber = (columns: ColumnState[]): number => {
  return columns.reduce((sum, col, index) => sum + col.digit * Math.pow(10, index), 0);
};

/**
 * State yaratish
 */
export const createState = (value: number): SorobanState => ({
  columns: numberToColumns(value),
  value: value,
});

// ============= TEKSHIRISH FUNKSIYALARI =============

/**
 * Formulasiz amal ruxsat etiladimi?
 */
export const isFormulasizAllowed = (currentDigit: number, delta: number, isAdd: boolean): boolean => {
  const rules = RULES_FORMULASIZ[currentDigit];
  if (!rules) return false;
  
  if (isAdd) {
    return rules.add.includes(delta);
  } else {
    return rules.subtract.includes(delta);
  }
};

/**
 * Kichik do'st (Formula 5) amal ruxsat etiladimi?
 */
export const isKichikDostAllowed = (currentDigit: number, delta: number, isAdd: boolean): boolean => {
  // Barcha kichik do'st qoidalarini tekshirish
  const rulesSets = [
    RULES_KICHIK_DOST_1,
    RULES_KICHIK_DOST_2,
    RULES_KICHIK_DOST_3,
    RULES_KICHIK_DOST_4,
  ];
  
  for (const rules of rulesSets) {
    const rule = rules[currentDigit];
    if (rule) {
      if (isAdd && rule.add.includes(delta)) return true;
      if (!isAdd && rule.subtract.includes(delta)) return true;
    }
  }
  
  return false;
};

/**
 * Katta do'st (Formula 10) amal ruxsat etiladimi?
 * Ko'p xonali sonlarda o'nliklar ustunini ham tekshiradi
 */
export const isKattaDostAllowed = (
  currentValue: number, 
  delta: number, 
  isAdd: boolean
): boolean => {
  const ones = Math.abs(currentValue) % 10;
  const tens = Math.floor(Math.abs(currentValue) / 10) % 10;
  
  const checkFunctions: Record<number, (t: number, o: number) => { canAdd: boolean; canSubtract: boolean }> = {
    1: getBigFriendRules_1,
    2: getBigFriendRules_2,
    3: getBigFriendRules_3,
    4: getBigFriendRules_4,
    5: getBigFriendRules_5,
    6: getBigFriendRules_6,
    7: getBigFriendRules_7,
    8: getBigFriendRules_8,
    9: getBigFriendRules_9,
  };
  
  const checkFn = checkFunctions[delta];
  if (!checkFn) return false;
  
  const result = checkFn(tens, ones);
  return isAdd ? result.canAdd : result.canSubtract;
};

// ============= AMALLAR GENERATSIYASI =============

export interface AllowedOperation {
  delta: number;
  isAdd: boolean;
  formulaType: FormulaCategory;
  isCarry: boolean;
}

/**
 * Joriy holatda mumkin bo'lgan barcha amallarni topish
 */
export const getAvailableOperations = (
  currentValue: number,
  allowedFormulas: FormulaCategory[],
  lastFormulaType: FormulaCategory | null = null
): AllowedOperation[] => {
  const operations: AllowedOperation[] = [];
  const currentDigit = Math.abs(currentValue) % 10;
  
  // Formulasiz amallar
  if (allowedFormulas.includes('formulasiz')) {
    const rules = RULES_FORMULASIZ[currentDigit];
    if (rules) {
      rules.add.forEach(delta => {
        operations.push({ delta, isAdd: true, formulaType: 'formulasiz', isCarry: false });
      });
      rules.subtract.forEach(delta => {
        operations.push({ delta, isAdd: false, formulaType: 'formulasiz', isCarry: false });
      });
    }
  }
  
  // Kichik do'st amallari
  if (allowedFormulas.includes('kichik_dost')) {
    const kichikDostRules = [
      RULES_KICHIK_DOST_1,
      RULES_KICHIK_DOST_2,
      RULES_KICHIK_DOST_3,
      RULES_KICHIK_DOST_4,
    ];
    
    for (const rules of kichikDostRules) {
      const rule = rules[currentDigit];
      if (rule) {
        rule.add.forEach(delta => {
          if (!operations.some(op => op.delta === delta && op.isAdd === true)) {
            operations.push({ delta, isAdd: true, formulaType: 'kichik_dost', isCarry: false });
          }
        });
        rule.subtract.forEach(delta => {
          if (!operations.some(op => op.delta === delta && op.isAdd === false)) {
            operations.push({ delta, isAdd: false, formulaType: 'kichik_dost', isCarry: false });
          }
        });
      }
    }
  }
  
  // Katta do'st amallari (agar oldingi amal katta do'st bo'lmasa)
  if (allowedFormulas.includes('katta_dost') && lastFormulaType !== 'katta_dost') {
    for (let delta = 1; delta <= 9; delta++) {
      if (isKattaDostAllowed(currentValue, delta, true)) {
        operations.push({ delta, isAdd: true, formulaType: 'katta_dost', isCarry: true });
      }
      if (isKattaDostAllowed(currentValue, delta, false)) {
        operations.push({ delta, isAdd: false, formulaType: 'katta_dost', isCarry: true });
      }
    }
  }
  
  return operations;
};

/**
 * Amalni bajarish va yangi holatni hisoblash
 */
export const applyOperation = (currentValue: number, op: AllowedOperation): number => {
  if (op.isAdd) {
    if (op.isCarry) {
      // Katta do'st: +delta = +10 - (10-delta)
      return currentValue + op.delta;
    }
    return currentValue + op.delta;
  } else {
    if (op.isCarry) {
      // Katta do'st: -delta = -10 + (10-delta)
      return currentValue - op.delta;
    }
    return currentValue - op.delta;
  }
};

// ============= MISOL GENERATORI =============

export interface ProblemConfig {
  digitCount: number;           // Xonalar soni (1, 2, 3, 4)
  operationCount: number;       // Amallar soni (3-25)
  allowedFormulas: FormulaCategory[]; // Ruxsat etilgan formulalar
  ensurePositiveResult?: boolean; // Natija musbat bo'lishi kerakmi?
}

/**
 * Yapon metodologiyasiga mos misol generatsiya qilish
 */
export const generateProblem = (config: ProblemConfig): GeneratedProblem => {
  const { digitCount, operationCount, allowedFormulas, ensurePositiveResult = true } = config;

  const maxStart = Math.pow(10, digitCount) - 1;
  const minStart = digitCount === 1 ? 1 : Math.pow(10, digitCount - 1);

  // Ba'zi formulalarda (katta do'st / mix) kombinatsiya topish qiyin bo'lishi mumkin.
  // Shuning uchun bir nechta marta boshidan urinib, faqat to'liq uzunlikdagi misolni qaytaramiz.
  const maxTries = 40;

  let best: GeneratedProblem | null = null;

  for (let tryIndex = 0; tryIndex < maxTries; tryIndex++) {
    const startValue = Math.floor(Math.random() * (maxStart - minStart + 1)) + minStart;

    const sequence: number[] = [];
    const operations: Operation[] = [];
    let currentValue = startValue;
    let lastFormulaType: FormulaCategory | null = null;

    let attempts = 0;
    const maxAttempts = operationCount * 60; // qiyin holatlarda ham to'liq yig'ib olish uchun

    while (sequence.length < operationCount - 1 && attempts < maxAttempts) {
      attempts++;

      let availableOps = getAvailableOperations(currentValue, allowedFormulas, lastFormulaType);

      if (ensurePositiveResult) {
        availableOps = availableOps.filter(op => {
          const newValue = applyOperation(currentValue, op);
          return newValue >= 0 && newValue < Math.pow(10, digitCount + 1);
        });
      }

      if (availableOps.length === 0) {
        if (operations.length > 0) {
          const lastOp = operations.pop()!;
          sequence.pop();
          currentValue = lastOp.isAdd ? currentValue - lastOp.delta : currentValue + lastOp.delta;
          lastFormulaType = operations.length > 0 ? operations[operations.length - 1].formulaType : null;
          continue;
        }
        break;
      }

      // Weighted selection: katta do'st kamroq chiqsin
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

      // Ko'p xonali misollar uchun delta ni kengaytirish (faqat formulasiz/kichik do'st)
      let finalDelta = selectedOp.delta;
      if (digitCount > 1 && !selectedOp.isCarry) {
        const multiplier = Math.pow(10, Math.floor(Math.random() * digitCount));
        finalDelta = selectedOp.delta * Math.min(multiplier, Math.pow(10, digitCount - 1));

        const testValue = selectedOp.isAdd ? currentValue + finalDelta : currentValue - finalDelta;
        if (ensurePositiveResult && (testValue < 0 || testValue >= Math.pow(10, digitCount + 1))) {
          finalDelta = selectedOp.delta;
        }
      }

      const signedDelta = selectedOp.isAdd ? finalDelta : -finalDelta;
      currentValue = currentValue + signedDelta;

      operations.push({
        delta: finalDelta,
        isAdd: selectedOp.isAdd,
        formulaType: selectedOp.formulaType,
        isCarry: selectedOp.isCarry,
      });

      sequence.push(signedDelta);
      lastFormulaType = selectedOp.formulaType;
    }

    const candidate: GeneratedProblem = {
      startValue,
      operations,
      finalAnswer: currentValue,
      sequence,
    };

    // Ideal holat: hammasi to'liq yig'ildi
    if (sequence.length === operationCount - 1) return candidate;

    // Aks holda, eng yaxshisini eslab qolamiz (fallback)
    if (!best || candidate.sequence.length > best.sequence.length) {
      best = candidate;
    }
  }

  // Juda kam ehtimol: hamma urinishda ham to'liq chiqmasa fallback qaytaramiz.
  // (UI tomonda validate/regen bor, shuning uchun bo'sh katak baribir chiqmaydi.)
  return best as GeneratedProblem;
};

// ============= LEGACY COMPATIBILITY =============
// Mavjud komponentlar bilan moslik uchun

export const LEGACY_FORMULA_MAPPING: Record<string, FormulaCategory[]> = {
  // NumberTrainer formulalari
  'oddiy': ['formulasiz'],
  'formula5': ['kichik_dost'],
  'formula10plus': ['katta_dost'],
  'hammasi': ['formulasiz', 'kichik_dost', 'katta_dost'],
  
  // MentalArithmeticPractice formulalari  
  'basic': ['formulasiz'],
  'small_friend_1': ['kichik_dost'],
  'small_friend_2': ['kichik_dost'],
  'big_friend_3': ['katta_dost'],
  'big_friend_4': ['katta_dost'],
  'mixed': ['formulasiz', 'kichik_dost', 'katta_dost'],
  
  // Yangi nomlar
  'formulasiz': ['formulasiz'],
  'kichik_dost': ['kichik_dost'],
  'katta_dost': ['katta_dost'],
  'mix': ['formulasiz', 'kichik_dost', 'katta_dost'],
};

/**
 * Legacy formula turidan yangi formatga aylantirish
 */
export const getLegacyFormulas = (legacyType: string): FormulaCategory[] => {
  return LEGACY_FORMULA_MAPPING[legacyType] || ['formulasiz'];
};

/**
 * Legacy komponentlar uchun soddalashtirilgan generator
 */
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

// ============= FORMULA LABELS =============
export const FORMULA_LABELS: Record<string, { label: string; icon: string; description: string }> = {
  formulasiz: {
    label: 'Formulasiz',
    icon: '📘',
    description: 'Oddiy qo\'shish va ayirish amallari',
  },
  kichik_dost: {
    label: 'Kichik do\'st (5)',
    icon: '🔢',
    description: '+4/-4, +3/-3, +2/-2, +1/-1 formulalari (5 ga to\'ldirish)',
  },
  katta_dost: {
    label: 'Katta do\'st (10)',
    icon: '🔟',
    description: '+9/-9 dan +1/-1 gacha formulalar (10 ga o\'tish)',
  },
  mix: {
    label: 'Mix (Aralash)',
    icon: '🎯',
    description: 'Barcha formulalar aralashtirilgan holda',
  },
};

// ============= VALIDATION =============

/**
 * Misol ketma-ketligini tekshirish
 * Yapon qoidalariga muvofiqligini tasdiqlash
 */
export const validateProblemSequence = (
  sequence: number[],
  allowedFormulas: FormulaCategory[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (sequence.length < 2) {
    errors.push('Kamida 2 ta son bo\'lishi kerak');
    return { isValid: false, errors };
  }
  
  let currentValue = sequence[0];
  let lastWasCarry = false;
  
  for (let i = 1; i < sequence.length; i++) {
    const delta = sequence[i];
    const isAdd = delta > 0;
    const absDelta = Math.abs(delta);
    
    // Tekshirish: qaysi formula ishlatilayotgan?
    const currentDigit = Math.abs(currentValue) % 10;
    
    let formulaUsed: FormulaCategory | null = null;
    let isCarryOperation = false;
    
    if (isFormulasizAllowed(currentDigit, absDelta, isAdd)) {
      formulaUsed = 'formulasiz';
    } else if (isKichikDostAllowed(currentDigit, absDelta, isAdd)) {
      formulaUsed = 'kichik_dost';
    } else if (isKattaDostAllowed(currentValue, absDelta, isAdd)) {
      formulaUsed = 'katta_dost';
      isCarryOperation = true;
    }
    
    if (!formulaUsed) {
      errors.push(`${i}-amal (${delta}) ruxsat etilmagan: joriy qiymat ${currentValue}`);
    } else if (!allowedFormulas.includes(formulaUsed)) {
      errors.push(`${i}-amal ${formulaUsed} formulasi ishlatilgan, lekin ruxsat etilmagan`);
    }
    
    // Ketma-ket katta do'st tekshirish
    if (isCarryOperation && lastWasCarry) {
      errors.push(`${i}-amalda ketma-ket katta do'st ishlatildi - bu ruxsat etilmagan`);
    }
    
    currentValue += delta;
    lastWasCarry = isCarryOperation;
  }
  
  return { isValid: errors.length === 0, errors };
};
