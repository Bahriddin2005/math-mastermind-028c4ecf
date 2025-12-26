export type MathSection = 'add-sub' | 'multiply' | 'divide' | 'mix';
export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface MathProblem {
  display: string;
  answer: number;
  section: MathSection;
  difficulty: Difficulty;
}

export interface GameStats {
  correct: number;
  incorrect: number;
  streak: number;
  bestStreak: number;
  totalTime: number;
  problems: number;
}

export const MentalMathGenerator = {
  // Addition and Subtraction - chain format
  generateAddSub: (level: Difficulty, termsCount: number = 3): MathProblem => {
    const terms: string[] = [];
    let currentTotal = 0;
    const maxNum = level * 15;

    for (let i = 0; i < termsCount; i++) {
      const num = Math.floor(Math.random() * maxNum) + 1;

      if (i === 0) {
        currentTotal = num;
        terms.push(String(num));
      } else {
        const isPlus = Math.random() > 0.4;
        if (isPlus) {
          currentTotal += num;
          terms.push(`+ ${num}`);
        } else {
          if (currentTotal - num >= 0) {
            currentTotal -= num;
            terms.push(`- ${num}`);
          } else {
            currentTotal += num;
            terms.push(`+ ${num}`);
          }
        }
      }
    }

    return {
      display: terms.join(' '),
      answer: currentTotal,
      section: 'add-sub',
      difficulty: level,
    };
  },

  // Multiplication
  generateMul: (level: Difficulty): MathProblem => {
    let n1: number, n2: number;
    
    switch (level) {
      case 1:
        n1 = Math.floor(Math.random() * 9) + 2;
        n2 = Math.floor(Math.random() * 9) + 2;
        break;
      case 2:
        n1 = Math.floor(Math.random() * 90) + 10;
        n2 = Math.floor(Math.random() * 9) + 2;
        break;
      case 3:
        n1 = Math.floor(Math.random() * 90) + 10;
        n2 = Math.floor(Math.random() * 90) + 10;
        break;
      case 4:
        n1 = Math.floor(Math.random() * 900) + 100;
        n2 = Math.floor(Math.random() * 9) + 2;
        break;
      default:
        n1 = Math.floor(Math.random() * 900) + 100;
        n2 = Math.floor(Math.random() * 90) + 10;
    }

    return {
      display: `${n1} × ${n2}`,
      answer: n1 * n2,
      section: 'multiply',
      difficulty: level,
    };
  },

  // Division (no remainder)
  generateDiv: (level: Difficulty): MathProblem => {
    let divisor: number, answer: number;

    switch (level) {
      case 1:
        divisor = Math.floor(Math.random() * 8) + 2;
        answer = Math.floor(Math.random() * 9) + 2;
        break;
      case 2:
        divisor = Math.floor(Math.random() * 8) + 2;
        answer = Math.floor(Math.random() * 90) + 10;
        break;
      case 3:
        divisor = Math.floor(Math.random() * 90) + 10;
        answer = Math.floor(Math.random() * 9) + 2;
        break;
      case 4:
        divisor = Math.floor(Math.random() * 90) + 10;
        answer = Math.floor(Math.random() * 90) + 10;
        break;
      default:
        divisor = Math.floor(Math.random() * 90) + 10;
        answer = Math.floor(Math.random() * 900) + 100;
    }

    const dividend = divisor * answer;

    return {
      display: `${dividend} ÷ ${divisor}`,
      answer: answer,
      section: 'divide',
      difficulty: level,
    };
  },

  // Mix mode - combines operations
  generateMix: (level: Difficulty): MathProblem => {
    const rand = Math.random();
    if (rand < 0.33) {
      return { ...MentalMathGenerator.generateAddSub(level), section: 'mix' };
    } else if (rand < 0.66) {
      return { ...MentalMathGenerator.generateMul(level), section: 'mix' };
    } else {
      return { ...MentalMathGenerator.generateDiv(level), section: 'mix' };
    }
  },

  // Generate problem by section
  generate: (section: MathSection, level: Difficulty): MathProblem => {
    switch (section) {
      case 'add-sub':
        return MentalMathGenerator.generateAddSub(level, Math.min(2 + level, 6));
      case 'multiply':
        return MentalMathGenerator.generateMul(level);
      case 'divide':
        return MentalMathGenerator.generateDiv(level);
      case 'mix':
        return MentalMathGenerator.generateMix(level);
    }
  },
};

export const getSectionInfo = (section: MathSection) => {
  const sections = {
    'add-sub': {
      name: "Qo'shish va Ayirish",
      shortName: '+−',
      icon: '➕',
      color: 'primary' as const,
      description: "Zanjir ko'rinishida qo'shish va ayirish",
    },
    'multiply': {
      name: "Ko'paytirish",
      shortName: '×',
      icon: '✖️',
      color: 'accent' as const,
      description: "Ko'paytirish jadvallarini mashq qiling",
    },
    'divide': {
      name: "Bo'lish",
      shortName: '÷',
      icon: '➗',
      color: 'success' as const,
      description: "Qoldiqsiz bo'lish mashqlari",
    },
    'mix': {
      name: 'Aralash',
      shortName: '🎲',
      icon: '🎯',
      color: 'warning' as const,
      description: "Barcha amallarni aralash holda mashq qiling",
    },
  };
  return sections[section];
};

export const getDifficultyLabel = (level: Difficulty): string => {
  const labels = {
    1: 'Oson',
    2: "O'rta",
    3: 'Qiyin',
    4: 'Juda Qiyin',
    5: 'Ekspert',
  };
  return labels[level];
};

// Helper function for lesson practice
export const generateProblem = (difficulty: 'easy' | 'medium' | 'hard', section: string = 'mixed') => {
  const levelMap: Record<string, Difficulty> = {
    easy: 1,
    medium: 2,
    hard: 3
  };
  const level = levelMap[difficulty] || 1;
  
  const sectionMap: Record<string, MathSection> = {
    addition: 'add-sub',
    subtraction: 'add-sub',
    multiplication: 'multiply',
    division: 'divide',
    mixed: 'mix'
  };
  const mathSection = sectionMap[section] || 'mix';
  
  const problem = MentalMathGenerator.generate(mathSection, level);
  
  return {
    question: problem.display,
    correctAnswer: problem.answer
  };
};
