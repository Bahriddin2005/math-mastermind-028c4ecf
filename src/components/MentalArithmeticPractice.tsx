import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Play, RotateCcw, Check } from 'lucide-react';

// Qoidalar: har bir natija uchun qo'shish/ayirish mumkin bo'lgan sonlar
const RULES: Record<number, { add: number[]; subtract: number[] }> = {
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

interface MentalArithmeticPracticeProps {
  problemCount?: number; // Nechta son ko'rsatiladi
  onComplete?: (isCorrect: boolean, answer: number, correctAnswer: number) => void;
}

export const MentalArithmeticPractice = ({ 
  problemCount = 5,
  onComplete 
}: MentalArithmeticPracticeProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [displayedNumbers, setDisplayedNumbers] = useState<number[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  const runningResultRef = useRef(0);
  const countRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keyingi sonni generatsiya qilish
  const generateNextNumber = useCallback(() => {
    const currentResult = runningResultRef.current;
    const rules = RULES[currentResult];
    
    if (!rules) return null;

    // Barcha mumkin bo'lgan amallarni to'plash
    const possibleOperations: { number: number; isAdd: boolean }[] = [];
    
    rules.add.forEach(num => {
      possibleOperations.push({ number: num, isAdd: true });
    });
    
    rules.subtract.forEach(num => {
      possibleOperations.push({ number: num, isAdd: false });
    });

    if (possibleOperations.length === 0) return null;

    // Tasodifiy amal tanlash
    const randomOp = possibleOperations[Math.floor(Math.random() * possibleOperations.length)];
    
    // Natijani yangilash
    if (randomOp.isAdd) {
      runningResultRef.current += randomOp.number;
    } else {
      runningResultRef.current -= randomOp.number;
    }

    return randomOp.number;
  }, []);

  // O'yinni boshlash
  const startGame = useCallback(() => {
    // Dastlabki natija tasodifiy 0-9
    const initialResult = Math.floor(Math.random() * 10);
    runningResultRef.current = initialResult;
    countRef.current = 1;
    
    setCurrentNumber(initialResult);
    setDisplayedNumbers([initialResult]);
    setIsRunning(true);
    setIsFinished(false);
    setUserAnswer('');
    setFeedback(null);
    setShowResult(false);

    // Har 1 soniyada yangi son
    intervalRef.current = setInterval(() => {
      countRef.current += 1;
      
      if (countRef.current > problemCount) {
        // O'yin tugadi
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsRunning(false);
        setIsFinished(true);
        setCurrentNumber(null);
        return;
      }

      const nextNum = generateNextNumber();
      if (nextNum !== null) {
        setCurrentNumber(nextNum);
        setDisplayedNumbers(prev => [...prev, nextNum]);
      }
    }, 1000);
  }, [problemCount, generateNextNumber]);

  // Javobni tekshirish
  const checkAnswer = useCallback(() => {
    const userNum = parseInt(userAnswer, 10);
    const correctAnswer = runningResultRef.current;
    const isCorrect = userNum === correctAnswer;
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setShowResult(true);
    
    onComplete?.(isCorrect, userNum, correctAnswer);
  }, [userAnswer, onComplete]);

  // Qayta boshlash
  const resetGame = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setIsFinished(false);
    setCurrentNumber(null);
    setDisplayedNumbers([]);
    setUserAnswer('');
    setFeedback(null);
    setShowResult(false);
    runningResultRef.current = 0;
    countRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Enter tugmasi bilan javob berish
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isFinished && !showResult && userAnswer) {
      checkAnswer();
    }
  };

  return (
    <Card className="p-8 max-w-md mx-auto">
      {/* Son ko'rsatish maydoni */}
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        {!isRunning && !isFinished && currentNumber === null && (
          <Button 
            onClick={startGame} 
            size="lg" 
            className="gap-2"
          >
            <Play className="h-5 w-5" />
            Boshlash
          </Button>
        )}

        {(isRunning || (isFinished && currentNumber === null)) && (
          <div className="text-center">
            {currentNumber !== null && (
              <div 
                className="text-8xl font-bold text-primary transition-all duration-200"
                key={displayedNumbers.length}
              >
                {currentNumber}
              </div>
            )}
            
            {isFinished && currentNumber === null && !showResult && (
              <div className="space-y-6">
                <p className="text-lg text-muted-foreground mb-4">
                  Natijani kiriting:
                </p>
                <Input
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Javob"
                  className="text-center text-2xl h-16 w-32 mx-auto"
                  autoFocus
                />
                <Button 
                  onClick={checkAnswer} 
                  disabled={!userAnswer}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Tekshirish
                </Button>
              </div>
            )}

            {showResult && (
              <div className="space-y-4">
                <div 
                  className={`text-6xl font-bold ${
                    feedback === 'correct' ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {feedback === 'correct' ? '✓' : '✗'}
                </div>
                <p className="text-lg">
                  {feedback === 'correct' 
                    ? "To'g'ri!" 
                    : `Noto'g'ri. To'g'ri javob: ${runningResultRef.current}`
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Sonlar: {displayedNumbers.join(' → ')}
                </p>
                <Button 
                  onClick={resetGame} 
                  variant="outline"
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Qayta boshlash
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress ko'rsatkichi */}
      {isRunning && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {countRef.current} / {problemCount}
        </div>
      )}
    </Card>
  );
};

export default MentalArithmeticPractice;
