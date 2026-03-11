import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AbacusDisplay } from './AbacusDisplay';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useSound } from '@/hooks/useSound';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Users, 
  Swords, 
  Trophy, 
  Copy, 
  Check, 
  Play, 
  RotateCcw,
  Clock,
  Zap,
  Crown
} from 'lucide-react';

interface Player {
  id: string;
  username: string;
  score: number;
  currentProblem: number;
  isReady: boolean;
  hasAnswered: boolean;
}

interface GameState {
  roomId: string;
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  players: Player[];
  currentNumber: number;
  displayedNumbers: number[];
  problemCount: number;
  currentProblemIndex: number;
  winnerId?: string;
}

// Qoidalar
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

const PROBLEM_COUNT = 5;
const NUMBER_SPEED = 1000; // ms
const NUMBERS_PER_PROBLEM = 5;

export const MultiplayerCompetition = () => {
  const { user } = useAuth();
  const { playSound } = useSound();
  
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [copied, setCopied] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [isHost, setIsHost] = useState(false);
  const [opponentName, setOpponentName] = useState('');
  
  const runningResultRef = useRef(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Xona yaratish
  const createRoom = useCallback(async () => {
    if (!user) {
      toast.error("Avval tizimga kiring!");
      return;
    }

    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
    setIsHost(true);
    
    const initialState: GameState = {
      roomId: newRoomId,
      status: 'waiting',
      players: [{
        id: user.id,
        username: user.email?.split('@')[0] || 'Player',
        score: 0,
        currentProblem: 0,
        isReady: true,
        hasAnswered: false,
      }],
      currentNumber: 0,
      displayedNumbers: [],
      problemCount: PROBLEM_COUNT,
      currentProblemIndex: 0,
    };
    
    setGameState(initialState);
    playSound('start');
    toast.success(`Xona yaratildi: ${newRoomId}`);
  }, [user, playSound]);

  // Xonaga qo'shilish
  const joinRoom = useCallback(async () => {
    if (!user) {
      toast.error("Avval tizimga kiring!");
      return;
    }

    if (!inputRoomId.trim()) {
      toast.error("Xona ID kiriting!");
      return;
    }

    setRoomId(inputRoomId.toUpperCase());
    setIsHost(false);
    playSound('bead');
  }, [user, inputRoomId, playSound]);

  // Real-time kanal sozlash
  useEffect(() => {
    if (!roomId || !user) return;

    const channel = supabase.channel(`competition:${roomId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const players: Player[] = Object.values(presenceState).flat().map((p: any) => ({
          id: p.userId,
          username: p.username,
          score: p.score || 0,
          currentProblem: p.currentProblem || 0,
          isReady: p.isReady || false,
          hasAnswered: p.hasAnswered || false,
        }));

        if (players.length > 0) {
          setGameState(prev => prev ? { ...prev, players } : null);
          
          // Raqib nomini saqlash
          const opponent = players.find(p => p.id !== user.id);
          if (opponent) {
            setOpponentName(opponent.username);
          }
        }
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const newPlayer = newPresences[0] as any;
        if (newPlayer.userId !== user.id) {
          toast.success(`${newPlayer.username} qo'shildi!`);
          playSound('correct');
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const leftPlayer = leftPresences[0] as any;
        if (leftPlayer.userId !== user.id) {
          toast.info(`${leftPlayer.username} chiqib ketdi`);
        }
      })
      .on('broadcast', { event: 'game_update' }, ({ payload }) => {
        setGameState(payload as GameState);
      })
      .on('broadcast', { event: 'countdown' }, ({ payload }) => {
        setCountdown(payload.count);
        if (payload.count > 0) {
          playSound('bead');
        }
      })
      .on('broadcast', { event: 'show_number' }, ({ payload }) => {
        setGameState(prev => prev ? {
          ...prev,
          currentNumber: payload.number,
          displayedNumbers: [...(prev.displayedNumbers || []), payload.number],
        } : null);
      })
      .on('broadcast', { event: 'problem_done' }, () => {
        setGameState(prev => prev ? { ...prev, status: 'playing' } : null);
      })
      .on('broadcast', { event: 'player_answered' }, ({ payload }) => {
        if (payload.playerId !== user.id) {
          playSound('beadHigh');
        }
        setGameState(prev => {
          if (!prev) return null;
          return {
            ...prev,
            players: prev.players.map(p => 
              p.id === payload.playerId 
                ? { ...p, score: p.score + payload.points, hasAnswered: true }
                : p
            ),
          };
        });
      })
      .on('broadcast', { event: 'game_finished' }, ({ payload }) => {
        setGameState(prev => prev ? { 
          ...prev, 
          status: 'finished', 
          winnerId: payload.winnerId 
        } : null);
        
        if (payload.winnerId === user.id) {
          playSound('complete');
          toast.success("Siz yutdingiz! 🎉");
        } else {
          playSound('incorrect');
          toast.info("O'yin tugadi");
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            oderId: user.id,
            username: user.email?.split('@')[0] || 'Player',
            score: 0,
            currentProblem: 0,
            isReady: isHost,
            hasAnswered: false,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [roomId, user, isHost, playSound]);

  // Keyingi sonni generatsiya qilish
  const generateNextNumber = useCallback(() => {
    const currentResult = runningResultRef.current;
    const rules = RULES[currentResult];
    
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

    return randomOp.number;
  }, []);

  // O'yinni boshlash (faqat host)
  const startGame = useCallback(async () => {
    if (!channelRef.current || !gameState || gameState.players.length < 2) {
      toast.error("Kamida 2 o'yinchi kerak!");
      return;
    }

    // Countdown
    for (let i = 3; i > 0; i--) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'countdown',
        payload: { count: i },
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // O'yinni boshlash
    const runProblem = async (problemIndex: number) => {
      if (problemIndex >= PROBLEM_COUNT) {
        // O'yin tugadi
        const winner = gameState.players.reduce((a, b) => a.score > b.score ? a : b);
        await channelRef.current?.send({
          type: 'broadcast',
          event: 'game_finished',
          payload: { winnerId: winner.id },
        });
        return;
      }

      const initialResult = Math.floor(Math.random() * 10);
      runningResultRef.current = initialResult;

      await channelRef.current?.send({
        type: 'broadcast',
        event: 'game_update',
        payload: {
          ...gameState,
          status: 'countdown',
          currentProblemIndex: problemIndex,
          displayedNumbers: [],
          players: gameState.players.map(p => ({ ...p, hasAnswered: false })),
        },
      });

      await channelRef.current?.send({
        type: 'broadcast',
        event: 'show_number',
        payload: { number: initialResult },
      });

      let count = 1;
      intervalRef.current = setInterval(async () => {
        count++;
        
        if (count > NUMBERS_PER_PROBLEM) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          await channelRef.current?.send({
            type: 'broadcast',
            event: 'problem_done',
            payload: { correctAnswer: runningResultRef.current },
          });
          
          // Keyingi masala uchun kutish
          setTimeout(() => runProblem(problemIndex + 1), 5000);
          return;
        }

        const nextNum = generateNextNumber();
        if (nextNum !== null) {
          await channelRef.current?.send({
            type: 'broadcast',
            event: 'show_number',
            payload: { number: nextNum },
          });
        }
      }, NUMBER_SPEED);
    };

    runProblem(0);
  }, [gameState, generateNextNumber]);

  // Javobni yuborish
  const submitAnswer = useCallback(async () => {
    if (!channelRef.current || !user || !gameState) return;

    const userNum = parseInt(userAnswer, 10);
    const correctAnswer = runningResultRef.current;
    const isCorrect = userNum === correctAnswer;
    const points = isCorrect ? 10 : 0;

    await channelRef.current.send({
      type: 'broadcast',
      event: 'player_answered',
      payload: { 
        playerId: user.id, 
        points,
        isCorrect,
      },
    });

    playSound(isCorrect ? 'correct' : 'incorrect');
    setUserAnswer('');
    
    if (isCorrect) {
      toast.success("To'g'ri!");
    } else {
      toast.error(`Noto'g'ri! Javob: ${correctAnswer}`);
    }
  }, [userAnswer, user, gameState, playSound]);

  // Xona ID nusxalash
  const copyRoomId = useCallback(() => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    toast.success("Nusxalandi!");
    setTimeout(() => setCopied(false), 2000);
  }, [roomId]);

  // Chiqish
  const leaveRoom = useCallback(() => {
    channelRef.current?.unsubscribe();
    setRoomId('');
    setGameState(null);
    setIsHost(false);
    setInputRoomId('');
  }, []);

  const currentPlayer = gameState?.players.find(p => p.id === user?.id);
  const opponent = gameState?.players.find(p => p.id !== user?.id);

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Musobaqa rejimi uchun tizimga kiring
          </p>
        </CardContent>
      </Card>
    );
  }

  // Xona yaratish/qo'shilish
  if (!roomId) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-red-500/10 to-orange-500/10 pb-4 px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Swords className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
            Ikki O'yinchi Musobaqasi
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <div className="space-y-3 sm:space-y-4 p-4 bg-secondary/30 rounded-xl">
              <h3 className="font-semibold flex items-center gap-2 text-base sm:text-lg">
                <Crown className="h-5 w-5 text-amber-500" />
                Yangi xona yaratish
              </h3>
              <p className="text-sm text-muted-foreground">
                Xona yarating va do'stingizni taklif qiling
              </p>
              <Button onClick={createRoom} className="w-full gap-2 h-12 sm:h-10 text-base sm:text-sm">
                <Play className="h-5 w-5 sm:h-4 sm:w-4" />
                Xona yaratish
              </Button>
            </div>
            
            <div className="space-y-3 sm:space-y-4 p-4 bg-secondary/30 rounded-xl">
              <h3 className="font-semibold flex items-center gap-2 text-base sm:text-lg">
                <Users className="h-5 w-5 text-blue-500" />
                Mavjud xonaga qo'shilish
              </h3>
              <Input
                placeholder="Xona ID kiriting"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
                className="text-center text-lg sm:text-base uppercase h-12 sm:h-10"
              />
              <Button 
                onClick={joinRoom} 
                variant="outline" 
                className="w-full gap-2 h-12 sm:h-10 text-base sm:text-sm"
                disabled={!inputRoomId.trim()}
              >
                <Zap className="h-5 w-5 sm:h-4 sm:w-4" />
                Qo'shilish
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-red-500/10 to-orange-500/10 pb-3 sm:pb-4 px-4 sm:px-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-xl">
            <Swords className="h-5 w-5 text-red-500" />
            <span className="hidden sm:inline">Musobaqa</span>
          </CardTitle>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Badge variant="outline" className="font-mono text-sm sm:text-base px-2 sm:px-3 py-1">
              {roomId}
            </Badge>
            <Button variant="ghost" size="icon" onClick={copyRoomId} className="h-9 w-9 sm:h-10 sm:w-10">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
        {/* O'yinchilar */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className={`p-3 sm:p-4 rounded-xl border-2 ${currentPlayer ? 'border-primary bg-primary/5' : 'border-muted'}`}>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                <AvatarFallback className="bg-primary/20 text-base sm:text-lg">
                  {currentPlayer?.username?.[0]?.toUpperCase() || 'P'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm sm:text-base truncate max-w-[80px] sm:max-w-none">
                  {currentPlayer?.username || 'Siz'}
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-primary">{currentPlayer?.score || 0}</p>
              </div>
            </div>
          </div>
          
          <div className={`p-3 sm:p-4 rounded-xl border-2 ${opponent ? 'border-orange-500 bg-orange-500/5' : 'border-muted border-dashed'}`}>
            {opponent ? (
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                  <AvatarFallback className="bg-orange-500/20 text-base sm:text-lg">
                    {opponent.username?.[0]?.toUpperCase() || 'O'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm sm:text-base truncate max-w-[80px] sm:max-w-none">
                    {opponent.username}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-500">{opponent.score}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-2">
                <Clock className="h-5 w-5 mb-1 animate-pulse" />
                <span className="text-sm">Kutilmoqda...</span>
              </div>
            )}
          </div>
        </div>

        {/* O'yin holati */}
        {gameState?.status === 'waiting' && (
          <div className="text-center py-6 sm:py-8">
            {gameState.players.length < 2 ? (
              <div>
                <Users className="h-14 w-14 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
                <p className="text-muted-foreground mb-4 text-base sm:text-sm">
                  Raqib kutilmoqda...
                </p>
                <p className="text-sm text-muted-foreground">
                  Xona ID: <span className="font-mono font-bold text-base">{roomId}</span>
                </p>
              </div>
            ) : isHost ? (
              <Button onClick={startGame} size="lg" className="gap-2 h-14 sm:h-12 text-lg sm:text-base px-8">
                <Play className="h-6 w-6 sm:h-5 sm:w-5" />
                O'yinni boshlash
              </Button>
            ) : (
              <p className="text-muted-foreground text-base sm:text-sm">
                Host o'yinni boshlashini kuting...
              </p>
            )}
          </div>
        )}

        {gameState?.status === 'countdown' && (
          <div className="text-center py-6 sm:py-8">
            <div className="text-[100px] sm:text-8xl font-bold text-primary animate-pulse leading-none">
              {countdown}
            </div>
          </div>
        )}

        {(gameState?.status === 'playing' || gameState?.status === 'countdown') && gameState.currentNumber !== undefined && (
          <div className="text-center">
            <div className="mb-3 sm:mb-4 text-base sm:text-sm text-muted-foreground font-medium">
              Masala {gameState.currentProblemIndex + 1}/{PROBLEM_COUNT}
            </div>
            
            <AbacusDisplay
              number={gameState.currentNumber}
              size="lg"
              columns={1}
              showNumber={true}
            />
            
            {gameState.status === 'playing' && !currentPlayer?.hasAnswered && (
              <div className="mt-4 sm:mt-6 max-w-xs mx-auto space-y-3 sm:space-y-4 px-2">
                <Input
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Javob"
                  className="text-center text-3xl sm:text-2xl h-16 sm:h-14"
                  autoFocus
                />
                <Button onClick={submitAnswer} disabled={!userAnswer} className="w-full gap-2 h-14 sm:h-12 text-lg sm:text-base">
                  <Check className="h-5 w-5 sm:h-4 sm:w-4" />
                  Yuborish
                </Button>
              </div>
            )}
            
            {currentPlayer?.hasAnswered && (
              <div className="mt-4 sm:mt-6 text-muted-foreground text-base sm:text-sm">
                Raqibni kutilmoqda...
              </div>
            )}
          </div>
        )}

        {gameState?.status === 'finished' && (
          <div className="text-center py-6 sm:py-8">
            <Trophy className={`h-20 w-20 sm:h-16 sm:w-16 mx-auto mb-4 ${gameState.winnerId === user?.id ? 'text-amber-500' : 'text-muted-foreground'}`} />
            <h3 className="text-xl sm:text-2xl font-bold mb-2 px-2">
              {gameState.winnerId === user?.id ? "Tabriklaymiz! Siz yutdingiz! 🎉" : `${opponentName} g'olib bo'ldi`}
            </h3>
            <div className="flex justify-center gap-6 sm:gap-8 my-4 sm:my-6">
              <div className="bg-primary/10 rounded-xl px-6 py-3">
                <p className="text-sm text-muted-foreground">Siz</p>
                <p className="text-4xl sm:text-3xl font-bold text-primary">{currentPlayer?.score || 0}</p>
              </div>
              <div className="bg-orange-500/10 rounded-xl px-6 py-3">
                <p className="text-sm text-muted-foreground truncate max-w-[80px]">{opponent?.username || 'Raqib'}</p>
                <p className="text-4xl sm:text-3xl font-bold text-orange-500">{opponent?.score || 0}</p>
              </div>
            </div>
            <Button onClick={leaveRoom} variant="outline" className="gap-2 h-12 sm:h-10 text-base sm:text-sm">
              <RotateCcw className="h-5 w-5 sm:h-4 sm:w-4" />
              Yangi o'yin
            </Button>
          </div>
        )}

        {/* Chiqish tugmasi */}
        {gameState?.status !== 'finished' && (
          <div className="mt-4 sm:mt-6 text-center">
            <Button variant="ghost" onClick={leaveRoom} className="text-muted-foreground h-10">
              Xonadan chiqish
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiplayerCompetition;
