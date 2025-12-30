import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Play, RotateCcw, Check, Settings2, Clock, Star, Trophy, Volume2 } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AbacusFlashCardProps {
  onComplete?: (correct: number, total: number) => void;
}

// Xonalar soni sozlamalari
type DigitLevel = '1-digit' | '2-digit' | '3-digit';

const DIGIT_CONFIG = {
  '1-digit': { label: "1 xonali", min: 1, max: 9, multiplier: 1 },
  '2-digit': { label: "2 xonali", min: 10, max: 99, multiplier: 2 },
  '3-digit': { label: "3 xonali", min: 100, max: 999, multiplier: 3 },
};

// Formulasiz qoidalar - 1 xonali uchun
const RULES_BASIC: Record<number, { add: number[]; subtract: number[] }> = {
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

// Kichik do'st +1/-1
const RULES_SMALL_FRIEND_1: Record<number, { add: number[]; subtract: number[] }> = {
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

// Kichik do'st +2/-2
const RULES_SMALL_FRIEND_2: Record<number, { add: number[]; subtract: number[] }> = {
  0: { add: [], subtract: [] },
  1: { add: [], subtract: [] },
  2: { add: [], subtract: [] },
  3: { add: [2], subtract: [] },
  4: { add: [2], subtract: [] },
  5: { add: [], subtract: [2] },
  6: { add: [], subtract: [2] },
  7: { add: [], subtract: [] },
  8: { add: [], subtract: [] },
  9: { add: [], subtract: [] },
};

// Katta do'st +3/-3
const RULES_BIG_FRIEND_3: Record<number, { add: number[]; subtract: number[] }> = {
  0: { add: [], subtract: [] },
  1: { add: [], subtract: [] },
  2: { add: [3], subtract: [] },
  3: { add: [3], subtract: [] },
  4: { add: [], subtract: [] },
  5: { add: [], subtract: [] },
  6: { add: [], subtract: [3] },
  7: { add: [], subtract: [3] },
  8: { add: [], subtract: [] },
  9: { add: [], subtract: [] },
};

// Katta do'st +4/-4
const RULES_BIG_FRIEND_4: Record<number, { add: number[]; subtract: number[] }> = {
  0: { add: [], subtract: [] },
  1: { add: [4], subtract: [] },
  2: { add: [4], subtract: [] },
  3: { add: [4], subtract: [] },
  4: { add: [], subtract: [] },
  5: { add: [], subtract: [] },
  6: { add: [], subtract: [4] },
  7: { add: [], subtract: [4] },
  8: { add: [], subtract: [4] },
  9: { add: [], subtract: [] },
};

// Aralash formula
const RULES_MIXED: Record<number, { add: number[]; subtract: number[] }> = {
  0: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [] },
  1: { add: [1, 2, 3, 4, 5, 6, 7, 8], subtract: [1] },
  2: { add: [1, 2, 3, 4, 5, 6, 7], subtract: [1, 2] },
  3: { add: [1, 2, 3, 5, 6], subtract: [1, 2, 3] },
  4: { add: [1, 2, 5], subtract: [1, 2, 3, 4] },
  5: { add: [1, 2, 3, 4], subtract: [1, 2, 5] },
  6: { add: [1, 2, 3], subtract: [1, 2, 3, 5, 6] },
  7: { add: [1, 2], subtract: [1, 2, 3, 4, 5, 7] },
  8: { add: [1], subtract: [1, 2, 3, 4, 5, 8] },
  9: { add: [], subtract: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
};

// Formula turlari
type FormulaType = 'basic' | 'small_friend_1' | 'small_friend_2' | 'big_friend_3' | 'big_friend_4' | 'mixed';

const FORMULA_CONFIG: Record<FormulaType, { 
  label: string; 
  rules: Record<number, { add: number[]; subtract: number[] }>;
  description: string;
}> = {
  basic: { 
    label: "Formulasiz", 
    rules: RULES_BASIC,
    description: "Asosiy qo'shish va ayirish amallari"
  },
  small_friend_1: { 
    label: "Kichik do'st +1/-1", 
    rules: RULES_SMALL_FRIEND_1,
    description: "4+1=5, 5-1=4 formulasi"
  },
  small_friend_2: { 
    label: "Kichik do'st +2/-2", 
    rules: RULES_SMALL_FRIEND_2,
    description: "3+2=5, 6-2=4 formulasi"
  },
  big_friend_3: { 
    label: "Katta do'st +3/-3", 
    rules: RULES_BIG_FRIEND_3,
    description: "2+3=5, 7-3=4 formulasi"
  },
  big_friend_4: { 
    label: "Katta do'st +4/-4", 
    rules: RULES_BIG_FRIEND_4,
    description: "1+4=5, 8-4=4 formulasi"
  },
  mixed: { 
    label: "Aralash (barcha formulalar)", 
    rules: RULES_MIXED,
    description: "Barcha formulalar birgalikda"
  },
};

// Hadlar soni konfiguratsiyasi (level bo'yicha)
const TERMS_CONFIG = {
  3: { label: "3 ta (Boshlang'ich)", basePoints: 10 },
  5: { label: "5 ta (Oson)", basePoints: 15 },
  7: { label: "7 ta (O'rta)", basePoints: 20 },
  10: { label: "10 ta (Qiyin)", basePoints: 30 },
  15: { label: "15 ta (Juda qiyin)", basePoints: 45 },
  20: { label: "20 ta (Ekspert)", basePoints: 60 },
};

// Tezlik konfiguratsiyasi
const SPEED_CONFIG = {
  100: { label: "0.1s (Ultra tez)", multiplier: 3.0 },
  200: { label: "0.2s (Juda tez)", multiplier: 2.5 },
  300: { label: "0.3s (Tez)", multiplier: 2.0 },
  400: { label: "0.4s", multiplier: 1.7 },
  500: { label: "0.5s (O'rta)", multiplier: 1.5 },
  600: { label: "0.6s", multiplier: 1.3 },
  700: { label: "0.7s", multiplier: 1.2 },
  800: { label: "0.8s", multiplier: 1.1 },
  900: { label: "0.9s", multiplier: 1.05 },
  1000: { label: "1s (Sekin)", multiplier: 1.0 },
};

export const AbacusFlashCard = ({ onComplete }: AbacusFlashCardProps) => {
  const { user } = useAuth();
  const { playSound } = useSound();
  
  // Settings
  const [problemCount, setProblemCount] = useState(5);
  const [termsCount, setTermsCount] = useState(5); // Hadlar soni
  const [showTime, setShowTime] = useState(500); // ms
  const [answerTimeLimit, setAnswerTimeLimit] = useState(10);
  const [showSettings, setShowSettings] = useState(true);
  const [digitLevel, setDigitLevel] = useState<DigitLevel>('1-digit');
  const [formulaType, setFormulaType] = useState<FormulaType>('basic');
  
  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [displayNumbers, setDisplayNumbers] = useState<number[]>([]);
  const [currentDisplayIndex, setCurrentDisplayIndex] = useState(-1);
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [isDisplaying, setIsDisplaying] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'timeout' | null>(null);
  const [score, setScore] = useState({ correct: 0, incorrect: 0, totalPoints: 0 });
  const [isFinished, setIsFinished] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [answerStartTime, setAnswerStartTime] = useState<number | null>(null);
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const displayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const runningResultRef = useRef(0);

  // Calculate points based on speed, terms, digits, streak and time
  const calculatePoints = useCallback((timeTaken: number, currentStreak: number) => {
    const termsConfig = TERMS_CONFIG[termsCount as keyof typeof TERMS_CONFIG] || TERMS_CONFIG[5];
    const speedConfig = SPEED_CONFIG[showTime as keyof typeof SPEED_CONFIG] || SPEED_CONFIG[500];
    const digitConfig = DIGIT_CONFIG[digitLevel];
    
    // Asosiy ball = hadlar soni bo'yicha
    let basePoints = termsConfig.basePoints;
    
    // Xonalar soni multiplikatori
    basePoints *= digitConfig.multiplier;
    
    // Tezlik multiplikatori
    basePoints *= speedConfig.multiplier;
    
    // Vaqt bonusi (tez javob bergan sari ko'proq)
    const maxTimeBonus = 20;
    const timeBonus = Math.max(0, Math.floor((answerTimeLimit - timeTaken) / answerTimeLimit * maxTimeBonus));
    basePoints += timeBonus;
    
    // Seriya bonusi (har bir streak +5 ball, max +30)
    const streakBonus = Math.min(currentStreak * 5, 30);
    basePoints += streakBonus;
    
    return Math.round(basePoints);
  }, [termsCount, showTime, digitLevel, answerTimeLimit]);

  // Generate number according to formula rules (for multi-digit, apply to each digit)
  const generateNextNumber = useCallback(() => {
    const currentResult = runningResultRef.current;
    const config = DIGIT_CONFIG[digitLevel];
    const selectedRules = FORMULA_CONFIG[formulaType].rules;
    
    if (digitLevel === '1-digit') {
      // 1 xonali uchun mavjud qoidalarni ishlatish
      const rules = selectedRules[currentResult % 10];
      if (!rules) return null;

      const possibleOperations: { number: number; isAdd: boolean }[] = [];
      rules.add.forEach(num => possibleOperations.push({ number: num, isAdd: true }));
      rules.subtract.forEach(num => {
        if (currentResult - num >= 0) {
          possibleOperations.push({ number: num, isAdd: false });
        }
      });

      if (possibleOperations.length === 0) return null;

      const randomOp = possibleOperations[Math.floor(Math.random() * possibleOperations.length)];
      
      if (randomOp.isAdd) {
        runningResultRef.current += randomOp.number;
        return randomOp.number;
      } else {
        runningResultRef.current -= randomOp.number;
        return -randomOp.number;
      }
    } else {
      // 2 yoki 3 xonali uchun - har bir xona uchun alohida qoidalar
      const numDigits = digitLevel === '2-digit' ? 2 : 3;
      let generatedNumber = 0;
      let multiplier = 1;
      let tempResult = currentResult;
      
      for (let d = 0; d < numDigits; d++) {
        const currentDigit = tempResult % 10;
        const rules = selectedRules[currentDigit];
        
        if (!rules) {
          multiplier *= 10;
          tempResult = Math.floor(tempResult / 10);
          continue;
        }
        
        const possibleOps: { num: number; isAdd: boolean }[] = [];
        rules.add.forEach(num => possibleOps.push({ num, isAdd: true }));
        
        // Faqat birinchi xonada ayirishni tekshirish
        if (d === 0) {
          rules.subtract.forEach(num => {
            possibleOps.push({ num, isAdd: false });
          });
        }
        
        if (possibleOps.length > 0) {
          const op = possibleOps[Math.floor(Math.random() * possibleOps.length)];
          generatedNumber += (op.isAdd ? op.num : -op.num) * multiplier;
        }
        
        multiplier *= 10;
        tempResult = Math.floor(tempResult / 10);
      }
      
      // Natijani tekshirish va yangilash
      const newResult = currentResult + generatedNumber;
      if (newResult >= 0 && newResult < config.max * 2) {
        runningResultRef.current = newResult;
        return generatedNumber;
      } else {
        // Agar manfiy bo'lsa, musbat qilish
        const absNum = Math.abs(generatedNumber);
        runningResultRef.current = currentResult + absNum;
        return absNum;
      }
    }
  }, [digitLevel, formulaType]);

  // Generate all numbers for a problem using formula rules
  const generateProblemNumbers = useCallback(() => {
    const config = DIGIT_CONFIG[digitLevel];
    const numbers: number[] = [];
    
    // Boshlang'ich son
    const initialNum = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
    runningResultRef.current = initialNum;
    numbers.push(initialNum);
    
    // Qolgan sonlarni generatsiya qilish
    for (let i = 1; i < termsCount; i++) {
      const nextNum = generateNextNumber();
      if (nextNum !== null) {
        numbers.push(nextNum);
      } else {
        // Agar qoida topilmasa, tasodifiy kichik son qo'shish
        const fallbackNum = Math.floor(Math.random() * 9) + 1;
        runningResultRef.current += fallbackNum;
        numbers.push(fallbackNum);
      }
    }
    
    return { numbers, answer: runningResultRef.current };
  }, [digitLevel, termsCount, generateNextNumber]);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (displayIntervalRef.current) {
      clearInterval(displayIntervalRef.current);
      displayIntervalRef.current = null;
    }
  }, []);

  // Start answer timer countdown
  const startAnswerTimer = useCallback(() => {
    setTimeLeft(answerTimeLimit);
    setAnswerStartTime(Date.now());
    
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          timerIntervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [answerTimeLimit]);

  // Handle timeout
  const handleTimeout = useCallback(() => {
    clearAllTimers();
    setFeedback('timeout');
    playSound('incorrect');
    setStreak(0);
    
    const newScore = {
      ...score,
      incorrect: score.incorrect + 1,
    };
    setScore(newScore);
    
    setTimeout(() => {
      if (currentProblem >= problemCount) {
        finishGame(newScore);
      } else {
        startNextProblem();
      }
    }, 2000);
  }, [score, currentProblem, problemCount, playSound, clearAllTimers]);

  // Handle timeout effect
  useEffect(() => {
    if (timeLeft === 0 && isPlaying && !isDisplaying && feedback === null && answerStartTime !== null) {
      handleTimeout();
    }
  }, [timeLeft, isPlaying, isDisplaying, feedback, answerStartTime, handleTimeout]);

  // Display numbers one by one
  const displayNumbersSequentially = useCallback((numbers: number[], answer: number) => {
    setDisplayNumbers(numbers);
    setCorrectAnswer(answer);
    setCurrentDisplayIndex(0);
    setIsDisplaying(true);
    
    let index = 0;
    displayIntervalRef.current = setInterval(() => {
      index++;
      if (index >= numbers.length) {
        clearInterval(displayIntervalRef.current!);
        displayIntervalRef.current = null;
        
        setTimeout(() => {
          setIsDisplaying(false);
          setCurrentDisplayIndex(-1);
          startAnswerTimer();
          inputRef.current?.focus();
        }, showTime);
      } else {
        setCurrentDisplayIndex(index);
      }
    }, showTime);
  }, [showTime, startAnswerTimer]);

  // Start game
  const startGame = useCallback(() => {
    setIsPlaying(true);
    setShowSettings(false);
    setCurrentProblem(1);
    setScore({ correct: 0, incorrect: 0, totalPoints: 0 });
    setIsFinished(false);
    setFeedback(null);
    setStreak(0);
    setBestStreak(0);
    setUserAnswer('');
    
    playSound('start');
    
    const { numbers, answer } = generateProblemNumbers();
    displayNumbersSequentially(numbers, answer);
  }, [generateProblemNumbers, displayNumbersSequentially, playSound]);

  // Start next problem
  const startNextProblem = useCallback(() => {
    setCurrentProblem(prev => prev + 1);
    setFeedback(null);
    setUserAnswer('');
    setAnswerStartTime(null);
    
    const { numbers, answer } = generateProblemNumbers();
    displayNumbersSequentially(numbers, answer);
  }, [generateProblemNumbers, displayNumbersSequentially]);

  // Check answer
  const checkAnswer = useCallback(() => {
    if (isDisplaying || feedback !== null) return;
    
    clearAllTimers();
    
    const userNum = parseInt(userAnswer, 10);
    const timeTaken = answerStartTime ? (Date.now() - answerStartTime) / 1000 : answerTimeLimit;
    const isCorrect = userNum === correctAnswer;
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    playSound(isCorrect ? 'correct' : 'incorrect');
    
    let newStreak = streak;
    let points = 0;
    
    if (isCorrect) {
      newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }
      points = calculatePoints(timeTaken, newStreak);
    } else {
      newStreak = 0;
      setStreak(0);
    }
    
    const newScore = {
      correct: score.correct + (isCorrect ? 1 : 0),
      incorrect: score.incorrect + (isCorrect ? 0 : 1),
      totalPoints: score.totalPoints + points,
    };
    setScore(newScore);
    
    setTimeout(() => {
      if (currentProblem >= problemCount) {
        finishGame(newScore);
      } else {
        startNextProblem();
      }
    }, 2000);
  }, [isDisplaying, userAnswer, correctAnswer, score, currentProblem, problemCount, playSound, streak, bestStreak, answerStartTime, answerTimeLimit, calculatePoints, clearAllTimers, feedback, startNextProblem]);

  // Finish game
  const finishGame = useCallback((finalScore: { correct: number; incorrect: number; totalPoints: number }) => {
    setIsFinished(true);
    setIsPlaying(false);
    playSound('complete');
    onComplete?.(finalScore.correct, problemCount);
    
    if (user) {
      saveResult(finalScore);
    }
  }, [problemCount, playSound, onComplete, user]);

  // Save result to database
  const saveResult = async (finalScore: { correct: number; incorrect: number; totalPoints: number }) => {
    if (!user) return;
    
    try {
      await supabase.from('game_sessions').insert({
        user_id: user.id,
        section: 'mental-arithmetic',
        difficulty: `${digitLevel}-${termsCount}terms`,
        mode: 'flashcard',
        correct: finalScore.correct,
        incorrect: finalScore.incorrect,
        best_streak: bestStreak,
        score: finalScore.totalPoints,
        problems_solved: problemCount,
      });
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_score, total_problems_solved, best_streak')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        await supabase
          .from('profiles')
          .update({
            total_score: (profile.total_score || 0) + finalScore.totalPoints,
            total_problems_solved: (profile.total_problems_solved || 0) + problemCount,
            best_streak: Math.max(profile.best_streak || 0, bestStreak),
            last_active_date: new Date().toISOString().split('T')[0],
          })
          .eq('user_id', user.id);
      }
      
      toast.success('Natija saqlandi!', { duration: 2000 });
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  // Reset game
  const resetGame = useCallback(() => {
    clearAllTimers();
    setIsPlaying(false);
    setIsFinished(false);
    setShowSettings(true);
    setCurrentProblem(0);
    setDisplayNumbers([]);
    setCurrentDisplayIndex(-1);
    setIsDisplaying(false);
    setUserAnswer('');
    setFeedback(null);
    setScore({ correct: 0, incorrect: 0, totalPoints: 0 });
    setStreak(0);
    setBestStreak(0);
    setTimeLeft(0);
    setAnswerStartTime(null);
  }, [clearAllTimers]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isDisplaying && userAnswer && feedback === null) {
      checkAnswer();
    }
  };

  const accuracy = score.correct + score.incorrect > 0
    ? Math.round((score.correct / (score.correct + score.incorrect)) * 100)
    : 0;

  // Get timer color based on time left
  const getTimerColor = () => {
    if (timeLeft <= 3) return 'text-red-500';
    if (timeLeft <= 5) return 'text-amber-500';
    return 'text-green-500';
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 pb-4 px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Star className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
          Flash Card Rejimi
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
        {/* Settings */}
        {showSettings && !isPlaying && !isFinished && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Settings2 className="h-4 w-4" />
              Sozlamalar
            </div>
            
            {/* Mavzu tanlash */}
            <div className="space-y-2">
              <Label className="text-sm sm:text-base font-medium">📚 Mavzu (Formula)</Label>
              <Select value={formulaType} onValueChange={(v) => setFormulaType(v as FormulaType)}>
                <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FORMULA_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col items-start">
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {FORMULA_CONFIG[formulaType].description}
              </p>
            </div>

            {/* Xonalar soni */}
            <div className="space-y-2">
              <Label className="text-sm sm:text-base font-medium">🔢 Xonalar soni</Label>
              <Select value={digitLevel} onValueChange={(v) => setDigitLevel(v as DigitLevel)}>
                <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-digit">1 xonali (1-9) - x1 ball</SelectItem>
                  <SelectItem value="2-digit">2 xonali (10-99) - x2 ball</SelectItem>
                  <SelectItem value="3-digit">3 xonali (100-999) - x3 ball</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tezlik va hadlar soni */}
            <div className="space-y-3">
              <Label className="text-sm sm:text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tezlik va misollar soni
              </Label>
              
              {/* Tezlik */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tezligi (soniyada)</span>
                  <span className="text-sm font-medium text-primary">
                    {(showTime / 1000).toFixed(1)}s
                    {SPEED_CONFIG[showTime as keyof typeof SPEED_CONFIG] && (
                      <span className="ml-1 text-amber-500">
                        (x{SPEED_CONFIG[showTime as keyof typeof SPEED_CONFIG].multiplier} ball)
                      </span>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[100, 200, 300, 400, 500].map((speed) => (
                    <Button
                      key={speed}
                      variant={showTime === speed ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowTime(speed)}
                      className="text-xs h-9"
                    >
                      {(speed / 1000).toFixed(1)}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[600, 700, 800, 900, 1000].map((speed) => (
                    <Button
                      key={speed}
                      variant={showTime === speed ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowTime(speed)}
                      className="text-xs h-9"
                    >
                      {(speed / 1000).toFixed(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Hadlar soni */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Hadlar soni (bir misolda)</span>
                  <span className="text-sm font-medium text-primary">
                    {termsCount} ta
                    {TERMS_CONFIG[termsCount as keyof typeof TERMS_CONFIG] && (
                      <span className="ml-1 text-amber-500">
                        ({TERMS_CONFIG[termsCount as keyof typeof TERMS_CONFIG].basePoints} ball)
                      </span>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {Object.entries(TERMS_CONFIG).map(([count]) => (
                    <Button
                      key={count}
                      variant={termsCount === Number(count) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTermsCount(Number(count))}
                      className="text-xs h-9"
                    >
                      {count}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Misollar soni */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Misollar soni</span>
                  <span className="text-sm font-medium text-primary">{problemCount} ta</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((count) => (
                    <Button
                      key={count}
                      variant={problemCount === count ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProblemCount(count)}
                      className="text-xs h-9"
                    >
                      {count}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Javob vaqti */}
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">Javob vaqti (soniya)</Label>
              <Select value={String(answerTimeLimit)} onValueChange={(v) => setAnswerTimeLimit(Number(v))}>
                <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 soniya</SelectItem>
                  <SelectItem value="10">10 soniya</SelectItem>
                  <SelectItem value="15">15 soniya</SelectItem>
                  <SelectItem value="20">20 soniya</SelectItem>
                  <SelectItem value="30">30 soniya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Taxminiy ball */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Taxminiy max ball (bir misol uchun):</span>
                <span className="text-lg font-bold text-amber-500">
                  ~{calculatePoints(0, 5)} ball
                </span>
              </div>
            </div>
            
            <div className="flex justify-center pt-4">
              <Button onClick={startGame} size="lg" className="gap-2 h-14 sm:h-12 text-lg sm:text-base px-8 w-full sm:w-auto">
                <Play className="h-6 w-6 sm:h-5 sm:w-5" />
                Mashqni boshlash
              </Button>
            </div>
          </div>
        )}

        {/* Game area */}
        {isPlaying && (
          <div className="space-y-6">
            {/* Top Stats Bar */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Misol</span>
                <span className="text-lg font-bold">{currentProblem} / {problemCount}</span>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-lg font-bold text-amber-500">{score.totalPoints}</span>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                <Clock className={`h-4 w-4 ${!isDisplaying ? getTimerColor() : 'text-muted-foreground'}`} />
                <span className={`text-lg font-bold ${!isDisplaying ? getTimerColor() : 'text-muted-foreground'}`}>
                  {isDisplaying ? '-' : `${timeLeft}s`}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <Progress value={(currentProblem / problemCount) * 100} className="h-2" />

            {/* Current streak */}
            {streak > 0 && (
              <div className="flex justify-center">
                <div className="bg-amber-500/10 text-amber-500 px-4 py-2 rounded-full flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span className="font-bold">{streak}x seriya!</span>
                </div>
              </div>
            )}

            {/* Main Display Area */}
            <div className="min-h-[350px] sm:min-h-[450px] flex items-center justify-center">
              {isDisplaying && currentDisplayIndex >= 0 && currentDisplayIndex < displayNumbers.length && (
                <div className="text-[100px] sm:text-[180px] font-bold font-display leading-none tracking-tight text-emerald-800 animate-fade-in">
                  {displayNumbers[currentDisplayIndex] < 0 
                    ? `−${Math.abs(displayNumbers[currentDisplayIndex])}` 
                    : (currentDisplayIndex > 0 ? `+${displayNumbers[currentDisplayIndex]}` : displayNumbers[currentDisplayIndex])}
                </div>
              )}

              {/* Answer Input */}
              {!isDisplaying && feedback === null && (
                <div className="text-center space-y-6 w-full max-w-md px-4">
                  <p className="text-lg text-muted-foreground">Javobingizni kiriting:</p>
                  <Input
                    ref={inputRef}
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="?"
                    className="text-center text-4xl sm:text-5xl font-bold h-20 sm:h-24"
                    autoFocus
                  />
                  <Button 
                    onClick={checkAnswer} 
                    size="lg" 
                    className="gap-2 h-14 text-lg px-8 w-full"
                    disabled={!userAnswer}
                  >
                    <Check className="h-6 w-6" />
                    Tekshirish
                  </Button>
                </div>
              )}

              {/* Feedback */}
              {feedback && (
                <div className="text-center space-y-4 animate-fade-in">
                  <div className={`text-[80px] sm:text-[120px] font-bold font-display leading-none ${
                    feedback === 'correct' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {correctAnswer}
                  </div>
                  <div className={`text-2xl sm:text-3xl font-bold ${
                    feedback === 'correct' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {feedback === 'correct' && "To'g'ri! ✓"}
                    {feedback === 'incorrect' && `Noto'g'ri. Javob: ${correctAnswer}`}
                    {feedback === 'timeout' && `Vaqt tugadi! Javob: ${correctAnswer}`}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="flex justify-center">
              <Button variant="outline" size="lg" onClick={() => playSound('bead')} className="gap-2">
                <Volume2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        {isFinished && (
          <div className="text-center space-y-6 py-6 sm:py-8">
            {/* Total Points */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-3 text-amber-500">
                <Trophy className="h-10 w-10 sm:h-8 sm:w-8" />
                <span className="text-6xl sm:text-5xl font-bold font-display">{score.totalPoints}</span>
              </div>
              <p className="text-base sm:text-sm text-muted-foreground">Jami ball</p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-green-500/10 rounded-xl p-4 sm:p-4">
                <div className="text-3xl sm:text-2xl font-bold text-green-500">{score.correct}</div>
                <div className="text-xs sm:text-xs text-muted-foreground mt-1">To'g'ri</div>
              </div>
              <div className="bg-red-500/10 rounded-xl p-4 sm:p-4">
                <div className="text-3xl sm:text-2xl font-bold text-red-500">{score.incorrect}</div>
                <div className="text-xs sm:text-xs text-muted-foreground mt-1">Noto'g'ri</div>
              </div>
              <div className="bg-amber-500/10 rounded-xl p-4 sm:p-4">
                <div className="text-3xl sm:text-2xl font-bold text-amber-500">{bestStreak}x</div>
                <div className="text-xs sm:text-xs text-muted-foreground mt-1">Seriya</div>
              </div>
            </div>
            
            <div className="text-lg sm:text-base text-muted-foreground">
              Aniqlik: <span className="text-blue-500 font-semibold">{accuracy}%</span>
            </div>
            
            <div className="flex justify-center px-4">
              <Button onClick={resetGame} variant="outline" className="gap-2 h-14 sm:h-10 text-lg sm:text-sm w-full sm:w-auto">
                <RotateCcw className="h-5 w-5 sm:h-4 sm:w-4" />
                Qayta boshlash
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AbacusFlashCard;
