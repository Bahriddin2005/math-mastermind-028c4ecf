import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Square, Volume2, VolumeX, RotateCcw, Check, Clock, BarChart3, Trophy, Target, Play, Home, Moon, Sun, User, LogOut, Settings, ShieldCheck, GraduationCap, Users, Flame } from 'lucide-react';
import { MultiplayerMode } from './MultiplayerMode';
import { DailyChallenge } from './DailyChallenge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { Leaderboard } from './Leaderboard';
import { useConfetti } from '@/hooks/useConfetti';
import { useSound } from '@/hooks/useSound';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Formulasiz qoidalar
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

// Formula 5 (kichik do'stlar)
const RULES_FORMULA_5: Record<number, { add: number[]; subtract: number[] }> = {
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

// Formula 10+ (katta do'stlar qo'shish)
const RULES_FORMULA_10_PLUS: Record<number, { add: number[]; subtract: number[] }> = {
  0: { add: [], subtract: [] },
  1: { add: [9], subtract: [] },
  2: { add: [8, 9], subtract: [] },
  3: { add: [7, 8, 9], subtract: [] },
  4: { add: [6, 7, 8, 9], subtract: [] },
  5: { add: [5, 6, 7, 8, 9], subtract: [] },
  6: { add: [4, 5, 6, 7, 8, 9], subtract: [] },
  7: { add: [3, 4, 5, 6, 7, 8, 9], subtract: [] },
  8: { add: [2, 3, 4, 5, 6, 7, 8, 9], subtract: [] },
  9: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [] },
};

// Formula 10- (katta do'stlar ayirish)
const RULES_FORMULA_10_MINUS: Record<number, { add: number[]; subtract: number[] }> = {
  0: { add: [], subtract: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  1: { add: [], subtract: [2, 3, 4, 5, 6, 7, 8, 9] },
  2: { add: [], subtract: [3, 4, 5, 6, 7, 8, 9] },
  3: { add: [], subtract: [4, 5, 6, 7, 8, 9] },
  4: { add: [], subtract: [5, 6, 7, 8, 9] },
  5: { add: [], subtract: [6, 7, 8, 9] },
  6: { add: [], subtract: [7, 8, 9] },
  7: { add: [], subtract: [8, 9] },
  8: { add: [], subtract: [9] },
  9: { add: [], subtract: [] },
};

// Hammasi (aralash)
const RULES_ALL: Record<number, { add: number[]; subtract: number[] }> = {
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
};

type FormulaType = 'oddiy' | 'formula5' | 'formula10plus' | 'formula10minus' | 'hammasi';

const FORMULA_RULES: Record<FormulaType, Record<number, { add: number[]; subtract: number[] }>> = {
  oddiy: RULES_BASIC,
  formula5: RULES_FORMULA_5,
  formula10plus: RULES_FORMULA_10_PLUS,
  formula10minus: RULES_FORMULA_10_MINUS,
  hammasi: RULES_ALL,
};

// Ovozli o'qish funksiyasi
const speakNumber = (number: string, isAddition: boolean, isFirst: boolean) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    
    let text = number;
    if (!isFirst) {
      text = isAddition ? `qo'sh ${number}` : `ayir ${number}`;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'uz-UZ';
    utterance.rate = 1.2;
    utterance.pitch = 1;
    
    const voices = window.speechSynthesis.getVoices();
    const uzVoice = voices.find(v => v.lang.startsWith('uz'));
    const ruVoice = voices.find(v => v.lang.startsWith('ru'));
    
    if (uzVoice) {
      utterance.voice = uzVoice;
    } else if (ruVoice) {
      utterance.voice = ruVoice;
      if (!isFirst) {
        utterance.text = isAddition ? `плюс ${number}` : `минус ${number}`;
      } else {
        utterance.text = number;
      }
    }
    
    window.speechSynthesis.speak(utterance);
  }
};

interface Stats {
  totalProblems: number;
  correctAnswers: number;
  averageTime: number;
  bestStreak: number;
}

interface DailyData {
  name: string;
  total: number;
  correct: number;
}

export const NumberTrainer = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('train');
  
  // Sozlamalar - localStorage dan yuklash
  const [formulaType, setFormulaType] = useState<FormulaType>(() => {
    const saved = localStorage.getItem('numberTrainer_formulaType');
    return (saved as FormulaType) || 'oddiy';
  });
  const [digitCount, setDigitCount] = useState(() => {
    const saved = localStorage.getItem('numberTrainer_digitCount');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [speed, setSpeed] = useState(() => {
    const saved = localStorage.getItem('numberTrainer_speed');
    return saved ? parseFloat(saved) : 0.5;
  });
  const [problemCount, setProblemCount] = useState(() => {
    const saved = localStorage.getItem('numberTrainer_problemCount');
    return saved ? parseInt(saved, 10) : 5;
  });
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    const saved = localStorage.getItem('numberTrainer_voiceEnabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [showStats, setShowStats] = useState(false);

  // Default sozlamalar
  const DEFAULT_SETTINGS = {
    formulaType: 'oddiy' as FormulaType,
    digitCount: 1,
    speed: 0.5,
    problemCount: 5,
    voiceEnabled: true,
  };

  // Sozlamalarni default holatga qaytarish
  const resetToDefaults = () => {
    setFormulaType(DEFAULT_SETTINGS.formulaType);
    setDigitCount(DEFAULT_SETTINGS.digitCount);
    setSpeed(DEFAULT_SETTINGS.speed);
    setProblemCount(DEFAULT_SETTINGS.problemCount);
    setVoiceEnabled(DEFAULT_SETTINGS.voiceEnabled);
    localStorage.removeItem('numberTrainer_formulaType');
    localStorage.removeItem('numberTrainer_digitCount');
    localStorage.removeItem('numberTrainer_speed');
    localStorage.removeItem('numberTrainer_problemCount');
    localStorage.removeItem('numberTrainer_voiceEnabled');
  };

  // Sozlamalarni localStorage ga saqlash
  useEffect(() => {
    localStorage.setItem('numberTrainer_formulaType', formulaType);
  }, [formulaType]);

  useEffect(() => {
    localStorage.setItem('numberTrainer_digitCount', String(digitCount));
  }, [digitCount]);

  useEffect(() => {
    localStorage.setItem('numberTrainer_speed', String(speed));
  }, [speed]);

  useEffect(() => {
    localStorage.setItem('numberTrainer_problemCount', String(problemCount));
  }, [problemCount]);

  useEffect(() => {
    localStorage.setItem('numberTrainer_voiceEnabled', String(voiceEnabled));
  }, [voiceEnabled]);

  // O'yin holati
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentDisplay, setCurrentDisplay] = useState<string | null>(null);
  const [isAddition, setIsAddition] = useState(true);
  const [displayedNumbers, setDisplayedNumbers] = useState<{ num: string; isAdd: boolean }[]>([]);
  
  // Natija
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  // Taymer
  const [elapsedTime, setElapsedTime] = useState(0);
  const [answerTime, setAnswerTime] = useState(0);
  
  // Statistika
  const [stats, setStats] = useState<Stats>({
    totalProblems: 0,
    correctAnswers: 0,
    averageTime: 0,
    bestStreak: 0,
  });
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);

  const runningResultRef = useRef(0);
  const countRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const answerStartTimeRef = useRef<number>(0);

  // Mount va admin tekshirish
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Statistikani yuklash
  useEffect(() => {
    if (!user) return;
    
    const loadStats = async () => {
      const { data } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('section', 'number-trainer')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (data && data.length > 0) {
        const totalProblems = data.length;
        const correctAnswers = data.filter(s => (s.correct || 0) > 0).length;
        const totalTime = data.reduce((sum, s) => sum + (s.total_time || 0), 0);
        const bestStreak = Math.max(...data.map(s => s.best_streak || 0));
        
        setStats({
          totalProblems,
          correctAnswers,
          averageTime: totalProblems > 0 ? totalTime / totalProblems : 0,
          bestStreak,
        });

        // Haftalik ma'lumotlar
        const days = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
        const today = new Date();
        const weekData: DailyData[] = [];

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const daySessions = data.filter(s => 
            s.created_at.startsWith(dateStr)
          );
          
          weekData.push({
            name: days[date.getDay()],
            total: daySessions.length,
            correct: daySessions.filter(s => (s.correct || 0) > 0).length,
          });
        }
        
        setDailyData(weekData);
      }
    };
    
    loadStats();
  }, [user, showResult]);

  const { playSound, soundEnabled, toggleSound } = useSound();

  // Sonni generatsiya qilish
  const generateNextNumber = useCallback(() => {
    const currentResult = runningResultRef.current;
    const lastDigit = Math.abs(currentResult) % 10;
    const rules = FORMULA_RULES[formulaType][lastDigit];

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

    let finalNumber = randomOp.number;
    if (digitCount > 1) {
      const multiplier = Math.pow(10, Math.floor(Math.random() * digitCount));
      finalNumber = randomOp.number * Math.min(multiplier, Math.pow(10, digitCount - 1));
    }

    if (randomOp.isAdd) {
      runningResultRef.current += finalNumber;
    } else {
      runningResultRef.current -= finalNumber;
    }

    setIsAddition(randomOp.isAdd);
    return { num: finalNumber, isAdd: randomOp.isAdd };
  }, [formulaType, digitCount]);

  // O'yinni boshlash
  const startGame = useCallback(() => {
    const maxInitial = Math.pow(10, digitCount) - 1;
    const minInitial = digitCount === 1 ? 1 : Math.pow(10, digitCount - 1);
    const initialResult = Math.floor(Math.random() * (maxInitial - minInitial + 1)) + minInitial;
    
    runningResultRef.current = initialResult;
    countRef.current = 1;
    startTimeRef.current = Date.now();

    setCurrentDisplay(String(initialResult));
    setDisplayedNumbers([{ num: String(initialResult), isAdd: true }]);
    setIsRunning(true);
    setIsFinished(false);
    setIsAddition(true);
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(null);
    setElapsedTime(0);
    setAnswerTime(0);

    // Start sound
    playSound('start');

    // Taymer
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 100) / 10);
    }, 100);

    if (voiceEnabled) {
      speakNumber(String(initialResult), true, true);
    }

    const speedMs = speed * 1000;

    intervalRef.current = setInterval(() => {
      countRef.current += 1;

      if (countRef.current > problemCount) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        answerStartTimeRef.current = Date.now();
        setIsRunning(false);
        setIsFinished(true);
        setCurrentDisplay(null);
        // Complete sound when game ends
        playSound('complete');
        return;
      }

      const result = generateNextNumber();
      if (result !== null) {
        setCurrentDisplay(String(result.num));
        setDisplayedNumbers(prev => [...prev, { num: String(result.num), isAdd: result.isAdd }]);
        
        // Tick sound for each number
        playSound('tick');
        
        if (voiceEnabled) {
          speakNumber(String(result.num), result.isAdd, false);
        }
      }
    }, speedMs);
  }, [digitCount, speed, problemCount, generateNextNumber, voiceEnabled, playSound]);

  // To'xtatish
  const stopGame = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsRunning(false);
    setIsFinished(false);
    setCurrentDisplay(null);
    setDisplayedNumbers([]);
  }, []);

  const { triggerLevelUpConfetti } = useConfetti();

  // Javobni tekshirish va saqlash
  const checkAnswer = useCallback(async () => {
    const userNum = parseInt(userAnswer, 10);
    const correctAnswer = runningResultRef.current;
    const correct = userNum === correctAnswer;
    const totalTime = (Date.now() - startTimeRef.current) / 1000;
    const answerDuration = (Date.now() - answerStartTimeRef.current) / 1000;
    
    setIsCorrect(correct);
    setShowResult(true);
    setAnswerTime(answerDuration);
    
    // Play sound and trigger confetti
    if (correct) {
      playSound('correct');
      triggerLevelUpConfetti();
    } else {
      playSound('incorrect');
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const newStreak = correct ? currentStreak + 1 : 0;
    setCurrentStreak(newStreak);

    // Bazaga saqlash
    if (user) {
      try {
        await supabase.from('game_sessions').insert({
          user_id: user.id,
          section: 'number-trainer',
          difficulty: formulaType,
          mode: `${digitCount}-xonali`,
          correct: correct ? 1 : 0,
          incorrect: correct ? 0 : 1,
          best_streak: newStreak,
          score: correct ? 10 : 0,
          total_time: totalTime,
          problems_solved: problemCount,
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
              total_score: (profile.total_score || 0) + (correct ? 10 : 0),
              total_problems_solved: (profile.total_problems_solved || 0) + 1,
              best_streak: Math.max(profile.best_streak || 0, newStreak),
              last_active_date: new Date().toISOString().split('T')[0],
            })
            .eq('user_id', user.id);
        }
      } catch (error) {
        console.error('Error saving session:', error);
      }
    }
  }, [userAnswer, user, formulaType, digitCount, problemCount, currentStreak]);

  // Qayta boshlash
  const resetGame = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsFinished(false);
    setCurrentDisplay(null);
    setDisplayedNumbers([]);
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(null);
    setElapsedTime(0);
    setAnswerTime(0);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  const accuracy = stats.totalProblems > 0 
    ? Math.round((stats.correctAnswers / stats.totalProblems) * 100) 
    : 0;


  // O'yin davomida - toza oq fon, markazda katta son
  if (isRunning && currentDisplay !== null) {
    const displayNumber = countRef.current === 1 
      ? currentDisplay 
      : (isAddition ? currentDisplay : `-${currentDisplay}`);
    
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div 
          key={countRef.current}
          className="animate-fade-in"
        >
          <span 
            className="text-[180px] sm:text-[220px] md:text-[280px] lg:text-[350px] font-light text-foreground tracking-tight"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {displayNumber}
          </span>
        </div>
      </div>
    );
  }

  // Natija sahifasi
  if (isFinished) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center z-50 p-6 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-lg w-full space-y-6 animate-fade-in">
          {/* Header card */}
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl border border-border/50 shadow-lg p-6 text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Umumiy vaqt</p>
                <p className="text-2xl font-bold font-mono text-accent">{elapsedTime.toFixed(1)}s</p>
              </div>
            </div>
            
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">Mashq tugadi!</h2>
            <p className="text-muted-foreground text-sm">Javobingizni kiriting</p>
          </div>
          
          {!showResult ? (
            <div className="space-y-4 animate-fade-in">
              <div className="relative">
                <Input
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && userAnswer && checkAnswer()}
                  placeholder="Javobni kiriting..."
                  className="text-center text-3xl h-20 rounded-2xl bg-card/80 backdrop-blur-sm border-2 border-primary/20 focus:border-primary shadow-lg font-mono"
                  autoFocus
                />
              </div>
              <Button
                onClick={checkAnswer}
                disabled={!userAnswer}
                size="lg"
                className="w-full gap-3 h-14 rounded-2xl bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-primary-foreground font-bold text-lg shadow-glow transition-all duration-300 hover:-translate-y-0.5"
              >
                <Check className="h-6 w-6" />
                Tekshirish
              </Button>
            </div>
          ) : (
            <div className={`space-y-6 ${isCorrect ? 'animate-scale-in' : 'animate-shake'}`}>
              {/* Result card */}
              <div className={`p-8 rounded-3xl text-center ${
                isCorrect 
                  ? 'bg-gradient-to-br from-success/10 to-success/5 border-2 border-success/30' 
                  : 'bg-gradient-to-br from-destructive/10 to-destructive/5 border-2 border-destructive/30'
              }`}>
                <div className={`text-8xl mb-4 ${isCorrect ? 'animate-celebrate' : ''}`}>
                  {isCorrect ? '🎉' : '😔'}
                </div>
                <p className={`text-2xl font-bold ${isCorrect ? 'text-success' : 'text-destructive'}`}>
                  {isCorrect ? "Zo'r! To'g'ri javob!" : "Noto'g'ri javob"}
                </p>
              </div>

              {/* Answer details */}
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">To'g'ri javob:</span>
                  <span className="text-2xl font-bold text-foreground font-mono">{runningResultRef.current}</span>
                </div>
                {!isCorrect && (
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">Sizning javobingiz:</span>
                    <span className="text-xl font-bold text-destructive font-mono">{userAnswer}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-muted-foreground">Javob vaqti:</span>
                  <span className="text-lg font-bold text-accent font-mono">{answerTime.toFixed(1)}s</span>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-4 pt-2">
            <Button
              onClick={resetGame}
              variant="outline"
              size="lg"
              className="flex-1 gap-2 h-14 rounded-2xl bg-card/80 backdrop-blur-sm border-border/50 hover:bg-muted transition-all duration-300"
            >
              <RotateCcw className="h-5 w-5" />
              Orqaga
            </Button>
            <Button
              onClick={startGame}
              size="lg"
              className="flex-1 gap-2 h-14 rounded-2xl bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-primary-foreground font-bold shadow-glow transition-all duration-300 hover:-translate-y-0.5"
            >
              <Play className="h-5 w-5" />
              Yangi mashq
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Navbar komponenti
  const NavbarComponent = () => (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        <div onClick={() => navigate('/')} className="cursor-pointer">
          <Logo size="md" />
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          {/* Video darslar button */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/courses')}
            className="gap-2 hidden md:flex"
          >
            <GraduationCap className="h-4 w-4" />
            <span>Darslar</span>
          </Button>

          {/* Bosh sahifa */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Bosh sahifa</span>
          </Button>

          {/* Theme toggle */}
          {mounted && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? "Yorug' rejim" : "Qorong'u rejim"}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-warning" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          )}

          {/* Ovoz effektlari */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleSound}
            aria-label={soundEnabled ? "Ovoz effektlarini o'chirish" : "Ovoz effektlarini yoqish"}
            title={soundEnabled ? "Ovoz effektlari yoniq" : "Ovoz effektlari o'chiq"}
          >
            {soundEnabled ? (
              <Volume2 className="h-5 w-5 text-primary" />
            ) : (
              <VolumeX className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>

          {/* Nutq sintezi */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            aria-label={voiceEnabled ? "Nutqni o'chirish" : "Nutqni yoqish"}
            title={voiceEnabled ? "Nutq yoniq" : "Nutq o'chiq"}
          >
            {voiceEnabled ? (
              <span className="text-lg">🔊</span>
            ) : (
              <span className="text-lg opacity-50">🔇</span>
            )}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profil</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/')} className="gap-2">
                  <Home className="h-4 w-4" />
                  Bosh sahifa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/courses')} className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Video darslar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-2">
                  <Settings className="h-4 w-4" />
                  Sozlamalar
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-2 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    Admin panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive">
                  <LogOut className="h-4 w-4" />
                  Chiqish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => navigate('/auth')}>
              <User className="h-4 w-4 mr-2" />
              Kirish
            </Button>
          )}
        </div>
      </div>
    </header>
  );

  // Sozlamalar sahifasi
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary-light/20">
      <NavbarComponent />
      
      <div className="container py-8 px-4 md:px-8">
        {/* Hero Section */}
        <div className="relative text-center mb-10 py-8 animate-fade-in">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
          </div>
          
          {/* Floating icons */}
          <div className="absolute top-4 left-[15%] animate-bounce-soft opacity-60">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center rotate-12">
              <span className="text-xl">🧮</span>
            </div>
          </div>
          <div className="absolute top-8 right-[15%] animate-bounce-soft opacity-60" style={{ animationDelay: '0.5s' }}>
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center -rotate-12">
              <span className="text-xl">🧠</span>
            </div>
          </div>
          <div className="absolute bottom-2 left-[20%] animate-bounce-soft opacity-50 hidden md:block" style={{ animationDelay: '1s' }}>
            <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center rotate-6">
              <span className="text-lg">⚡</span>
            </div>
          </div>
          <div className="absolute bottom-4 right-[20%] animate-bounce-soft opacity-50 hidden md:block" style={{ animationDelay: '0.7s' }}>
            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center -rotate-6">
              <span className="text-lg">🎯</span>
            </div>
          </div>

          {/* Main content */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-sm text-primary font-medium mb-4">
              <Flame className="h-4 w-4" />
              Kundalik mashq qiling
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4">
              Mental Arifmetika{' '}
              <span className="relative">
                <span className="text-gradient-primary">Treneri</span>
                <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none">
                  <path d="M2 6C50 2 150 2 198 6" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" className="opacity-50"/>
                </svg>
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Aql hisoblash ko&apos;nikmalarini rivojlantiring va{' '}
              <span className="text-foreground font-medium">o&apos;z darajangizni</span> oshiring
            </p>

            {/* Stats badges */}
            {user && stats.totalProblems > 0 && (
              <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-card/80 backdrop-blur-sm rounded-full border border-border/50 shadow-sm">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{stats.totalProblems} mashq</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-card/80 backdrop-blur-sm rounded-full border border-border/50 shadow-sm">
                  <Trophy className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium">{accuracy}% aniqlik</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-card/80 backdrop-blur-sm rounded-full border border-border/50 shadow-sm">
                  <Flame className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">{stats.bestStreak} seriya</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5 mb-8 bg-card/80 backdrop-blur-sm border border-border/50 p-1.5 rounded-2xl shadow-md">
            <TabsTrigger value="train" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all duration-300">
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Mashq</span>
            </TabsTrigger>
            <TabsTrigger value="daily" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-xl transition-all duration-300">
              <Flame className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Kunlik</span>
            </TabsTrigger>
            <TabsTrigger value="multiplayer" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all duration-300">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Multiplayer</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2 data-[state=active]:bg-warning data-[state=active]:text-warning-foreground rounded-xl transition-all duration-300">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Reyting</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all duration-300">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Statistika</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-0 animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <DailyChallenge />
            </div>
          </TabsContent>

          <TabsContent value="multiplayer" className="mt-0 animate-fade-in">
            <MultiplayerMode onBack={() => setActiveTab('train')} />
          </TabsContent>

          <TabsContent value="train" className="mt-0 animate-fade-in">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Mini statistika */}
              {user && stats.totalProblems > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="group relative p-4 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-foreground">{stats.totalProblems}</p>
                        <p className="text-xs text-muted-foreground">Jami mashqlar</p>
                      </div>
                    </div>
                  </div>
                  <div className="group relative p-4 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                        <Check className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-success">{accuracy}%</p>
                        <p className="text-xs text-muted-foreground">Aniqlik</p>
                      </div>
                    </div>
                  </div>
                  <div className="group relative p-4 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-blue-500">{stats.averageTime.toFixed(1)}s</p>
                        <p className="text-xs text-muted-foreground">O'rtacha vaqt</p>
                      </div>
                    </div>
                  </div>
                  <div className="group relative p-4 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                        <Flame className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-warning">{stats.bestStreak}</p>
                        <p className="text-xs text-muted-foreground">Eng uzun seriya</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Misol turi */}
                <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-md overflow-hidden">
                  <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Square className="h-4 w-4 text-primary" />
                      </div>
                      Misol turi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <RadioGroup
                      value={formulaType}
                      onValueChange={(v) => setFormulaType(v as FormulaType)}
                      className="grid grid-cols-2 gap-2"
                    >
                      {[
                        { value: 'oddiy', label: 'Oddiy', icon: '📘' },
                        { value: 'formula5', label: 'Formula 5', icon: '🔢' },
                        { value: 'formula10plus', label: 'Formula 10+', icon: '➕' },
                        { value: 'formula10minus', label: 'Formula 10-', icon: '➖' },
                        { value: 'hammasi', label: 'Hammasi', icon: '🎯' },
                      ].map((item) => (
                        <div key={item.value} className="flex items-center">
                          <RadioGroupItem
                            value={item.value}
                            id={`formula-${item.value}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`formula-${item.value}`}
                            className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 border-2 
                              ${formulaType === item.value 
                                ? 'bg-primary text-primary-foreground border-primary shadow-glow' 
                                : 'bg-muted/50 border-transparent hover:bg-muted hover:border-border'
                              }`}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <span className="font-medium text-sm">{item.label}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Son xonasi */}
                <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-md overflow-hidden">
                  <CardHeader className="pb-3 bg-gradient-to-r from-accent/5 to-transparent">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        <span className="text-accent font-bold">123</span>
                      </div>
                      Son xonasi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <RadioGroup
                      value={String(digitCount)}
                      onValueChange={(v) => setDigitCount(Number(v))}
                      className="grid grid-cols-2 gap-2"
                    >
                      {[
                        { value: 1, label: '1 xonali', desc: '1-9' },
                        { value: 2, label: '2 xonali', desc: '10-99' },
                        { value: 3, label: '3 xonali', desc: '100-999' },
                        { value: 4, label: '4 xonali', desc: '1000-9999' },
                      ].map((item) => (
                        <div key={item.value} className="flex items-center">
                          <RadioGroupItem
                            value={String(item.value)}
                            id={`digit-${item.value}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`digit-${item.value}`}
                            className={`flex flex-col w-full px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 border-2 
                              ${digitCount === item.value 
                                ? 'bg-accent text-accent-foreground border-accent shadow-accent-glow' 
                                : 'bg-muted/50 border-transparent hover:bg-muted hover:border-border'
                              }`}
                          >
                            <span className="font-medium text-sm">{item.label}</span>
                            <span className="text-xs opacity-70">{item.desc}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              </div>

              {/* Tezligi va Misollar soni */}
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-md overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 via-accent/5 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    Tezlik va misollar soni
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 space-y-6">
                  {/* Tezligi */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-muted-foreground">Tezligi (soniyada)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0.1}
                          max={10}
                          step={0.1}
                          value={speed}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val >= 0.1 && val <= 10) {
                              setSpeed(Math.round(val * 10) / 10);
                            }
                          }}
                          className="w-20 h-8 text-center text-sm font-bold bg-primary/10 border-primary/30"
                        />
                        <span className="text-sm text-muted-foreground">s</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.5, 2, 2.5, 3].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSpeed(s)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 
                            ${speed === s 
                              ? 'bg-primary text-primary-foreground shadow-glow' 
                              : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Misollar soni */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-muted-foreground">Misollar soni</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={999}
                          value={problemCount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 1 && val <= 999) {
                              setProblemCount(val);
                            }
                          }}
                          className="w-20 h-8 text-center text-sm font-bold bg-accent/10 border-accent/30"
                        />
                        <span className="text-sm text-muted-foreground">ta</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40, 50].map((num) => (
                        <button
                          key={num}
                          onClick={() => setProblemCount(num)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200 
                            ${problemCount === num 
                              ? 'bg-accent text-accent-foreground shadow-accent-glow' 
                              : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Boshlash va Reset tugmalari */}
              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                <Button
                  onClick={resetToDefaults}
                  variant="outline"
                  size="lg"
                  className="px-6 py-6 text-base font-medium rounded-2xl border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all duration-300"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Default holatga qaytarish
                </Button>
                <Button
                  onClick={startGame}
                  size="lg"
                  className="relative group bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-primary-foreground px-12 py-6 text-lg font-bold rounded-2xl shadow-glow transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <Play className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
                  Mashqni boshlash
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-0 animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <Leaderboard currentUserId={user?.id} />
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-0 animate-fade-in">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Statistika kartalar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-glow" />
                  <CardContent className="p-5 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{stats.totalProblems}</p>
                    <p className="text-sm text-muted-foreground mt-1">Jami mashqlar</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success to-green-400" />
                  <CardContent className="p-5 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-3">
                      <Check className="h-6 w-6 text-success" />
                    </div>
                    <p className="text-3xl font-bold text-success">{accuracy}%</p>
                    <p className="text-sm text-muted-foreground mt-1">Aniqlik</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
                  <CardContent className="p-5 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                      <Clock className="h-6 w-6 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold text-blue-500">{stats.averageTime.toFixed(1)}s</p>
                    <p className="text-sm text-muted-foreground mt-1">O'rtacha vaqt</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning to-amber-400" />
                  <CardContent className="p-5 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-3">
                      <Trophy className="h-6 w-6 text-warning" />
                    </div>
                    <p className="text-3xl font-bold text-warning">{stats.bestStreak}</p>
                    <p className="text-sm text-muted-foreground mt-1">Eng uzun seriya</p>
                  </CardContent>
                </Card>
              </div>

              {/* Haftalik grafik */}
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-md overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    Haftalik progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {dailyData.length > 0 ? (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyData} barCategoryGap="20%">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                          />
                          <YAxis 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '12px',
                              boxShadow: 'var(--shadow-lg)',
                            }}
                            labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                          />
                          <Bar dataKey="total" fill="hsl(var(--muted))" name="Jami" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="correct" fill="hsl(var(--primary))" name="To'g'ri" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        Hali ma'lumot yo'q. Mashq qiling!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NumberTrainer;
