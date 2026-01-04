import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Trophy, Users, ArrowLeft, Crown, Swords, Timer, Medal, Star, Flame, Zap, ArrowRight, CheckCircle, XCircle, Loader2, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface TournamentModeProps {
  onBack: () => void;
}

interface TournamentPlayer {
  id: string;
  username: string;
  avatar_url: string | null;
  score: number;
  wins: number;
  losses: number;
  isEliminated: boolean;
}

interface Match {
  id: string;
  round: number;
  player1: TournamentPlayer | null;
  player2: TournamentPlayer | null;
  winner: TournamentPlayer | null;
  status: 'pending' | 'playing' | 'finished';
}

export const TournamentMode = ({ onBack }: TournamentModeProps) => {
  const { user } = useAuth();
  const [view, setView] = useState<'menu' | 'create' | 'waiting' | 'bracket' | 'match' | 'results'>('menu');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  
  // Tournament settings
  const [tournamentName, setTournamentName] = useState('');
  const [playerCount, setPlayerCount] = useState(4);
  const [digitCount, setDigitCount] = useState(1);
  const [roundCount, setRoundCount] = useState(3);
  
  // Tournament state
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [tournamentWinner, setTournamentWinner] = useState<TournamentPlayer | null>(null);

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

  const generateBotPlayers = (count: number) => {
    const botNames = ['Botir', 'Jasur', 'Sardor', 'Dilshod', 'Akbar', 'Rustam', 'Sherzod', 'Nodir'];
    return Array.from({ length: count - 1 }, (_, i) => ({
      id: `bot-${i}`,
      username: botNames[i] || `Bot ${i + 1}`,
      avatar_url: null,
      score: 0,
      wins: 0,
      losses: 0,
      isEliminated: false,
    }));
  };

  const generateBracket = (tournamentPlayers: TournamentPlayer[]) => {
    const shuffled = [...tournamentPlayers].sort(() => Math.random() - 0.5);
    const totalRounds = Math.log2(shuffled.length);
    const newMatches: Match[] = [];
    
    // Generate first round matches
    for (let i = 0; i < shuffled.length; i += 2) {
      newMatches.push({
        id: `match-1-${i / 2}`,
        round: 1,
        player1: shuffled[i],
        player2: shuffled[i + 1] || null,
        winner: shuffled[i + 1] ? null : shuffled[i], // Auto-win if no opponent
        status: shuffled[i + 1] ? 'pending' : 'finished',
      });
    }

    // Generate placeholder matches for later rounds
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInRound = Math.pow(2, totalRounds - round);
      for (let i = 0; i < matchesInRound; i++) {
        newMatches.push({
          id: `match-${round}-${i}`,
          round,
          player1: null,
          player2: null,
          winner: null,
          status: 'pending',
        });
      }
    }

    return newMatches;
  };

  const startTournament = () => {
    if (!profile) return;
    
    setLoading(true);
    
    // Create player list with user and bots
    const userPlayer: TournamentPlayer = {
      id: user?.id || 'user',
      username: profile.username,
      avatar_url: profile.avatar_url,
      score: 0,
      wins: 0,
      losses: 0,
      isEliminated: false,
    };
    
    const bots = generateBotPlayers(playerCount);
    const allPlayers = [userPlayer, ...bots];
    
    setPlayers(allPlayers);
    setMatches(generateBracket(allPlayers));
    setCurrentRound(1);
    setView('bracket');
    setLoading(false);
    
    toast.success('Turnir boshlandi!');
  };

  const startMatch = (match: Match) => {
    if (!match.player1 || !match.player2) return;
    
    setCurrentMatch({
      ...match,
      status: 'playing',
    });
    setView('match');
    
    // Simulate match after 3 seconds
    setTimeout(() => {
      const userIsPlayer = match.player1?.id === user?.id || match.player2?.id === user?.id;
      let winner: TournamentPlayer;
      
      if (userIsPlayer) {
        // 60% chance user wins
        winner = Math.random() > 0.4 
          ? (match.player1?.id === user?.id ? match.player1 : match.player2)!
          : (match.player1?.id === user?.id ? match.player2 : match.player1)!;
      } else {
        // Random winner for bot vs bot
        winner = Math.random() > 0.5 ? match.player1! : match.player2!;
      }
      
      completeMatch(match, winner);
    }, 3000);
  };

  const completeMatch = (match: Match, winner: TournamentPlayer) => {
    const updatedMatches = matches.map(m => {
      if (m.id === match.id) {
        return { ...m, winner, status: 'finished' as const };
      }
      return m;
    });

    // Update player stats
    const loser = match.player1?.id === winner.id ? match.player2 : match.player1;
    setPlayers(prev => prev.map(p => {
      if (p.id === winner.id) {
        return { ...p, wins: p.wins + 1, score: p.score + 100 };
      }
      if (p.id === loser?.id) {
        return { ...p, losses: p.losses + 1, isEliminated: true };
      }
      return p;
    }));

    // Find next round match and assign winner
    const nextRoundMatches = updatedMatches.filter(m => m.round === match.round + 1);
    if (nextRoundMatches.length > 0) {
      const matchIndex = matches.filter(m => m.round === match.round).findIndex(m => m.id === match.id);
      const nextMatchIndex = Math.floor(matchIndex / 2);
      const nextMatch = nextRoundMatches[nextMatchIndex];
      
      if (nextMatch) {
        const updatedNextMatch = {
          ...nextMatch,
          player1: matchIndex % 2 === 0 ? winner : nextMatch.player1,
          player2: matchIndex % 2 === 1 ? winner : nextMatch.player2,
        };
        
        const finalMatches = updatedMatches.map(m => 
          m.id === nextMatch.id ? updatedNextMatch : m
        );
        setMatches(finalMatches);
      }
    } else {
      // This was the final match
      setTournamentWinner(winner);
      if (winner.id === user?.id) {
        confetti({
          particleCount: 200,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']
        });
      }
      setView('results');
    }
    
    setMatches(updatedMatches);
    setCurrentMatch(null);
    setView('bracket');
    
    if (winner.id === user?.id) {
      toast.success('Siz g\'olib bo\'ldingiz! 🎉');
    } else {
      toast.info(`${winner.username} g'olib bo'ldi`);
    }
  };

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Yarim final';
    if (round === totalRounds - 2) return 'Chorak final';
    return `${round}-raund`;
  };

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

  // Match View
  if (view === 'match' && currentMatch) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-amber-500/10 flex flex-col items-center justify-center z-50 p-6">
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-amber-400/40 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center space-y-8 animate-fade-in">
          <Badge className="bg-red-500 animate-pulse text-lg px-4 py-1">JONLI O'YIN</Badge>
          
          <div className="flex items-center justify-center gap-8">
            {/* Player 1 */}
            <div className="text-center space-y-3 animate-slide-in-left">
              <Avatar className="h-24 w-24 mx-auto border-4 border-primary shadow-2xl">
                <AvatarImage src={currentMatch.player1?.avatar_url || undefined} />
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                  {currentMatch.player1?.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-lg">{currentMatch.player1?.username}</p>
              {currentMatch.player1?.id === user?.id && (
                <Badge className="bg-primary">Siz</Badge>
              )}
            </div>

            {/* VS */}
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl">
                <Swords className="h-10 w-10 text-white animate-pulse" />
              </div>
            </div>

            {/* Player 2 */}
            <div className="text-center space-y-3 animate-slide-in-right">
              <Avatar className="h-24 w-24 mx-auto border-4 border-secondary shadow-2xl">
                <AvatarImage src={currentMatch.player2?.avatar_url || undefined} />
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-secondary to-secondary/60 text-secondary-foreground">
                  {currentMatch.player2?.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-lg">{currentMatch.player2?.username}</p>
              {currentMatch.player2?.id === user?.id && (
                <Badge className="bg-primary">Siz</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            <span className="text-lg text-muted-foreground">O'yin davom etmoqda...</span>
          </div>
        </div>
      </div>
    );
  }

  // Results View
  if (view === 'results' && tournamentWinner) {
    const isUserWinner = tournamentWinner.id === user?.id;
    
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Winner Banner */}
        <div className={`relative overflow-hidden rounded-2xl p-8 text-center shadow-2xl ${
          isUserWinner 
            ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500' 
            : 'bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800'
        }`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
          
          <div className="relative">
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
        </div>

        {/* Final Standings */}
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
                <div
                  key={p.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    p.id === user?.id 
                      ? 'bg-primary/10 border border-primary/30' 
                      : index === 0 
                      ? 'bg-amber-500/10' 
                      : 'bg-muted/50'
                  }`}
                >
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
                    <p className="text-xs text-muted-foreground">
                      {p.wins}G / {p.losses}M
                    </p>
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
    const totalRounds = Math.log2(playerCount);
    const matchesByRound = Array.from({ length: totalRounds }, (_, i) =>
      matches.filter(m => m.round === i + 1)
    );

    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Button onClick={onBack} variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Chiqish
          </Button>
          <Badge variant="secondary" className="text-lg px-4">
            <Trophy className="h-4 w-4 mr-2" />
            {tournamentName || 'Turnir'}
          </Badge>
        </div>

        {/* Tournament Bracket */}
        <div className="overflow-x-auto">
          <div className="flex gap-8 min-w-max p-4">
            {matchesByRound.map((roundMatches, roundIndex) => (
              <div key={roundIndex} className="space-y-4">
                <h3 className="text-center font-bold text-sm text-muted-foreground uppercase tracking-wider">
                  {getRoundName(roundIndex + 1, totalRounds)}
                </h3>
                <div className="space-y-4" style={{ marginTop: `${roundIndex * 2}rem` }}>
                  {roundMatches.map((match) => (
                    <Card 
                      key={match.id}
                      className={`w-48 cursor-pointer transition-all hover:shadow-lg ${
                        match.status === 'playing' 
                          ? 'border-amber-500 bg-amber-500/10 animate-pulse' 
                          : match.status === 'finished' 
                          ? 'border-emerald-500/50 bg-emerald-500/5' 
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => match.player1 && match.player2 && match.status === 'pending' && startMatch(match)}
                    >
                      <CardContent className="p-3 space-y-2">
                        {/* Player 1 */}
                        <div className={`flex items-center gap-2 p-2 rounded-lg ${
                          match.winner?.id === match.player1?.id ? 'bg-emerald-500/20' : ''
                        }`}>
                          {match.player1 ? (
                            <>
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={match.player1.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {match.player1.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium truncate flex-1">
                                {match.player1.username}
                              </span>
                              {match.winner?.id === match.player1.id && (
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                              )}
                              {match.winner && match.winner.id !== match.player1.id && (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">TBD</span>
                          )}
                        </div>

                        <div className="flex items-center justify-center">
                          <span className="text-[10px] text-muted-foreground">VS</span>
                        </div>

                        {/* Player 2 */}
                        <div className={`flex items-center gap-2 p-2 rounded-lg ${
                          match.winner?.id === match.player2?.id ? 'bg-emerald-500/20' : ''
                        }`}>
                          {match.player2 ? (
                            <>
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={match.player2.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {match.player2.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium truncate flex-1">
                                {match.player2.username}
                              </span>
                              {match.winner?.id === match.player2.id && (
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                              )}
                              {match.winner && match.winner.id !== match.player2.id && (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">TBD</span>
                          )}
                        </div>

                        {/* Match Status */}
                        {match.status === 'pending' && match.player1 && match.player2 && (
                          <Button size="sm" className="w-full text-xs">
                            <Swords className="h-3 w-3 mr-1" />
                            Boshlash
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Create Tournament View
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
              <Label>Turnir nomi (ixtiyoriy)</Label>
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
          onClick={startTournament} 
          size="lg" 
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Trophy className="h-5 w-5 mr-2" />
          )}
          Turnirni boshlash
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
          <p className="text-muted-foreground mt-2">
            Bracket tizimida raqobatlashing!
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <Card 
          className="group cursor-pointer border-2 border-transparent hover:border-amber-500/30 transition-all duration-300"
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
      </div>

      {/* Info */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Swords className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Qanday ishlaydi?</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Turnirda o'yinchilar juft-juft bo'lib raqobatlashadi. G'olib keyingi raundga o'tadi, mag'lub chiqariladi. Oxirgi qolgan o'yinchi - turnir g'olibi!
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
