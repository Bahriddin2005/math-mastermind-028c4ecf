import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { MentalArithmeticHistory } from './MentalArithmeticHistory';
import { MentalArithmeticLeaderboard } from './MentalArithmeticLeaderboard';
import { AbacusFlashCard } from './AbacusFlashCard';
import { GhostBattle } from './GhostBattle';
import { GhostBattleStats } from './GhostBattleStats';
import { GhostBattleRanking } from './GhostBattleRanking';
import { AIGhostBattle } from './AIGhostBattle';
import { MultiplayerCompetition } from './MultiplayerCompetition';
import { ComboEffect } from './ComboEffect';
import { LevelUpModal } from './LevelUpModal';
import { 
  Play, RotateCcw, Zap, BarChart3, Trophy, 
  Swords, Users, BookOpen, Flame, Target, 
  Clock, Gift, TrendingUp, Star, Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSound } from '@/hooks/useSound';
import { toast } from 'sonner';
import { useAdaptiveGamification } from '@/hooks/useAdaptiveGamification';
import { cn } from '@/lib/utils';

// Formula rules
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

const RULES_SMALL_FRIEND: Record<number, { add: number[]; subtract: number[] }> = {
  0: { add: [], subtract: [] },
  1: { add: [], subtract: [] },
  2: { add: [], subtract: [] },
  3: { add: [2], subtract: [] },
  4: { add: [1, 2], subtract: [] },
  5: { add: [], subtract: [1, 2] },
  6: { add: [], subtract: [2] },
  7: { add: [], subtract: [] },
  8: { add: [], subtract: [] },
  9: { add: [], subtract: [] },
};

const RULES_BIG_FRIEND: Record<number, { add: number[]; subtract: number[] }> = {
  0: { add: [], subtract: [] },
  1: { add: [4], subtract: [] },
  2: { add: [3, 4], subtract: [] },
  3: { add: [3, 4], subtract: [] },
  4: { add: [], subtract: [] },
  5: { add: [], subtract: [] },
  6: { add: [], subtract: [3, 4] },
  7: { add: [], subtract: [3, 4] },
  8: { add: [], subtract: [4] },
  9: { add: [], subtract: [] },
};

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

type FormulaType = 'basic' | 'small_friend' | 'big_friend' | 'mixed' | 'negative' | 'multiply' | 'divide';

const FORMULA_CONFIG: Record<string, { label: string; icon: string; rules: Record<number, { add: number[]; subtract: number[] }> }> = {
  basic: { label: "Formulasiz", icon: "📊", rules: RULES_BASIC },
  small_friend: { label: "Kichik formula (5)", icon: "🔢", rules: RULES_SMALL_FRIEND },
  big_friend: { label: "Katta formula (10)", icon: "➕", rules: RULES_BIG_FRIEND },
  mixed: { label: "Mix formula", icon: "🎲", rules: RULES_MIXED },
  negative: { label: "Manfiy sonlar", icon: "➖", rules: RULES_BASIC },
  multiply: { label: "Ko'paytirish", icon: "✖️", rules: RULES_BASIC },
  divide: { label: "Bo'lish", icon: "➗", rules: RULES_BASIC },
};

const DIGIT_OPTIONS = [
  { value: 1, label: "1 xonali", range: "1-9" },
  { value: 2, label: "2 xonali", range: "10-99" },
  { value: 3, label: "3 xonali", range: "100-999" },
  { value: 4, label: "4 xonali", range: "1000-9999" },
];

const SPEED_OPTIONS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.5, 2, 2.5, 3];
const COUNT_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25];

interface PracticeStats {
  totalProblems: number;
  correctAnswers: number;
  incorrectAnswers: number;
  bestStreak: number;
  averageTime: number;
}

export const MentalArithmeticPractice = () => {
  const { user } = useAuth();
  const { playSound } = useSound();
  
  const gamification = useAdaptiveGamification({
    gameType: 'mental-arithmetic',
    baseScore: 15,
    enabled: !!user,
  });
  
  // Settings
  const [formulaType, setFormulaType] = useState<FormulaType>('basic');
  const [digitCount, setDigitCount] = useState(1);
  const [customSpeed, setCustomSpeed] = useState(3); // seconds
  const [customCount, setCustomCount] = useState(10);
  const [bonusAvailable, setBonusAvailable] = useState(false);
  const [activeTab, setActiveTab] = useState('mashq');
  
  // Game state
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [displayedNumbers, setDisplayedNumbers] = useState<number[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [showComboEffect, setShowComboEffect] = useState(false);
  
  // Stats
  const [stats, setStats] = useState<PracticeStats>({
    totalProblems: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    bestStreak: 0,
    averageTime: 0,
  });
  
  const runningResultRef = useRef(0);
  const countRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const checkBonus = async () => {
      if (user) {
        const available = await gamification.checkBonusAvailability();
        setBonusAvailable(available);
      }
    };
    checkBonus();
  }, [user, gamification.checkBonusAvailability]);

  useEffect(() => {
    if (!user) return;
    
    const loadStats = async () => {
      const { data } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('section', 'mental-arithmetic')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data && data.length > 0) {
        const totalProblems = data.reduce((sum, s) => sum + (s.correct || 0) + (s.incorrect || 0), 0);
        const correctAnswers = data.reduce((sum, s) => sum + (s.correct || 0), 0);
        const incorrectAnswers = data.reduce((sum, s) => sum + (s.incorrect || 0), 0);
        const bestStreak = Math.max(...data.map(s => s.best_streak || 0));
        const totalTime = data.reduce((sum, s) => sum + (s.total_time || 0), 0);
        
        setStats({
          totalProblems,
          correctAnswers,
          incorrectAnswers,
          bestStreak,
          averageTime: totalProblems > 0 ? totalTime / totalProblems : 0,
        });
      }
    };
    
    loadStats();
  }, [user, refreshHistory]);

  const generateNextNumber = useCallback(() => {
    const currentResult = runningResultRef.current;
    const selectedRules = FORMULA_CONFIG[formulaType].rules;
    const rules = selectedRules[currentResult % 10]; // Use last digit for multi-digit
    
    if (!rules) return null;

    const possibleOperations: { number: number; isAdd: boolean }[] = [];
    
    rules.add.forEach(num => possibleOperations.push({ number: num, isAdd: true }));
    rules.subtract.forEach(num => possibleOperations.push({ number: num, isAdd: false }));

    if (possibleOperations.length === 0) return null;

    const randomOp = possibleOperations[Math.floor(Math.random() * possibleOperations.length)];
    
    if (randomOp.isAdd) {
      runningResultRef.current += randomOp.number;
      return randomOp.number;
    } else {
      runningResultRef.current -= randomOp.number;
      return -randomOp.number;
    }
  }, [formulaType]);

  const startGame = useCallback(() => {
    const maxInitial = digitCount === 1 ? 9 : digitCount === 2 ? 99 : digitCount === 3 ? 999 : 9999;
    const minInitial = digitCount === 1 ? 1 : digitCount === 2 ? 10 : digitCount === 3 ? 100 : 1000;
    const initialResult = Math.floor(Math.random() * (maxInitial - minInitial + 1)) + minInitial;
    
    runningResultRef.current = initialResult;
    countRef.current = 1;
    startTimeRef.current = Date.now();
    
    playSound('start');
    
    setCurrentNumber(initialResult);
    setDisplayedNumbers([initialResult]);
    setIsRunning(true);
    setIsFinished(false);
    setUserAnswer('');
    setFeedback(null);
    setShowResult(false);

    intervalRef.current = setInterval(() => {
      countRef.current += 1;
      
      if (countRef.current > customCount) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        playSound('complete');
        setIsRunning(false);
        setCurrentNumber(null);
        setIsFinished(true);
        return;
      }

      const nextNum = generateNextNumber();
      if (nextNum !== null) {
        setCurrentNumber(nextNum);
        setDisplayedNumbers(prev => [...prev, nextNum]);
      }
    }, customSpeed * 1000);
  }, [customCount, customSpeed, generateNextNumber, playSound, digitCount]);

  const checkAnswer = useCallback(async () => {
    const userNum = parseInt(userAnswer, 10);
    const correctAnswer = runningResultRef.current;
    const isCorrect = userNum === correctAnswer;
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    const responseTimeMs = Math.floor(timeTaken * 1000);
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setShowResult(true);
    
    playSound(isCorrect ? 'correct' : 'incorrect');
    
    const newStreak = isCorrect ? currentStreak + 1 : 0;
    setCurrentStreak(newStreak);
    
    if (isCorrect && newStreak >= 2) {
      setShowComboEffect(true);
    }
    
    setStats(prev => ({
      ...prev,
      totalProblems: prev.totalProblems + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      incorrectAnswers: prev.incorrectAnswers + (isCorrect ? 0 : 1),
      bestStreak: Math.max(prev.bestStreak, newStreak),
    }));

    if (user) {
      const difficultyMultiplier = digitCount >= 3 ? 2 : digitCount === 2 ? 1.5 : 1;
      await gamification.processAnswer(isCorrect, responseTimeMs, difficultyMultiplier);
      
      try {
        const scoreEarned = isCorrect ? Math.floor(15 * gamification.comboMultiplier) : 0;
        
        await supabase.from('game_sessions').insert({
          user_id: user.id,
          section: 'mental-arithmetic',
          difficulty: digitCount === 1 ? 'easy' : digitCount === 2 ? 'medium' : 'hard',
          mode: 'practice',
          correct: isCorrect ? 1 : 0,
          incorrect: isCorrect ? 0 : 1,
          best_streak: Math.max(newStreak, gamification.maxCombo),
          score: scoreEarned,
          total_time: timeTaken,
          problems_solved: 1,
        });
        
        setRefreshHistory(prev => prev + 1);
      } catch (error) {
        console.error('Error saving session:', error);
      }
    }
    
    if (isCorrect) {
      toast.success("Zo'r! To'g'ri javob! 🎉", { duration: 2000 });
    }
  }, [userAnswer, user, currentStreak, playSound, gamification, digitCount]);

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
    gamification.resetCombo();
  }, [gamification]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isFinished && !showResult && userAnswer) {
      checkAnswer();
    }
  };

  const accuracy = stats.totalProblems > 0 
    ? Math.round((stats.correctAnswers / stats.totalProblems) * 100) 
    : 0;

  const difficultyLevel = gamification.difficultyLevel || 1;
  const coefficient = (1 + (difficultyLevel - 1) * 0.1).toFixed(2);

  return (
    <div className="space-y-4">
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

      {/* Main Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <Card className="p-1.5 bg-card/80 backdrop-blur-sm border-border/50">
          <TabsList className="grid w-full grid-cols-6 h-auto p-0 bg-transparent gap-1">
            {[
              { value: 'mashq', icon: Play, label: 'Mashq' },
              { value: 'oquv', icon: BookOpen, label: "O'quv" },
              { value: 'kunlik', icon: Flame, label: 'Kunlik' },
              { value: 'multiplayer', icon: Users, label: 'Multiplayer' },
              { value: 'reyting', icon: Trophy, label: 'Reyting' },
              { value: 'statistika', icon: BarChart3, label: 'Statistika' },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "flex items-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-medium transition-all",
                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/50"
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Card>

        {/* Mashq Tab Content */}
        <TabsContent value="mashq" className="mt-4 space-y-4">
          {/* Level & Gamification Header */}
          <Card className="p-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-lg">
                {gamification.level}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">Level {gamification.level}</span>
                  <span className="text-xs text-muted-foreground">{gamification.currentXp} / {gamification.requiredXp} XP</span>
                </div>
                <Progress value={gamification.levelProgress} className="h-2" />
              </div>
            </div>
            
            {/* Gamification Stats Row */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-3 rounded-xl bg-primary/10">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Zap className="h-3 w-3 text-primary" />
                  Energiya
                </div>
                <div className="text-lg font-bold text-primary">{gamification.energy}/{gamification.maxEnergy}</div>
              </div>
              <div className="p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Flame className="h-3 w-3" />
                  Combo
                </div>
                <div className="text-lg font-bold">-</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                  Qiyinlik
                </div>
                <div className="text-lg font-bold text-blue-500">{difficultyLevel}/10</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Star className="h-3 w-3 text-amber-500" />
                  Koeffitsient
                </div>
                <div className="text-lg font-bold text-amber-500">×{coefficient}</div>
              </div>
            </div>
          </Card>

          {/* Bonus Challenge Banner */}
          {bonusAvailable && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Bonus tayyor — challenge o'yna!</span>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2">
            <Card className="p-3 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-muted">
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-lg font-bold">{stats.totalProblems}</div>
                <div className="text-[10px] text-muted-foreground">Jami mashqlar</div>
              </div>
            </Card>
            <Card className="p-3 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Check className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <div className="text-lg font-bold text-green-500">{accuracy}%</div>
                <div className="text-[10px] text-muted-foreground">Aniqlik</div>
              </div>
            </Card>
            <Card className="p-3 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <div className="text-lg font-bold text-blue-500">{stats.averageTime.toFixed(1)}s</div>
                <div className="text-[10px] text-muted-foreground">O'rtacha vaqt</div>
              </div>
            </Card>
            <Card className="p-3 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Flame className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <div className="text-lg font-bold text-amber-500">{stats.bestStreak}</div>
                <div className="text-[10px] text-muted-foreground">Eng uzun seriya</div>
              </div>
            </Card>
          </div>

          {/* Settings Section - Only show when not running */}
          {!isRunning && !isFinished && (
            <>
              {/* Formula Type Selection */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-muted">
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="font-medium">Misol turi</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {Object.entries(FORMULA_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setFormulaType(key as FormulaType)}
                      className={cn(
                        "p-3 rounded-xl text-left transition-all",
                        formulaType === key
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <span className="text-lg">{config.icon}</span>
                      <div className="text-xs font-medium mt-1 line-clamp-1">{config.label}</div>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Digit Count Selection */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                    123
                  </div>
                  <span className="font-medium">Son xonasi</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {DIGIT_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setDigitCount(option.value)}
                      className={cn(
                        "p-3 rounded-xl text-left transition-all",
                        digitCount === option.value
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <div className="text-sm font-medium">{option.label}</div>
                      <div className="text-xs opacity-70">{option.range}</div>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Speed & Count Settings */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-muted">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="font-medium">Tezlik va misollar soni</span>
                </div>
                
                {/* Speed Selection */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Tezligi (soniyada)</span>
                    <div className="px-3 py-1 rounded-lg border text-sm font-medium">{customSpeed} s</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SPEED_OPTIONS.map(speed => (
                      <button
                        key={speed}
                        onClick={() => setCustomSpeed(speed)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                          customSpeed === speed
                            ? "bg-foreground text-background"
                            : "bg-muted/50 hover:bg-muted"
                        )}
                      >
                        {speed}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Count Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Misollar soni</span>
                    <div className="px-3 py-1 rounded-lg border text-sm font-medium">{customCount} ta</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {COUNT_OPTIONS.map(count => (
                      <button
                        key={count}
                        onClick={() => setCustomCount(count)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                          customCount === count
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted/50 hover:bg-muted"
                        )}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Start Button */}
              <Button 
                onClick={startGame} 
                size="lg" 
                className="w-full h-14 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Play className="h-5 w-5 mr-2" />
                Mashqni boshlash
              </Button>
            </>
          )}

          {/* Game Running State */}
          {isRunning && (
            <Card className="p-8 text-center">
              <div className="text-7xl sm:text-9xl font-bold mb-4 animate-pulse">
                {currentNumber !== null && (
                  <span className={currentNumber >= 0 ? 'text-primary' : 'text-destructive'}>
                    {currentNumber >= 0 ? `+${currentNumber}` : currentNumber}
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {countRef.current} / {customCount}
              </div>
              <Progress value={(countRef.current / customCount) * 100} className="mt-4" />
            </Card>
          )}

          {/* Game Finished - Answer Input */}
          {isFinished && !showResult && (
            <Card className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-4">Javobingizni kiriting</h3>
              <div className="flex flex-col items-center gap-4">
                <Input
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Javob..."
                  className="text-center text-2xl h-14 max-w-[200px]"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button onClick={checkAnswer} size="lg" disabled={!userAnswer}>
                    <Check className="h-5 w-5 mr-2" />
                    Tekshirish
                  </Button>
                  <Button onClick={resetGame} variant="outline" size="lg">
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Result Display */}
          {showResult && (
            <Card className={cn(
              "p-6 text-center border-2",
              feedback === 'correct' ? "border-green-500 bg-green-500/10" : "border-destructive bg-destructive/10"
            )}>
              <div className={cn(
                "text-3xl font-bold mb-2",
                feedback === 'correct' ? "text-green-500" : "text-destructive"
              )}>
                {feedback === 'correct' ? "To'g'ri! 🎉" : "Noto'g'ri 😔"}
              </div>
              <div className="text-muted-foreground mb-4">
                To'g'ri javob: <span className="font-bold text-foreground">{runningResultRef.current}</span>
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                Sonlar ketma-ketligi: {displayedNumbers.map((n, i) => (
                  <span key={i} className={i === 0 ? '' : n >= 0 ? 'text-primary' : 'text-destructive'}>
                    {i === 0 ? n : (n >= 0 ? ` +${n}` : ` ${n}`)}
                  </span>
                ))}
              </div>
              <Button onClick={resetGame} size="lg" className="w-full max-w-xs">
                <RotateCcw className="h-5 w-5 mr-2" />
                Qayta boshlash
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* O'quv Tab - Flashcard */}
        <TabsContent value="oquv" className="mt-4">
          <AbacusFlashCard onComplete={() => setRefreshHistory(prev => prev + 1)} />
        </TabsContent>

        {/* Kunlik Tab - Ghost Battle */}
        <TabsContent value="kunlik" className="mt-4 space-y-4">
          <GhostBattle />
          <GhostBattleStats />
          <GhostBattleRanking />
        </TabsContent>

        {/* Multiplayer Tab */}
        <TabsContent value="multiplayer" className="mt-4 space-y-4">
          <AIGhostBattle />
          <MultiplayerCompetition />
        </TabsContent>

        {/* Reyting Tab */}
        <TabsContent value="reyting" className="mt-4">
          <MentalArithmeticLeaderboard />
        </TabsContent>

        {/* Statistika Tab */}
        <TabsContent value="statistika" className="mt-4">
          <MentalArithmeticHistory refreshTrigger={refreshHistory} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MentalArithmeticPractice;
