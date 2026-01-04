import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Users, Crown, Play, Copy, Check, Clock, Trophy, ArrowLeft, Loader2, Star, Zap, Target, Flame, Swords, Timer, TrendingUp, Medal, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useAdaptiveGamification } from '@/hooks/useAdaptiveGamification';
import { GamificationDisplay } from '@/components/GamificationDisplay';
import { useSound } from '@/hooks/useSound';

type FormulaType = 'oddiy' | 'formula5' | 'formula10plus' | 'formula10minus' | 'hammasi';

interface Room {
  id: string;
  room_code: string;
  host_id: string;
  status: 'waiting' | 'playing' | 'finished';
  formula_type: string;
  digit_count: number;
  speed: number;
  problem_count: number;
  current_problem: number;
}

interface Participant {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  answer: number | null;
  is_correct: boolean | null;
  answer_time: number | null;
  score: number;
  is_ready: boolean;
}

// Formula qoidalari
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

interface MultiplayerModeProps {
  onBack: () => void;
}

export const MultiplayerMode = ({ onBack }: MultiplayerModeProps) => {
  const { user } = useAuth();
  const { playSound } = useSound();
  const [view, setView] = useState<'menu' | 'create' | 'join' | 'lobby' | 'countdown' | 'playing' | 'results'>('menu');
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [roomCode, setRoomCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  
  // Gamification hook
  const gamification = useAdaptiveGamification({
    gameType: 'multiplayer',
    baseScore: 15,
    enabled: !!user,
  });
  
  // O'yin sozlamalari
  const [formulaType, setFormulaType] = useState<FormulaType>('oddiy');
  const [digitCount, setDigitCount] = useState(1);
  const [speed, setSpeed] = useState(0.5);
  const [problemCount, setProblemCount] = useState(5);
  
  // O'yin holati
  const [currentDisplay, setCurrentDisplay] = useState<string | null>(null);
  const [isAddition, setIsAddition] = useState(true);
  const [displayedNumbers, setDisplayedNumbers] = useState<{ num: string; isAdd: boolean }[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [lastXpEarned, setLastXpEarned] = useState(0);
  const [lastScoreEarned, setLastScoreEarned] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [showScoreAnimation, setShowScoreAnimation] = useState(false);
  const [liveRankings, setLiveRankings] = useState<Participant[]>([]);
  const [showRankChange, setShowRankChange] = useState(false);
  
  const runningResultRef = useRef(0);
  const countRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Profilni yuklash
  useEffect(() => {
    if (!user) return;
    
    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setProfile(data);
      }
    };
    
    loadProfile();
  }, [user]);

  // Realtime obunalar
  useEffect(() => {
    if (!room) return;

    // Xona yangilanishlarini kuzatish
    const roomChannel = supabase
      .channel(`room-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'multiplayer_rooms',
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          console.log('Room update:', payload);
          if (payload.eventType === 'UPDATE') {
            const newRoom = payload.new as Room;
            setRoom(newRoom);
            
            if (newRoom.status === 'playing' && view === 'lobby') {
              setView('countdown');
              // Start countdown animation
              let count = 3;
              setCountdown(count);
              playSound('countdown');
              
              const countdownInterval = setInterval(() => {
                count--;
                setCountdown(count);
                if (count > 0) playSound('countdown');
                
                if (count <= 0) {
                  clearInterval(countdownInterval);
                  playSound('start');
                  setView('playing');
                  startGameSequence(newRoom);
                }
              }, 1000);
            }
          }
          if (payload.eventType === 'DELETE') {
            toast.error('Xona yopildi');
            resetState();
          }
        }
      )
      .subscribe();

    // Ishtirokchilar yangilanishlarini kuzatish
    const participantsChannel = supabase
      .channel(`participants-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'multiplayer_participants',
          filter: `room_id=eq.${room.id}`,
        },
        async () => {
          // Ishtirokchilarni qayta yuklash
          const { data } = await supabase
            .from('multiplayer_participants')
            .select('*')
            .eq('room_id', room.id)
            .order('score', { ascending: false });
          
          if (data) {
            setParticipants(data as Participant[]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [room?.id, view]);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const resetState = () => {
    setRoom(null);
    setParticipants([]);
    setRoomCode('');
    setView('menu');
    setCurrentDisplay(null);
    setDisplayedNumbers([]);
    setUserAnswer('');
    setHasAnswered(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Xona yaratish
  const createRoom = async () => {
    if (!user || !profile) return;
    
    setLoading(true);
    try {
      const code = generateRoomCode();
      
      const { data: roomData, error: roomError } = await supabase
        .from('multiplayer_rooms')
        .insert({
          host_id: user.id,
          room_code: code,
          formula_type: formulaType,
          digit_count: digitCount,
          speed,
          problem_count: problemCount,
        })
        .select()
        .single();
      
      if (roomError) throw roomError;
      
      // Xonaga qo'shilish
      const { error: participantError } = await supabase
        .from('multiplayer_participants')
        .insert({
          room_id: roomData.id,
          user_id: user.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
        });
      
      if (participantError) throw participantError;
      
      setRoom(roomData as Room);
      setRoomCode(code);
      setView('lobby');
      
      // Ishtirokchilarni yuklash
      const { data: participantsData } = await supabase
        .from('multiplayer_participants')
        .select('*')
        .eq('room_id', roomData.id);
      
      if (participantsData) {
        setParticipants(participantsData as Participant[]);
      }
      
      toast.success('Xona yaratildi!');
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Xona yaratishda xato');
    } finally {
      setLoading(false);
    }
  };

  // Xonaga qo'shilish
  const joinRoom = async () => {
    if (!user || !profile || !roomCode.trim()) return;
    
    setLoading(true);
    try {
      const { data: roomData, error: roomError } = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .eq('status', 'waiting')
        .single();
      
      if (roomError || !roomData) {
        toast.error('Xona topilmadi yoki o\'yin boshlangan');
        return;
      }
      
      const { error: participantError } = await supabase
        .from('multiplayer_participants')
        .insert({
          room_id: roomData.id,
          user_id: user.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
        });
      
      if (participantError) {
        if (participantError.code === '23505') {
          toast.error('Siz allaqachon bu xonadasiz');
        } else {
          throw participantError;
        }
        return;
      }
      
      setRoom(roomData as Room);
      setView('lobby');
      
      // Ishtirokchilarni yuklash
      const { data: participantsData } = await supabase
        .from('multiplayer_participants')
        .select('*')
        .eq('room_id', roomData.id);
      
      if (participantsData) {
        setParticipants(participantsData as Participant[]);
      }
      
      toast.success('Xonaga qo\'shildingiz!');
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Xonaga qo\'shilishda xato');
    } finally {
      setLoading(false);
    }
  };

  // O'yinni boshlash (faqat host)
  const startGame = async () => {
    if (!room || room.host_id !== user?.id) return;
    
    await supabase
      .from('multiplayer_rooms')
      .update({ 
        status: 'playing',
        started_at: new Date().toISOString(),
      })
      .eq('id', room.id);
  };

  // O'yin ketma-ketligini boshlash
  const startGameSequence = useCallback((gameRoom: Room) => {
    const maxInitial = Math.pow(10, gameRoom.digit_count) - 1;
    const minInitial = gameRoom.digit_count === 1 ? 1 : Math.pow(10, gameRoom.digit_count - 1);
    const initialResult = Math.floor(Math.random() * (maxInitial - minInitial + 1)) + minInitial;
    
    runningResultRef.current = initialResult;
    countRef.current = 1;
    startTimeRef.current = Date.now();
    
    setCurrentDisplay(String(initialResult));
    setDisplayedNumbers([{ num: String(initialResult), isAdd: true }]);
    setIsAddition(true);
    setUserAnswer('');
    setHasAnswered(false);
    setElapsedTime(0);
    
    // Taymer
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 100) / 10);
    }, 100);
    
    const speedMs = gameRoom.speed * 1000;
    
    intervalRef.current = setInterval(() => {
      countRef.current += 1;
      
      if (countRef.current > gameRoom.problem_count) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setCurrentDisplay(null);
        return;
      }
      
      const result = generateNextNumber(gameRoom.digit_count);
      if (result !== null) {
        setCurrentDisplay(String(result.num));
        setDisplayedNumbers(prev => [...prev, { num: String(result.num), isAdd: result.isAdd }]);
        setIsAddition(result.isAdd);
      }
    }, speedMs);
  }, []);

  const generateNextNumber = (digits: number) => {
    const currentResult = runningResultRef.current;
    const lastDigit = Math.abs(currentResult) % 10;
    const rules = RULES_ALL[lastDigit];
    
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
    if (digits > 1) {
      const multiplier = Math.pow(10, Math.floor(Math.random() * digits));
      finalNumber = randomOp.number * Math.min(multiplier, Math.pow(10, digits - 1));
    }
    
    if (randomOp.isAdd) {
      runningResultRef.current += finalNumber;
    } else {
      runningResultRef.current -= finalNumber;
    }
    
    return { num: finalNumber, isAdd: randomOp.isAdd };
  };

  // Javobni yuborish
  const submitAnswer = async () => {
    if (!user || !room || hasAnswered) return;
    
    const userNum = parseInt(userAnswer, 10);
    const correctAnswer = runningResultRef.current;
    const isCorrect = userNum === correctAnswer;
    const answerTime = (Date.now() - startTimeRef.current);
    
    setHasAnswered(true);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Process gamification
    const { xpEarned, scoreEarned } = await gamification.processAnswer(
      isCorrect,
      answerTime,
      room.digit_count
    );
    
    setLastXpEarned(xpEarned);
    setLastScoreEarned(scoreEarned);
    
    // Javobni saqlash - gamification score bilan
    const finalScore = isCorrect ? scoreEarned : 0;
    await supabase
      .from('multiplayer_participants')
      .update({
        answer: userNum,
        is_correct: isCorrect,
        answer_time: answerTime / 1000,
        score: finalScore,
      })
      .eq('room_id', room.id)
      .eq('user_id', user.id);
    
    toast(isCorrect ? "To'g'ri javob!" : "Noto'g'ri", {
      description: isCorrect 
        ? `+${scoreEarned} ball, +${xpEarned} XP` 
        : `To'g'ri javob: ${correctAnswer}`,
    });
    
    // Natijalarni ko'rsatish
    setTimeout(() => {
      setView('results');
    }, 2000);
  };

  // Xonadan chiqish
  const leaveRoom = async () => {
    if (!room || !user) return;
    
    await supabase
      .from('multiplayer_participants')
      .delete()
      .eq('room_id', room.id)
      .eq('user_id', user.id);
    
    // Agar host bo'lsa, xonani o'chirish
    if (room.host_id === user.id) {
      await supabase
        .from('multiplayer_rooms')
        .delete()
        .eq('id', room.id);
    }
    
    resetState();
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode || room?.room_code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Kod nusxalandi!');
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <Users className="h-16 w-16 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-bold">Multiplayer rejimi</h2>
        <p className="text-muted-foreground">Multiplayer o'yinida qatnashish uchun tizimga kiring</p>
        <Button onClick={onBack} variant="outline">Orqaga</Button>
      </div>
    );
  }

  // Countdown view
  if (view === 'countdown') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/10 flex flex-col items-center justify-center z-50 overflow-hidden">
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary/30 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Countdown Number */}
        <div className="relative">
          {/* Outer Ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 rounded-full border-4 border-primary/20 animate-ping" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border-4 border-primary/40 animate-pulse" />
          </div>
          
          {/* Number */}
          <div 
            key={countdown}
            className="relative w-40 h-40 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/50 animate-scale-in"
          >
            <span className="text-7xl font-bold text-primary-foreground">
              {countdown > 0 ? countdown : '🚀'}
            </span>
          </div>
        </div>

        {/* Message */}
        <div className="mt-8 text-center animate-fade-in">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {countdown > 0 ? 'Tayyorlaning!' : 'Boshlandi!'}
          </h2>
          <p className="text-muted-foreground mt-2">
            {participants.length} o'yinchi tayyor
          </p>
        </div>

        {/* Participants Circle */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-4">
          {participants.map((p, i) => (
            <div 
              key={p.id} 
              className="flex flex-col items-center gap-2 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="relative">
                <Avatar className="h-14 w-14 border-3 border-primary shadow-lg ring-2 ring-primary/30">
                  <AvatarImage src={p.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">
                    {p.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground">{p.username.slice(0, 8)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  // O'yin davomida - Enhanced with real-time competition
  if (view === 'playing' && currentDisplay !== null) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center z-50 overflow-hidden">
        {/* Animated Background with Particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          {/* Flying particles */}
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary/40 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Live Timer with Pulse Effect */}
        <div className="absolute top-6 right-6">
          <div className="relative flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-muted/90 to-muted/70 backdrop-blur-sm border border-border/50 shadow-lg">
            <div className="absolute inset-0 rounded-2xl bg-red-500/10 animate-pulse"></div>
            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50"></div>
            <Timer className="h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-mono font-bold tabular-nums text-foreground">{elapsedTime.toFixed(1)}s</span>
          </div>
        </div>
        
        {/* Live Rankings - Real-time Competition Display */}
        <div className="absolute top-6 left-6 space-y-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/80 backdrop-blur-sm border border-border/50">
            <Swords className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Raqobat</span>
          </div>
          <div className="space-y-1.5">
            {participants.slice(0, 4).map((p, i) => (
              <div 
                key={p.id} 
                className={`flex items-center gap-3 px-3 py-2 rounded-xl backdrop-blur-sm border transition-all duration-500 ${
                  p.user_id === user?.id 
                    ? 'bg-primary/20 border-primary/50 shadow-lg shadow-primary/20' 
                    : 'bg-muted/60 border-border/30'
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Rank Badge */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-amber-400 text-amber-900' :
                  i === 1 ? 'bg-gray-300 text-gray-700' :
                  i === 2 ? 'bg-amber-700 text-amber-100' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {i + 1}
                </div>
                
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={p.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                    {p.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{p.username.slice(0, 10)}</p>
                </div>
                
                {p.user_id === user?.id && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">Siz</Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Gamification Display - Compact */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
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
            compact
          />
        </div>

        {/* Problem Counter with Progress Ring */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2">
          <div className="relative flex items-center gap-3 px-5 py-3 rounded-2xl bg-muted/80 backdrop-blur-sm border border-border/50">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${(countRef.current / (room?.problem_count || problemCount)) * 100.5} 100.5`}
                  className="text-primary transition-all duration-300"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {countRef.current}
              </span>
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground">Son</p>
              <p className="text-sm font-semibold">{countRef.current} / {room?.problem_count || problemCount}</p>
            </div>
          </div>
        </div>
        
        {/* Main Number Display - Enhanced Animation */}
        <div className="relative flex items-center justify-center">
          {/* Glow Effect */}
          <div className={`absolute inset-0 blur-3xl transition-colors duration-300 scale-150 ${isAddition ? 'bg-emerald-500/30' : 'bg-rose-500/30'}`}></div>
          
          {/* Number Container with Enhanced Animation */}
          <div 
            key={currentDisplay}
            className="relative flex items-center justify-center animate-scale-in"
          >
            {/* Operation Sign with Glow */}
            {countRef.current > 1 && (
              <div className="relative mr-4">
                <span className={`text-7xl md:text-9xl font-light drop-shadow-lg ${isAddition ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isAddition ? '+' : '−'}
                </span>
                <div className={`absolute inset-0 blur-xl ${isAddition ? 'bg-emerald-500/30' : 'bg-rose-500/30'}`}></div>
              </div>
            )}
            
            {/* Number with Shadow */}
            <span className="text-[140px] md:text-[200px] font-extralight tracking-tight drop-shadow-2xl">
              {currentDisplay}
            </span>
          </div>
        </div>

        {/* Progress Bar with Gradient */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-72">
          <Progress 
            value={(countRef.current / (room?.problem_count || problemCount)) * 100} 
            className="h-2 bg-muted/50"
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Boshlanish</span>
            <span>Tugash</span>
          </div>
        </div>
      </div>
    );
  }

  // Javob kiritish - Enhanced with urgency animations
  if (view === 'playing' && currentDisplay === null && !hasAnswered) {
    const answeredCount = participants.filter(p => p.answer !== null).length;
    
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-amber-500/10 flex flex-col items-center justify-center z-50 p-6">
        {/* Urgency Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 animate-pulse"></div>
        </div>

        <div className="max-w-md w-full space-y-6 text-center animate-fade-in">
          {/* Header with Timer */}
          <div className="relative">
            <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-orange-500/30 mb-4 animate-pulse">
              <Target className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Javobingizni kiriting!
            </h2>
            <p className="text-muted-foreground mt-2 flex items-center justify-center gap-2">
              <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
              Tez bo'ling!
              <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
            </p>
          </div>
          
          {/* Answer Input - Enhanced */}
          <div className="space-y-4">
            <div className="relative">
              <Input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && userAnswer && submitAnswer()}
                placeholder="?"
                className="text-center text-5xl h-24 font-mono border-3 border-amber-400/50 focus:border-amber-500 bg-muted/30 shadow-lg"
                autoFocus
              />
              {userAnswer && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Sparkles className="h-6 w-6 text-amber-500 animate-pulse" />
                </div>
              )}
            </div>
            
            <Button 
              onClick={submitAnswer} 
              disabled={!userAnswer} 
              size="lg" 
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-xl shadow-green-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="h-6 w-6 mr-2" />
              Yuborish
            </Button>
          </div>

          {/* Real-time Competition Status */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Swords className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Raqobat holati</p>
            </div>
            
            <div className="flex justify-center gap-4 flex-wrap">
              {participants.map((p, i) => (
                <div 
                  key={p.id} 
                  className="flex flex-col items-center gap-2 animate-fade-in"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="relative">
                    <Avatar className={`h-12 w-12 border-3 transition-all duration-500 ${
                      p.answer !== null 
                        ? 'border-emerald-500 ring-4 ring-emerald-500/30 scale-110' 
                        : 'border-muted-foreground/30 opacity-70'
                    }`}>
                      <AvatarImage src={p.avatar_url || undefined} />
                      <AvatarFallback className="text-sm font-bold">{p.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {p.answer !== null ? (
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                    ) : (
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-amber-500/80 rounded-full flex items-center justify-center animate-pulse">
                        <Clock className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium transition-colors ${
                    p.answer !== null ? 'text-emerald-500' : 'text-muted-foreground'
                  }`}>
                    {p.username.slice(0, 6)}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4 space-y-2">
              <Progress value={(answeredCount / participants.length) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">{answeredCount}</span> / {participants.length} javob berdi
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Javob kutish (javob bergandan keyin) - Enhanced waiting screen
  if (view === 'playing' && currentDisplay === null && hasAnswered) {
    const answeredCount = participants.filter(p => p.answer !== null).length;
    const allAnswered = answeredCount === participants.length;
    
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background via-emerald-500/5 to-primary/5 flex flex-col items-center justify-center z-50 p-6">
        <div className="max-w-md w-full space-y-8 text-center animate-fade-in">
          {/* Success Animation */}
          <div className="relative">
            {/* Ripple Effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-40 w-40 rounded-full border-2 border-emerald-500/30 animate-ping" style={{ animationDuration: '2s' }}></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-32 w-32 rounded-full border-2 border-emerald-500/40 animate-ping" style={{ animationDuration: '1.5s' }}></div>
            </div>
            
            {/* Main Badge */}
            <div className="relative h-28 w-28 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
              <Check className="h-14 w-14 text-white animate-scale-in" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">
              Javob yuborildi!
            </h2>
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Raqiblarni kutmoqdamiz...
            </p>
          </div>

          {/* Live Rankings During Wait */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Real-time holat</p>
            </div>
            
            <div className="space-y-3">
              {participants.map((p, i) => (
                <div 
                  key={p.id} 
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-500 ${
                    p.answer !== null 
                      ? 'bg-emerald-500/10 border border-emerald-500/30' 
                      : 'bg-muted/30 border border-transparent'
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-amber-400 text-amber-900' :
                    i === 1 ? 'bg-gray-300 text-gray-700' :
                    i === 2 ? 'bg-amber-700 text-amber-100' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {i + 1}
                  </div>
                  
                  <Avatar className={`h-10 w-10 border-2 transition-all ${
                    p.answer !== null ? 'border-emerald-500' : 'border-muted'
                  }`}>
                    <AvatarImage src={p.avatar_url || undefined} />
                    <AvatarFallback className="text-sm">{p.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium truncate">{p.username}</p>
                  </div>
                  
                  {p.answer !== null ? (
                    <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                      <Check className="h-3 w-3 mr-1" />
                      Tayyor
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground animate-pulse">
                      <Clock className="h-3 w-3 mr-1" />
                      Kutilmoqda
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            
            {/* Progress */}
            <div className="mt-4 space-y-2">
              <Progress value={(answeredCount / participants.length) * 100} className="h-3" />
              <p className="text-sm font-medium">
                <span className="text-emerald-500">{answeredCount}</span> / {participants.length} o'yinchi tayyor
              </p>
            </div>
          </div>

          {allAnswered && (
            <div className="flex items-center justify-center gap-3 text-primary font-semibold animate-pulse">
              <Sparkles className="h-5 w-5" />
              <span>Natijalar tayyorlanmoqda...</span>
              <Sparkles className="h-5 w-5" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Natijalar - Enhanced with winner celebration
  if (view === 'results') {
    const sortedParticipants = [...participants].sort((a, b) => {
      if (a.is_correct && !b.is_correct) return -1;
      if (!a.is_correct && b.is_correct) return 1;
      return (a.answer_time || 999) - (b.answer_time || 999);
    });

    const podiumParticipants = sortedParticipants.slice(0, 3);
    const otherParticipants = sortedParticipants.slice(3);
    const isWinner = sortedParticipants[0]?.user_id === user?.id;
    const myRank = sortedParticipants.findIndex(p => p.user_id === user?.id) + 1;

    // Confetti animation on first render
    useEffect(() => {
      // Play winner or complete sound
      if (isWinner) {
        playSound('winner');
      } else {
        playSound('complete');
      }

      const duration = 4000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 65,
          origin: { x: 0, y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 65,
          origin: { x: 1, y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }, []);
    
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Winner Banner */}
        {isWinner && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 p-6 text-center shadow-2xl shadow-amber-500/30">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
            <div className="relative">
              <Crown className="h-16 w-16 mx-auto text-white mb-3 drop-shadow-lg animate-bounce" />
              <h2 className="text-3xl font-black text-white drop-shadow-lg">TABRIKLAYMIZ!</h2>
              <p className="text-white/90 font-semibold mt-1">Siz g'olib bo'ldingiz!</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-2xl scale-150 animate-pulse"></div>
            <Trophy className="relative h-16 w-16 text-amber-500 drop-shadow-lg" />
          </div>
          <h2 className="text-2xl font-bold">O'yin yakunlandi!</h2>
          <div className="flex items-center justify-center gap-3 mt-2">
            <p className="text-muted-foreground">To'g'ri javob:</p>
            <Badge variant="outline" className="text-lg font-mono font-bold px-4 py-1">
              {runningResultRef.current}
            </Badge>
          </div>
        </div>

        {/* Your Result Card - Enhanced */}
        <Card className={`relative overflow-hidden border-2 ${
          isWinner 
            ? 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-400' 
            : 'bg-gradient-to-br from-primary/5 to-accent/5 border-primary/30'
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-400/20 to-transparent rounded-bl-full"></div>
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black ${
                  myRank === 1 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' :
                  myRank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700' :
                  myRank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  #{myRank}
                </div>
                <div>
                  <h3 className="font-bold text-lg">Sizning natijangiz</h3>
                  <p className="text-sm text-muted-foreground">Level {gamification.level}</p>
                </div>
              </div>
              {isWinner && (
                <Medal className="h-10 w-10 text-amber-500 animate-pulse" />
              )}
            </div>
            
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-background/50">
                <p className="text-2xl font-bold text-primary">{lastScoreEarned}</p>
                <p className="text-xs text-muted-foreground">Ball</p>
              </div>
              <div className="p-3 rounded-xl bg-background/50">
                <p className="text-2xl font-bold text-emerald-500">+{lastXpEarned}</p>
                <p className="text-xs text-muted-foreground">XP</p>
              </div>
              <div className="p-3 rounded-xl bg-background/50">
                <p className="text-2xl font-bold text-amber-500">{gamification.combo}x</p>
                <p className="text-xs text-muted-foreground">Combo</p>
              </div>
              <div className="p-3 rounded-xl bg-background/50">
                <p className="text-2xl font-bold text-purple-500">{gamification.totalXp.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Jami XP</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Podium - Enhanced with animations */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent rounded-3xl"></div>
          <div className="flex items-end justify-center gap-3 md:gap-6 h-72 px-4 pt-4">
            {/* 2nd Place */}
            {podiumParticipants[1] && (
              <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: '300ms' }}>
                <div className="relative">
                  <Avatar className="h-16 w-16 border-4 border-gray-300 shadow-xl mb-2 ring-4 ring-gray-300/30">
                    <AvatarImage src={podiumParticipants[1].avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 font-bold text-xl">
                      {podiumParticipants[1].username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {podiumParticipants[1].user_id === user?.id && (
                    <Badge className="absolute -top-2 -right-2 bg-primary text-[10px] px-1">Siz</Badge>
                  )}
                </div>
                <p className="font-semibold text-sm mb-2 truncate max-w-[90px]">{podiumParticipants[1].username}</p>
                <div className="w-24 md:w-32 h-28 bg-gradient-to-t from-gray-400 to-gray-200 rounded-t-2xl flex flex-col items-center justify-start pt-4 shadow-xl border-t-4 border-gray-300">
                  <span className="text-4xl font-black text-gray-600">2</span>
                  <span className="text-xs text-gray-500 mt-1 font-medium">{podiumParticipants[1].answer_time?.toFixed(1)}s</span>
                  {podiumParticipants[1].is_correct && (
                    <Check className="h-4 w-4 text-emerald-500 mt-1" />
                  )}
                </div>
              </div>
            )}

            {/* 1st Place */}
            {podiumParticipants[0] && (
              <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="relative">
                  <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 h-10 w-10 text-amber-400 drop-shadow-lg animate-bounce" />
                  <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-xl scale-110 animate-pulse"></div>
                  <Avatar className="relative h-24 w-24 border-4 border-amber-400 shadow-2xl ring-4 ring-amber-400/40">
                    <AvatarImage src={podiumParticipants[0].avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-3xl">
                      {podiumParticipants[0].username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {podiumParticipants[0].user_id === user?.id && (
                    <Badge className="absolute -top-2 -right-2 bg-primary text-[10px] px-1">Siz</Badge>
                  )}
                </div>
                <p className="font-bold text-lg mt-3 mb-2 truncate max-w-[120px]">{podiumParticipants[0].username}</p>
                <div className="w-28 md:w-40 h-40 bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-2xl flex flex-col items-center justify-start pt-4 shadow-2xl border-t-4 border-amber-400">
                  <Sparkles className="h-6 w-6 text-amber-700 mb-1 animate-pulse" />
                  <span className="text-5xl font-black text-amber-800">1</span>
                  <span className="text-sm text-amber-700 font-bold mt-1">{podiumParticipants[0].answer_time?.toFixed(1)}s</span>
                  {podiumParticipants[0].is_correct && (
                    <Badge className="mt-2 bg-emerald-500 shadow-md">
                      <Check className="h-3 w-3 mr-1" />
                      To'g'ri
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {podiumParticipants[2] && (
              <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: '500ms' }}>
                <div className="relative">
                  <Avatar className="h-14 w-14 border-4 border-amber-700 shadow-xl mb-2 ring-4 ring-amber-700/30">
                    <AvatarImage src={podiumParticipants[2].avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-amber-700 to-amber-800 text-white font-bold">
                      {podiumParticipants[2].username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {podiumParticipants[2].user_id === user?.id && (
                    <Badge className="absolute -top-2 -right-2 bg-primary text-[10px] px-1">Siz</Badge>
                  )}
                </div>
                <p className="font-semibold text-sm mb-2 truncate max-w-[80px]">{podiumParticipants[2].username}</p>
                <div className="w-20 md:w-28 h-20 bg-gradient-to-t from-amber-800 to-amber-600 rounded-t-2xl flex flex-col items-center justify-start pt-3 shadow-xl border-t-4 border-amber-700">
                  <span className="text-3xl font-black text-amber-200">3</span>
                  <span className="text-xs text-amber-300">{podiumParticipants[2].answer_time?.toFixed(1)}s</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Other Participants - Enhanced */}
        {otherParticipants.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-center text-muted-foreground flex items-center justify-center gap-2">
              <Users className="h-5 w-5" />
              Boshqa ishtirokchilar
            </h3>
            <div className="space-y-2">
              {otherParticipants.map((p, index) => (
                <Card 
                  key={p.id} 
                  className={`overflow-hidden transition-all hover:border-primary/30 ${
                    p.user_id === user?.id ? 'border-primary/50 bg-primary/5' : ''
                  }`}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
                      {index + 4}
                    </div>
                    <Avatar className="h-10 w-10 border-2 border-border">
                      <AvatarImage src={p.avatar_url || undefined} />
                      <AvatarFallback>{p.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{p.username}</p>
                        {p.user_id === user?.id && (
                          <Badge variant="outline" className="text-[10px]">Siz</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-mono">{p.answer ?? '-'}</span> • {p.answer_time?.toFixed(1)}s
                      </p>
                    </div>
                    <Badge variant={p.is_correct ? 'default' : 'destructive'} className={p.is_correct ? 'bg-emerald-500' : ''}>
                      {p.is_correct ? "To'g'ri" : "Noto'g'ri"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Stats Summary - Enhanced */}
        <Card className="bg-gradient-to-br from-muted/50 to-muted/30 border-border/50">
          <CardContent className="p-5">
            <h3 className="text-sm font-medium text-muted-foreground text-center mb-4">O'yin statistikasi</h3>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="space-y-1">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Check className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-emerald-500">{sortedParticipants.filter(p => p.is_correct).length}</p>
                <p className="text-xs text-muted-foreground">To'g'ri</p>
              </div>
              <div className="space-y-1">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl font-bold">{sortedParticipants.length}</p>
                <p className="text-xs text-muted-foreground">O'yinchilar</p>
              </div>
              <div className="space-y-1">
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-amber-500">{room?.problem_count || problemCount}</p>
                <p className="text-xs text-muted-foreground">Sonlar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Action Buttons - Enhanced */}
        <div className="flex gap-3">
          <Button 
            onClick={resetState} 
            size="lg" 
            className="flex-1 h-14 text-lg font-semibold"
            variant="outline"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Menyuga
          </Button>
          <Button 
            onClick={() => {
              resetState();
              setView('create');
            }} 
            size="lg" 
            className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 shadow-lg"
          >
            <Play className="h-5 w-5 mr-2" />
            Qayta o'ynash
          </Button>
        </div>
      </div>
    );
  }

  // Lobby
  if (view === 'lobby' && room) {
    const isHost = room.host_id === user.id;
    
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button onClick={leaveRoom} variant="ghost" size="sm" className="gap-2 hover:bg-destructive/10 hover:text-destructive">
            <ArrowLeft className="h-4 w-4" />
            Chiqish
          </Button>
          <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            {participants.length} o'yinchi
          </Badge>
        </div>
        
        {/* Room Code Card */}
        <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
          <CardContent className="p-6 text-center relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">Xona kodi</p>
            <div className="flex items-center justify-center gap-3">
              <div className="flex gap-1.5">
                {room.room_code.split('').map((char, i) => (
                  <span 
                    key={i} 
                    className="w-10 h-12 bg-background border-2 border-border rounded-lg flex items-center justify-center text-2xl font-mono font-bold shadow-sm"
                  >
                    {char}
                  </span>
                ))}
              </div>
              <Button 
                onClick={copyRoomCode} 
                variant="outline" 
                size="icon"
                className="h-12 w-12 rounded-lg shrink-0"
              >
                {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Do'stlaringizga yuboring va birga o'ynang!
            </p>
          </CardContent>
        </Card>

        {/* Game Settings Summary */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-3 rounded-xl bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Formula</p>
            <p className="text-sm font-semibold truncate">{room.formula_type}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Xona</p>
            <p className="text-sm font-semibold">{room.digit_count}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Tezlik</p>
            <p className="text-sm font-semibold">{room.speed}s</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Sonlar</p>
            <p className="text-sm font-semibold">{room.problem_count}</p>
          </div>
        </div>
        
        {/* Participants List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">O'yinchilar</h3>
            <span className="text-sm text-muted-foreground">
              {participants.length < 2 && "Kamida 2 ta o'yinchi kerak"}
            </span>
          </div>
          <div className="space-y-2">
            {participants.map((p, index) => (
              <div 
                key={p.id} 
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-muted/60 to-muted/30 rounded-xl border border-border/50 transition-all hover:border-primary/30"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                    <AvatarImage src={p.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">
                      {p.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {p.user_id === room.host_id && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                      <Crown className="h-3 w-3 text-amber-900" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{p.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.user_id === room.host_id ? 'Host' : 'O\'yinchi'}
                  </p>
                </div>
                {p.user_id === user?.id && (
                  <Badge variant="outline" className="text-xs">Siz</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Action Button */}
        {isHost ? (
          <Button 
            onClick={startGame} 
            size="lg" 
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-green-500/25 transition-all hover:shadow-green-500/40"
            disabled={participants.length < 2}
          >
            <Play className="h-6 w-6 mr-2" />
            O'yinni boshlash
          </Button>
        ) : (
          <div className="p-4 rounded-xl bg-muted/50 border border-border/50 text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground">
              Host o'yinni boshlashini kuting...
            </p>
          </div>
        )}
      </div>
    );
  }

  // Xona yaratish
  if (view === 'create') {
    const formulaOptions = [
      { value: 'oddiy', label: 'Oddiy', description: 'Asosiy qoidalar' },
      { value: 'formula5', label: 'F-5', description: '5-formula' },
      { value: 'formula10plus', label: 'F-10+', description: '10+ formula' },
      { value: 'formula10minus', label: 'F-10-', description: '10- formula' },
      { value: 'hammasi', label: 'Hammasi', description: 'Barcha formulalar' },
    ];

    return (
      <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button onClick={() => setView('menu')} variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Xona yaratish</h2>
            <p className="text-sm text-muted-foreground">O'yin sozlamalarini tanlang</p>
          </div>
        </div>
        
        {/* Settings Cards */}
        <div className="space-y-4">
          {/* Formula Type */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">🧮</span>
                </div>
                Misol turi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <RadioGroup value={formulaType} onValueChange={(v) => setFormulaType(v as FormulaType)} className="grid grid-cols-5 gap-2">
                {formulaOptions.map((option) => (
                  <div key={option.value}>
                    <RadioGroupItem value={option.value} id={`create-${option.value}`} className="peer sr-only" />
                    <Label
                      htmlFor={`create-${option.value}`}
                      className="flex flex-col items-center justify-center p-3 border-2 rounded-xl cursor-pointer text-center transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    >
                      <span className="font-semibold text-sm">{option.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
          
          {/* Digit Count */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">🔢</span>
                </div>
                Son xonasi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <RadioGroup value={String(digitCount)} onValueChange={(v) => setDigitCount(Number(v))} className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <div key={num}>
                    <RadioGroupItem value={String(num)} id={`digit-create-${num}`} className="peer sr-only" />
                    <Label
                      htmlFor={`digit-create-${num}`}
                      className="flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    >
                      <span className="text-2xl font-bold">{num}</span>
                      <span className="text-xs text-muted-foreground mt-1">xonali</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
          
          {/* Speed & Problem Count Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Speed */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3 bg-muted/30">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Tezlik
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <RadioGroup value={String(speed)} onValueChange={(v) => setSpeed(Number(v))} className="grid grid-cols-2 gap-2">
                  {[0.3, 0.5, 0.7, 1].map((s) => (
                    <div key={s}>
                      <RadioGroupItem value={String(s)} id={`speed-create-${s}`} className="peer sr-only" />
                      <Label
                        htmlFor={`speed-create-${s}`}
                        className="flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        <span className="font-semibold">{s}s</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
            
            {/* Problem Count */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3 bg-muted/30">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-primary">#</span>
                  Sonlar
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <RadioGroup value={String(problemCount)} onValueChange={(v) => setProblemCount(Number(v))} className="grid grid-cols-2 gap-2">
                  {[3, 5, 7, 10].map((num) => (
                    <div key={num}>
                      <RadioGroupItem value={String(num)} id={`count-create-${num}`} className="peer sr-only" />
                      <Label
                        htmlFor={`count-create-${num}`}
                        className="flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        <span className="font-semibold">{num}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Create Button */}
        <Button 
          onClick={createRoom} 
          size="lg" 
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40" 
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Crown className="h-5 w-5 mr-2" />
          )}
          Xona yaratish
        </Button>
      </div>
    );
  }

  // Xonaga qo'shilish
  if (view === 'join') {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button onClick={() => setView('menu')} variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Xonaga qo'shilish</h2>
            <p className="text-sm text-muted-foreground">6 xonali kodni kiriting</p>
          </div>
        </div>
        
        {/* Code Input */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <p className="text-muted-foreground">
                Do'stingiz bergan xona kodini kiriting
              </p>
            </div>
            
            <div className="flex justify-center gap-2 mb-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div 
                  key={i}
                  className={`w-11 h-14 border-2 rounded-xl flex items-center justify-center text-2xl font-mono font-bold transition-all ${
                    roomCode[i] 
                      ? 'border-primary bg-primary/5 text-foreground' 
                      : 'border-border bg-muted/30 text-muted-foreground'
                  }`}
                >
                  {roomCode[i] || '•'}
                </div>
              ))}
            </div>
            
            <Input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABCDEF"
              className="text-center text-2xl font-mono uppercase tracking-widest h-14 bg-muted/30"
              maxLength={6}
              autoFocus
            />
          </CardContent>
        </Card>
        
        {/* Join Button */}
        <Button 
          onClick={joinRoom} 
          size="lg" 
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40" 
          disabled={loading || roomCode.length < 6}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Users className="h-5 w-5 mr-2" />
          )}
          Qo'shilish
        </Button>
      </div>
    );
  }

  // Asosiy menyu
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl scale-150"></div>
          <div className="relative h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <Users className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Multiplayer
          </h2>
          <p className="text-muted-foreground mt-2">
            Do'stlaringiz bilan raqobatlashing!
          </p>
        </div>
      </div>
      
      {/* Action Cards */}
      <div className="grid gap-4">
        <Card 
          className="group cursor-pointer border-2 border-transparent hover:border-primary/30 transition-all duration-300 overflow-hidden relative bg-gradient-to-br from-card to-card/80"
          onClick={() => setView('create')}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="p-6 flex items-center gap-5 relative">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
              <Crown className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg group-hover:text-primary transition-colors">Xona yaratish</h3>
              <p className="text-sm text-muted-foreground">Yangi o'yin xonasi oching</p>
            </div>
            <ArrowLeft className="h-5 w-5 text-muted-foreground rotate-180 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </CardContent>
        </Card>
        
        <Card 
          className="group cursor-pointer border-2 border-transparent hover:border-primary/30 transition-all duration-300 overflow-hidden relative bg-gradient-to-br from-card to-card/80"
          onClick={() => setView('join')}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="p-6 flex items-center gap-5 relative">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg group-hover:text-primary transition-colors">Xonaga qo'shilish</h3>
              <p className="text-sm text-muted-foreground">Kod orqali o'yinga qo'shiling</p>
            </div>
            <ArrowLeft className="h-5 w-5 text-muted-foreground rotate-180 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Trophy className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Qanday ishlaydi?</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Xona yarating yoki do'stingiz kodini kiriting. O'yin boshlanganida hammaga bir xil sonlar ko'rsatiladi - kim tezroq to'g'ri javob bersa g'olib!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};