import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AbacusDisplay } from './AbacusDisplay';
import { MentalArithmeticHistory } from './MentalArithmeticHistory';
import { MentalArithmeticLeaderboard } from './MentalArithmeticLeaderboard';
import { AbacusFlashCard } from './AbacusFlashCard';
import { AbacusTutorial } from './AbacusTutorial';
import { MultiplayerCompetition } from './MultiplayerCompetition';
import { Play, RotateCcw, Check, Settings2, Zap, BarChart3, Trophy, Lightbulb, GraduationCap, Swords, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSound } from '@/hooks/useSound';
import { toast } from 'sonner';

// Formulasiz qoidalar: har bir natija uchun qo'shish/ayirish mumkin bo'lgan sonlar
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

// Kichik do'st +2/-2 formulasi
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

// Kichik do'st +1/-1 formulasi
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

// Katta do'st +3/-3 formulasi
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

// Katta do'st +4/-4 formulasi
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

// Aralash formula - barcha formulalarni birlashtiradi
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

const FORMULA_CONFIG = {
  basic: { 
    label: "Formulasiz", 
    rules: RULES_BASIC,
    example: "Natija 4 → +5, -1, -2, -3, -4 | Natija 6 → +1, +2, +3, -1, -5, -6",
    description: "Abakusda formulasiz asosiy qo'shish va ayirish amallari"
  },
  small_friend_1: { 
    label: "Kichik do'st +1/-1", 
    rules: RULES_SMALL_FRIEND_1,
    example: "Natija 4 → +1 (5-4=1) | Natija 5 → -1 (4+1=5)",
    description: "4+1=5 yoki 5-1=4 formulasi orqali amal bajariladi"
  },
  small_friend_2: { 
    label: "Kichik do'st +2/-2", 
    rules: RULES_SMALL_FRIEND_2,
    example: "Natija 3 → +2 (5-3=2) | Natija 6 → -2 (5+1=6)",
    description: "3+2=5 yoki 6-2=4 formulasi orqali amal bajariladi"
  },
  big_friend_3: { 
    label: "Katta do'st +3/-3", 
    rules: RULES_BIG_FRIEND_3,
    example: "Natija 2 → +3 (5-2=3) | Natija 7 → -3 (5+2=7)",
    description: "2+3=5 yoki 7-3=4 formulasi orqali amal bajariladi"
  },
  big_friend_4: { 
    label: "Katta do'st +4/-4", 
    rules: RULES_BIG_FRIEND_4,
    example: "Natija 1 → +4 (5-1=4) | Natija 8 → -4 (5+3=8)",
    description: "1+4=5 yoki 8-4=4 formulasi orqali amal bajariladi"
  },
  mixed: { 
    label: "Aralash (barcha formulalar)", 
    rules: RULES_MIXED,
    example: "Barcha formulalar aralashtirilgan holda",
    description: "Formulasiz + Kichik do'st + Katta do'st formulalari birgalikda"
  },
};

// Qiyinlik darajalari
const DIFFICULTY_CONFIG = {
  easy: { label: "Oson", count: 3, speed: 1500 },
  medium: { label: "O'rta", count: 5, speed: 1000 },
  hard: { label: "Qiyin", count: 10, speed: 700 },
};

type DifficultyLevel = keyof typeof DIFFICULTY_CONFIG;

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
  
  // Sozlamalar
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [formulaType, setFormulaType] = useState<FormulaType>('basic');
  const [customSpeed, setCustomSpeed] = useState(500); // ms - default 0.5 sekund
  const [customCount, setCustomCount] = useState(5); // sonlar soni
  const [showAbacus, setShowAbacus] = useState(true);
  const [showSettings, setShowSettings] = useState(true);
  const [abacusColumns, setAbacusColumns] = useState(1);
  const [continuousMode, setContinuousMode] = useState(false); // To'xtovsiz mashq rejimi
  const [currentProgress, setCurrentProgress] = useState(0);
  
  // O'yin holati
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [displayedNumbers, setDisplayedNumbers] = useState<number[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [refreshHistory, setRefreshHistory] = useState(0);
  
  // Statistika
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

  // Statistikani yuklash
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

  // Boncuk harakati ovozi
  const handleBeadMove = useCallback(() => {
    playSound('bead');
  }, [playSound]);

  // Keyingi sonni generatsiya qilish
  const generateNextNumber = useCallback(() => {
    const currentResult = runningResultRef.current;
    const selectedRules = FORMULA_CONFIG[formulaType].rules;
    const rules = selectedRules[currentResult];
    
    if (!rules) return null;

    const possibleOperations: { number: number; isAdd: boolean }[] = [];
    
    rules.add.forEach(num => {
      possibleOperations.push({ number: num, isAdd: true });
    });
    
    rules.subtract.forEach(num => {
      possibleOperations.push({ number: num, isAdd: false });
    });

    if (possibleOperations.length === 0) return null;

    const randomOp = possibleOperations[Math.floor(Math.random() * possibleOperations.length)];
    
    if (randomOp.isAdd) {
      runningResultRef.current += randomOp.number;
    } else {
      runningResultRef.current -= randomOp.number;
    }

    // Faqat sonni qaytarish (amal ko'rsatilmaydi)
    return randomOp.number;
  }, [formulaType]);

  // O'yinni boshlash
  const startGame = useCallback(() => {
    const initialResult = Math.floor(Math.random() * 10);
    runningResultRef.current = initialResult;
    countRef.current = 1;
    startTimeRef.current = Date.now();
    
    playSound('start');
    
    setCurrentNumber(initialResult);
    setDisplayedNumbers([initialResult]);
    setIsRunning(true);
    setIsFinished(false);
    setShowSettings(false);
    setUserAnswer('');
    setFeedback(null);
    setShowResult(false);
    setCurrentProgress((1 / customCount) * 100);

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
        setCurrentProgress(100);
        
        // To'xtovsiz rejimda avtomatik keyingi mashqqa o'tish
        if (continuousMode) {
          // 1.5 sekunddan keyin yangi mashq boshlash
          setTimeout(() => {
            const newInitialResult = Math.floor(Math.random() * 10);
            runningResultRef.current = newInitialResult;
            countRef.current = 1;
            startTimeRef.current = Date.now();
            
            setCurrentNumber(newInitialResult);
            setDisplayedNumbers([newInitialResult]);
            setIsRunning(true);
            setCurrentProgress((1 / customCount) * 100);

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
                setCurrentProgress(100);
                
                // Rekursiv davom ettirish
                if (continuousMode) {
                  setTimeout(() => startGame(), 1500);
                } else {
                  setIsFinished(true);
                }
                return;
              }

              const nextNum = generateNextNumber();
              if (nextNum !== null) {
                setCurrentNumber(nextNum);
                setDisplayedNumbers(prev => [...prev, nextNum]);
                setCurrentProgress((countRef.current / customCount) * 100);
              }
            }, customSpeed);
          }, 1500);
        } else {
          setIsFinished(true);
        }
        return;
      }

      const nextNum = generateNextNumber();
      if (nextNum !== null) {
        setCurrentNumber(nextNum);
        setDisplayedNumbers(prev => [...prev, nextNum]);
        setCurrentProgress((countRef.current / customCount) * 100);
      }
    }, customSpeed);
  }, [customCount, customSpeed, generateNextNumber, playSound, continuousMode]);

  // Javobni tekshirish va saqlash
  const checkAnswer = useCallback(async () => {
    const userNum = parseInt(userAnswer, 10);
    const correctAnswer = runningResultRef.current;
    const isCorrect = userNum === correctAnswer;
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setShowResult(true);
    
    playSound(isCorrect ? 'correct' : 'incorrect');
    
    const newStreak = isCorrect ? currentStreak + 1 : 0;
    setCurrentStreak(newStreak);
    
    // Statistikani yangilash
    setStats(prev => ({
      ...prev,
      totalProblems: prev.totalProblems + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      incorrectAnswers: prev.incorrectAnswers + (isCorrect ? 0 : 1),
      bestStreak: Math.max(prev.bestStreak, newStreak),
    }));
    
    // Supabase'ga saqlash
    if (user) {
      try {
        await supabase.from('game_sessions').insert({
          user_id: user.id,
          section: 'mental-arithmetic',
          difficulty: difficulty,
          mode: 'practice',
          correct: isCorrect ? 1 : 0,
          incorrect: isCorrect ? 0 : 1,
          best_streak: newStreak,
          score: isCorrect ? 10 : 0,
          total_time: timeTaken,
          problems_solved: 1,
        });
        
        // Profilni yangilash
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_score, total_problems_solved, best_streak')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          await supabase
            .from('profiles')
            .update({
              total_score: (profile.total_score || 0) + (isCorrect ? 10 : 0),
              total_problems_solved: (profile.total_problems_solved || 0) + 1,
              best_streak: Math.max(profile.best_streak || 0, newStreak),
              last_active_date: new Date().toISOString().split('T')[0],
            })
            .eq('user_id', user.id);
        }
        
        // Tarixni yangilash
        setRefreshHistory(prev => prev + 1);
      } catch (error) {
        console.error('Error saving session:', error);
      }
    }
    
    if (isCorrect) {
      toast.success("To'g'ri javob! 🎉", { duration: 2000 });
    }
  }, [userAnswer, user, difficulty, currentStreak, playSound]);

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
    setShowSettings(true);
    runningResultRef.current = 0;
    countRef.current = 0;
  }, []);

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

  const config = DIFFICULTY_CONFIG[difficulty];
  const accuracy = stats.totalProblems > 0 
    ? Math.round((stats.correctAnswers / stats.totalProblems) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Statistika */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="text-sm text-muted-foreground">Jami</div>
          <div className="text-2xl font-bold text-primary">{stats.totalProblems}</div>
        </Card>
        <Card className="p-3">
          <div className="text-sm text-muted-foreground">To'g'ri</div>
          <div className="text-2xl font-bold text-green-500">{stats.correctAnswers}</div>
        </Card>
        <Card className="p-3">
          <div className="text-sm text-muted-foreground">Aniqlik</div>
          <div className="text-2xl font-bold text-blue-500">{accuracy}%</div>
        </Card>
        <Card className="p-3">
          <div className="text-sm text-muted-foreground">Eng uzun seriya</div>
          <div className="text-2xl font-bold text-amber-500">{stats.bestStreak}</div>
        </Card>
      </div>

      <Tabs defaultValue="practice" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="practice" className="gap-1.5 text-xs sm:text-sm">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Mashq</span>
          </TabsTrigger>
          <TabsTrigger value="tutorial" className="gap-1.5 text-xs sm:text-sm">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Tutorial</span>
          </TabsTrigger>
          <TabsTrigger value="flashcard" className="gap-1.5 text-xs sm:text-sm">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Flash Card</span>
          </TabsTrigger>
          <TabsTrigger value="multiplayer" className="gap-1.5 text-xs sm:text-sm">
            <Swords className="h-4 w-4" />
            <span className="hidden sm:inline">Musobaqa</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-1.5 text-xs sm:text-sm">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Reyting</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Tarix</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="practice" className="mt-4">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Mental Arifmetika Mashqi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Sozlamalar */}
              {showSettings && !isRunning && !isFinished && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Settings2 className="h-4 w-4" />
                    Sozlamalar
                  </div>
                  
                  {/* Formula namunasi */}
                  <Card className="bg-muted/50 border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{FORMULA_CONFIG[formulaType].label}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {FORMULA_CONFIG[formulaType].description}
                          </p>
                          <p className="text-xs text-primary mt-2 font-mono bg-background/50 px-2 py-1 rounded">
                            {FORMULA_CONFIG[formulaType].example}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Formula turi</Label>
                      <Select value={formulaType} onValueChange={(v) => setFormulaType(v as FormulaType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Formulasiz</SelectItem>
                          <SelectItem value="small_friend_1">Kichik do'st +1/-1</SelectItem>
                          <SelectItem value="small_friend_2">Kichik do'st +2/-2</SelectItem>
                          <SelectItem value="big_friend_3">Katta do'st +3/-3</SelectItem>
                          <SelectItem value="big_friend_4">Katta do'st +4/-4</SelectItem>
                          <SelectItem value="mixed">Aralash (barcha)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Sonlar soni</Label>
                      <Select value={String(customCount)} onValueChange={(v) => setCustomCount(Number(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 ta son</SelectItem>
                          <SelectItem value="5">5 ta son</SelectItem>
                          <SelectItem value="7">7 ta son</SelectItem>
                          <SelectItem value="10">10 ta son</SelectItem>
                          <SelectItem value="15">15 ta son</SelectItem>
                          <SelectItem value="20">20 ta son</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tezlik (ms)</Label>
                      <Select value={String(customSpeed)} onValueChange={(v) => setCustomSpeed(Number(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="300">300ms (juda tez)</SelectItem>
                          <SelectItem value="500">500ms (tez)</SelectItem>
                          <SelectItem value="700">700ms</SelectItem>
                          <SelectItem value="1000">1000ms (normal)</SelectItem>
                          <SelectItem value="1500">1500ms (sekin)</SelectItem>
                          <SelectItem value="2000">2000ms (juda sekin)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>To'xtovsiz rejim</Label>
                      <Select value={continuousMode ? 'yes' : 'no'} onValueChange={(v) => setContinuousMode(v === 'yes')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">O'chirilgan</SelectItem>
                          <SelectItem value="yes">Yoqilgan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Abacus ko'rsatish</Label>
                      <Select value={showAbacus ? 'yes' : 'no'} onValueChange={(v) => setShowAbacus(v === 'yes')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Ha</SelectItem>
                          <SelectItem value="no">Yo'q</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Abacus ustunlari</Label>
                      <Select value={String(abacusColumns)} onValueChange={(v) => setAbacusColumns(Number(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 (Birliklar)</SelectItem>
                          <SelectItem value="2">2 (O'nliklar)</SelectItem>
                          <SelectItem value="3">3 (Yuzliklar)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* O'yin maydoni */}
              <div className="flex flex-col items-center justify-center min-h-[350px]">
                {!isRunning && !isFinished && (
                  <Button onClick={startGame} size="lg" className="gap-2">
                    <Play className="h-5 w-5" />
                    Boshlash
                  </Button>
                )}

                {isRunning && currentNumber !== null && (
                  <div className="text-center w-full max-w-md">
                    {/* Progress bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>Son: {countRef.current} / {customCount}</span>
                        <span>{continuousMode ? "To'xtovsiz rejim" : `${customSpeed}ms`}</span>
                      </div>
                      <Progress value={currentProgress} className="h-2" />
                    </div>
                    
                    {showAbacus ? (
                      <AbacusDisplay 
                        number={currentNumber} 
                        size="lg" 
                        columns={abacusColumns}
                        onBeadMove={handleBeadMove}
                      />
                    ) : (
                      <div className="text-8xl font-bold text-primary animate-fade-in" key={displayedNumbers.length}>
                        {currentNumber}
                      </div>
                    )}
                    
                    {/* To'xtovsiz rejimda to'xtatish tugmasi */}
                    {continuousMode && (
                      <Button 
                        onClick={resetGame} 
                        variant="destructive" 
                        size="sm" 
                        className="mt-6 gap-2"
                      >
                        <Square className="h-4 w-4" />
                        To'xtatish
                      </Button>
                    )}
                  </div>
                )}

                {isFinished && !showResult && (
                  <div className="space-y-6 text-center w-full max-w-xs">
                    <p className="text-lg text-muted-foreground">Natijani kiriting:</p>
                    <Input
                      type="number"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Javob"
                      className="text-center text-2xl h-16"
                      autoFocus
                    />
                    <Button onClick={checkAnswer} disabled={!userAnswer} className="gap-2 w-full">
                      <Check className="h-4 w-4" />
                      Tekshirish
                    </Button>
                  </div>
                )}

                {showResult && (
                  <div className="space-y-4 text-center">
                    {showAbacus ? (
                      <AbacusDisplay 
                        number={runningResultRef.current} 
                        size="md" 
                        columns={abacusColumns}
                      />
                    ) : (
                      <div className={`text-6xl font-bold ${feedback === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                        {feedback === 'correct' ? '✓' : '✗'}
                      </div>
                    )}
                    <p className="text-lg">
                      {feedback === 'correct' 
                        ? "To'g'ri!" 
                        : `Noto'g'ri. To'g'ri javob: ${runningResultRef.current}`
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sonlar: {displayedNumbers.join(' → ')}
                    </p>
                    <Button onClick={resetGame} variant="outline" className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Qayta boshlash
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tutorial" className="mt-4">
          <AbacusTutorial />
        </TabsContent>

        <TabsContent value="flashcard" className="mt-4">
          <AbacusFlashCard onComplete={() => setRefreshHistory(prev => prev + 1)} />
        </TabsContent>

        <TabsContent value="multiplayer" className="mt-4">
          <MultiplayerCompetition />
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <MentalArithmeticLeaderboard />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <MentalArithmeticHistory refreshTrigger={refreshHistory} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MentalArithmeticPractice;
