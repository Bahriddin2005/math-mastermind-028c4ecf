import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ComboEffect } from './ComboEffect';
import { LevelUpModal } from './LevelUpModal';
import { Play, RotateCcw, Zap, Star, Trophy, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSound } from '@/hooks/useSound';
import { toast } from 'sonner';
import { useAdaptiveGamification } from '@/hooks/useAdaptiveGamification';
import { cn } from '@/lib/utils';

// Soroban rules engine (hidden from user)
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

// Generate wrong answers for balloon game
const generateWrongAnswers = (correct: number, count: number = 3): number[] => {
  const wrongs: number[] = [];
  const offsets = [-3, -2, -1, 1, 2, 3, -4, 4, -5, 5];
  
  for (const offset of offsets) {
    const wrong = correct + offset;
    if (wrong >= 0 && wrong !== correct && !wrongs.includes(wrong)) {
      wrongs.push(wrong);
      if (wrongs.length >= count) break;
    }
  }
  
  while (wrongs.length < count) {
    const random = Math.floor(Math.random() * 20);
    if (random !== correct && !wrongs.includes(random)) {
      wrongs.push(random);
    }
  }
  
  return wrongs;
};

// Shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const MentalArithmeticPractice = () => {
  const { user } = useAuth();
  const { playSound } = useSound();
  
  const gamification = useAdaptiveGamification({
    gameType: 'mental-arithmetic',
    baseScore: 15,
    enabled: !!user,
  });
  
  // Game state
  const [gamePhase, setGamePhase] = useState<'ready' | 'showing' | 'choosing' | 'result'>('ready');
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [displayedNumbers, setDisplayedNumbers] = useState<number[]>([]);
  const [choices, setChoices] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showComboEffect, setShowComboEffect] = useState(false);
  const [score, setScore] = useState(0);
  const [problemsPlayed, setProblemsPlayed] = useState(0);
  
  // Game settings (adaptive)
  const operationCount = Math.min(3 + Math.floor(gamification.level / 3), 10);
  const showSpeed = Math.max(3000 - (gamification.difficultyLevel * 150), 800);
  
  const runningResultRef = useRef(0);
  const countRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const generateNextNumber = useCallback(() => {
    const currentResult = runningResultRef.current;
    const lastDigit = Math.abs(currentResult) % 10;
    const rules = RULES[lastDigit];
    
    if (!rules) return null;

    const possibleOps: { num: number; isAdd: boolean }[] = [];
    rules.add.forEach(num => possibleOps.push({ num, isAdd: true }));
    rules.subtract.forEach(num => possibleOps.push({ num, isAdd: false }));

    if (possibleOps.length === 0) return null;

    const op = possibleOps[Math.floor(Math.random() * possibleOps.length)];
    
    if (op.isAdd) {
      runningResultRef.current += op.num;
      return op.num;
    } else {
      runningResultRef.current -= op.num;
      return -op.num;
    }
  }, []);

  const startGame = useCallback(() => {
    // Initialize
    const initial = Math.floor(Math.random() * 9) + 1;
    runningResultRef.current = initial;
    countRef.current = 1;
    startTimeRef.current = Date.now();
    
    playSound('start');
    
    setCurrentNumber(initial);
    setDisplayedNumbers([initial]);
    setGamePhase('showing');
    setSelectedAnswer(null);
    setIsCorrect(null);
    setChoices([]);

    intervalRef.current = setInterval(() => {
      countRef.current += 1;
      
      if (countRef.current > operationCount) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        // Prepare choices
        const correct = runningResultRef.current;
        const wrongs = generateWrongAnswers(correct, 3);
        const allChoices = shuffleArray([correct, ...wrongs]);
        
        setChoices(allChoices);
        setCurrentNumber(null);
        setGamePhase('choosing');
        playSound('complete');
        return;
      }

      const nextNum = generateNextNumber();
      if (nextNum !== null) {
        setCurrentNumber(nextNum);
        setDisplayedNumbers(prev => [...prev, nextNum]);
      }
    }, showSpeed);
  }, [operationCount, showSpeed, generateNextNumber, playSound]);

  const handleChooseAnswer = useCallback(async (answer: number) => {
    const correctAnswer = runningResultRef.current;
    const correct = answer === correctAnswer;
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    
    setSelectedAnswer(answer);
    setIsCorrect(correct);
    setGamePhase('result');
    
    playSound(correct ? 'correct' : 'incorrect');
    
    const newStreak = correct ? currentStreak + 1 : 0;
    setCurrentStreak(newStreak);
    setProblemsPlayed(prev => prev + 1);
    
    if (correct) {
      const earnedScore = 10 + (newStreak * 2);
      setScore(prev => prev + earnedScore);
      
      if (newStreak >= 2) {
        setShowComboEffect(true);
      }
    }

    // Save to database
    if (user) {
      try {
        await gamification.processAnswer(correct, Math.floor(timeTaken * 1000), 1);
        
        await supabase.from('game_sessions').insert({
          user_id: user.id,
          section: 'mental-arithmetic',
          difficulty: 'medium',
          mode: 'practice',
          correct: correct ? 1 : 0,
          incorrect: correct ? 0 : 1,
          best_streak: Math.max(newStreak, gamification.maxCombo),
          score: correct ? 10 + (newStreak * 2) : 0,
          total_time: timeTaken,
          problems_solved: 1,
        });
      } catch (error) {
        console.error('Error saving:', error);
      }
    }
    
    if (correct) {
      toast.success("Zo'r! 🎉", { duration: 1500 });
    }
  }, [user, currentStreak, playSound, gamification]);

  const resetGame = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setGamePhase('ready');
    setCurrentNumber(null);
    setDisplayedNumbers([]);
    setChoices([]);
    setSelectedAnswer(null);
    setIsCorrect(null);
    runningResultRef.current = 0;
    countRef.current = 0;
    gamification.resetCombo();
  }, [gamification]);

  const playAgain = useCallback(() => {
    resetGame();
    setTimeout(() => startGame(), 100);
  }, [resetGame, startGame]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <ComboEffect
        combo={currentStreak}
        showEffect={showComboEffect}
        onEffectComplete={() => setShowComboEffect(false)}
      />

      <LevelUpModal
        isOpen={gamification.showLevelUpModal}
        onClose={gamification.closeLevelUpModal}
        newLevel={gamification.newLevelForModal}
        rewards={gamification.levelUpRewards}
      />

      {/* Stats Bar */}
      <Card className="p-3 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="font-bold text-lg">{score}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                {gamification.energy}/{gamification.maxEnergy}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="font-semibold text-primary">Level {gamification.level}</span>
          </div>
        </div>
      </Card>

      {/* Main Game Area */}
      <Card className="p-6 min-h-[400px] flex flex-col items-center justify-center bg-gradient-to-b from-card to-card/80 border-2 border-primary/20">
        
        {/* Ready Phase */}
        {gamePhase === 'ready' && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/30">
              <Play className="h-12 w-12 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Tayyor!</h2>
              <p className="text-muted-foreground">
                Sonlarni yodda tuting va to'g'ri javobni tanlang
              </p>
            </div>
            <Button
              size="lg"
              onClick={startGame}
              disabled={gamification.energy <= 0}
              className="h-14 px-8 text-lg font-bold rounded-2xl bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 transition-all"
            >
              <Play className="h-6 w-6 mr-2" />
              O'ynash
            </Button>
            {gamification.energy <= 0 && (
              <p className="text-sm text-destructive">Energiya tugadi! Biroz kuting.</p>
            )}
          </div>
        )}

        {/* Showing Numbers Phase */}
        {gamePhase === 'showing' && currentNumber !== null && (
          <div className="text-center space-y-6 animate-scale-in">
            <div className="text-8xl font-black tabular-nums text-primary drop-shadow-lg animate-pulse">
              {currentNumber >= 0 ? `+${currentNumber}` : currentNumber}
            </div>
            <div className="flex items-center gap-2">
              <Progress value={(countRef.current / operationCount) * 100} className="h-2 flex-1" />
              <span className="text-sm text-muted-foreground">{countRef.current}/{operationCount}</span>
            </div>
          </div>
        )}

        {/* Choosing Phase - Balloon Style */}
        {gamePhase === 'choosing' && (
          <div className="text-center space-y-6 w-full animate-fade-in">
            <div className="text-xl font-bold text-muted-foreground">
              Natija qancha? 🎈
            </div>
            <div className="grid grid-cols-2 gap-4">
              {choices.map((choice, index) => (
                <button
                  key={choice}
                  onClick={() => handleChooseAnswer(choice)}
                  className={cn(
                    "relative p-6 rounded-3xl font-bold text-3xl transition-all duration-200",
                    "hover:scale-105 active:scale-95 hover:shadow-xl",
                    "bg-gradient-to-br shadow-lg",
                    index === 0 && "from-blue-400 to-blue-500 text-white shadow-blue-500/30",
                    index === 1 && "from-emerald-400 to-emerald-500 text-white shadow-emerald-500/30",
                    index === 2 && "from-amber-400 to-amber-500 text-white shadow-amber-500/30",
                    index === 3 && "from-pink-400 to-pink-500 text-white shadow-pink-500/30"
                  )}
                  style={{
                    animation: `float ${2 + index * 0.3}s ease-in-out infinite`,
                    animationDelay: `${index * 0.2}s`
                  }}
                >
                  {choice}
                  {/* Balloon shine */}
                  <div className="absolute top-3 left-4 w-3 h-3 rounded-full bg-white/40" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result Phase */}
        {gamePhase === 'result' && (
          <div className="text-center space-y-6 animate-bounce-in">
            <div className={cn(
              "w-24 h-24 mx-auto rounded-full flex items-center justify-center",
              isCorrect 
                ? "bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-xl shadow-emerald-500/30" 
                : "bg-gradient-to-br from-red-400 to-red-500 shadow-xl shadow-red-500/30"
            )}>
              {isCorrect ? (
                <Check className="h-12 w-12 text-white" />
              ) : (
                <X className="h-12 w-12 text-white" />
              )}
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black">
                {isCorrect ? "Zo'r! 🎉" : "Xato 😅"}
              </h2>
              {!isCorrect && (
                <p className="text-lg text-muted-foreground">
                  To'g'ri javob: <span className="font-bold text-primary">{runningResultRef.current}</span>
                </p>
              )}
              {isCorrect && currentStreak >= 2 && (
                <p className="text-lg text-amber-500 font-bold">
                  🔥 {currentStreak} Combo!
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={resetGame}
                className="flex-1 h-12 rounded-xl"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Bosh sahifa
              </Button>
              <Button
                size="lg"
                onClick={playAgain}
                disabled={gamification.energy <= 0}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-primary/90"
              >
                <Play className="h-5 w-5 mr-2" />
                Yana
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Session Stats */}
      {problemsPlayed > 0 && gamePhase === 'ready' && (
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center justify-around text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{problemsPlayed}</p>
              <p className="text-xs text-muted-foreground">O'yinlar</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-2xl font-bold text-amber-500">{score}</p>
              <p className="text-xs text-muted-foreground">Ball</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-2xl font-bold text-emerald-500">{currentStreak}</p>
              <p className="text-xs text-muted-foreground">Combo</p>
            </div>
          </div>
        </Card>
      )}

      {/* CSS for floating animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};
