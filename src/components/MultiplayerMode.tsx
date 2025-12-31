import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Crown, Play, Copy, Check, Clock, Trophy, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

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
  const [view, setView] = useState<'menu' | 'create' | 'join' | 'lobby' | 'playing' | 'results'>('menu');
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [roomCode, setRoomCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  
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
              setView('playing');
              startGameSequence(newRoom);
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
    const answerTime = (Date.now() - startTimeRef.current) / 1000;
    
    setHasAnswered(true);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Javobni saqlash
    await supabase
      .from('multiplayer_participants')
      .update({
        answer: userNum,
        is_correct: isCorrect,
        answer_time: answerTime,
        score: isCorrect ? 10 : 0,
      })
      .eq('room_id', room.id)
      .eq('user_id', user.id);
    
    toast(isCorrect ? "To'g'ri javob!" : "Noto'g'ri", {
      description: `To'g'ri javob: ${correctAnswer}`,
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

  // O'yin davomida
  if (view === 'playing' && currentDisplay !== null) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center z-50 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Timer */}
        <div className="absolute top-6 right-6 flex items-center gap-3 px-4 py-2 rounded-full bg-muted/80 backdrop-blur-sm border border-border/50">
          <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="text-xl font-mono font-bold tabular-nums">{elapsedTime.toFixed(1)}s</span>
        </div>
        
        {/* Participants */}
        <div className="absolute top-6 left-6 flex gap-2">
          {participants.map((p, i) => (
            <div key={p.id} className="relative" style={{ animationDelay: `${i * 100}ms` }}>
              <Avatar className="h-12 w-12 border-3 border-primary/50 shadow-lg ring-2 ring-background">
                <AvatarImage src={p.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">
                  {p.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-background text-xs font-medium border shadow-sm">
                {p.username.slice(0, 6)}
              </div>
            </div>
          ))}
        </div>

        {/* Problem Counter */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-muted/80 backdrop-blur-sm border border-border/50">
          <span className="text-sm font-medium text-muted-foreground">
            Son {countRef.current} / {room?.problem_count || problemCount}
          </span>
        </div>
        
        {/* Main Number Display */}
        <div className="relative flex items-center justify-center">
          {/* Glow Effect */}
          <div className={`absolute inset-0 blur-3xl transition-colors duration-300 ${isAddition ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}></div>
          
          {/* Number Container */}
          <div 
            key={currentDisplay}
            className={`relative flex items-center justify-center transition-all animate-scale-in ${
              isAddition ? 'text-foreground' : 'text-foreground'
            }`}
          >
            {/* Operation Sign */}
            {countRef.current > 1 && (
              <span className={`text-6xl md:text-8xl font-light mr-4 ${isAddition ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isAddition ? '+' : '−'}
              </span>
            )}
            
            {/* Number */}
            <span className="text-[140px] md:text-[200px] font-extralight tracking-tight">
              {currentDisplay}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64 h-2 rounded-full bg-muted overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-300"
            style={{ width: `${(countRef.current / (room?.problem_count || problemCount)) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  }

  // Javob kiritish
  if (view === 'playing' && currentDisplay === null && !hasAnswered) {
    const answeredCount = participants.filter(p => p.answer !== null).length;
    
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center z-50 p-6">
        <div className="max-w-md w-full space-y-6 text-center animate-fade-in">
          {/* Header */}
          <div>
            <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg mb-4">
              <span className="text-3xl">✏️</span>
            </div>
            <h2 className="text-3xl font-bold">Javobingizni kiriting!</h2>
          </div>
          
          {/* Answer Input */}
          <div className="space-y-4">
            <Input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && userAnswer && submitAnswer()}
              placeholder="Javob"
              className="text-center text-4xl h-20 font-mono border-2 focus:border-primary"
              autoFocus
            />
            
            <Button 
              onClick={submitAnswer} 
              disabled={!userAnswer} 
              size="lg" 
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg"
            >
              <Check className="h-6 w-6 mr-2" />
              Yuborish
            </Button>
          </div>

          {/* Other Players Status */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-sm text-muted-foreground mb-3">O'yinchilar holati</p>
            <div className="flex justify-center gap-3 flex-wrap">
              {participants.map((p) => (
                <div key={p.id} className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <Avatar className={`h-10 w-10 border-2 transition-all ${p.answer !== null ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-border opacity-60'}`}>
                      <AvatarImage src={p.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{p.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {p.answer !== null && (
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground truncate max-w-[50px]">{p.username.slice(0, 6)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {answeredCount} / {participants.length} javob berdi
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Javob kutish (javob bergandan keyin)
  if (view === 'playing' && currentDisplay === null && hasAnswered) {
    const answeredCount = participants.filter(p => p.answer !== null).length;
    const allAnswered = answeredCount === participants.length;
    
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center z-50 p-6">
        <div className="max-w-md w-full space-y-8 text-center animate-fade-in">
          {/* Waiting Animation */}
          <div className="relative">
            <div className="h-24 w-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center animate-pulse">
                <Check className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-28 w-28 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-emerald-500">Javobingiz qabul qilindi!</h2>
            <p className="text-muted-foreground mt-2">Boshqa o'yinchilarni kutmoqdamiz...</p>
          </div>

          {/* Players Status */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex justify-center gap-3 flex-wrap mb-4">
              {participants.map((p) => (
                <div key={p.id} className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <Avatar className={`h-12 w-12 border-2 transition-all ${p.answer !== null ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-border'}`}>
                      <AvatarImage src={p.avatar_url || undefined} />
                      <AvatarFallback>{p.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {p.answer !== null ? (
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                    ) : (
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-muted border-2 border-background rounded-full flex items-center justify-center">
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{p.username.slice(0, 8)}</span>
                </div>
              ))}
            </div>
            
            {/* Progress */}
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500"
                  style={{ width: `${(answeredCount / participants.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm font-medium">
                {answeredCount} / {participants.length} o'yinchi javob berdi
              </p>
            </div>
          </div>

          {allAnswered && (
            <p className="text-primary font-medium animate-pulse">Natijalar tayyorlanmoqda...</p>
          )}
        </div>
      </div>
    );
  }

  // Natijalar
  if (view === 'results') {
    const sortedParticipants = [...participants].sort((a, b) => {
      if (a.is_correct && !b.is_correct) return -1;
      if (!a.is_correct && b.is_correct) return 1;
      return (a.answer_time || 999) - (b.answer_time || 999);
    });

    const podiumParticipants = sortedParticipants.slice(0, 3);
    const otherParticipants = sortedParticipants.slice(3);

    // Confetti animation on first render
    useEffect(() => {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }, []);
    
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-xl scale-150 animate-pulse"></div>
            <Trophy className="relative h-20 w-20 text-amber-500 drop-shadow-lg" />
          </div>
          <h2 className="text-3xl font-bold">O'yin yakunlandi!</h2>
          <p className="text-muted-foreground mt-1">To'g'ri javob: <span className="font-mono font-bold text-foreground text-xl">{runningResultRef.current}</span></p>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-2 md:gap-4 h-64 px-4">
          {/* 2nd Place */}
          {podiumParticipants[1] && (
            <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: '200ms' }}>
              <Avatar className="h-16 w-16 border-4 border-gray-400 shadow-lg mb-2">
                <AvatarImage src={podiumParticipants[1].avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-500 text-white font-bold text-xl">
                  {podiumParticipants[1].username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="font-semibold text-sm mb-2 truncate max-w-[80px]">{podiumParticipants[1].username}</p>
              <div className="w-20 md:w-28 h-24 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg flex flex-col items-center justify-start pt-3 shadow-lg">
                <span className="text-3xl font-bold text-gray-700">2</span>
                <span className="text-xs text-gray-600 mt-1">{podiumParticipants[1].answer_time?.toFixed(1)}s</span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {podiumParticipants[0] && (
            <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="relative">
                <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 h-8 w-8 text-amber-400 drop-shadow-lg" />
                <Avatar className="h-20 w-20 border-4 border-amber-400 shadow-xl">
                  <AvatarImage src={podiumParticipants[0].avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-500 text-white font-bold text-2xl">
                    {podiumParticipants[0].username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <p className="font-bold text-base mt-2 mb-2 truncate max-w-[100px]">{podiumParticipants[0].username}</p>
              <div className="w-24 md:w-32 h-32 bg-gradient-to-t from-amber-400 to-amber-300 rounded-t-lg flex flex-col items-center justify-start pt-3 shadow-xl">
                <span className="text-4xl font-bold text-amber-700">1</span>
                <span className="text-sm text-amber-700 font-medium mt-1">{podiumParticipants[0].answer_time?.toFixed(1)}s</span>
                {podiumParticipants[0].is_correct && (
                  <Badge className="mt-2 bg-emerald-500">To'g'ri</Badge>
                )}
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {podiumParticipants[2] && (
            <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: '300ms' }}>
              <Avatar className="h-14 w-14 border-4 border-amber-700 shadow-lg mb-2">
                <AvatarImage src={podiumParticipants[2].avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-amber-700 to-amber-800 text-white font-bold">
                  {podiumParticipants[2].username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="font-semibold text-sm mb-2 truncate max-w-[80px]">{podiumParticipants[2].username}</p>
              <div className="w-20 md:w-28 h-16 bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-lg flex flex-col items-center justify-start pt-2 shadow-lg">
                <span className="text-2xl font-bold text-amber-200">3</span>
                <span className="text-xs text-amber-300">{podiumParticipants[2].answer_time?.toFixed(1)}s</span>
              </div>
            </div>
          )}
        </div>

        {/* Other Participants */}
        {otherParticipants.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-center text-muted-foreground">Boshqa ishtirokchilar</h3>
            <div className="space-y-2">
              {otherParticipants.map((p, index) => (
                <Card key={p.id} className="overflow-hidden">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="text-xl font-bold text-muted-foreground w-8 text-center">
                      {index + 4}
                    </div>
                    <Avatar className="h-10 w-10 border-2 border-border">
                      <AvatarImage src={p.avatar_url || undefined} />
                      <AvatarFallback>{p.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Javob: {p.answer ?? '-'} | {p.answer_time?.toFixed(1)}s
                      </p>
                    </div>
                    <Badge variant={p.is_correct ? 'default' : 'destructive'}>
                      {p.is_correct ? "To'g'ri" : "Noto'g'ri"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-500">{sortedParticipants.filter(p => p.is_correct).length}</p>
                <p className="text-xs text-muted-foreground">To'g'ri javob</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{sortedParticipants.length}</p>
                <p className="text-xs text-muted-foreground">O'yinchilar</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{room?.problem_count || problemCount}</p>
                <p className="text-xs text-muted-foreground">Sonlar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Action Button */}
        <Button 
          onClick={resetState} 
          size="lg" 
          className="w-full h-14 text-lg font-semibold"
          variant="outline"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Menyuga qaytish
        </Button>
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