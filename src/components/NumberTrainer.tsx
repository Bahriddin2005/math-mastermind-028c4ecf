import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Square, Volume2, VolumeX, RotateCcw, Check, Clock, BarChart3, Trophy, Target, Play, Home, Moon, Sun, User, LogOut, Settings, ShieldCheck, GraduationCap, Users, Flame, BookOpen } from 'lucide-react';
import { MultiplayerMode } from './MultiplayerMode';
import { Navbar } from './Navbar';
import { DailyChallenge } from './DailyChallenge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { Leaderboard } from './Leaderboard';
import { useConfetti } from '@/hooks/useConfetti';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import { useAdaptiveGamification } from '@/hooks/useAdaptiveGamification';
import { GamificationDisplay } from './GamificationDisplay';
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

// Formula 5 (kichik do'stlar) - Yapon metodologiyasi
// +4: -1, +5 (4+1=5 do'stligi) -> faqat 4 da ishlaydi
// +3: -2, +5 (3+2=5 do'stligi) -> faqat 3 da ishlaydi
// +2: -3, +5 (2+3=5 do'stligi) -> faqat 2 da ishlaydi
// +1: -4, +5 (1+4=5 do'stligi) -> faqat 1 da ishlaydi
// -4: -5, +1 -> faqat 5 da ishlaydi
// -3: -5, +2 -> faqat 5 da ishlaydi
// -2: -5, +3 -> faqat 6 da ishlaydi
// -1: -5, +4 -> faqat 7 da ishlaydi
const RULES_FORMULA_5: Record<number, { add: number[]; subtract: number[] }> = {
  0: { add: [], subtract: [] },
  1: { add: [4], subtract: [] },    // +4 qo'shish (1+4=5, keyin -1+5)
  2: { add: [3], subtract: [] },    // +3 qo'shish (2+3=5, keyin -2+5)
  3: { add: [2], subtract: [] },    // +2 qo'shish (3+2=5, keyin -3+5)
  4: { add: [1], subtract: [] },    // +1 qo'shish (4+1=5, keyin -4+5)
  5: { add: [], subtract: [1, 2] }, // -1, -2 ayirish (5-1=4: -5+4, 5-2=3: -5+3)
  6: { add: [], subtract: [3] },    // -3 ayirish (6-3=3: -5+2)
  7: { add: [], subtract: [4] },    // -4 ayirish (7-4=3: -5+1)
  8: { add: [], subtract: [] },
  9: { add: [], subtract: [] },
};

// Formula 10 (katta do'stlar) - Sizning bergan jadvallaringiz asosida
// Katta do'st qo'shishda: +N → +10 - (10-N)
// Katta do'st ayirishda: -N → -10 + (10-N)
// MUHIM: Ayirish faqat o'nliklar > 0 bo'lganda ishlaydi (X>0)

// Katta do'st qoidalari - har bir delta uchun qaysi birlik raqamida ishlashini ko'rsatadi
const KATTA_DOST_ADD: Record<number, number[]> = {
  1: [9],           // +1: faqat x9 da
  2: [8, 9],        // +2: x8, x9 da
  3: [7, 8, 9],     // +3: x7, x8, x9 da
  4: [6, 7, 8, 9],  // +4: x6, x7, x8, x9 da
  5: [5, 6, 7, 8, 9], // +5: x5-x9 da
  6: [4, 9],        // +6: x4, x9 da
  7: [3, 4, 8, 9],  // +7: x3, x4, x8, x9 da
  8: [2, 3, 4, 7, 8, 9], // +8: x2-x4, x7-x9 da (x3,x4,x8,x9 faqat X>0)
  9: [1, 2, 3, 4, 6, 7, 8, 9], // +9: x1-x4 (x4 X>0), x6-x9 (x9 X>0)
};

// Ayirish faqat o'nliklar mavjud bo'lganda ishlaydi
const KATTA_DOST_SUB: Record<number, number[]> = {
  1: [0],           // -1: x0 da (X>0)
  2: [0, 1],        // -2: x0, x1 da (X>0)
  3: [0, 1, 2],     // -3: x0, x1, x2 da (X>0)
  4: [0, 1, 2, 3],  // -4: x0-x3 da (X>0)
  5: [0, 1, 2, 3, 4], // -5: x0-x4 da (X>0)
  6: [0, 5],        // -6: x0, x5 da (X>0)
  7: [0, 1, 5, 6],  // -7: x0, x1, x5, x6 da (X>0)
  8: [0, 1, 2, 5, 6, 7], // -8: x0-x2, x5-x7 da (X>0)
  9: [0, 1, 2, 3, 5, 6, 7, 8], // -9: x0-x3, x5-x8 da (X>0)
};

// Formula 10+ (katta do'stlar qo'shish) - statik jadval
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

// Formula 10- (katta do'stlar ayirish) - statik jadval
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

// Manfiy sonlar qoidalari - manfiy natijalar bilan ishlash
const RULES_NEGATIVE: Record<number, { add: number[]; subtract: number[] }> = {
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

// Ko'paytirish qoidalari - oddiy ko'paytirish jadvali
const RULES_MULTIPLY: Record<number, { multiply: number[] }> = {
  1: { multiply: [2, 3, 4, 5, 6, 7, 8, 9] },
  2: { multiply: [2, 3, 4, 5, 6, 7, 8, 9] },
  3: { multiply: [2, 3, 4, 5, 6, 7, 8, 9] },
  4: { multiply: [2, 3, 4, 5, 6, 7, 8, 9] },
  5: { multiply: [2, 3, 4, 5, 6, 7, 8, 9] },
  6: { multiply: [2, 3, 4, 5, 6, 7, 8, 9] },
  7: { multiply: [2, 3, 4, 5, 6, 7, 8, 9] },
  8: { multiply: [2, 3, 4, 5, 6, 7, 8, 9] },
  9: { multiply: [2, 3, 4, 5, 6, 7, 8, 9] },
};

// Bo'lish qoidalari - qoldiqsiz bo'lish
const RULES_DIVIDE: Record<number, { divide: number[] }> = {
  2: { divide: [2] },
  3: { divide: [3] },
  4: { divide: [2, 4] },
  5: { divide: [5] },
  6: { divide: [2, 3, 6] },
  7: { divide: [7] },
  8: { divide: [2, 4, 8] },
  9: { divide: [3, 9] },
};

type FormulaType = 'oddiy' | 'formula5' | 'formula10plus' | 'hammasi' | 'manfiy' | 'kopaytirish' | 'bolish';

const FORMULA_RULES: Record<string, Record<number, { add: number[]; subtract: number[] }>> = {
  oddiy: RULES_BASIC,
  formula5: RULES_FORMULA_5,
  formula10plus: RULES_FORMULA_10_PLUS,
  formula10minus: RULES_FORMULA_10_MINUS,
  hammasi: RULES_ALL,
  manfiy: RULES_NEGATIVE,
};

// Web Speech API fallback (used when ElevenLabs fails or is disabled)
const speakNumberFallback = (number: string, isAddition: boolean, isFirst: boolean) => {
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

interface TopicStats {
  topic: string;
  label: string;
  icon: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface DailyData {
  name: string;
  total: number;
  correct: number;
}

// Mavzu nomlari
const TOPIC_LABELS: Record<string, { label: string; icon: string }> = {
  oddiy: { label: 'Formulasiz', icon: '📘' },
  formula5: { label: 'Kichik formula (5)', icon: '🔢' },
  formula10plus: { label: 'Katta formula (10)', icon: '➕' },
  hammasi: { label: 'Mix formula', icon: '🎯' },
  manfiy: { label: 'Manfiy sonlar', icon: '➖' },
  kopaytirish: { label: "Ko'paytirish", icon: '✖️' },
  bolish: { label: "Bo'lish", icon: '➗' },
};

// Ripple effect va haptic feedback
const createRipple = (event: React.MouseEvent<HTMLElement>) => {
  const button = event.currentTarget;
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.className = 'ripple bg-current opacity-30';
  
  button.appendChild(ripple);
  
  setTimeout(() => ripple.remove(), 600);
};

const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

const handleTabClick = (event: React.MouseEvent<HTMLElement>, value: string, setTab: (v: string) => void) => {
  createRipple(event);
  triggerHaptic();
  setTab(value);
};

export const NumberTrainer = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('train');
  const [prevTab, setPrevTab] = useState('train');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [bonusAvailable, setBonusAvailable] = useState(false);
  
  // Adaptive Gamification hook
  const gamification = useAdaptiveGamification({
    gameType: 'number-trainer',
    baseScore: 10,
    enabled: !!user,
  });

  // Answer start time tracking for gamification - moved to refs section below
  
  const tabOrder = ['train', 'learn', 'daily', 'multiplayer', 'leaderboard', 'stats'];
  
  const handleTabChange = (newTab: string) => {
    const currentIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(newTab);
    setSlideDirection(newIndex > currentIndex ? 'right' : 'left');
    setPrevTab(activeTab);
    setActiveTab(newTab);
  };

  // Check bonus availability
  useEffect(() => {
    const checkBonus = async () => {
      if (user) {
        const available = await gamification.checkBonusAvailability();
        setBonusAvailable(available);
      }
    };
    checkBonus();
  }, [user, gamification.checkBonusAvailability]);
  
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
  const [topicStats, setTopicStats] = useState<TopicStats[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);

  const runningResultRef = useRef(0);
  const countRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const answerStartTimeRef = useRef<number>(0);
  const lastWasKattaDostRef = useRef(false); // Mix formula uchun - ketma-ket katta do'st cheklovi

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
        .limit(500);
      
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

        // Mavzular bo'yicha statistika
        const topicMap = new Map<string, { total: number; correct: number }>();
        data.forEach(session => {
          const topic = (session as any).formula_type || session.difficulty || 'oddiy';
          if (!topicMap.has(topic)) {
            topicMap.set(topic, { total: 0, correct: 0 });
          }
          const t = topicMap.get(topic)!;
          t.total += 1;
          t.correct += (session.correct || 0) > 0 ? 1 : 0;
        });

        const topicStatsData: TopicStats[] = [];
        topicMap.forEach((value, key) => {
          const labelInfo = TOPIC_LABELS[key] || { label: key, icon: '📊' };
          topicStatsData.push({
            topic: key,
            label: labelInfo.label,
            icon: labelInfo.icon,
            total: value.total,
            correct: value.correct,
            accuracy: value.total > 0 ? Math.round((value.correct / value.total) * 100) : 0,
          });
        });

        // Eng ko'p mashq qilingan mavzularni birinchi qilish
        topicStatsData.sort((a, b) => b.total - a.total);
        setTopicStats(topicStatsData);

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
  // useElevenLabs=true enables ElevenLabs when provider setting is 'elevenlabs'
  const { speakNumber, stop: stopTTS, cleanup: cleanupTTS } = useTTS({ useElevenLabs: true });

  // Sonni generatsiya qilish
  const generateNextNumber = useCallback(() => {
    const currentResult = runningResultRef.current;
    
    // Ko'paytirish rejimi - digitCount ga qarab qiyinlik
    if (formulaType === 'kopaytirish') {
      let num1: number, num2: number;
      if (digitCount === 1) {
        // 1 xonali: 1-9 × 2-9
        num1 = Math.floor(Math.random() * 9) + 1;
        num2 = Math.floor(Math.random() * 8) + 2;
      } else if (digitCount === 2) {
        // 2 xonali: 10-99 × 2-9
        num1 = Math.floor(Math.random() * 90) + 10;
        num2 = Math.floor(Math.random() * 8) + 2;
      } else if (digitCount === 3) {
        // 3 xonali: 10-99 × 10-99
        num1 = Math.floor(Math.random() * 90) + 10;
        num2 = Math.floor(Math.random() * 90) + 10;
      } else {
        // 4 xonali: 100-999 × 2-9
        num1 = Math.floor(Math.random() * 900) + 100;
        num2 = Math.floor(Math.random() * 8) + 2;
      }
      runningResultRef.current = num1 * num2;
      return { num: num1, isAdd: true, isMultiply: true, secondNum: num2 };
    }
    
    // Bo'lish rejimi - digitCount ga qarab qiyinlik
    if (formulaType === 'bolish') {
      let divisor: number, quotient: number;
      if (digitCount === 1) {
        // 1 xonali: natija 1-9, bo'luvchi 2-9
        divisor = Math.floor(Math.random() * 8) + 2;
        quotient = Math.floor(Math.random() * 9) + 1;
      } else if (digitCount === 2) {
        // 2 xonali: natija 10-99, bo'luvchi 2-9
        divisor = Math.floor(Math.random() * 8) + 2;
        quotient = Math.floor(Math.random() * 90) + 10;
      } else if (digitCount === 3) {
        // 3 xonali: natija 10-99, bo'luvchi 10-99
        divisor = Math.floor(Math.random() * 90) + 10;
        quotient = Math.floor(Math.random() * 9) + 1;
      } else {
        // 4 xonali: natija 10-99, bo'luvchi 10-99
        divisor = Math.floor(Math.random() * 90) + 10;
        quotient = Math.floor(Math.random() * 90) + 10;
      }
      const dividend = divisor * quotient;
      runningResultRef.current = quotient;
      return { num: dividend, isAdd: true, isDivide: true, secondNum: divisor };
    }
    
    const lastDigit = Math.abs(currentResult) % 10;
    const tens = Math.floor(Math.abs(currentResult) / 10);
    const hasHigherTens = tens > 0;
    
    // Katta do'st uchun maxsus tekshiruv
    if (formulaType === 'formula10plus') {
      const possibleOperations: { number: number; isAdd: boolean }[] = [];
      
      // Qo'shish - KATTA_DOST_ADD jadvaliga qarab
      for (let delta = 1; delta <= 9; delta++) {
        if (KATTA_DOST_ADD[delta]?.includes(lastDigit)) {
          // X>0 sharti tekshirish (ba'zi holatlarda)
          if (delta === 4 && lastDigit === 9 && !hasHigherTens) continue;
          if (delta === 8 && [3, 4, 8, 9].includes(lastDigit) && !hasHigherTens) continue;
          if (delta === 9 && lastDigit === 4 && !hasHigherTens) continue;
          if (delta === 9 && lastDigit === 9 && !hasHigherTens) continue;
          possibleOperations.push({ number: delta, isAdd: true });
        }
      }
      
      // Ayirish - KATTA_DOST_SUB jadvaliga qarab (faqat X>0 bo'lganda)
      if (hasHigherTens) {
        for (let delta = 1; delta <= 9; delta++) {
          if (KATTA_DOST_SUB[delta]?.includes(lastDigit)) {
            possibleOperations.push({ number: delta, isAdd: false });
          }
        }
      }
      
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
    }
    
    // MIX FORMULA (hammasi) - Yapon metodologiyasi
    // Qoidalar: 1) Ketma-ket 2 ta katta do'st yo'q
    //           2) Formulasiz, kichik do'st, katta do'st aralash
    if (formulaType === 'hammasi') {
      const possibleOperations: { number: number; isAdd: boolean; isKattaDost: boolean }[] = [];
      
      // 1. FORMULASIZ amallar
      const basicRules = RULES_BASIC[lastDigit];
      if (basicRules) {
        basicRules.add.forEach(num => {
          possibleOperations.push({ number: num, isAdd: true, isKattaDost: false });
        });
        basicRules.subtract.forEach(num => {
          if (currentResult >= num) {
            possibleOperations.push({ number: num, isAdd: false, isKattaDost: false });
          }
        });
      }
      
      // 2. KICHIK DO'ST (Formula 5) amallar
      const smallFriendRules = RULES_FORMULA_5[lastDigit];
      if (smallFriendRules) {
        smallFriendRules.add.forEach(num => {
          if (!possibleOperations.some(op => op.number === num && op.isAdd)) {
            possibleOperations.push({ number: num, isAdd: true, isKattaDost: false });
          }
        });
        smallFriendRules.subtract.forEach(num => {
          if (currentResult >= num && !possibleOperations.some(op => op.number === num && !op.isAdd)) {
            possibleOperations.push({ number: num, isAdd: false, isKattaDost: false });
          }
        });
      }
      
      // 3. KATTA DO'ST (Formula 10) - faqat oldingi amal katta do'st bo'lmasa
      if (!lastWasKattaDostRef.current) {
        // Qo'shish
        for (let delta = 1; delta <= 9; delta++) {
          if (KATTA_DOST_ADD[delta]?.includes(lastDigit)) {
            // X>0 sharti tekshirish
            if (delta === 4 && lastDigit === 9 && !hasHigherTens) continue;
            if (delta === 8 && [3, 4, 8, 9].includes(lastDigit) && !hasHigherTens) continue;
            if (delta === 9 && lastDigit === 4 && !hasHigherTens) continue;
            if (delta === 9 && lastDigit === 9 && !hasHigherTens) continue;
            if (!possibleOperations.some(op => op.number === delta && op.isAdd)) {
              possibleOperations.push({ number: delta, isAdd: true, isKattaDost: true });
            }
          }
        }
        // Ayirish (faqat X>0)
        if (hasHigherTens) {
          for (let delta = 1; delta <= 9; delta++) {
            if (KATTA_DOST_SUB[delta]?.includes(lastDigit)) {
              if (!possibleOperations.some(op => op.number === delta && !op.isAdd)) {
                possibleOperations.push({ number: delta, isAdd: false, isKattaDost: true });
              }
            }
          }
        }
      }
      
      if (possibleOperations.length === 0) return null;
      
      // Weighted selection: katta do'stni kamroq tanlash (25% ehtimollik)
      const nonKattaDostOps = possibleOperations.filter(op => !op.isKattaDost);
      const kattaDostOps = possibleOperations.filter(op => op.isKattaDost);
      
      let randomOp: { number: number; isAdd: boolean; isKattaDost: boolean };
      if (nonKattaDostOps.length > 0 && Math.random() > 0.25) {
        randomOp = nonKattaDostOps[Math.floor(Math.random() * nonKattaDostOps.length)];
      } else if (kattaDostOps.length > 0) {
        randomOp = kattaDostOps[Math.floor(Math.random() * kattaDostOps.length)];
      } else {
        randomOp = possibleOperations[Math.floor(Math.random() * possibleOperations.length)];
      }
      
      // Ketma-ket katta do'st cheklovini yangilash
      lastWasKattaDostRef.current = randomOp.isKattaDost;
      
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
    }
    
    // MANFIY SONLAR rejimi - manfiy natijalar bilan ishlash
    if (formulaType === 'manfiy') {
      const possibleOperations: { number: number; isAdd: boolean }[] = [];
      
      // Qo'shish va ayirish ikkalasini ham ruxsat berish
      // Agar natija musbat bo'lsa - ayirish ustunlik oladi
      // Agar natija manfiy bo'lsa - qo'shish ustunlik oladi
      
      if (currentResult >= 0) {
        // Musbat holatda - ayirish mumkin (manfiy natija bo'lishi mumkin)
        for (let num = 1; num <= 9; num++) {
          possibleOperations.push({ number: num, isAdd: false });
        }
        // Ba'zi qo'shishlar ham bo'lsin
        for (let num = 1; num <= Math.min(5, 9 - lastDigit); num++) {
          possibleOperations.push({ number: num, isAdd: true });
        }
      } else {
        // Manfiy holatda - qo'shish mumkin (musbat tomon harakat)
        for (let num = 1; num <= 9; num++) {
          possibleOperations.push({ number: num, isAdd: true });
        }
        // Ba'zi ayirishlar ham bo'lsin (yanada manfiy)
        if (Math.random() > 0.7) {
          for (let num = 1; num <= 5; num++) {
            possibleOperations.push({ number: num, isAdd: false });
          }
        }
      }
      
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
    }
    
    const rules = FORMULA_RULES[formulaType]?.[lastDigit];

    if (!rules) return null;

    const possibleOperations: { number: number; isAdd: boolean }[] = [];

    rules.add.forEach(num => {
      possibleOperations.push({ number: num, isAdd: true });
    });

    // Ayirish uchun natija manfiy bo'lmasligi kerak (manfiy rejimi uchun emas)
    rules.subtract.forEach(num => {
      if (currentResult >= num) {
        possibleOperations.push({ number: num, isAdd: false });
      }
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
    // Ko'paytirish yoki Bo'lish rejimida boshqacha boshlanadi
    if (formulaType === 'kopaytirish' || formulaType === 'bolish') {
      runningResultRef.current = 0;
      countRef.current = 0;
      startTimeRef.current = Date.now();

      setDisplayedNumbers([]);
      setIsRunning(true);
      setIsFinished(false);
      setIsAddition(true);
      setUserAnswer('');
      setShowResult(false);
      setIsCorrect(null);
      setElapsedTime(0);
      setAnswerTime(0);

      playSound('start');

      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 100) / 10);
      }, 100);

      // Birinchi misolni ko'rsatish
      const result = generateNextNumber();
      if (result !== null) {
        if ('isMultiply' in result) {
          setCurrentDisplay(`${result.num} × ${result.secondNum}`);
          setDisplayedNumbers([{ num: `${result.num} × ${result.secondNum}`, isAdd: true }]);
        } else if ('isDivide' in result) {
          setCurrentDisplay(`${result.num} ÷ ${result.secondNum}`);
          setDisplayedNumbers([{ num: `${result.num} ÷ ${result.secondNum}`, isAdd: true }]);
        }
        playSound('tick');
      }

      // Ko'paytirish/Bo'lish rejimida har bir misol alohida - faqat bitta misol
      answerStartTimeRef.current = Date.now();
      setIsRunning(false);
      setIsFinished(true);
      return;
    }

    const maxInitial = Math.pow(10, digitCount) - 1;
    const minInitial = digitCount === 1 ? 1 : Math.pow(10, digitCount - 1);
    const initialResult = Math.floor(Math.random() * (maxInitial - minInitial + 1)) + minInitial;
    
    runningResultRef.current = initialResult;
    countRef.current = 1;
    lastWasKattaDostRef.current = false; // Mix formula uchun reset
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
  }, [formulaType, digitCount, speed, problemCount, generateNextNumber, voiceEnabled, playSound, speakNumber]);

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
    stopTTS();
    window.speechSynthesis.cancel();
    setIsRunning(false);
    setIsFinished(false);
    setCurrentDisplay(null);
    setDisplayedNumbers([]);
  }, [stopTTS]);

  const { triggerLevelUpConfetti } = useConfetti();

  // Javobni tekshirish va saqlash
  const checkAnswer = useCallback(async () => {
    const userNum = parseInt(userAnswer, 10);
    const correctAnswer = runningResultRef.current;
    const correct = userNum === correctAnswer;
    const totalTime = (Date.now() - startTimeRef.current) / 1000;
    const answerDuration = (Date.now() - answerStartTimeRef.current) / 1000;
    const responseTimeMs = Math.floor(answerDuration * 1000);
    
    setIsCorrect(correct);
    setShowResult(true);
    setAnswerTime(answerDuration);
    
    // Play sound
    if (correct) {
      playSound('correct');
    } else {
      playSound('incorrect');
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const newStreak = correct ? currentStreak + 1 : 0;
    setCurrentStreak(newStreak);

    // Adaptive Gamification - process answer
    if (user) {
      const difficultyMultiplier = digitCount + (formulaType === 'hammasi' ? 1 : 0);
      await gamification.processAnswer(correct, responseTimeMs, difficultyMultiplier);
    }

    // Bazaga saqlash
    if (user) {
      try {
        const scoreEarned = correct ? Math.floor(10 * gamification.comboMultiplier) : 0;
        
        await supabase.from('game_sessions').insert({
          user_id: user.id,
          section: 'number-trainer',
          difficulty: formulaType,
          mode: `${digitCount}-xonali`,
          correct: correct ? 1 : 0,
          incorrect: correct ? 0 : 1,
          best_streak: Math.max(newStreak, gamification.maxCombo),
          score: scoreEarned,
          total_time: totalTime,
          problems_solved: problemCount,
          formula_type: formulaType,
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
              total_score: (profile.total_score || 0) + scoreEarned,
              total_problems_solved: (profile.total_problems_solved || 0) + 1,
              best_streak: Math.max(profile.best_streak || 0, newStreak, gamification.maxCombo),
              last_active_date: new Date().toISOString().split('T')[0],
            })
            .eq('user_id', user.id);
        }
      } catch (error) {
        console.error('Error saving session:', error);
      }
    }
  }, [userAnswer, user, formulaType, digitCount, problemCount, currentStreak, gamification]);

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
    gamification.resetCombo();
  }, [gamification]);

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


  // O'yin davomida - yangi dizayn, pastroqda ko'rsatish
  if (isRunning && currentDisplay !== null) {
    const isFirstNumber = countRef.current === 1;
    
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-background via-emerald-100/40 to-emerald-300 dark:from-slate-950 dark:via-emerald-900/40 dark:to-emerald-600/70 flex flex-col z-50">
        {/* Yuqori panel */}
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground bg-muted/50 dark:bg-slate-800/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/30">
            <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            <span>{problemCount} ta son</span>
          </div>
          
          <div className="flex items-center gap-2 text-lg sm:text-xl font-mono bg-muted/80 dark:bg-slate-800/80 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-border/50 shadow-lg">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="text-foreground font-semibold">{elapsedTime.toFixed(1)}s</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="px-6 sm:px-12 mb-4">
          <div className="h-1.5 bg-muted dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary via-primary to-primary/70 rounded-full transition-all duration-300"
              style={{ width: `${(countRef.current / problemCount) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Son: {countRef.current}/{problemCount}</span>
            <span>{digitCount} xonali • {formulaType}</span>
          </div>
        </div>
        
        {/* Asosiy son ko'rsatish joyi - pastroqda */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Katta animatsiyali orqa fon */}
          <div className="relative">
            {/* Katta yorug'lik effekti - bir xil rang */}
            <div className="absolute inset-0 blur-[100px] sm:blur-[150px] rounded-full scale-[2] sm:scale-[2.5]">
              <div className="absolute inset-0 rounded-full animate-pulse bg-primary/20" />
            </div>
            
            {/* Ikkinchi qatlam glow - bir xil rang */}
            <div className="absolute inset-0 blur-[60px] sm:blur-[80px] rounded-full scale-150">
              <div className="absolute inset-0 rounded-full bg-primary/15" />
            </div>
            
            {/* Son konteyner */}
            <div 
              key={countRef.current}
              className="relative animate-in fade-in-0 zoom-in-90 duration-300"
            >
              {/* Matematik amal belgisi va son - bir qatorda */}
              <div className="flex items-center justify-center gap-3 sm:gap-6 w-full">
                {/* Matematik amal belgisi - har doim ko'rsatiladi */}
                <span 
                  className="text-[150px] sm:text-[280px] md:text-[400px] lg:text-[520px] font-bold leading-none drop-shadow-2xl text-white"
                  style={{ 
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    filter: 'drop-shadow(0 0 30px rgba(0,0,0,0.3))'
                  }}
                >
                  {isAddition ? '+' : '−'}
                </span>
                
                {/* Asosiy son - juda katta */}
                <span 
                  className="text-[220px] sm:text-[380px] md:text-[540px] lg:text-[700px] font-black leading-none text-white drop-shadow-2xl"
                  style={{ 
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    letterSpacing: '-0.02em',
                    filter: 'drop-shadow(0 0 30px rgba(0,0,0,0.3))'
                  }}
                >
                  {currentDisplay}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Natija sahifasi - pastroqda joylashgan
  if (isFinished) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-background via-background to-primary/5 dark:from-slate-950 dark:via-slate-900 dark:to-primary/10 flex flex-col z-50 p-4 sm:p-6 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-64 sm:w-96 h-64 sm:h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-64 sm:w-96 h-64 sm:h-96 bg-accent/5 dark:bg-accent/10 rounded-full blur-3xl" />
        </div>

        {/* Yuqori qism - vaqt ko'rsatkichi */}
        <div className="flex justify-center pt-4">
          <div className="flex items-center gap-2 bg-muted/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="font-mono text-lg sm:text-xl font-bold text-foreground">{elapsedTime.toFixed(1)}s</span>
          </div>
        </div>

        {/* Asosiy kontent - pastroqda */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative max-w-lg w-full space-y-4 sm:space-y-5 animate-fade-in mx-auto">
            {/* Header */}
            <div className="text-center mb-2">
              <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground dark:text-white">Mashq tugadi!</h2>
              <p className="text-muted-foreground dark:text-slate-400 text-xs sm:text-sm mt-1">Javobingizni kiriting</p>
            </div>
            
            {!showResult ? (
              <div className="space-y-3 sm:space-y-4 animate-fade-in">
                <div className="relative">
                  <Input
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && userAnswer && checkAnswer()}
                    placeholder="Javobni kiriting..."
                    className="text-center text-2xl sm:text-3xl h-16 sm:h-20 rounded-2xl bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm border-2 border-primary/20 dark:border-primary/30 focus:border-primary shadow-lg dark:shadow-2xl font-mono dark:text-white dark:placeholder:text-slate-500"
                    autoFocus
                  />
                </div>
                <Button
                  onClick={checkAnswer}
                  disabled={!userAnswer}
                  size="lg"
                  className="w-full gap-2 sm:gap-3 h-12 sm:h-14 rounded-2xl bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-primary-foreground font-bold text-base sm:text-lg shadow-glow transition-all duration-300 hover:-translate-y-0.5"
                >
                  <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                  Tekshirish
                </Button>
              </div>
            ) : (
              <div className={`space-y-4 sm:space-y-5 ${isCorrect ? 'animate-scale-in' : 'animate-shake'}`}>
                {/* Result card */}
                <div className={`p-5 sm:p-6 rounded-2xl text-center ${
                  isCorrect 
                    ? 'bg-gradient-to-br from-success/10 to-success/5 dark:from-success/20 dark:to-success/10 border-2 border-success/30 dark:border-success/40' 
                    : 'bg-gradient-to-br from-destructive/10 to-destructive/5 dark:from-destructive/20 dark:to-destructive/10 border-2 border-destructive/30 dark:border-destructive/40'
                }`}>
                  <div className={`text-5xl sm:text-6xl mb-2 sm:mb-3 ${isCorrect ? 'animate-celebrate' : ''}`}>
                    {isCorrect ? '🎉' : '😔'}
                  </div>
                  <p className={`text-lg sm:text-xl font-bold ${isCorrect ? 'text-success' : 'text-destructive'}`}>
                    {isCorrect ? "Zo'r! To'g'ri javob!" : "Noto'g'ri javob"}
                  </p>
                </div>

                {/* Answer details */}
                <div className="bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-border/50 dark:border-slate-700/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground dark:text-slate-400">To'g'ri javob:</span>
                    <span className="text-xl sm:text-2xl font-bold text-foreground dark:text-white font-mono">{runningResultRef.current}</span>
                  </div>
                  {!isCorrect && (
                    <div className="flex items-center justify-between pt-2 border-t border-border/50 dark:border-slate-700/50">
                      <span className="text-sm text-muted-foreground dark:text-slate-400">Sizning javobingiz:</span>
                      <span className="text-lg sm:text-xl font-bold text-destructive font-mono">{userAnswer}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50 dark:border-slate-700/50">
                    <span className="text-sm text-muted-foreground dark:text-slate-400">Javob vaqti:</span>
                    <span className="text-base sm:text-lg font-bold text-accent font-mono">{answerTime.toFixed(1)}s</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 sm:gap-4 pt-1">
              <Button
                onClick={resetGame}
                variant="outline"
                size="lg"
                className="flex-1 gap-2 h-12 sm:h-14 rounded-2xl bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm border-border/50 dark:border-slate-600 hover:bg-muted dark:hover:bg-slate-700 transition-all duration-300 text-sm sm:text-base"
              >
                <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
                Orqaga
              </Button>
              <Button
                onClick={startGame}
                size="lg"
                className="flex-1 gap-2 h-12 sm:h-14 rounded-2xl bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-primary-foreground font-bold shadow-glow transition-all duration-300 hover:-translate-y-0.5 text-sm sm:text-base"
              >
                <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                Yangi mashq
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sozlamalar sahifasi
  return (
    <div className="min-h-screen dark:bg-slate-950">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      
      <div className="container py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-8">
        {/* Hero Section */}
        <div className="relative text-center mb-6 sm:mb-8 md:mb-10 py-4 sm:py-6 md:py-8 animate-fade-in">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-24 sm:w-32 h-24 sm:h-32 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-32 sm:w-40 h-32 sm:h-40 bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl" />
          </div>
          
          {/* Floating icons */}
          <div className="absolute top-2 sm:top-4 left-[10%] sm:left-[15%] animate-bounce-soft opacity-60">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center rotate-12">
              <span className="text-base sm:text-xl">🧮</span>
            </div>
          </div>
          <div className="absolute top-4 sm:top-8 right-[10%] sm:right-[15%] animate-bounce-soft opacity-60" style={{ animationDelay: '0.5s' }}>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center -rotate-12">
              <span className="text-base sm:text-xl">🧠</span>
            </div>
          </div>
          <div className="absolute bottom-2 left-[20%] animate-bounce-soft opacity-50 hidden md:block" style={{ animationDelay: '1s' }}>
            <div className="h-8 w-8 rounded-lg bg-warning/10 dark:bg-warning/20 flex items-center justify-center rotate-6">
              <span className="text-lg">⚡</span>
            </div>
          </div>
          <div className="absolute bottom-4 right-[20%] animate-bounce-soft opacity-50 hidden md:block" style={{ animationDelay: '0.7s' }}>
            <div className="h-8 w-8 rounded-lg bg-success/10 dark:bg-success/20 flex items-center justify-center -rotate-6">
              <span className="text-lg">🎯</span>
            </div>
          </div>

          {/* Main content */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-primary/10 dark:bg-primary/20 rounded-full text-xs sm:text-sm text-primary font-medium mb-3 sm:mb-4">
              <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Kundalik mashq qiling
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-bold text-foreground dark:text-white mb-2 sm:mb-4 px-2">
              Mental Arifmetika{' '}
              <span className="relative inline-block">
                <span className="text-gradient-primary">Treneri</span>
                <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full" height="6" viewBox="0 0 200 8" fill="none">
                  <path d="M2 6C50 2 150 2 198 6" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" className="opacity-50"/>
                </svg>
              </span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground dark:text-slate-400 max-w-xl mx-auto leading-relaxed px-4">
              Aql hisoblash ko&apos;nikmalarini rivojlantiring va{' '}
              <span className="text-foreground dark:text-white font-medium">o&apos;z darajangizni</span> oshiring
            </p>

            {/* Stats badges */}
            {user && stats.totalProblems > 0 && (
              <div className="flex items-center justify-center gap-2 sm:gap-3 mt-4 sm:mt-6 flex-wrap px-2">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-border/50 dark:border-slate-700/50 shadow-sm">
                  <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  <span className="text-xs sm:text-sm font-medium dark:text-white">{stats.totalProblems} mashq</span>
                </div>
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-border/50 dark:border-slate-700/50 shadow-sm">
                  <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-warning" />
                  <span className="text-xs sm:text-sm font-medium dark:text-white">{accuracy}% aniqlik</span>
                </div>
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-border/50 dark:border-slate-700/50 shadow-sm">
                  <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
                  <span className="text-xs sm:text-sm font-medium dark:text-white">{stats.bestStreak} seriya</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Desktop TabsList - tepa qismda */}
          <TabsList className="hidden md:grid w-full max-w-3xl mx-auto grid-cols-6 mb-6 lg:mb-8 bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm border border-border/50 dark:border-slate-700/50 p-1 lg:p-1.5 rounded-xl lg:rounded-2xl shadow-md dark:shadow-2xl">
            <TabsTrigger value="train" className="gap-1.5 lg:gap-2 text-xs lg:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg lg:rounded-xl transition-all duration-300">
              <Play className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
              <span className="font-medium">Mashq</span>
            </TabsTrigger>
            <TabsTrigger value="learn" className="gap-1.5 lg:gap-2 text-xs lg:text-sm data-[state=active]:bg-success data-[state=active]:text-success-foreground rounded-lg lg:rounded-xl transition-all duration-300">
              <BookOpen className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
              <span className="font-medium">O'quv</span>
            </TabsTrigger>
            <TabsTrigger value="daily" className="gap-1.5 lg:gap-2 text-xs lg:text-sm data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg lg:rounded-xl transition-all duration-300">
              <Flame className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
              <span className="font-medium">Kunlik</span>
            </TabsTrigger>
            <TabsTrigger value="multiplayer" className="gap-1.5 lg:gap-2 text-xs lg:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg lg:rounded-xl transition-all duration-300">
              <Users className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
              <span className="font-medium">Multiplayer</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1.5 lg:gap-2 text-xs lg:text-sm data-[state=active]:bg-warning data-[state=active]:text-warning-foreground rounded-lg lg:rounded-xl transition-all duration-300">
              <Trophy className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
              <span className="font-medium">Reyting</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-1.5 lg:gap-2 text-xs lg:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg lg:rounded-xl transition-all duration-300">
              <BarChart3 className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
              <span className="font-medium">Statistika</span>
            </TabsTrigger>
          </TabsList>

          {/* Mobile TabsList - tepada sticky */}
          <div className="md:hidden sticky top-0 z-40 -mx-3 sm:-mx-4 px-3 sm:px-4 pt-2 pb-3 bg-background/95 dark:bg-slate-950/95 backdrop-blur-lg border-b border-border/30 dark:border-slate-800/50 mb-4">
            <TabsList className="grid w-full grid-cols-6 p-1 sm:p-1.5 bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm border border-border/50 dark:border-slate-700/50 rounded-xl shadow-sm h-auto relative">
              <TabsTrigger 
                value="train" 
                onClick={(e) => { createRipple(e); triggerHaptic(); }}
                className="ripple-container relative flex flex-col items-center gap-0.5 py-1.5 sm:py-2 px-0.5 text-muted-foreground dark:text-slate-500 data-[state=active]:text-primary-foreground data-[state=active]:bg-primary rounded-lg transition-all duration-200 text-[9px] sm:text-[10px]"
              >
                <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="font-medium">Mashq</span>
              </TabsTrigger>
              <TabsTrigger 
                value="learn" 
                onClick={(e) => { createRipple(e); triggerHaptic(); }}
                className="ripple-container relative flex flex-col items-center gap-0.5 py-1.5 sm:py-2 px-0.5 text-muted-foreground dark:text-slate-500 data-[state=active]:text-success-foreground data-[state=active]:bg-success rounded-lg transition-all duration-200 text-[9px] sm:text-[10px]"
              >
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="font-medium">O'quv</span>
              </TabsTrigger>
              <TabsTrigger 
                value="daily" 
                onClick={(e) => { createRipple(e); triggerHaptic(); }}
                className="ripple-container relative flex flex-col items-center gap-0.5 py-1.5 sm:py-2 px-0.5 text-muted-foreground dark:text-slate-500 data-[state=active]:text-accent-foreground data-[state=active]:bg-accent rounded-lg transition-all duration-200 text-[9px] sm:text-[10px]"
              >
                <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="font-medium">Kunlik</span>
              </TabsTrigger>
              <TabsTrigger 
                value="multiplayer" 
                onClick={(e) => { createRipple(e); triggerHaptic(); }}
                className="ripple-container relative flex flex-col items-center gap-0.5 py-1.5 sm:py-2 px-0.5 text-muted-foreground dark:text-slate-500 data-[state=active]:text-primary-foreground data-[state=active]:bg-primary rounded-lg transition-all duration-200 text-[9px] sm:text-[10px]"
              >
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="font-medium">Ko'p</span>
              </TabsTrigger>
              <TabsTrigger 
                value="leaderboard" 
                onClick={(e) => { createRipple(e); triggerHaptic(); }}
                className="ripple-container relative flex flex-col items-center gap-0.5 py-1.5 sm:py-2 px-0.5 text-muted-foreground dark:text-slate-500 data-[state=active]:text-warning-foreground data-[state=active]:bg-warning rounded-lg transition-all duration-200 text-[9px] sm:text-[10px]"
              >
                <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="font-medium">Reyting</span>
              </TabsTrigger>
              <TabsTrigger 
                value="stats" 
                onClick={(e) => { createRipple(e); triggerHaptic(); }}
                className="ripple-container relative flex flex-col items-center gap-0.5 py-1.5 sm:py-2 px-0.5 text-muted-foreground dark:text-slate-500 data-[state=active]:text-primary-foreground data-[state=active]:bg-primary rounded-lg transition-all duration-200 text-[9px] sm:text-[10px]"
              >
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="font-medium">Stat</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="learn" className={`mt-0 ${slideDirection === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`} key={`learn-${activeTab}`}>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-success/10 dark:bg-success/20 rounded-full text-xs sm:text-sm text-success font-medium mb-3 sm:mb-4">
                  <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Video darslar
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground dark:text-white mb-2">
                  Mental Arifmetika Darslari
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground dark:text-slate-400 max-w-lg mx-auto px-4">
                  Professional video darslar orqali mental arifmetika sirlarini o'rganing
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Kurs kartasi 1 */}
                <Card 
                  className="group bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm border-border/50 dark:border-slate-700/50 shadow-md dark:shadow-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden h-[200px] sm:h-[220px] flex flex-col"
                  onClick={() => navigate('/courses')}
                >
                  <div className="h-24 sm:h-28 bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/30 dark:to-accent/30 flex items-center justify-center flex-shrink-0">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-primary/20 dark:bg-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                    </div>
                  </div>
                  <CardContent className="p-3 sm:p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-foreground dark:text-white mb-1 line-clamp-1 text-sm sm:text-base">Boshlang'ich kurs</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground dark:text-slate-400 mb-2 sm:mb-3 line-clamp-2 flex-1">Soroban asoslari va oddiy formulalar</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-primary font-medium">Bepul</span>
                      <span className="text-xs text-muted-foreground dark:text-slate-500">10+ dars</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Kurs kartasi 2 */}
                <Card 
                  className="group bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm border-border/50 dark:border-slate-700/50 shadow-md dark:shadow-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden h-[200px] sm:h-[220px] flex flex-col"
                  onClick={() => navigate('/courses')}
                >
                  <div className="h-24 sm:h-28 bg-gradient-to-br from-accent/20 to-warning/20 dark:from-accent/30 dark:to-warning/30 flex items-center justify-center flex-shrink-0">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-accent/20 dark:bg-accent/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Target className="h-6 w-6 sm:h-7 sm:w-7 text-accent" />
                    </div>
                  </div>
                  <CardContent className="p-3 sm:p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-foreground dark:text-white mb-1 line-clamp-1 text-sm sm:text-base">O'rta daraja</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground dark:text-slate-400 mb-2 sm:mb-3 line-clamp-2 flex-1">Formula 5 va Formula 10</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-accent font-medium">Premium</span>
                      <span className="text-xs text-muted-foreground dark:text-slate-500">15+ dars</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Kurs kartasi 3 */}
                <Card 
                  className="group bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm border-border/50 dark:border-slate-700/50 shadow-md dark:shadow-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden h-[200px] sm:h-[220px] flex flex-col sm:col-span-2 lg:col-span-1"
                  onClick={() => navigate('/courses')}
                >
                  <div className="h-24 sm:h-28 bg-gradient-to-br from-warning/20 to-destructive/20 dark:from-warning/30 dark:to-destructive/30 flex items-center justify-center flex-shrink-0">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-warning/20 dark:bg-warning/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-warning" />
                    </div>
                  </div>
                  <CardContent className="p-3 sm:p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-foreground dark:text-white mb-1 line-clamp-1 text-sm sm:text-base">Yuqori daraja</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground dark:text-slate-400 mb-2 sm:mb-3 line-clamp-2 flex-1">Murakkab formulalar va tezlik</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-warning font-medium">Premium</span>
                      <span className="text-xs text-muted-foreground dark:text-slate-500">20+ dars</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 sm:mt-8 text-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/courses')}
                  className="gap-2 h-10 sm:h-12 px-6 sm:px-8 rounded-xl sm:rounded-2xl bg-gradient-to-r from-success to-green-400 hover:from-green-400 hover:to-success text-white font-bold shadow-lg text-sm sm:text-base"
                >
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
                  Barcha kurslarni ko'rish
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="daily" className={`mt-0 ${slideDirection === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`} key={`daily-${activeTab}`}>
            <div className="max-w-2xl mx-auto">
              <DailyChallenge />
            </div>
          </TabsContent>

          <TabsContent value="multiplayer" className={`mt-0 ${slideDirection === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`} key={`multiplayer-${activeTab}`}>
            <MultiplayerMode onBack={() => setActiveTab('train')} />
          </TabsContent>

          <TabsContent value="train" className={`mt-0 ${slideDirection === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`} key={`train-${activeTab}`}>
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
              {/* Gamification Display */}
              {user && !gamification.isLoading && (
                <GamificationDisplay
                  level={gamification.level}
                  currentXp={gamification.currentXp}
                  requiredXp={gamification.requiredXp}
                  levelProgress={gamification.levelProgress}
                  energy={gamification.energy}
                  maxEnergy={gamification.maxEnergy}
                  combo={gamification.combo}
                  comboMultiplier={gamification.comboMultiplier}
                  difficultyLevel={gamification.difficultyLevel}
                  xpUntilLevelUp={gamification.xpUntilLevelUp}
                  isStruggling={gamification.isStruggling}
                  isFlagged={gamification.isFlagged}
                  showBonusHint={bonusAvailable}
                />
              )}

              {/* Mini statistika */}
              {user && stats.totalProblems > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                  <div className="group relative p-3 sm:p-4 bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-border/50 dark:border-slate-700/50 shadow-sm dark:shadow-lg hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                        <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg sm:text-xl font-bold text-foreground dark:text-white">{stats.totalProblems}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground dark:text-slate-400">Jami mashqlar</p>
                      </div>
                    </div>
                  </div>
                  <div className="group relative p-3 sm:p-4 bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-border/50 dark:border-slate-700/50 shadow-sm dark:shadow-lg hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-success/10 dark:bg-success/20 flex items-center justify-center">
                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                      </div>
                      <div>
                        <p className="text-lg sm:text-xl font-bold text-success">{accuracy}%</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground dark:text-slate-400">Aniqlik</p>
                      </div>
                    </div>
                  </div>
                  <div className="group relative p-3 sm:p-4 bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-border/50 dark:border-slate-700/50 shadow-sm dark:shadow-lg hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-lg sm:text-xl font-bold text-blue-500">{stats.averageTime.toFixed(1)}s</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground dark:text-slate-400">O'rtacha vaqt</p>
                      </div>
                    </div>
                  </div>
                  <div className="group relative p-3 sm:p-4 bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-border/50 dark:border-slate-700/50 shadow-sm dark:shadow-lg hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-warning/10 dark:bg-warning/20 flex items-center justify-center">
                        <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                      </div>
                      <div>
                        <p className="text-lg sm:text-xl font-bold text-warning">{stats.bestStreak}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground dark:text-slate-400">Eng uzun seriya</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Cards */}
              <div className="grid md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                {/* Misol turi */}
                <Card className="bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm border-border/50 dark:border-slate-700/50 shadow-md dark:shadow-2xl overflow-hidden h-auto md:h-[280px] flex flex-col">
                  <CardHeader className="pb-2 sm:pb-3 bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10 px-3 sm:px-4 md:px-6">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                      <div className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 rounded-md sm:rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                        <Square className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-primary" />
                      </div>
                      <span className="dark:text-white">Misol turi</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 sm:pt-3 px-3 sm:px-4 md:px-6">
                    <RadioGroup
                      value={formulaType}
                      onValueChange={(v) => setFormulaType(v as FormulaType)}
                      className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2"
                    >
                      {[
                        { value: 'oddiy', label: 'Formulasiz', icon: '📘', color: 'primary' },
                        { value: 'formula5', label: 'Kichik formula (5)', icon: '🔢', color: 'primary' },
                        { value: 'formula10plus', label: 'Katta formula (10)', icon: '➕', color: 'accent' },
                        { value: 'hammasi', label: 'Mix formula', icon: '🎯', color: 'warning' },
                        { value: 'manfiy', label: 'Manfiy sonlar', icon: '➖', color: 'destructive' },
                        { value: 'kopaytirish', label: "Ko'paytirish", icon: '✖️', color: 'success' },
                        { value: 'bolish', label: "Bo'lish", icon: '➗', color: 'blue' },
                      ].map((item) => (
                        <div key={item.value} className="flex items-center relative">
                          <RadioGroupItem
                            value={item.value}
                            id={`formula-${item.value}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`formula-${item.value}`}
                            className={`flex items-center gap-1.5 sm:gap-2 w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 border-2 
                              ${formulaType === item.value 
                                ? item.color === 'primary' ? 'bg-primary text-primary-foreground border-primary shadow-glow'
                                  : item.color === 'accent' ? 'bg-accent text-accent-foreground border-accent shadow-accent-glow'
                                  : item.color === 'warning' ? 'bg-warning text-warning-foreground border-warning'
                                  : item.color === 'destructive' ? 'bg-destructive text-destructive-foreground border-destructive'
                                  : item.color === 'success' ? 'bg-success text-success-foreground border-success'
                                  : 'bg-blue-500 text-white border-blue-500'
                                : 'bg-muted/50 dark:bg-slate-800/50 border-transparent hover:bg-muted dark:hover:bg-slate-700 hover:border-border dark:hover:border-slate-600'
                              }`}
                          >
                            <span className="text-sm sm:text-lg">{item.icon}</span>
                            <span className="font-medium text-xs sm:text-sm">{item.label}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Son xonasi */}
                <Card className="bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm border-border/50 dark:border-slate-700/50 shadow-md dark:shadow-2xl overflow-hidden h-auto md:h-[280px] flex flex-col">
                  <CardHeader className="pb-2 sm:pb-3 bg-gradient-to-r from-accent/5 to-transparent dark:from-accent/10 px-3 sm:px-4 md:px-6">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                      <div className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 rounded-md sm:rounded-lg bg-accent/10 dark:bg-accent/20 flex items-center justify-center">
                        <span className="text-accent font-bold text-xs sm:text-sm">123</span>
                      </div>
                      <span className="dark:text-white">Son xonasi</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 sm:pt-3 px-3 sm:px-4 md:px-6">
                    <RadioGroup
                      value={String(digitCount)}
                      onValueChange={(v) => setDigitCount(Number(v))}
                      className="grid grid-cols-2 gap-1.5 sm:gap-2"
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
                            className={`flex flex-col w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 border-2 
                              ${digitCount === item.value 
                                ? 'bg-accent text-accent-foreground border-accent shadow-accent-glow' 
                                : 'bg-muted/50 dark:bg-slate-800/50 border-transparent hover:bg-muted dark:hover:bg-slate-700 hover:border-border dark:hover:border-slate-600'
                              }`}
                          >
                            <span className="font-medium text-xs sm:text-sm">{item.label}</span>
                            <span className="text-[10px] sm:text-xs opacity-70">{item.desc}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              </div>

              {/* Tezligi va Misollar soni */}
              <Card className="bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm border-border/50 dark:border-slate-700/50 shadow-md dark:shadow-2xl overflow-hidden">
                <CardHeader className="pb-2 sm:pb-3 bg-gradient-to-r from-primary/5 via-accent/5 to-transparent dark:from-primary/10 dark:via-accent/10 px-3 sm:px-4 md:px-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                    <div className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 rounded-md sm:rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-primary" />
                    </div>
                    <span className="dark:text-white">Tezlik va misollar soni</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 sm:pt-3 space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-6">
                  {/* Tezligi */}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-slate-400">Tezligi (soniyada)</Label>
                      <div className="flex items-center gap-1.5 sm:gap-2">
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
                          className="w-16 sm:w-20 h-7 sm:h-8 text-center text-xs sm:text-sm font-bold bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/40 dark:text-white"
                        />
                        <span className="text-xs sm:text-sm text-muted-foreground dark:text-slate-400">s</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                      {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.5, 2, 2.5, 3].map((s) => {
                        // Speed-based color logic
                        const getSpeedColor = (speedVal: number, isSelected: boolean) => {
                          if (isSelected) {
                            if (speedVal <= 0.5) return 'bg-green-500 text-white shadow-green-500/30';
                            if (speedVal <= 0.6) return 'bg-yellow-500 text-white shadow-yellow-500/30';
                            if (speedVal <= 0.9) return 'bg-orange-500 text-white shadow-orange-500/30';
                            if (speedVal === 1) return 'bg-red-500 text-white shadow-red-500/30';
                            if (speedVal <= 1.5) return 'bg-red-600 text-white shadow-red-600/30';
                            if (speedVal <= 2) return 'bg-red-700 text-white shadow-red-700/30';
                            return 'bg-red-900 text-white shadow-red-900/30';
                          }
                          // Unselected state - subtle hint of color
                          if (speedVal <= 0.5) return 'bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30';
                          if (speedVal <= 0.6) return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/30';
                          if (speedVal <= 0.9) return 'bg-orange-500/20 text-orange-700 dark:text-orange-400 hover:bg-orange-500/30';
                          if (speedVal === 1) return 'bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30';
                          if (speedVal <= 1.5) return 'bg-red-600/20 text-red-700 dark:text-red-500 hover:bg-red-600/30';
                          if (speedVal <= 2) return 'bg-red-700/20 text-red-800 dark:text-red-600 hover:bg-red-700/30';
                          return 'bg-red-900/20 text-red-900 dark:text-red-700 hover:bg-red-900/30';
                        };
                        
                        return (
                          <button
                            key={s}
                            onClick={() => setSpeed(s)}
                            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm
                              ${getSpeedColor(s, speed === s)}`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Misollar soni */}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-slate-400">Misollar soni</Label>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={25}
                          value={problemCount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 1 && val <= 25) {
                              setProblemCount(val);
                            }
                          }}
                          className="w-16 sm:w-20 h-7 sm:h-8 text-center text-xs sm:text-sm font-bold bg-accent/10 dark:bg-accent/20 border-accent/30 dark:border-accent/40 dark:text-white"
                        />
                        <span className="text-xs sm:text-sm text-muted-foreground dark:text-slate-400">ta</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                      {[3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25].map((num) => (
                        <button
                          key={num}
                          onClick={() => setProblemCount(num)}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 
                            ${problemCount === num 
                              ? 'bg-accent text-accent-foreground shadow-accent-glow' 
                              : 'bg-muted/70 dark:bg-slate-800 text-muted-foreground dark:text-slate-400 hover:bg-muted dark:hover:bg-slate-700 hover:text-foreground dark:hover:text-white'
                            }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Boshlash tugmasi */}
              <div className="flex justify-center pt-2 sm:pt-4">
                <Button
                  onClick={startGame}
                  size="lg"
                  className="relative group bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-primary-foreground px-8 sm:px-12 py-4 sm:py-6 text-sm sm:text-lg font-bold rounded-xl sm:rounded-2xl shadow-glow transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <Play className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 group-hover:scale-110 transition-transform" />
                  Mashqni boshlash
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className={`mt-0 ${slideDirection === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`} key={`leaderboard-${activeTab}`}>
            <div className="max-w-2xl mx-auto">
              <Leaderboard currentUserId={user?.id} />
            </div>
          </TabsContent>

          <TabsContent value="stats" className={`mt-0 ${slideDirection === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`} key={`stats-${activeTab}`}>
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
              {/* Statistika kartalar - Mobile optimized */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Card className="bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm border-border/50 dark:border-slate-700/50 shadow-md dark:shadow-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 sm:hover:-translate-y-1 overflow-hidden flex flex-col relative group">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-glow" />
                  <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Target className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <p className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white truncate">{stats.totalProblems}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground dark:text-slate-400 truncate">Jami mashqlar</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm border-border/50 dark:border-slate-700/50 shadow-md dark:shadow-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 sm:hover:-translate-y-1 overflow-hidden flex flex-col relative group">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success to-green-400" />
                  <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-success/10 dark:bg-success/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Check className="h-6 w-6 sm:h-7 sm:w-7 text-success" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <p className="text-2xl sm:text-3xl font-bold text-success truncate">{accuracy}%</p>
                      <p className="text-xs sm:text-sm text-muted-foreground dark:text-slate-400 truncate">Aniqlik</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm border-border/50 dark:border-slate-700/50 shadow-md dark:shadow-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 sm:hover:-translate-y-1 overflow-hidden flex flex-col relative group">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
                  <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-blue-500" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <p className="text-2xl sm:text-3xl font-bold text-blue-500 truncate">{stats.averageTime.toFixed(1)}s</p>
                      <p className="text-xs sm:text-sm text-muted-foreground dark:text-slate-400 truncate">O'rtacha vaqt</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm border-border/50 dark:border-slate-700/50 shadow-md dark:shadow-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 sm:hover:-translate-y-1 overflow-hidden flex flex-col relative group">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning to-amber-400" />
                  <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-warning/10 dark:bg-warning/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-warning" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <p className="text-2xl sm:text-3xl font-bold text-warning truncate">{stats.bestStreak}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground dark:text-slate-400 truncate">Eng uzun seriya</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Mavzular bo'yicha tahlil */}
              {topicStats.length > 0 && (
                <Card className="bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm border-border/50 dark:border-slate-700/50 shadow-md dark:shadow-2xl overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-warning to-accent" />
                  <CardHeader className="bg-gradient-to-r from-accent/5 to-transparent dark:from-accent/10 px-3 sm:px-6">
                    <CardTitle className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center">
                        <Target className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                      </div>
                      <span className="dark:text-white">Mavzular bo'yicha tahlil</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid gap-3">
                      {topicStats.map((topic) => {
                        const isStrong = topic.accuracy >= 70;
                        const isWeak = topic.accuracy < 50;
                        return (
                          <div 
                            key={topic.topic}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                              isStrong 
                                ? 'bg-success/5 border-success/20' 
                                : isWeak 
                                  ? 'bg-destructive/5 border-destructive/20' 
                                  : 'bg-muted/30 border-border/50'
                            }`}
                          >
                            <span className="text-2xl">{topic.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm dark:text-white truncate">{topic.label}</span>
                                <div className="flex items-center gap-2">
                                  {isStrong && <span className="text-xs text-success font-medium">Kuchli 💪</span>}
                                  {isWeak && <span className="text-xs text-destructive font-medium">Yaxshilash kerak 📚</span>}
                                  <span className={`text-sm font-bold ${
                                    isStrong ? 'text-success' : isWeak ? 'text-destructive' : 'text-foreground'
                                  }`}>
                                    {topic.accuracy}%
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all ${
                                      isStrong ? 'bg-success' : isWeak ? 'bg-destructive' : 'bg-primary'
                                    }`}
                                    style={{ width: `${topic.accuracy}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {topic.correct}/{topic.total}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Haftalik grafik */}
              <Card className="bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm border-border/50 dark:border-slate-700/50 shadow-md dark:shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10 px-3 sm:px-6">
                  <CardTitle className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <span className="dark:text-white">Haftalik progress</span>
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
