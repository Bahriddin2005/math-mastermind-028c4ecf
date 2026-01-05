import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Play, RotateCcw, Check, Settings2, Clock, Star, Trophy, Volume2, Sparkles, Zap } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import { useAuth } from '@/hooks/useAuth';
import { useConfetti } from '@/hooks/useConfetti';
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
  const { triggerCompletionConfetti } = useConfetti();
  // useElevenLabs=true enables ElevenLabs when provider setting is 'elevenlabs'
  const { speakNumber, stop: stopTTS } = useTTS({ useElevenLabs: true });
  
  // Settings
  const [problemCount, setProblemCount] = useState(5);
  const [termsCount, setTermsCount] = useState(5); // Hadlar soni
  const [showTime, setShowTime] = useState(500); // ms
  const [answerTimeLimit, setAnswerTimeLimit] = useState(10);
  const [showSettings, setShowSettings] = useState(true);
  const [digitLevel, setDigitLevel] = useState<DigitLevel>('1-digit');
  const [formulaType, setFormulaType] = useState<FormulaType>('basic');
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    const saved = localStorage.getItem('flashCard_voiceEnabled');
    return saved !== null ? saved === 'true' : true;
  });
  
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
    
    // Speak first number
    if (voiceEnabled && numbers.length > 0) {
      speakNumber(String(Math.abs(numbers[0])), true, true);
    }
    
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
        // Speak subsequent numbers
        if (voiceEnabled) {
          const num = numbers[index];
          speakNumber(String(Math.abs(num)), num >= 0, false);
        }
      }
    }, showTime);
  }, [showTime, startAnswerTimer, voiceEnabled, speakNumber]);

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
    
    // Trigger confetti effect based on accuracy
    const finalAccuracy = Math.round((finalScore.correct / (finalScore.correct + finalScore.incorrect)) * 100);
    setTimeout(() => {
      triggerCompletionConfetti(finalAccuracy);
    }, 300);
    
    onComplete?.(finalScore.correct, problemCount);
    
    if (user) {
      saveResult(finalScore);
    }
  }, [problemCount, playSound, onComplete, user, triggerCompletionConfetti]);

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

  // Fullscreen game mode when playing
  if (isPlaying) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col safe-top safe-bottom">
        {/* Minimal Header - Mobile Optimized */}
        <div className="flex justify-between items-center px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 border-b border-border/50">
          <div className="flex items-center gap-1.5 xs:gap-2 px-2 xs:px-3 py-1 xs:py-1.5 bg-muted/50 rounded-lg">
            <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs xs:text-sm font-medium">{currentProblem}/{problemCount}</span>
          </div>
          
          {streak > 0 && (
            <div className="bg-amber-500/10 text-amber-500 px-2 xs:px-3 py-1 xs:py-1.5 rounded-full flex items-center gap-1 xs:gap-1.5">
              <Star className="h-3 w-3 xs:h-4 xs:w-4" />
              <span className="font-bold text-xs xs:text-sm">{streak}x</span>
            </div>
          )}
          
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-4">
            <div className="flex items-center gap-1 xs:gap-1.5 px-2 xs:px-3 py-1 xs:py-1.5 bg-muted/50 rounded-lg">
              <Trophy className="h-3 w-3 xs:h-4 xs:w-4 text-amber-500" />
              <span className="text-xs xs:text-sm font-bold text-amber-500">{score.totalPoints}</span>
            </div>
            
            {!isDisplaying && (
              <div className={`flex items-center gap-1 xs:gap-1.5 px-2 xs:px-3 py-1 xs:py-1.5 rounded-lg ${timeLeft <= 3 ? 'bg-red-500/20' : 'bg-muted/50'}`}>
                <Clock className={`h-3 w-3 xs:h-4 xs:w-4 ${getTimerColor()}`} />
                <span className={`text-xs xs:text-sm font-bold ${getTimerColor()}`}>{timeLeft}s</span>
              </div>
            )}
            
            <Button variant="ghost" size="icon" onClick={resetGame} className="h-8 w-8 xs:h-9 xs:w-9">
              <RotateCcw className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={(currentProblem / problemCount) * 100} className="h-0.5 xs:h-1 rounded-none" />

        {/* Main Content - Conditional layout - Full height */}
        <div className={`flex-1 min-h-[calc(100vh-80px)] overflow-y-auto flex flex-col items-center px-4 py-6 sm:py-10 justify-start pt-12 sm:pt-20 md:pt-24`}>
          {isDisplaying && currentDisplayIndex >= 0 && currentDisplayIndex < displayNumbers.length && (
            <div key={currentDisplayIndex} className="relative flex items-center justify-center w-full animate-zoom-pop">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-amber-500/20 rounded-full blur-[100px] xs:blur-[120px] sm:blur-[150px] scale-150 sm:scale-200 animate-pulse-slow" />
              <div className="relative text-[160px] xs:text-[200px] sm:text-[300px] md:text-[380px] lg:text-[460px] font-bold font-display leading-none tracking-tight text-emerald-700 dark:text-emerald-400 select-none drop-shadow-2xl text-center">
                {displayNumbers[currentDisplayIndex] < 0 
                  ? `−${Math.abs(displayNumbers[currentDisplayIndex])}` 
                  : `+${displayNumbers[currentDisplayIndex]}`}
              </div>
            </div>
          )}

          {/* Answer Input - Beautiful Design */}
          {!isDisplaying && feedback === null && (
            <div className="text-center space-y-6 xs:space-y-8 sm:space-y-10 w-full max-w-2xl px-4 xs:px-6 animate-zoom-in">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-transparent to-primary/50 rounded-full" />
                  <span className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-semibold text-foreground">Natija qancha? 🤔</span>
                  <div className="h-1 w-8 sm:w-12 bg-gradient-to-l from-transparent to-primary/50 rounded-full" />
                </div>
                <p className="text-sm xs:text-base sm:text-lg text-muted-foreground">Javobingni yoz va tekshir!</p>
              </div>
              
              {/* Input Container */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 rounded-3xl blur-xl" />
                <div className="relative bg-card/80 backdrop-blur-sm border-2 border-primary/20 rounded-3xl p-6 xs:p-8 sm:p-10 shadow-lg">
                  <Input
                    ref={inputRef}
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="?"
                    className="text-center text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold h-24 xs:h-32 sm:h-40 md:h-48 lg:h-56 border-2 border-primary/30 rounded-2xl xs:rounded-3xl bg-background/50 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300"
                    autoFocus
                  />
                </div>
              </div>
              
              {/* Submit Button */}
              <Button 
                onClick={checkAnswer} 
                size="lg" 
                className="gap-3 xs:gap-4 h-16 xs:h-20 sm:h-24 text-lg xs:text-xl sm:text-2xl md:text-3xl px-12 xs:px-16 sm:px-20 w-full max-w-md mx-auto rounded-2xl xs:rounded-3xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 font-semibold"
                disabled={!userAnswer}
              >
                <Check className="h-6 w-6 xs:h-8 xs:w-8 sm:h-10 sm:w-10" />
                Tekshirish
              </Button>
            </div>
          )}

          {/* Feedback - Mobile Optimized - Child Friendly */}
          {feedback && (
            <div className="text-center space-y-4 xs:space-y-6 sm:space-y-8 animate-fade-in px-4 flex flex-col items-center w-full">
              {/* Celebration emoji for correct */}
              {feedback === 'correct' && (
                <div className="text-6xl xs:text-7xl sm:text-8xl animate-bounce">🎉</div>
              )}
              
              <div className={`text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-center ${
                feedback === 'correct' ? 'text-green-500' : 'text-red-500'
              }`}>
                {feedback === 'correct' && "Zo'r! Sen uddalading! 🔥"}
                {feedback === 'incorrect' && (
                  <div className="space-y-2">
                    <span>Deyarli to'g'ri! 💪</span>
                    <div className="text-xl xs:text-2xl sm:text-3xl text-muted-foreground font-normal mt-2">
                      To'g'ri javob: <span className="text-primary font-bold">{correctAnswer}</span>
                    </div>
                    <div className="text-sm xs:text-base sm:text-lg text-muted-foreground font-normal">
                      Keyingi safar aniqroq bo'lasan! 🚀
                    </div>
                  </div>
                )}
                {feedback === 'timeout' && (
                  <div className="space-y-2">
                    <span>Vaqt tugadi! ⏰</span>
                    <div className="text-xl xs:text-2xl sm:text-3xl text-muted-foreground font-normal mt-2">
                      Javob: <span className="text-primary font-bold">{correctAnswer}</span>
                    </div>
                    <div className="text-sm xs:text-base sm:text-lg text-muted-foreground font-normal">
                      Keyingi safar tezroq bo'lasan! 💨
                    </div>
                  </div>
                )}
              </div>
              
              {/* Show answer for correct with speed feedback */}
              {feedback === 'correct' && (
                <div className="text-lg xs:text-xl sm:text-2xl text-muted-foreground">
                  ⚡ Juda tez! Davom et!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-280px)] sm:min-h-[calc(100vh-260px)]">
      {/* Settings - At Top when not playing */}
      {showSettings && !isFinished && (
        <>
          {/* Settings Panel - At Top - Beautiful Mobile Optimized Design */}
          <div className="bg-gradient-to-b from-card/95 to-card/80 backdrop-blur-lg border border-border/50 rounded-2xl sm:rounded-3xl shadow-lg p-3 xs:p-4 sm:p-6 space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Settings2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-foreground">Sozlamalar</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span>Flash Card</span>
              </div>
            </div>

            {/* Quick Settings Row - 2x2 grid on mobile */}
            <div className="grid grid-cols-2 gap-2 xs:gap-3 sm:grid-cols-4 sm:gap-4">
              {/* Formula */}
              <div className="space-y-1.5">
                <Label className="text-[10px] xs:text-xs text-muted-foreground flex items-center gap-1">
                  <span className="text-sm">📚</span> Formula
                </Label>
                <Select value={formulaType} onValueChange={(v) => setFormulaType(v as FormulaType)}>
                  <SelectTrigger className="h-9 xs:h-10 sm:h-11 text-xs xs:text-sm bg-background/50 border-border/50 hover:border-primary/30 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FORMULA_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key} className="text-xs xs:text-sm">{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Digits */}
              <div className="space-y-1.5">
                <Label className="text-[10px] xs:text-xs text-muted-foreground flex items-center gap-1">
                  <span className="text-sm">🔢</span> Xonalar
                </Label>
                <Select value={digitLevel} onValueChange={(v) => setDigitLevel(v as DigitLevel)}>
                  <SelectTrigger className="h-9 xs:h-10 sm:h-11 text-xs xs:text-sm bg-background/50 border-border/50 hover:border-primary/30 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-digit" className="text-xs xs:text-sm">1 xonali</SelectItem>
                    <SelectItem value="2-digit" className="text-xs xs:text-sm">2 xonali</SelectItem>
                    <SelectItem value="3-digit" className="text-xs xs:text-sm">3 xonali</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Terms */}
              <div className="space-y-1.5">
                <Label className="text-[10px] xs:text-xs text-muted-foreground flex items-center gap-1">
                  <span className="text-sm">📊</span> Hadlar
                </Label>
                <Select value={String(termsCount)} onValueChange={(v) => setTermsCount(Number(v))}>
                  <SelectTrigger className="h-9 xs:h-10 sm:h-11 text-xs xs:text-sm bg-background/50 border-border/50 hover:border-primary/30 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TERMS_CONFIG).map(([count, config]) => (
                      <SelectItem key={count} value={count} className="text-xs xs:text-sm">{count} ta</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Answer Time */}
              <div className="space-y-1.5">
                <Label className="text-[10px] xs:text-xs text-muted-foreground flex items-center gap-1">
                  <span className="text-sm">⏱️</span> Javob vaqti
                </Label>
                <Select value={String(answerTimeLimit)} onValueChange={(v) => setAnswerTimeLimit(Number(v))}>
                  <SelectTrigger className="h-9 xs:h-10 sm:h-11 text-xs xs:text-sm bg-background/50 border-border/50 hover:border-primary/30 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5" className="text-xs xs:text-sm">5s</SelectItem>
                    <SelectItem value="10" className="text-xs xs:text-sm">10s</SelectItem>
                    <SelectItem value="15" className="text-xs xs:text-sm">15s</SelectItem>
                    <SelectItem value="20" className="text-xs xs:text-sm">20s</SelectItem>
                    <SelectItem value="30" className="text-xs xs:text-sm">30s</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Speed & Problems - Compact horizontal scroll */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Speed Selection */}
              <div className="space-y-2 bg-background/30 rounded-xl p-2.5 sm:p-3 border border-border/30">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] xs:text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3 w-3 xs:h-3.5 xs:w-3.5 text-primary/60" /> Tezlik
                  </Label>
                  <span className="text-xs sm:text-sm font-semibold text-primary px-2 py-0.5 bg-primary/10 rounded-md">
                    {(showTime / 1000).toFixed(1)}s
                  </span>
                </div>
                <div className="flex gap-1.5 xs:gap-2 overflow-x-auto pb-1 hide-scrollbar -mx-0.5 px-0.5">
                  {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((speed) => (
                    <Button
                      key={speed}
                      variant={showTime === speed ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowTime(speed)}
                      className={`text-[10px] xs:text-xs h-8 xs:h-9 px-2.5 xs:px-3 flex-shrink-0 rounded-lg ${
                        showTime === speed 
                          ? 'bg-primary shadow-md' 
                          : 'bg-background/50 hover:bg-primary/10 hover:border-primary/30'
                      }`}
                    >
                      {(speed / 1000).toFixed(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Problems Count */}
              <div className="space-y-2 bg-background/30 rounded-xl p-2.5 sm:p-3 border border-border/30">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] xs:text-xs text-muted-foreground flex items-center gap-1.5">
                    <Zap className="h-3 w-3 xs:h-3.5 xs:w-3.5 text-amber-500/60" /> Misollar
                  </Label>
                  <span className="text-xs sm:text-sm font-semibold text-amber-500 px-2 py-0.5 bg-amber-500/10 rounded-md">
                    {problemCount} ta
                  </span>
                </div>
                <div className="flex gap-1.5 xs:gap-2 overflow-x-auto pb-1 hide-scrollbar -mx-0.5 px-0.5">
                  {[3, 5, 7, 10, 15, 20].map((count) => (
                    <Button
                      key={count}
                      variant={problemCount === count ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProblemCount(count)}
                      className={`text-[10px] xs:text-xs h-8 xs:h-9 px-3 xs:px-4 flex-shrink-0 rounded-lg ${
                        problemCount === count 
                          ? 'bg-amber-500 hover:bg-amber-600 shadow-md' 
                          : 'bg-background/50 hover:bg-amber-500/10 hover:border-amber-500/30'
                      }`}
                    >
                      {count}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Start Button - Prominent */}
            <Button 
              onClick={startGame} 
              size="lg" 
              className="w-full h-12 xs:h-13 sm:h-14 text-base xs:text-lg font-bold gap-2 xs:gap-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="h-5 w-5 xs:h-6 xs:w-6" />
              Mashqni boshlash
            </Button>
          </div>
        </>
      )}

      {/* Results - Mobile Optimized - Child Friendly */}
      {isFinished && (
        <div className="flex-1 flex items-center justify-center py-4 xs:py-6 sm:py-8">
          <div className="text-center space-y-4 xs:space-y-6 sm:space-y-8 w-full max-w-md px-3 xs:px-4">
            {/* Celebration Header */}
            <div className="space-y-2">
              <div className="text-5xl xs:text-6xl sm:text-7xl">
                {accuracy >= 80 ? '🏆' : accuracy >= 60 ? '⭐' : accuracy >= 40 ? '💪' : '📚'}
              </div>
              <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-foreground">
                {accuracy >= 80 ? "Ajoyib natija! 🎉" : 
                 accuracy >= 60 ? "Yaxshi ish! 👏" : 
                 accuracy >= 40 ? "Yaxshi harakat! 💪" : 
                 "Mashq qil, sen uddalaysan! 🚀"}
              </h2>
            </div>

            {/* Total Points with motivation */}
            <div className="space-y-1 xs:space-y-2">
              <div className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-bold font-display bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                +{score.totalPoints}
              </div>
              <p className="text-sm xs:text-base text-muted-foreground font-medium">ball to'plading! 🌟</p>
            </div>
            
            {/* Stats Grid - Mobile Optimized */}
            <div className="grid grid-cols-3 gap-2 xs:gap-3">
              <div className="bg-green-500/10 rounded-xl xs:rounded-2xl p-2.5 xs:p-3 sm:p-4 border border-green-500/20">
                <div className="text-xl xs:text-2xl sm:text-3xl font-bold text-green-500">{score.correct}</div>
                <div className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 xs:mt-1">To'g'ri ✓</div>
              </div>
              <div className="bg-red-500/10 rounded-xl xs:rounded-2xl p-2.5 xs:p-3 sm:p-4 border border-red-500/20">
                <div className="text-xl xs:text-2xl sm:text-3xl font-bold text-red-500">{score.incorrect}</div>
                <div className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 xs:mt-1">Xato</div>
              </div>
              <div className="bg-amber-500/10 rounded-xl xs:rounded-2xl p-2.5 xs:p-3 sm:p-4 border border-amber-500/20">
                <div className="text-xl xs:text-2xl sm:text-3xl font-bold text-amber-500">{bestStreak}x</div>
                <div className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 xs:mt-1">🔥 Seriya</div>
              </div>
            </div>
            
            {/* Progress and Motivation */}
            <div className="space-y-3 bg-primary/5 rounded-2xl p-4 border border-primary/10">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Aniqlik</span>
                <span className="font-bold text-primary">{accuracy}%</span>
              </div>
              <Progress value={accuracy} className="h-2" />
              <p className="text-xs xs:text-sm text-muted-foreground">
                {accuracy >= 80 ? "Sen ko'pchilikdan yaxshiroqsan! 🌟" :
                 accuracy >= 60 ? "Yana bir oz va mukammal bo'lasan! 📈" :
                 "Har kuni mashq qil va ustaga aylanasan! 💎"}
              </p>
            </div>
            
            {/* Restart Button */}
            <Button 
              onClick={resetGame} 
              size="lg"
              className="w-full h-12 xs:h-13 sm:h-14 text-base xs:text-lg font-semibold gap-2 xs:gap-3 rounded-xl xs:rounded-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
            >
              <RotateCcw className="h-4 w-4 xs:h-5 xs:w-5" />
              Yana o'ynash 🎮
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbacusFlashCard;
