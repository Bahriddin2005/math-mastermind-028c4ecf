import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Square, Volume2, VolumeX, RotateCcw, Check, Clock, BarChart3, Trophy, Target, Play, Home, Moon, Sun, User, LogOut, Settings, ShieldCheck, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { Leaderboard } from './Leaderboard';
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
  
  // Sozlamalar
  const [formulaType, setFormulaType] = useState<FormulaType>('oddiy');
  const [digitCount, setDigitCount] = useState(1);
  const [speed, setSpeed] = useState(0.5);
  const [problemCount, setProblemCount] = useState(5);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showStats, setShowStats] = useState(false);

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
        return;
      }

      const result = generateNextNumber();
      if (result !== null) {
        setCurrentDisplay(String(result.num));
        setDisplayedNumbers(prev => [...prev, { num: String(result.num), isAdd: result.isAdd }]);
        
        if (voiceEnabled) {
          speakNumber(String(result.num), result.isAdd, false);
        }
      }
    }, speedMs);
  }, [digitCount, speed, problemCount, generateNextNumber, voiceEnabled]);

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


  // O'yin davomida
  if (isRunning && currentDisplay !== null) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
        {/* Taymer */}
        <div className="absolute top-6 right-6 flex items-center gap-2 text-2xl font-mono text-muted-foreground">
          <Clock className="h-6 w-6" />
          {elapsedTime.toFixed(1)}s
        </div>
        
        <div 
          className="text-[180px] md:text-[250px] font-light text-foreground transition-all duration-100"
          key={countRef.current}
        >
          {!isAddition && countRef.current > 1 ? '-' : ''}{currentDisplay}
        </div>
        <div className="absolute bottom-10 flex gap-4">
          <Button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          <Button
            onClick={stopGame}
            variant="destructive"
            size="lg"
            className="gap-2"
          >
            <Square className="h-5 w-5" />
            To'xtatish
          </Button>
        </div>
      </div>
    );
  }

  // Natija sahifasi
  if (isFinished) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 p-6">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex items-center justify-center gap-4 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span className="font-mono text-lg">{elapsedTime.toFixed(1)}s</span>
          </div>
          
          <h2 className="text-2xl font-bold text-foreground">Mashq tugadi!</h2>
          
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Ko'rsatilgan sonlar:</p>
            <p className="text-lg font-mono">
              {displayedNumbers.map((item, i) => (
                <span key={i}>
                  {i > 0 ? (item.isAdd ? ' + ' : ' - ') : ''}{item.num}
                </span>
              ))}
            </p>
          </div>

          {!showResult ? (
            <div className="space-y-4">
              <p className="text-lg text-muted-foreground">Natijani kiriting:</p>
              <Input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && userAnswer && checkAnswer()}
                placeholder="Javob"
                className="text-center text-3xl h-16"
                autoFocus
              />
              <Button
                onClick={checkAnswer}
                disabled={!userAnswer}
                size="lg"
                className="w-full gap-2"
              >
                <Check className="h-5 w-5" />
                Tekshirish
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className={`text-6xl font-bold ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                {isCorrect ? '✓' : '✗'}
              </div>
              <div>
                <p className="text-lg">
                  {isCorrect ? "To'g'ri javob!" : "Noto'g'ri"}
                </p>
                <p className="text-3xl font-bold mt-2">
                  To'g'ri javob: {runningResultRef.current}
                </p>
                {!isCorrect && (
                  <p className="text-muted-foreground mt-1">
                    Sizning javobingiz: {userAnswer}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  Javob vaqti: {answerTime.toFixed(1)}s
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center pt-4">
            <Button
              onClick={resetGame}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <RotateCcw className="h-5 w-5" />
              Orqaga
            </Button>
            <Button
              onClick={startGame}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
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

          {/* Ovoz */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            aria-label={voiceEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
          >
            {voiceEnabled ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5 text-muted-foreground" />
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
    <div className="min-h-screen bg-background">
      <NavbarComponent />
      
      <div className="container py-6 px-4 md:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-6">
            <TabsTrigger value="train" className="gap-2">
              <Play className="h-4 w-4" />
              Mashq
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2">
              <Trophy className="h-4 w-4" />
              Reyting
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistika
            </TabsTrigger>
          </TabsList>

          <TabsContent value="train" className="mt-0">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Mini statistika */}
              {user && stats.totalProblems > 0 && (
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold">{stats.totalProblems}</p>
                    <p className="text-xs text-muted-foreground">Jami</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold text-green-500">{accuracy}%</p>
                    <p className="text-xs text-muted-foreground">Aniqlik</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold text-blue-500">{stats.averageTime.toFixed(1)}s</p>
                    <p className="text-xs text-muted-foreground">Vaqt</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold text-amber-500">{stats.bestStreak}</p>
                    <p className="text-xs text-muted-foreground">Seriya</p>
                  </div>
                </div>
              )}

              {/* Misol turi */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Misol turi</Label>
                <RadioGroup
                  value={formulaType}
                  onValueChange={(v) => setFormulaType(v as FormulaType)}
                  className="flex flex-wrap gap-2"
                >
                  {[
                    { value: 'oddiy', label: 'Oddiy' },
                    { value: 'formula5', label: 'Formula 5' },
                    { value: 'formula10plus', label: 'Formula 10+' },
                    { value: 'formula10minus', label: 'Formula 10-' },
                    { value: 'hammasi', label: 'hammasi' },
                  ].map((item) => (
                    <div key={item.value} className="flex items-center">
                      <RadioGroupItem
                        value={item.value}
                        id={`formula-${item.value}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`formula-${item.value}`}
                        className="flex items-center gap-2 px-4 py-2 border rounded-full cursor-pointer transition-colors peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted"
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formulaType === item.value ? 'border-primary-foreground bg-primary-foreground' : 'border-muted-foreground'}`}>
                          {formulaType === item.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Son xonasi */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Son xonasi</Label>
                <RadioGroup
                  value={String(digitCount)}
                  onValueChange={(v) => setDigitCount(Number(v))}
                  className="flex flex-wrap gap-2"
                >
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} className="flex items-center">
                      <RadioGroupItem
                        value={String(num)}
                        id={`digit-${num}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`digit-${num}`}
                        className="flex items-center gap-2 px-4 py-2 border rounded-full cursor-pointer transition-colors peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted"
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${digitCount === num ? 'border-primary-foreground bg-primary-foreground' : 'border-muted-foreground'}`}>
                          {digitCount === num && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        {num} xonali
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Tezligi */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Tezligi</Label>
                <RadioGroup
                  value={String(speed)}
                  onValueChange={(v) => setSpeed(Number(v))}
                  className="flex flex-wrap gap-2"
                >
                  {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((s) => (
                    <div key={s} className="flex items-center">
                      <RadioGroupItem
                        value={String(s)}
                        id={`speed-${s}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`speed-${s}`}
                        className="flex items-center gap-2 px-3 py-2 border rounded-full cursor-pointer transition-colors peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted text-sm"
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${speed === s ? 'border-primary-foreground bg-primary-foreground' : 'border-muted-foreground'}`}>
                          {speed === s && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </div>
                        {s}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Misollar soni */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Misollar soni</Label>
                <RadioGroup
                  value={String(problemCount)}
                  onValueChange={(v) => setProblemCount(Number(v))}
                  className="flex flex-wrap gap-2"
                >
                  {Array.from({ length: 18 }, (_, i) => i + 3).map((num) => (
                    <div key={num} className="flex items-center">
                      <RadioGroupItem
                        value={String(num)}
                        id={`count-${num}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`count-${num}`}
                        className="flex items-center gap-2 px-3 py-2 border rounded-full cursor-pointer transition-colors peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted text-sm"
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${problemCount === num ? 'border-primary-foreground bg-primary-foreground' : 'border-muted-foreground'}`}>
                          {problemCount === num && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </div>
                        {num}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Boshlash tugmasi */}
              <Button
                onClick={startGame}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-8"
              >
                Boshlash
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-0">
            <div className="max-w-2xl mx-auto">
              <Leaderboard currentUserId={user?.id} />
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-0">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Statistika kartalar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{stats.totalProblems}</p>
                    <p className="text-sm text-muted-foreground">Jami mashqlar</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Check className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold text-green-500">{accuracy}%</p>
                    <p className="text-sm text-muted-foreground">Aniqlik</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold text-blue-500">{stats.averageTime.toFixed(1)}s</p>
                    <p className="text-sm text-muted-foreground">O'rtacha vaqt</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Trophy className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                    <p className="text-2xl font-bold text-amber-500">{stats.bestStreak}</p>
                    <p className="text-sm text-muted-foreground">Eng uzun seriya</p>
                  </CardContent>
                </Card>
              </div>

              {/* Haftalik grafik */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Haftalik progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          />
                          <YAxis 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--popover))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Bar dataKey="total" fill="hsl(var(--muted))" name="Jami" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="correct" fill="hsl(var(--primary))" name="To'g'ri" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Hali ma'lumot yo'q. Mashq qiling!
                    </p>
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
