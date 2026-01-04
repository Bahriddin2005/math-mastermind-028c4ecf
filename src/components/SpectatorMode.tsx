import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Eye, Users, ArrowLeft, Trophy, Clock, Swords, Play, Pause, Volume2, VolumeX, Flame, Target, Crown, Zap, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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

interface SpectatorModeProps {
  onBack: () => void;
}

export const SpectatorMode = ({ onBack }: SpectatorModeProps) => {
  const { user } = useAuth();
  const [view, setView] = useState<'search' | 'watching'>('search');
  const [roomCode, setRoomCode] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [liveViewers, setLiveViewers] = useState(1);

  // Active rooms list
  const [activeRooms, setActiveRooms] = useState<Room[]>([]);

  // Fetch active rooms
  useEffect(() => {
    const fetchActiveRooms = async () => {
      const { data } = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .in('status', ['playing', 'waiting'])
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) {
        setActiveRooms(data as Room[]);
      }
    };

    fetchActiveRooms();
    const interval = setInterval(fetchActiveRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  // Real-time subscriptions when watching
  useEffect(() => {
    if (!room) return;

    const roomChannel = supabase
      .channel(`spectator-room-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'multiplayer_rooms',
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setRoom(payload.new as Room);
          }
          if (payload.eventType === 'DELETE') {
            toast.error('O\'yin yakunlandi');
            setView('search');
            setRoom(null);
          }
        }
      )
      .subscribe();

    const participantsChannel = supabase
      .channel(`spectator-participants-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'multiplayer_participants',
          filter: `room_id=eq.${room.id}`,
        },
        async () => {
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
  }, [room?.id]);

  const joinAsSpectator = async (code?: string) => {
    const searchCode = code || roomCode;
    if (!searchCode.trim()) return;

    setLoading(true);
    try {
      const { data: roomData, error } = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .eq('room_code', searchCode.toUpperCase())
        .single();

      if (error || !roomData) {
        toast.error('Xona topilmadi');
        return;
      }

      // Fetch participants
      const { data: participantsData } = await supabase
        .from('multiplayer_participants')
        .select('*')
        .eq('room_id', roomData.id)
        .order('score', { ascending: false });

      setRoom(roomData as Room);
      setParticipants((participantsData as Participant[]) || []);
      setView('watching');
      setLiveViewers(Math.floor(Math.random() * 10) + 1);
      toast.success('Tomosha qilishni boshladingiz!');
    } catch (error) {
      console.error('Error joining as spectator:', error);
      toast.error('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      waiting: { label: 'Kutilmoqda', color: 'bg-amber-500' },
      playing: { label: 'O\'yin davom etmoqda', color: 'bg-emerald-500' },
      finished: { label: 'Yakunlandi', color: 'bg-gray-500' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.finished;
    return (
      <Badge className={`${config.color} text-white animate-pulse`}>
        {config.label}
      </Badge>
    );
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-amber-400" />;
    if (index === 1) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Trophy className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-bold text-muted-foreground">{index + 1}</span>;
  };

  // Watching View
  if (view === 'watching' && room) {
    const sortedParticipants = [...participants].sort((a, b) => (b.score || 0) - (a.score || 0));

    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button onClick={() => { setView('search'); setRoom(null); }} variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Chiqish
          </Button>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <Eye className="h-3 w-3" />
              {liveViewers} tomosha
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-8 w-8"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Live Status Bar */}
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-500">JONLI</span>
          </div>
          {getStatusBadge(room.status)}
        </div>

        {/* Room Info */}
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Swords className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Xona: {room.room_code}</h3>
                  <p className="text-sm text-muted-foreground">{participants.length} o'yinchi</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{room.digit_count} xonali</Badge>
                <Badge variant="outline">{room.speed}s</Badge>
                <Badge variant="outline">{room.problem_count} misol</Badge>
              </div>
            </div>

            {room.status === 'playing' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">O'yin jarayoni</span>
                  <span className="font-medium">{room.current_problem || 0} / {room.problem_count}</span>
                </div>
                <Progress value={((room.current_problem || 0) / room.problem_count) * 100} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Leaderboard */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Jonli Reyting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedParticipants.map((p, index) => (
              <div
                key={p.id}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-500 ${
                  index === 0 
                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 border border-amber-500/30' 
                    : index < 3 
                    ? 'bg-muted/50' 
                    : 'hover:bg-muted/30'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  {getRankIcon(index)}
                </div>
                <Avatar className={`h-10 w-10 border-2 ${index === 0 ? 'border-amber-400' : 'border-border'}`}>
                  <AvatarImage src={p.avatar_url || undefined} />
                  <AvatarFallback className={index === 0 ? 'bg-amber-400 text-amber-900' : ''}>
                    {p.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.username}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {p.is_correct !== null && (
                      <Badge variant={p.is_correct ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0">
                        {p.is_correct ? "To'g'ri" : "Noto'g'ri"}
                      </Badge>
                    )}
                    {p.answer_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {p.answer_time.toFixed(1)}s
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{p.score || 0}</p>
                  <p className="text-[10px] text-muted-foreground">ball</p>
                </div>
              </div>
            ))}

            {participants.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>O'yinchilar kutilmoqda...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {room.status === 'playing' && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-emerald-500/10 border-emerald-500/20">
              <CardContent className="p-4 text-center">
                <Target className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                <p className="text-2xl font-bold text-emerald-500">
                  {participants.filter(p => p.is_correct).length}
                </p>
                <p className="text-xs text-muted-foreground">To'g'ri javoblar</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/10 border-amber-500/20">
              <CardContent className="p-4 text-center">
                <Flame className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                <p className="text-2xl font-bold text-amber-500">
                  {Math.max(...participants.map(p => p.score || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Eng yuqori ball</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="p-4 text-center">
                <Zap className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-primary">
                  {Math.min(...participants.filter(p => p.answer_time).map(p => p.answer_time || 999), 999).toFixed(1)}s
                </p>
                <p className="text-xs text-muted-foreground">Eng tez</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Search View
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="ghost" size="icon">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Spectator rejimi</h2>
          <p className="text-sm text-muted-foreground">Boshqa o'yinchilarni tomosha qiling</p>
        </div>
      </div>

      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl scale-150 animate-pulse" />
          <div className="relative h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Eye className="h-10 w-10 text-white" />
          </div>
        </div>
        <p className="text-muted-foreground">
          O'yinlarni jonli tomosha qiling va o'rganing!
        </p>
      </div>

      {/* Search by Code */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Xona kodini kiriting
          </p>
          <div className="flex gap-2">
            <Input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABCDEF"
              className="text-center text-lg font-mono uppercase"
              maxLength={6}
            />
            <Button 
              onClick={() => joinAsSpectator()} 
              disabled={loading || roomCode.length < 6}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              <Eye className="h-4 w-4 mr-2" />
              Tomosha
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Rooms */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Swords className="h-4 w-4 text-primary" />
          Faol o'yinlar
        </h3>
        
        {activeRooms.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Hozircha faol o'yinlar yo'q</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeRooms.map((r) => (
              <Card 
                key={r.id} 
                className="cursor-pointer hover:border-primary/30 transition-all"
                onClick={() => joinAsSpectator(r.room_code)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    {r.status === 'playing' ? (
                      <Play className="h-5 w-5 text-purple-500" />
                    ) : (
                      <Pause className="h-5 w-5 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-mono font-bold">{r.room_code}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{r.digit_count} xonali</span>
                      <span>•</span>
                      <span>{r.problem_count} misol</span>
                    </div>
                  </div>
                  {getStatusBadge(r.status)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
