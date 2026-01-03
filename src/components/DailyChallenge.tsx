import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, Trophy, Check, Play, Medal, Award, Flame, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTTS } from '@/hooks/useTTS';
interface DailyChallenge {
  id: string;
  challenge_date: string;
  formula_type: string;
  digit_count: number;
  speed: number;
  problem_count: number;
  seed: number;
}
interface ChallengeResult {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  is_correct: boolean;
  completion_time: number;
  score: number;
}

// Seed-based random generator for consistent results
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

// Formula qoidalari
const RULES_ALL: Record<number, {
  add: number[];
  subtract: number[];
}> = {
  0: {
    add: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    subtract: []
  },
  1: {
    add: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    subtract: [1]
  },
  2: {
    add: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    subtract: [1, 2]
  },
  3: {
    add: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    subtract: [1, 2, 3]
  },
  4: {
    add: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    subtract: [1, 2, 3, 4]
  },
  5: {
    add: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    subtract: [1, 2, 3, 4, 5]
  },
  6: {
    add: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    subtract: [1, 2, 3, 4, 5, 6]
  },
  7: {
    add: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    subtract: [1, 2, 3, 4, 5, 6, 7]
  },
  8: {
    add: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    subtract: [1, 2, 3, 4, 5, 6, 7, 8]
  },
  9: {
    add: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    subtract: [1, 2, 3, 4, 5, 6, 7, 8, 9]
  }
};
export const DailyChallenge = () => {
  const {
    user
  } = useAuth();
  const {
    speakNumber,
    stop: stopTTS
  } = useTTS({
    useElevenLabs: true
  });
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [results, setResults] = useState<ChallengeResult[]>([]);
  const [userResult, setUserResult] = useState<ChallengeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{
    username: string;
    avatar_url: string | null;
  } | null>(null);
  const [voiceEnabled] = useState(() => {
    const saved = localStorage.getItem('numberTrainer_voiceEnabled');
    return saved !== null ? saved === 'true' : true;
  });

  // O'yin holati
  const [view, setView] = useState<'info' | 'playing' | 'answer' | 'done'>('info');
  const [currentDisplay, setCurrentDisplay] = useState<string | null>(null);
  const [isAddition, setIsAddition] = useState(true);
  const [displayedNumbers, setDisplayedNumbers] = useState<{
    num: string;
    isAdd: boolean;
  }[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const runningResultRef = useRef(0);
  const countRef = useRef(0);
  const seedRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Profilni yuklash
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const {
        data
      } = await supabase.from('profiles').select('username, avatar_url').eq('user_id', user.id).single();
      if (data) {
        setProfile(data);
      }
    };
    loadProfile();
  }, [user]);

  // Kunlik musobaqani yuklash
  useEffect(() => {
    const loadChallenge = async () => {
      setLoading(true);
      try {
        // Bugungi musobaqani olish yoki yaratish
        const {
          data: challengeData,
          error
        } = await supabase.rpc('get_or_create_daily_challenge');
        if (error) throw error;
        if (challengeData) {
          setChallenge(challengeData as DailyChallenge);

          // Natijalarni yuklash
          const {
            data: resultsData
          } = await supabase.from('daily_challenge_results').select('*').eq('challenge_id', challengeData.id).order('score', {
            ascending: false
          }).order('completion_time', {
            ascending: true
          }).limit(50);
          if (resultsData) {
            setResults(resultsData as ChallengeResult[]);

            // Foydalanuvchi natijasini tekshirish
            if (user) {
              const userRes = resultsData.find(r => r.user_id === user.id);
              if (userRes) {
                setUserResult(userRes as ChallengeResult);
                setView('done');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading challenge:', error);
        toast.error('Musobaqani yuklashda xato');
      } finally {
        setLoading(false);
      }
    };
    loadChallenge();
  }, [user]);

  // Realtime natijalar
  useEffect(() => {
    if (!challenge) return;
    const channel = supabase.channel(`daily-results-${challenge.id}`).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'daily_challenge_results',
      filter: `challenge_id=eq.${challenge.id}`
    }, async () => {
      const {
        data
      } = await supabase.from('daily_challenge_results').select('*').eq('challenge_id', challenge.id).order('score', {
        ascending: false
      }).order('completion_time', {
        ascending: true
      }).limit(50);
      if (data) {
        setResults(data as ChallengeResult[]);
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [challenge?.id]);

  // Qolgan vaqtni hisoblash
  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor(diff % (1000 * 60 * 60) / (1000 * 60));
      const seconds = Math.floor(diff % (1000 * 60) / 1000);
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  // Seed asosida son generatsiya qilish
  const generateNextNumberWithSeed = useCallback((digits: number) => {
    const currentResult = runningResultRef.current;
    const lastDigit = Math.abs(currentResult) % 10;
    const rules = RULES_ALL[lastDigit];
    if (!rules) return null;
    const possibleOperations: {
      number: number;
      isAdd: boolean;
    }[] = [];
    rules.add.forEach(num => {
      possibleOperations.push({
        number: num,
        isAdd: true
      });
    });
    rules.subtract.forEach(num => {
      possibleOperations.push({
        number: num,
        isAdd: false
      });
    });
    if (possibleOperations.length === 0) return null;
    seedRef.current++;
    const randomIndex = Math.floor(seededRandom(seedRef.current) * possibleOperations.length);
    const randomOp = possibleOperations[randomIndex];
    let finalNumber = randomOp.number;
    if (digits > 1) {
      seedRef.current++;
      const multiplierIndex = Math.floor(seededRandom(seedRef.current) * digits);
      const multiplier = Math.pow(10, multiplierIndex);
      finalNumber = randomOp.number * Math.min(multiplier, Math.pow(10, digits - 1));
    }
    if (randomOp.isAdd) {
      runningResultRef.current += finalNumber;
    } else {
      runningResultRef.current -= finalNumber;
    }
    return {
      num: finalNumber,
      isAdd: randomOp.isAdd
    };
  }, []);

  // O'yinni boshlash
  const startChallenge = useCallback(() => {
    if (!challenge) return;
    seedRef.current = challenge.seed;
    const maxInitial = Math.pow(10, challenge.digit_count) - 1;
    const minInitial = challenge.digit_count === 1 ? 1 : Math.pow(10, challenge.digit_count - 1);
    seedRef.current++;
    const range = maxInitial - minInitial + 1;
    const initialResult = minInitial + Math.floor(seededRandom(seedRef.current) * range);
    runningResultRef.current = initialResult;
    countRef.current = 1;
    startTimeRef.current = Date.now();
    setCurrentDisplay(String(initialResult));
    setDisplayedNumbers([{
      num: String(initialResult),
      isAdd: true
    }]);
    setIsAddition(true);
    setUserAnswer('');
    setElapsedTime(0);
    setView('playing');

    // Speak first number with ElevenLabs
    if (voiceEnabled) {
      speakNumber(String(initialResult), true, true);
    }

    // Taymer
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 100) / 10);
    }, 100);
    const speedMs = challenge.speed * 1000;
    intervalRef.current = setInterval(() => {
      countRef.current += 1;
      if (countRef.current > challenge.problem_count) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setCurrentDisplay(null);
        setView('answer');
        return;
      }
      const result = generateNextNumberWithSeed(challenge.digit_count);
      if (result !== null) {
        setCurrentDisplay(String(result.num));
        setDisplayedNumbers(prev => [...prev, {
          num: String(result.num),
          isAdd: result.isAdd
        }]);
        setIsAddition(result.isAdd);

        // Speak subsequent numbers with ElevenLabs
        if (voiceEnabled) {
          speakNumber(String(result.num), result.isAdd, false);
        }
      }
    }, speedMs);
  }, [challenge, generateNextNumberWithSeed, voiceEnabled, speakNumber]);

  // Javobni yuborish
  const submitAnswer = async () => {
    if (!user || !challenge || !profile) return;
    const userNum = parseInt(userAnswer, 10);
    const correctAnswer = runningResultRef.current;
    const isCorrect = userNum === correctAnswer;
    const completionTime = (Date.now() - startTimeRef.current) / 1000;
    const score = isCorrect ? Math.max(100 - Math.floor(completionTime), 10) : 0;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      const {
        data,
        error
      } = await supabase.from('daily_challenge_results').insert({
        challenge_id: challenge.id,
        user_id: user.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        answer: userNum,
        correct_answer: correctAnswer,
        is_correct: isCorrect,
        completion_time: completionTime,
        score
      }).select().single();
      if (error) {
        if (error.code === '23505') {
          toast.error('Siz bugun allaqachon qatnashgansiz!');
        } else {
          throw error;
        }
      } else {
        setUserResult(data as ChallengeResult);
        toast(isCorrect ? "To'g'ri javob!" : "Noto'g'ri", {
          description: `To'g'ri javob: ${correctAnswer}`
        });
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Natijani saqlashda xato');
    }
    setView('done');
  };
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-amber-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="text-muted-foreground font-bold">{rank}</span>;
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>;
  }

  // O'yin davomida - Yangi dizayn
  if (view === 'playing' && currentDisplay !== null) {
    const isFirstNumber = countRef.current === 1;
    
    return <div className="fixed inset-0 bg-gradient-to-b from-background via-background to-primary/5 flex flex-col z-50">
        {/* Yuqori panel */}
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Badge className="text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30">
            <Flame className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 text-amber-500" />
            Kunlik musobaqa
          </Badge>
          
          <div className="flex items-center gap-2 text-lg sm:text-xl font-mono bg-muted/80 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-border/50 shadow-lg">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="text-foreground font-semibold">{elapsedTime.toFixed(1)}s</span>
          </div>
        </div>
        
        {/* Progress ko'rsatkichi */}
        <div className="px-6 sm:px-12 mb-4">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary via-primary to-primary/70 rounded-full transition-all duration-300" style={{
            width: `${countRef.current / (challenge?.problem_count || 1) * 100}%`
          }} />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Son: {countRef.current}/{challenge?.problem_count}</span>
            <span>{challenge?.digit_count} xonali</span>
          </div>
        </div>
        
        {/* Asosiy son ko'rsatish joyi - pastroqda */}
        <div className="flex-1 flex flex-col items-center justify-end pb-[20vh] sm:pb-[25vh]">
          {/* Katta animatsiyali orqa fon */}
          <div className="relative">
            {/* Katta yorug'lik effekti */}
            <div className="absolute inset-0 blur-[100px] sm:blur-[150px] rounded-full scale-[2] sm:scale-[2.5]">
              <div className={`absolute inset-0 rounded-full animate-pulse ${
                isFirstNumber 
                  ? 'bg-primary/40' 
                  : isAddition 
                    ? 'bg-emerald-500/40' 
                    : 'bg-red-500/40'
              }`} />
            </div>
            
            {/* Ikkinchi qatlam glow */}
            <div className="absolute inset-0 blur-[60px] sm:blur-[80px] rounded-full scale-150">
              <div className={`absolute inset-0 rounded-full ${
                isFirstNumber 
                  ? 'bg-primary/30' 
                  : isAddition 
                    ? 'bg-emerald-400/30' 
                    : 'bg-red-400/30'
              }`} />
            </div>
            
            {/* Son konteyner */}
            <div 
              key={countRef.current}
              className="relative animate-in fade-in-0 zoom-in-90 duration-300"
            >
              {/* Matematik amal belgisi va son - bir qatorda */}
              <div className="flex items-center justify-center gap-2 sm:gap-4">
                {/* Matematik amal belgisi - har doim ko'rsatiladi */}
                <span 
                  className={`text-[60px] sm:text-[100px] md:text-[140px] lg:text-[180px] font-bold leading-none drop-shadow-2xl ${
                    isFirstNumber 
                      ? 'text-primary' 
                      : isAddition 
                        ? 'text-emerald-500 dark:text-emerald-400' 
                        : 'text-red-500 dark:text-red-400'
                  }`}
                  style={{ 
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    textShadow: isFirstNumber 
                      ? '0 0 60px hsl(var(--primary) / 0.5), 0 0 120px hsl(var(--primary) / 0.3)'
                      : isAddition
                        ? '0 0 60px rgba(16, 185, 129, 0.5), 0 0 120px rgba(16, 185, 129, 0.3)'
                        : '0 0 60px rgba(239, 68, 68, 0.5), 0 0 120px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  {isAddition || isFirstNumber ? '+' : '−'}
                </span>
                
                {/* Asosiy son - juda katta */}
                <span 
                  className="text-[80px] sm:text-[140px] md:text-[200px] lg:text-[260px] font-black leading-none text-foreground dark:text-white drop-shadow-2xl"
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
      </div>;
  }

  // Javob kiritish - pastroqda joylashgan
  if (view === 'answer') {
    return <div className="fixed inset-0 bg-gradient-to-b from-background via-background to-primary/5 flex flex-col z-50 p-4 sm:p-6">
        {/* Yuqori qism - badge */}
        <div className="flex justify-center pt-4">
          <Badge className="text-sm sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30">
            <Flame className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 text-amber-500" />
            Kunlik musobaqa
          </Badge>
        </div>
        
        {/* Asosiy kontent - pastroqda */}
        <div className="flex-1 flex flex-col items-center justify-end pb-[15vh] sm:pb-[20vh]">
          <div className="max-w-md w-full space-y-4 sm:space-y-5 text-center">
            <h2 className="text-xl sm:text-2xl font-bold">Javobingizni kiriting!</h2>
            
            <div className="flex items-center justify-center gap-2 text-muted-foreground bg-muted/80 backdrop-blur-sm px-4 py-2 rounded-full mx-auto w-fit border border-border/50">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="font-mono text-lg sm:text-xl font-bold">{elapsedTime.toFixed(1)}s</span>
            </div>
            
            
            
            <Input type="number" value={userAnswer} onChange={e => setUserAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && userAnswer && submitAnswer()} placeholder="Javob" className="text-center text-3xl sm:text-4xl h-16 sm:h-20 text-primary font-bold rounded-2xl border-2 border-primary/20 focus:border-primary bg-card/80 backdrop-blur-sm" autoFocus />
            
            <Button onClick={submitAnswer} disabled={!userAnswer || !user} size="lg" className="w-full h-14 sm:h-12 text-lg sm:text-base rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg">
              <Check className="h-5 w-5 sm:h-5 sm:w-5 mr-2" />
              Yuborish
            </Button>
            
            {!user && <p className="text-xs sm:text-sm text-muted-foreground">
                Natijani saqlash uchun tizimga kiring
              </p>}
          </div>
        </div>
      </div>;
  }

  // Natijalar va info - Mobile optimized
  return <div className="space-y-4 sm:space-y-6">
      {/* Kunlik musobaqa ma'lumotlari */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
        <CardHeader className="px-3 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 sm:gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <span className="text-base sm:text-lg">Kunlik musobaqa</span>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-normal mt-0.5">
                  {new Date().toLocaleDateString('uz-UZ', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
                </p>
              </div>
            </CardTitle>
            <div className="flex items-center gap-2 sm:flex-col sm:items-end bg-muted/50 sm:bg-transparent px-3 py-2 sm:p-0 rounded-lg sm:rounded-none">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Timer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Yangilanish:</span>
              </div>
              <span className="font-mono text-base sm:text-lg font-bold text-primary">{timeLeft}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
          {challenge && <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Turi</p>
                <p className="font-semibold text-xs sm:text-base">{challenge.formula_type}</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Xona</p>
                <p className="font-semibold text-xs sm:text-base">{challenge.digit_count}-xon</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Tezlik</p>
                <p className="font-semibold text-xs sm:text-base">{challenge.speed}s</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Sonlar</p>
                <p className="font-semibold text-xs sm:text-base">{challenge.problem_count}</p>
              </div>
            </div>}
          
          {view === 'info' && !userResult && <Button onClick={startChallenge} size="lg" className="w-full h-12 sm:h-11 text-base sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" disabled={!user}>
              <Play className="h-5 w-5 sm:h-5 sm:w-5 mr-2" />
              Musobaqani boshlash
            </Button>}
          
          {!user && view === 'info' && <p className="text-center text-xs sm:text-sm text-muted-foreground mt-2">
              Qatnashish uchun tizimga kiring
            </p>}
          
          {userResult && <div className={cn("p-3 sm:p-4 rounded-xl text-center", userResult.is_correct ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30")}>
              <p className="text-base sm:text-lg font-semibold">
                {userResult.is_correct ? "✓ To'g'ri javob!" : "✗ Noto'g'ri"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Vaqt: <span className="font-mono font-bold">{userResult.completion_time.toFixed(1)}s</span> | Ball: <span className="font-bold text-primary">{userResult.score}</span>
              </p>
            </div>}
        </CardContent>
      </Card>
      
      {/* Reyting - Mobile optimized */}
      <Card>
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
            Bugungi reyting
            <Badge variant="secondary" className="ml-auto text-[10px] sm:text-xs">
              {results.length} ishtirokchi
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
          {results.length === 0 ? <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <Trophy className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-30" />
              <p className="text-sm sm:text-base">Hali hech kim qatnashmadi</p>
              <p className="text-xs sm:text-sm">Birinchi bo'lib qatnashing!</p>
            </div> : <div className="space-y-2 max-h-[350px] sm:max-h-[400px] overflow-y-auto pr-1 sm:pr-2">
              {results.map((result, index) => {
            const rank = index + 1;
            const isCurrentUser = result.user_id === user?.id;
            return <div key={result.id} className={cn('flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border transition-all', isCurrentUser && 'ring-2 ring-primary ring-offset-1 sm:ring-offset-2 ring-offset-background bg-primary/5', rank === 1 && !isCurrentUser && 'bg-amber-500/5 border-amber-500/20', rank === 2 && !isCurrentUser && 'bg-gray-400/5 border-gray-400/20', rank === 3 && !isCurrentUser && 'bg-amber-700/5 border-amber-700/20', rank > 3 && !isCurrentUser && 'bg-card border-border/40')}>
                    <div className="w-6 sm:w-8 flex justify-center flex-shrink-0">
                      {getRankIcon(rank)}
                    </div>
                    
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                      <AvatarImage src={result.avatar_url || undefined} />
                      <AvatarFallback className="text-xs sm:text-sm">{result.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium text-sm sm:text-base truncate", isCurrentUser && "text-primary")}>
                        {result.username}
                        {isCurrentUser && <span className="text-[10px] sm:text-xs ml-1">(siz)</span>}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-mono">
                        {result.completion_time.toFixed(1)}s
                      </p>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <Badge variant={result.is_correct ? "default" : "destructive"} className="text-[10px] sm:text-xs px-2 py-0.5">
                        {result.score}
                      </Badge>
                    </div>
                  </div>;
          })}
            </div>}
        </CardContent>
      </Card>
    </div>;
};