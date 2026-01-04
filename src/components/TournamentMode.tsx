import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Trophy, Users, ArrowLeft, Crown, Swords, Timer, Medal, Star, Flame, Zap, ArrowRight, CheckCircle, XCircle, Loader2, Target, Copy, Check, Play, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useSound } from '@/hooks/useSound';
import { MultiplayerChat } from './MultiplayerChat';

interface TournamentModeProps {
  onBack: () => void;
}

interface Tournament {
  id: string;
  name: string;
  host_id: string;
  status: 'waiting' | 'playing' | 'finished';
  player_count: number;
  digit_count: number;
  formula_type: string;
  speed: number;
  problem_count: number;
  current_round: number;
}

interface TournamentPlayer {
  id: string;
  tournament_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  score: number;
  wins: number;
  losses: number;
  is_eliminated: boolean;
}

interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  match_index: number;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  status: 'pending' | 'playing' | 'finished';
  player1_answer: number | null;
  player2_answer: number | null;
  player1_time: number | null;
  player2_time: number | null;
  correct_answer: number | null;
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

export const TournamentMode = ({ onBack }: TournamentModeProps) => {
  const { user } = useAuth();
  const { playSound } = useSound();
  const [view, setView] = useState<'menu' | 'create' | 'join' | 'lobby' | 'bracket' | 'match' | 'results'>('menu');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  
  // Tournament settings
  const [tournamentName, setTournamentName] = useState('');
  const [playerCount, setPlayerCount] = useState(4);
  const [digitCount, setDigitCount] = useState(1);
  const [tournamentCode, setTournamentCode] = useState('');
  
  // Tournament state
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [currentMatch, setCurrentMatch] = useState<TournamentMatch | null>(null);
  const [tournamentWinner, setTournamentWinner] = useState<TournamentPlayer | null>(null);

  // Match gameplay state
  const [currentDisplay, setCurrentDisplay] = useState<string | null>(null);
  const [isAddition, setIsAddition] = useState(true);
  const [userAnswer, setUserAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [countdown, setCountdown] = useState(3);
  
  const runningResultRef = useRef(0);
  const countRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Load profile
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user]);

  // Realtime subscriptions
  useEffect(() => {
    if (!tournament) return;

    const tournamentChannel = supabase
      .channel(`tournament-${tournament.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tournaments',
        filter: `id=eq.${tournament.id}`,
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setTournament(payload.new as Tournament);
        }
        if (payload.eventType === 'DELETE') {
          toast.error('Turnir yakunlandi');
          resetState();
        }
      })
      .subscribe();

    const participantsChannel = supabase
      .channel(`tournament-participants-${tournament.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tournament_participants',
        filter: `tournament_id=eq.${tournament.id}`,
      }, async () => {
        const { data } = await supabase
          .from('tournament_participants')
          .select('*')
          .eq('tournament_id', tournament.id)
          .order('score', { ascending: false });
        if (data) setPlayers(data as TournamentPlayer[]);
      })
      .subscribe();

    const matchesChannel = supabase
      .channel(`tournament-matches-${tournament.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tournament_matches',
        filter: `tournament_id=eq.${tournament.id}`,
      }, async () => {
        const { data } = await supabase
          .from('tournament_matches')
          .select('*')
          .eq('tournament_id', tournament.id)
          .order('round')
          .order('match_index');
        if (data) setMatches(data as TournamentMatch[]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tournamentChannel);
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(matchesChannel);
    };
  }, [tournament?.id]);

  const generateTournamentCode = () => {
    return 'T' + Math.random().toString(36).substring(2, 7).toUpperCase();
  };

  const resetState = () => {
    setTournament(null);
    setPlayers([]);
    setMatches([]);
    setCurrentMatch(null);
    setTournamentWinner(null);
    setView('menu');
    setTournamentCode('');
    setCurrentDisplay(null);
    setUserAnswer('');
    setHasAnswered(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const createTournament = async () => {
    if (!user || !profile) return;
    setLoading(true);

    try {
      const code = generateTournamentCode();
      
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .insert({
          name: tournamentName || 'Turnir',
          host_id: user.id,
          player_count: playerCount,
          digit_count: digitCount,
        })
        .select()
        .single();

      if (tournamentError) throw tournamentError;

      // Join as participant
      const { error: participantError } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id: tournamentData.id,
          user_id: user.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
        });

      if (participantError) throw participantError;

      setTournament(tournamentData as Tournament);
      setTournamentCode(code);
      setView('lobby');

      // Load participants
      const { data: participantsData } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentData.id);

      if (participantsData) setPlayers(participantsData as TournamentPlayer[]);

      toast.success('Turnir yaratildi!');
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast.error('Turnir yaratishda xato');
    } finally {
      setLoading(false);
    }
  };

  const joinTournament = async () => {
    if (!user || !profile || !tournamentCode.trim()) return;
    setLoading(true);

    try {
      // Find tournament by looking at recent waiting tournaments
      const { data: tournaments, error: searchError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(20);

      if (searchError || !tournaments || tournaments.length === 0) {
        toast.error('Turnir topilmadi');
        return;
      }

      // For now, join the first available tournament (can be enhanced with actual code matching)
      const tournamentData = tournaments[0];

      // Check if already full
      const { data: currentParticipants } = await supabase
        .from('tournament_participants')
        .select('id')
        .eq('tournament_id', tournamentData.id);

      if (currentParticipants && currentParticipants.length >= tournamentData.player_count) {
        toast.error('Turnir to\'lgan');
        return;
      }

      const { error: participantError } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id: tournamentData.id,
          user_id: user.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
        });

      if (participantError) {
        if (participantError.code === '23505') {
          toast.error('Siz allaqachon bu turnirdasiz');
        } else {
          throw participantError;
        }
        return;
      }

      setTournament(tournamentData as Tournament);
      setView('lobby');

      const { data: participantsData } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentData.id);

      if (participantsData) setPlayers(participantsData as TournamentPlayer[]);

      toast.success('Turnirga qo\'shildingiz!');
    } catch (error) {
      console.error('Error joining tournament:', error);
      toast.error('Turnirga qo\'shilishda xato');
    } finally {
      setLoading(false);
    }
  };

  const startTournament = async () => {
    if (!tournament || !user || tournament.host_id !== user.id) return;

    // Generate bracket
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const totalRounds = Math.log2(shuffledPlayers.length);
    const newMatches: Omit<TournamentMatch, 'id'>[] = [];

    // First round matches
    for (let i = 0; i < shuffledPlayers.length; i += 2) {
      newMatches.push({
        tournament_id: tournament.id,
        round: 1,
        match_index: i / 2,
        player1_id: shuffledPlayers[i].id,
        player2_id: shuffledPlayers[i + 1]?.id || null,
        winner_id: shuffledPlayers[i + 1] ? null : shuffledPlayers[i].id,
        status: shuffledPlayers[i + 1] ? 'pending' : 'finished',
        player1_answer: null,
        player2_answer: null,
        player1_time: null,
        player2_time: null,
        correct_answer: null,
      });
    }

    // Later round placeholders
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInRound = Math.pow(2, totalRounds - round);
      for (let i = 0; i < matchesInRound; i++) {
        newMatches.push({
          tournament_id: tournament.id,
          round,
          match_index: i,
          player1_id: null,
          player2_id: null,
          winner_id: null,
          status: 'pending',
          player1_answer: null,
          player2_answer: null,
          player1_time: null,
          player2_time: null,
          correct_answer: null,
        });
      }
    }

    // Insert matches
    const { error: matchesError } = await supabase
      .from('tournament_matches')
      .insert(newMatches);

    if (matchesError) {
      console.error('Error creating matches:', matchesError);
      toast.error('Xato yuz berdi');
      return;
    }

    // Update tournament status
    await supabase
      .from('tournaments')
      .update({ status: 'playing' })
      .eq('id', tournament.id);

    setView('bracket');
    toast.success('Turnir boshlandi!');
  };

  const startMatch = async (match: TournamentMatch) => {
    if (!match.player1_id || !match.player2_id) return;

    // Update match status
    await supabase
      .from('tournament_matches')
      .update({ status: 'playing', started_at: new Date().toISOString() })
      .eq('id', match.id);

    setCurrentMatch({ ...match, status: 'playing' });
    setCountdown(3);
    setView('match');

    // Countdown
    playSound('countdown');
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count > 0) playSound('countdown');
      
      if (count <= 0) {
        clearInterval(countdownInterval);
        playSound('start');
        startMatchGameplay(match);
      }
    }, 1000);
  };

  const startMatchGameplay = useCallback((match: TournamentMatch) => {
    if (!tournament) return;

    const maxInitial = Math.pow(10, tournament.digit_count) - 1;
    const minInitial = tournament.digit_count === 1 ? 1 : Math.pow(10, tournament.digit_count - 1);
    const initialResult = Math.floor(Math.random() * (maxInitial - minInitial + 1)) + minInitial;

    runningResultRef.current = initialResult;
    countRef.current = 1;
    startTimeRef.current = Date.now();

    setCurrentDisplay(String(initialResult));
    setIsAddition(true);
    setUserAnswer('');
    setHasAnswered(false);

    const speedMs = tournament.speed * 1000;

    intervalRef.current = setInterval(() => {
      countRef.current += 1;

      if (countRef.current > tournament.problem_count) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setCurrentDisplay(null);
        return;
      }

      const result = generateNextNumber(tournament.digit_count);
      if (result !== null) {
        setCurrentDisplay(String(result.num));
        setIsAddition(result.isAdd);
      }
    }, speedMs);
  }, [tournament]);

  const generateNextNumber = (digits: number) => {
    const currentResult = runningResultRef.current;
    const lastDigit = Math.abs(currentResult) % 10;
    const rules = RULES_ALL[lastDigit];

    if (!rules) return null;

    const possibleOperations: { number: number; isAdd: boolean }[] = [];
    rules.add.forEach(num => possibleOperations.push({ number: num, isAdd: true }));
    rules.subtract.forEach(num => possibleOperations.push({ number: num, isAdd: false }));

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

  const submitMatchAnswer = async () => {
    if (!user || !currentMatch || hasAnswered) return;

    const userNum = parseInt(userAnswer, 10);
    const correctAnswer = runningResultRef.current;
    const isCorrect = userNum === correctAnswer;
    const answerTime = (Date.now() - startTimeRef.current) / 1000;

    setHasAnswered(true);

    // Find my player
    const myPlayer = players.find(p => p.user_id === user.id);
    if (!myPlayer) return;

    const isPlayer1 = currentMatch.player1_id === myPlayer.id;

    // Update match with my answer
    const updateData: Record<string, unknown> = {};
    if (isPlayer1) {
      updateData.player1_answer = userNum;
      updateData.player1_time = answerTime;
    } else {
      updateData.player2_answer = userNum;
      updateData.player2_time = answerTime;
    }
    updateData.correct_answer = correctAnswer;

    await supabase
      .from('tournament_matches')
      .update(updateData)
      .eq('id', currentMatch.id);

    toast(isCorrect ? "To'g'ri javob!" : "Noto'g'ri", {
      description: isCorrect ? `${answerTime.toFixed(1)}s` : `To'g'ri javob: ${correctAnswer}`,
    });

    // Wait for opponent or simulate
    setTimeout(() => {
      completeMatch(currentMatch, correctAnswer);
    }, 2000);
  };

  const completeMatch = async (match: TournamentMatch, correctAnswer: number) => {
    // Determine winner based on correctness and time
    const player1 = players.find(p => p.id === match.player1_id);
    const player2 = players.find(p => p.id === match.player2_id);

    if (!player1 || !player2) return;

    // Get updated match data
    const { data: updatedMatch } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('id', match.id)
      .single();

    if (!updatedMatch) return;

    const p1Correct = updatedMatch.player1_answer === correctAnswer;
    const p2Correct = updatedMatch.player2_answer === correctAnswer;

    let winnerId: string;
    if (p1Correct && !p2Correct) {
      winnerId = player1.id;
    } else if (!p1Correct && p2Correct) {
      winnerId = player2.id;
    } else if (p1Correct && p2Correct) {
      winnerId = (updatedMatch.player1_time || 999) <= (updatedMatch.player2_time || 999) ? player1.id : player2.id;
    } else {
      winnerId = (updatedMatch.player1_time || 999) <= (updatedMatch.player2_time || 999) ? player1.id : player2.id;
    }

    const loserId = winnerId === player1.id ? player2.id : player1.id;

    // Update match
    await supabase
      .from('tournament_matches')
      .update({ winner_id: winnerId, status: 'finished', finished_at: new Date().toISOString() })
      .eq('id', match.id);

    // Update player stats
    await supabase
      .from('tournament_participants')
      .update({ wins: (players.find(p => p.id === winnerId)?.wins || 0) + 1, score: (players.find(p => p.id === winnerId)?.score || 0) + 100 })
      .eq('id', winnerId);

    await supabase
      .from('tournament_participants')
      .update({ losses: (players.find(p => p.id === loserId)?.losses || 0) + 1, is_eliminated: true })
      .eq('id', loserId);

    // Check if this was the final match
    const totalRounds = Math.log2(tournament?.player_count || 4);
    if (match.round === totalRounds) {
      const winner = players.find(p => p.id === winnerId);
      setTournamentWinner(winner || null);
      
      if (winner?.user_id === user?.id) {
        playSound('winner');
        confetti({
          particleCount: 200,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']
        });
      }
      setView('results');
    } else {
      // Advance winner to next round
      const nextRoundMatches = matches.filter(m => m.round === match.round + 1);
      const nextMatchIndex = Math.floor(match.match_index / 2);
      const nextMatch = nextRoundMatches[nextMatchIndex];

      if (nextMatch) {
        const updateField = match.match_index % 2 === 0 ? 'player1_id' : 'player2_id';
        await supabase
          .from('tournament_matches')
          .update({ [updateField]: winnerId })
          .eq('id', nextMatch.id);
      }

      setCurrentMatch(null);
      setView('bracket');

      const winner = players.find(p => p.id === winnerId);
      if (winner?.user_id === user?.id) {
        toast.success('Siz g\'olib bo\'ldingiz! 🎉');
      } else {
        toast.info(`${winner?.username} g'olib bo'ldi`);
      }
    }
  };

  const copyTournamentCode = () => {
    navigator.clipboard.writeText(tournament?.id.slice(0, 8).toUpperCase() || tournamentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Kod nusxalandi!');
  };

  const leaveTournament = async () => {
    if (!tournament || !user) return;

    const myPlayer = players.find(p => p.user_id === user.id);
    if (myPlayer) {
      await supabase
        .from('tournament_participants')
        .delete()
        .eq('id', myPlayer.id);
    }

    if (tournament.host_id === user.id) {
      await supabase.from('tournaments').delete().eq('id', tournament.id);
    }

    resetState();
  };

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Yarim final';
    if (round === totalRounds - 2) return 'Chorak final';
    return `${round}-raund`;
  };

  const getPlayerById = (id: string | null) => players.find(p => p.id === id);

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <Trophy className="h-16 w-16 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-bold">Turnir rejimi</h2>
        <p className="text-muted-foreground">Turnirda qatnashish uchun tizimga kiring</p>
        <Button onClick={onBack} variant="outline">Orqaga</Button>
      </div>
    );
  }

  // Match View with countdown
  if (view === 'match' && countdown > 0) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-amber-500/10 flex flex-col items-center justify-center z-50">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border-4 border-primary/40 animate-ping" />
          </div>
          <div 
            key={countdown}
            className="relative w-40 h-40 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl animate-scale-in"
          >
            <span className="text-7xl font-bold text-white">{countdown}</span>
          </div>
        </div>
        <h2 className="mt-8 text-3xl font-bold">Tayyorlaning!</h2>
      </div>
    );
  }

  // Match gameplay
  if (view === 'match' && currentDisplay !== null) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center z-50">
        <div className="absolute top-6 left-1/2 -translate-x-1/2">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Son {countRef.current} / {tournament?.problem_count || 5}
          </Badge>
        </div>

        <div className="relative flex items-center justify-center">
          <div className={`absolute inset-0 blur-3xl scale-150 ${isAddition ? 'bg-emerald-500/30' : 'bg-rose-500/30'}`}></div>
          <div key={currentDisplay} className="relative flex items-center justify-center animate-scale-in">
            {countRef.current > 1 && (
              <span className={`text-7xl md:text-9xl font-light mr-4 ${isAddition ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isAddition ? '+' : '−'}
              </span>
            )}
            <span className="text-[140px] md:text-[200px] font-extralight">{currentDisplay}</span>
          </div>
        </div>
      </div>
    );
  }

  // Answer input
  if (view === 'match' && currentDisplay === null && !hasAnswered) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-amber-500/10 flex flex-col items-center justify-center z-50 p-6">
        <div className="max-w-md w-full space-y-6 text-center animate-fade-in">
          <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl">
            <Target className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold">Javobingizni kiriting!</h2>
          
          <Input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && userAnswer && submitMatchAnswer()}
            placeholder="?"
            className="text-center text-5xl h-24 font-mono"
            autoFocus
          />
          
          <Button 
            onClick={submitMatchAnswer} 
            disabled={!userAnswer} 
            size="lg" 
            className="w-full h-16 text-xl font-bold bg-gradient-to-r from-emerald-500 to-green-600"
          >
            <Zap className="h-6 w-6 mr-2" />
            Yuborish
          </Button>
        </div>
      </div>
    );
  }

  // Waiting for result
  if (view === 'match' && hasAnswered) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background via-emerald-500/5 to-primary/5 flex flex-col items-center justify-center z-50">
        <div className="relative h-28 w-28 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-2xl">
          <Check className="h-14 w-14 text-white" />
        </div>
        <h2 className="mt-8 text-3xl font-bold">Javob yuborildi!</h2>
        <p className="text-muted-foreground mt-2 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Natija hisoblanmoqda...
        </p>
      </div>
    );
  }

  // Results View
  if (view === 'results' && tournamentWinner) {
    const isUserWinner = tournamentWinner.user_id === user?.id;
    
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <div className={`relative overflow-hidden rounded-2xl p-8 text-center shadow-2xl ${
          isUserWinner ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500' : 'bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800'
        }`}>
          <Crown className="h-20 w-20 mx-auto text-white mb-4 drop-shadow-lg animate-bounce" />
          <Avatar className="h-24 w-24 mx-auto border-4 border-white shadow-2xl mb-4">
            <AvatarImage src={tournamentWinner.avatar_url || undefined} />
            <AvatarFallback className="text-3xl font-bold">
              {tournamentWinner.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-3xl font-black text-white drop-shadow-lg">
            {isUserWinner ? 'TABRIKLAYMIZ!' : 'TURNIR YAKUNLANDI'}
          </h2>
          <p className="text-white/90 font-semibold mt-2">
            {isUserWinner ? 'Siz turnir g\'olibi bo\'ldingiz!' : `${tournamentWinner.username} turnir g'olibi!`}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Yakuniy natijalar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {players
              .sort((a, b) => b.wins - a.wins || b.score - a.score)
              .map((p, index) => (
                <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl ${
                  p.user_id === user?.id ? 'bg-primary/10 border border-primary/30' : index === 0 ? 'bg-amber-500/10' : 'bg-muted/50'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-amber-400 text-amber-900' :
                    index === 1 ? 'bg-gray-300 text-gray-700' :
                    index === 2 ? 'bg-amber-700 text-amber-100' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={p.avatar_url || undefined} />
                    <AvatarFallback>{p.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{p.username}</p>
                    <p className="text-xs text-muted-foreground">{p.wins}G / {p.losses}M</p>
                  </div>
                  <span className="font-bold text-primary">{p.score}</span>
                </div>
              ))}
          </CardContent>
        </Card>

        <Button onClick={onBack} size="lg" className="w-full">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Menyuga qaytish
        </Button>
      </div>
    );
  }

  // Bracket View
  if (view === 'bracket') {
    const totalRounds = Math.log2(tournament?.player_count || 4);
    const matchesByRound = Array.from({ length: totalRounds }, (_, i) =>
      matches.filter(m => m.round === i + 1)
    );

    const myPlayer = players.find(p => p.user_id === user?.id);

    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Button onClick={leaveTournament} variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Chiqish
          </Button>
          <Badge variant="secondary" className="text-lg px-4">
            <Trophy className="h-4 w-4 mr-2" />
            {tournament?.name || 'Turnir'}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-8 min-w-max p-4">
            {matchesByRound.map((roundMatches, roundIndex) => (
              <div key={roundIndex} className="space-y-4">
                <h3 className="text-center font-bold text-sm text-muted-foreground uppercase tracking-wider">
                  {getRoundName(roundIndex + 1, totalRounds)}
                </h3>
                <div className="space-y-4" style={{ marginTop: `${roundIndex * 2}rem` }}>
                  {roundMatches.map((match) => {
                    const player1 = getPlayerById(match.player1_id);
                    const player2 = getPlayerById(match.player2_id);
                    const canStart = match.status === 'pending' && player1 && player2 && 
                      (player1.user_id === user?.id || player2.user_id === user?.id || tournament?.host_id === user?.id);

                    return (
                      <Card 
                        key={match.id}
                        className={`w-48 cursor-pointer transition-all hover:shadow-lg ${
                          match.status === 'playing' ? 'border-amber-500 bg-amber-500/10 animate-pulse' :
                          match.status === 'finished' ? 'border-emerald-500/50 bg-emerald-500/5' :
                          canStart ? 'hover:border-primary/50' : ''
                        }`}
                        onClick={() => canStart && startMatch(match)}
                      >
                        <CardContent className="p-3 space-y-2">
                          <div className={`flex items-center gap-2 p-2 rounded-lg ${
                            match.winner_id === player1?.id ? 'bg-emerald-500/20' : ''
                          }`}>
                            {player1 ? (
                              <>
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={player1.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">{player1.username.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium truncate flex-1">{player1.username}</span>
                                {match.winner_id === player1.id && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">TBD</span>
                            )}
                          </div>

                          <div className="flex items-center justify-center">
                            <span className="text-[10px] text-muted-foreground">VS</span>
                          </div>

                          <div className={`flex items-center gap-2 p-2 rounded-lg ${
                            match.winner_id === player2?.id ? 'bg-emerald-500/20' : ''
                          }`}>
                            {player2 ? (
                              <>
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={player2.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">{player2.username.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium truncate flex-1">{player2.username}</span>
                                {match.winner_id === player2.id && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">TBD</span>
                            )}
                          </div>

                          {canStart && (
                            <Button size="sm" className="w-full text-xs">
                              <Swords className="h-3 w-3 mr-1" />
                              Boshlash
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {tournament && (
          <MultiplayerChat
            roomId={tournament.id}
            isOpen={chatOpen}
            onClose={() => setChatOpen(!chatOpen)}
          />
        )}
      </div>
    );
  }

  // Lobby View
  if (view === 'lobby' && tournament) {
    const isHost = tournament.host_id === user?.id;
    const canStart = isHost && players.length >= 2 && 
      (players.length === 2 || players.length === 4 || players.length === 8 || players.length === 16);

    return (
      <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Button onClick={leaveTournament} variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Chiqish
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            {players.length} / {tournament.player_count}
          </Badge>
        </div>

        <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h3 className="font-bold text-xl">{tournament.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">Turnir ID</p>
            <div className="flex items-center justify-center gap-3">
              <code className="px-4 py-2 bg-muted rounded-lg font-mono text-lg">
                {tournament.id.slice(0, 8).toUpperCase()}
              </code>
              <Button onClick={copyTournamentCode} variant="outline" size="icon">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Ishtirokchilar</h3>
          {players.map((p, index) => (
            <div key={p.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-background">
                  <AvatarImage src={p.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">
                    {p.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {p.user_id === tournament.host_id && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-amber-400 rounded-full flex items-center justify-center">
                    <Crown className="h-3 w-3 text-amber-900" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{p.username}</p>
                <p className="text-xs text-muted-foreground">
                  {p.user_id === tournament.host_id ? 'Host' : 'O\'yinchi'}
                </p>
              </div>
              {p.user_id === user?.id && <Badge variant="outline">Siz</Badge>}
            </div>
          ))}
        </div>

        {isHost ? (
          <Button 
            onClick={startTournament} 
            size="lg" 
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500"
            disabled={!canStart}
          >
            <Play className="h-6 w-6 mr-2" />
            Turnirni boshlash ({players.length}/{tournament.player_count})
          </Button>
        ) : (
          <div className="p-4 rounded-xl bg-muted/50 text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Host turnirni boshlashini kuting...</p>
          </div>
        )}

        <MultiplayerChat
          roomId={tournament.id}
          isOpen={chatOpen}
          onClose={() => setChatOpen(!chatOpen)}
        />
      </div>
    );
  }

  // Join View
  if (view === 'join') {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button onClick={() => setView('menu')} variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Turnirga qo'shilish</h2>
            <p className="text-sm text-muted-foreground">Turnir kodini kiriting</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-amber-500" />
            </div>
            <Input
              value={tournamentCode}
              onChange={(e) => setTournamentCode(e.target.value.toUpperCase())}
              placeholder="Turnir kodi"
              className="text-center text-lg font-mono"
            />
            <Button 
              onClick={joinTournament} 
              size="lg" 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500"
              disabled={loading || !tournamentCode.trim()}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Users className="h-5 w-5 mr-2" />}
              Qo'shilish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create View
  if (view === 'create') {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button onClick={() => setView('menu')} variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Turnir yaratish</h2>
            <p className="text-sm text-muted-foreground">Sozlamalarni tanlang</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Turnir nomi</Label>
              <Input
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                placeholder="Mening turnirim"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              O'yinchilar soni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={String(playerCount)} onValueChange={(v) => setPlayerCount(Number(v))} className="grid grid-cols-3 gap-3">
              {[4, 8, 16].map((num) => (
                <div key={num}>
                  <RadioGroupItem value={String(num)} id={`players-${num}`} className="peer sr-only" />
                  <Label
                    htmlFor={`players-${num}`}
                    className="flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <span className="text-2xl font-bold">{num}</span>
                    <span className="text-xs text-muted-foreground">{Math.log2(num)} raund</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Son xonasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={String(digitCount)} onValueChange={(v) => setDigitCount(Number(v))} className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((num) => (
                <div key={num}>
                  <RadioGroupItem value={String(num)} id={`digit-${num}`} className="peer sr-only" />
                  <Label
                    htmlFor={`digit-${num}`}
                    className="flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <span className="font-semibold">{num}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Button 
          onClick={createTournament} 
          size="lg" 
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500"
          disabled={loading}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Trophy className="h-5 w-5 mr-2" />}
          Turnir yaratish
        </Button>
      </div>
    );
  }

  // Menu View
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-500/20 rounded-full blur-xl scale-150" />
          <div className="relative h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Trophy className="h-10 w-10 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            Turnir rejimi
          </h2>
          <p className="text-muted-foreground mt-2">Haqiqiy o'yinchilar bilan raqobatlashing!</p>
        </div>
      </div>

      <div className="grid gap-4">
        <Card 
          className="group cursor-pointer border-2 border-transparent hover:border-amber-500/30 transition-all"
          onClick={() => setView('create')}
        >
          <CardContent className="p-6 flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Crown className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg group-hover:text-amber-500 transition-colors">Turnir yaratish</h3>
              <p className="text-sm text-muted-foreground">Yangi turnir boshlang</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </CardContent>
        </Card>

        <Card 
          className="group cursor-pointer border-2 border-transparent hover:border-emerald-500/30 transition-all"
          onClick={() => setView('join')}
        >
          <CardContent className="p-6 flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg group-hover:text-emerald-500 transition-colors">Turnirga qo'shilish</h3>
              <p className="text-sm text-muted-foreground">Mavjud turnirga kiring</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </CardContent>
        </Card>
      </div>

      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Swords className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Real-time raqobat</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Haqiqiy o'yinchilar bilan bracket tizimida bellashing. G'olib keyingi raundga o'tadi!
            </p>
          </div>
        </div>
      </div>

      <Button onClick={onBack} variant="outline" size="lg" className="w-full">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Orqaga
      </Button>
    </div>
  );
};
