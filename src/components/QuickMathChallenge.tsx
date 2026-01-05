import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Zap, Timer, Check, X, RotateCcw, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mental arifmetika formula qoidalari
const FORMULA_RULES = {
  oddiy: {
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
  },
  formula5: {
    3: { add: [2], subtract: [] },
    4: { add: [1, 2], subtract: [] },
    5: { add: [], subtract: [1, 2] },
    6: { add: [], subtract: [2] },
  },
  formula10plus: {
    1: { add: [9], subtract: [] },
    2: { add: [8, 9], subtract: [] },
    3: { add: [7, 8, 9], subtract: [] },
    4: { add: [6, 7, 8, 9], subtract: [] },
    5: { add: [5, 6, 7, 8, 9], subtract: [] },
    6: { add: [4, 5, 6, 7, 8, 9], subtract: [] },
    7: { add: [3, 4, 5, 6, 7, 8, 9], subtract: [] },
    8: { add: [2, 3, 4, 5, 6, 7, 8, 9], subtract: [] },
    9: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [] },
  },
  hammasi: {
    0: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [] },
    1: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1] },
    2: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2] },
    3: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3] },
    4: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4] },
    5: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4, 5] },
    6: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4, 5, 6] },
    7: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4, 5, 6, 7] },
    8: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4, 5, 6, 7, 8] },
    9: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  },
};

type FormulaType = keyof typeof FORMULA_RULES;

const FORMULA_OPTIONS: { id: FormulaType; name: string; color: string }[] = [
  { id: 'oddiy', name: 'Oddiy', color: 'bg-blue-500' },
  { id: 'formula5', name: 'Formula 5', color: 'bg-green-500' },
  { id: 'formula10plus', name: 'Katta formula', color: 'bg-purple-500' },
  { id: 'hammasi', name: 'Aralash', color: 'bg-orange-500' },
];

// Mental arifmetika formulalari bo'yicha masala generatsiyasi
const generateProblem = (formula: FormulaType) => {
  const rules = FORMULA_RULES[formula];
  
  const validStarts = Object.keys(rules).map(Number).filter(n => {
    const rule = rules[n as keyof typeof rules];
    return rule && (rule.add.length > 0 || rule.subtract.length > 0);
  });
  
  if (validStarts.length === 0) {
    return { question: '5 + 3', answer: 8 };
  }
  
  const startNum = validStarts[Math.floor(Math.random() * validStarts.length)];
  const rule = rules[startNum as keyof typeof rules];
  
  const canAdd = rule.add.length > 0;
  const canSubtract = rule.subtract.length > 0;
  
  let operator: '+' | '-';
  let operand: number;
  
  if (canAdd && canSubtract) {
    operator = Math.random() > 0.5 ? '+' : '-';
  } else if (canAdd) {
    operator = '+';
  } else {
    operator = '-';
  }
  
  if (operator === '+') {
    operand = rule.add[Math.floor(Math.random() * rule.add.length)];
  } else {
    operand = rule.subtract[Math.floor(Math.random() * rule.subtract.length)];
  }
  
  const answer = operator === '+' ? startNum + operand : startNum - operand;
  
  return { 
    question: `${startNum} ${operator} ${operand}`, 
    answer 
  };
};

export const QuickMathChallenge = () => {
  const [selectedFormula, setSelectedFormula] = useState<FormulaType>('oddiy');
  const [currentProblem, setCurrentProblem] = useState<{ question: string; answer: number } | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(18);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<'correct' | 'incorrect' | null>(null);

  const startGame = useCallback(() => {
    setIsPlaying(true);
    setTimeLeft(18);
    setCorrectCount(0);
    setTotalCount(0);
    setUserAnswer('');
    setLastResult(null);
    setCurrentProblem(generateProblem(selectedFormula));
  }, [selectedFormula]);

  const resetGame = useCallback(() => {
    setIsPlaying(false);
    setCurrentProblem(null);
    setUserAnswer('');
    setCorrectCount(0);
    setTotalCount(0);
    setLastResult(null);
  }, []);

  // Timer
  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsPlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, timeLeft]);

  const handleAnswer = () => {
    if (!currentProblem || !userAnswer) return;

    const isCorrect = parseInt(userAnswer) === currentProblem.answer;
    setTotalCount(prev => prev + 1);
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setLastResult('correct');
    } else {
      setLastResult('incorrect');
    }

    // Keyingi masala
    setTimeout(() => {
      setLastResult(null);
      setCurrentProblem(generateProblem(selectedFormula));
      setUserAnswer('');
    }, 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnswer();
    }
  };

  // O'yin tugadi
  if (!isPlaying && totalCount > 0) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-primary" />
            Tez javob - Natija
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <div className="text-4xl font-display font-bold text-primary mb-2">
              {correctCount}/{totalCount}
            </div>
            <p className="text-sm text-muted-foreground">
              Aniqlik: {totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0}%
            </p>
          </div>
          <Button onClick={startGame} className="w-full" variant="default">
            <RotateCcw className="h-4 w-4 mr-2" />
            Qayta o'ynash
          </Button>
        </CardContent>
      </Card>
    );
  }

  // O'yin jarayonida
  if (isPlaying && currentProblem) {
    return (
      <Card className={cn(
        "border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 transition-all",
        lastResult === 'correct' && "ring-2 ring-green-500/50",
        lastResult === 'incorrect' && "ring-2 ring-red-500/50"
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Tez javob
            </span>
            <Badge variant="outline" className={cn(
              "border-primary/50",
              timeLeft <= 5 && "text-red-500 border-red-500/50 animate-pulse"
            )}>
              <Timer className="h-3 w-3 mr-1" />
              {timeLeft}s
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-3xl font-display font-bold">{currentProblem.question} = ?</p>
            
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
              className="w-32 text-center text-2xl font-bold p-3 rounded-xl border-2 border-border bg-background focus:border-primary outline-none"
              placeholder="?"
            />
            
            <Button onClick={handleAnswer} className="w-full">
              Tasdiqlash
            </Button>
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>To'g'ri: {correctCount}</span>
            <span className="flex items-center gap-1">
              {lastResult === 'correct' && <Check className="h-3 w-3 text-green-500" />}
              {lastResult === 'incorrect' && <X className="h-3 w-3 text-red-500" />}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Boshlash ekrani
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-5 w-5 text-primary" />
          Tez javob
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Mental arifmetika formulalari bo'yicha tez hisoblash
        </p>

        {/* Formula tanlash */}
        <div className="flex flex-wrap gap-2">
          {FORMULA_OPTIONS.map((formula) => (
            <button
              key={formula.id}
              onClick={() => setSelectedFormula(formula.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                selectedFormula === formula.id
                  ? `${formula.color} text-white shadow-md`
                  : "bg-secondary hover:bg-secondary/80 text-foreground"
              )}
            >
              {formula.name}
            </button>
          ))}
        </div>

        <Button onClick={startGame} className="w-full" size="lg">
          <Zap className="h-4 w-4 mr-2" />
          Boshlash (18s)
        </Button>
      </CardContent>
    </Card>
  );
};
