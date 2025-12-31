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
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
        <div className="absolute top-6 right-6 flex items-center gap-2 text-2xl font-mono text-muted-foreground">
          <Clock className="h-6 w-6" />
          {elapsedTime.toFixed(1)}s
        </div>
        
        <div className="absolute top-6 left-6 flex gap-2">
          {participants.map((p) => (
            <Avatar key={p.id} className="h-10 w-10 border-2 border-primary">
              <AvatarImage src={p.avatar_url || undefined} />
              <AvatarFallback>{p.username.charAt(0)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        
        <div 
          className="text-[180px] md:text-[250px] font-light text-foreground transition-all duration-100"
        >
          {!isAddition && countRef.current > 1 ? '-' : ''}{currentDisplay}
        </div>
      </div>
    );
  }

  // Javob kiritish
  if (view === 'playing' && currentDisplay === null && !hasAnswered) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <h2 className="text-2xl font-bold">Javobingizni kiriting!</h2>
          
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
          
          <Input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && userAnswer && submitAnswer()}
            placeholder="Javob"
            className="text-center text-3xl h-16"
            autoFocus
          />
          
          <Button onClick={submitAnswer} disabled={!userAnswer} size="lg" className="w-full">
            <Check className="h-5 w-5 mr-2" />
            Yuborish
          </Button>
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
    
    return (
      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="text-center">
          <Trophy className="h-16 w-16 mx-auto text-amber-500 mb-4" />
          <h2 className="text-2xl font-bold">Natijalar</h2>
        </div>
        
        <div className="space-y-3">
          {sortedParticipants.map((p, index) => (
            <Card key={p.id} className={index === 0 ? 'border-amber-500' : ''}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="text-2xl font-bold text-muted-foreground w-8">
                  {index + 1}
                </div>
                <Avatar>
                  <AvatarImage src={p.avatar_url || undefined} />
                  <AvatarFallback>{p.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{p.username}</p>
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
        
        <div className="flex gap-4">
          <Button onClick={resetState} variant="outline" className="flex-1">
            Menyuga
          </Button>
        </div>
      </div>
    );
  }

  // Lobby
  if (view === 'lobby' && room) {
    const isHost = room.host_id === user.id;
    
    return (
      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={leaveRoom} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Chiqish
          </Button>
          <Badge variant="secondary">
            {participants.length} o'yinchi
          </Badge>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Xona kodi</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-mono font-bold tracking-widest">
                {room.room_code}
              </span>
              <Button onClick={copyRoomCode} variant="ghost" size="icon">
                {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Kodni do'stlaringizga yuboring
            </p>
          </CardContent>
        </Card>
        
        <div className="space-y-3">
          <h3 className="font-medium">O'yinchilar</h3>
          {participants.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar>
                <AvatarImage src={p.avatar_url || undefined} />
                <AvatarFallback>{p.username.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium flex-1">{p.username}</span>
              {p.user_id === room.host_id && (
                <Crown className="h-5 w-5 text-amber-500" />
              )}
            </div>
          ))}
        </div>
        
        {isHost && (
          <Button 
            onClick={startGame} 
            size="lg" 
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={participants.length < 2}
          >
            <Play className="h-5 w-5 mr-2" />
            O'yinni boshlash
          </Button>
        )}
        
        {!isHost && (
          <p className="text-center text-muted-foreground">
            Host o'yinni boshlashini kuting...
          </p>
        )}
      </div>
    );
  }

  // Xona yaratish
  if (view === 'create') {
    return (
      <div className="max-w-md mx-auto p-6 space-y-6">
        <Button onClick={() => setView('menu')} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Orqaga
        </Button>
        
        <h2 className="text-2xl font-bold">Xona yaratish</h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Misol turi</Label>
            <RadioGroup value={formulaType} onValueChange={(v) => setFormulaType(v as FormulaType)} className="flex flex-wrap gap-2">
              {['oddiy', 'formula5', 'formula10plus', 'formula10minus', 'hammasi'].map((type) => (
                <div key={type} className="flex items-center">
                  <RadioGroupItem value={type} id={`create-${type}`} className="peer sr-only" />
                  <Label
                    htmlFor={`create-${type}`}
                    className="px-3 py-1.5 border rounded-full cursor-pointer text-sm peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
                  >
                    {type}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label>Son xonasi</Label>
            <RadioGroup value={String(digitCount)} onValueChange={(v) => setDigitCount(Number(v))} className="flex gap-2">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="flex items-center">
                  <RadioGroupItem value={String(num)} id={`digit-create-${num}`} className="peer sr-only" />
                  <Label
                    htmlFor={`digit-create-${num}`}
                    className="px-3 py-1.5 border rounded-full cursor-pointer text-sm peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
                  >
                    {num}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label>Tezlik (soniya)</Label>
            <RadioGroup value={String(speed)} onValueChange={(v) => setSpeed(Number(v))} className="flex flex-wrap gap-2">
              {[0.3, 0.5, 0.7, 1].map((s) => (
                <div key={s} className="flex items-center">
                  <RadioGroupItem value={String(s)} id={`speed-create-${s}`} className="peer sr-only" />
                  <Label
                    htmlFor={`speed-create-${s}`}
                    className="px-3 py-1.5 border rounded-full cursor-pointer text-sm peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
                  >
                    {s}s
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label>Sonlar soni</Label>
            <RadioGroup value={String(problemCount)} onValueChange={(v) => setProblemCount(Number(v))} className="flex flex-wrap gap-2">
              {[3, 5, 7, 10].map((num) => (
                <div key={num} className="flex items-center">
                  <RadioGroupItem value={String(num)} id={`count-create-${num}`} className="peer sr-only" />
                  <Label
                    htmlFor={`count-create-${num}`}
                    className="px-3 py-1.5 border rounded-full cursor-pointer text-sm peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
                  >
                    {num}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
        
        <Button onClick={createRoom} size="lg" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
          Xona yaratish
        </Button>
      </div>
    );
  }

  // Xonaga qo'shilish
  if (view === 'join') {
    return (
      <div className="max-w-md mx-auto p-6 space-y-6">
        <Button onClick={() => setView('menu')} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Orqaga
        </Button>
        
        <h2 className="text-2xl font-bold">Xonaga qo'shilish</h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Xona kodi</Label>
            <Input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ABCDEF"
              className="text-center text-2xl font-mono uppercase tracking-widest"
              maxLength={6}
            />
          </div>
        </div>
        
        <Button 
          onClick={joinRoom} 
          size="lg" 
          className="w-full" 
          disabled={loading || roomCode.length < 6}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
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