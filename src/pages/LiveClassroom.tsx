import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Video, VideoOff, Mic, MicOff, Hand, Users, LogOut, Shield, Calculator, X } from 'lucide-react';
import { LiveAbacus } from '@/components/LiveAbacus';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useRoomContext,
  useTracks,
  useParticipants,
  VideoTrack,
  TrackToggle,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, RoomEvent } from 'livekit-client';

const LiveClassroom = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !user) return;
    fetchSessionAndToken();
  }, [sessionId, user]);

  const fetchSessionAndToken = async () => {
    try {
      // Fetch session info
      const { data: session, error: sessionError } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        setError("Sessiya topilmadi");
        setLoading(false);
        return;
      }

      setSessionInfo(session);

      // Get LiveKit token
      const { data, error: fnError } = await supabase.functions.invoke('livekit-token', {
        body: { roomName: session.room_name, sessionId },
      });

      if (fnError || !data?.success) {
        setError(data?.error || "Token olishda xatolik");
        setLoading(false);
        return;
      }

      setToken(data.token);
      setWsUrl(data.url);
      setIsTeacher(data.isTeacher);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Kutilmagan xatolik");
      setLoading(false);
    }
  };

  const handleDisconnect = useCallback(async () => {
    if (sessionId && user) {
      await supabase
        .from('live_session_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('session_id', sessionId)
        .eq('user_id', user.id);
    }
    navigate(-1);
  }, [sessionId, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 border-4 border-primary/10 rounded-full" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-2 w-16 h-16 border-4 border-transparent border-b-primary/40 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            <Video className="absolute inset-0 m-auto w-6 h-6 text-primary/60" />
          </div>
          <div className="space-y-1.5">
            <p className="text-lg font-bold text-foreground tracking-tight">Xonaga ulanmoqda</p>
            <p className="text-sm text-muted-foreground">Iltimos, kuting...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-4">
        <Card className="max-w-sm w-full border-destructive/20 shadow-2xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-destructive/60 via-destructive to-destructive/60" />
          <CardContent className="pt-10 pb-10 text-center space-y-6">
            <div className="w-18 h-18 rounded-3xl bg-gradient-to-br from-destructive/15 to-destructive/5 flex items-center justify-center mx-auto shadow-inner" style={{ width: 72, height: 72 }}>
              <X className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-foreground tracking-tight">{error}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">Sessiyaga ulanishda muammo yuz berdi</p>
            </div>
            <Button onClick={() => navigate(-1)} variant="outline" className="gap-2.5 shadow-sm">
              <ArrowLeft className="w-4 h-4" /> Orqaga qaytish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token || !wsUrl) return null;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-to-r from-card/95 to-card/80 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={handleDisconnect}>
            <LogOut className="w-4.5 h-4.5" />
          </Button>
          <div className="space-y-1">
            <h1 className="font-extrabold text-sm md:text-base truncate max-w-[200px] md:max-w-none leading-none tracking-tight">
              {sessionInfo?.title}
            </h1>
            <div className="flex items-center gap-2">
              <Badge 
                variant={isTeacher ? "default" : "secondary"} 
                className="text-[10px] px-2.5 py-0.5 h-5 font-bold rounded-lg shadow-sm"
              >
                {isTeacher ? "👨‍🏫 O'qituvchi" : "📖 O'quvchi"}
              </Badge>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 h-5 rounded-lg bg-destructive/10 text-destructive text-[10px] font-bold">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                Jonli
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LiveKit Room */}
      <div className="flex-1 overflow-hidden">
        <LiveKitRoom
          serverUrl={wsUrl}
          token={token}
          connect={true}
          onDisconnected={handleDisconnect}
          data-lk-theme="default"
          className="h-full"
        >
          <RoomContent isTeacher={isTeacher} sessionId={sessionId!} />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
};

// Inner component with access to room context
const RoomContent = ({ isTeacher, sessionId }: { isTeacher: boolean; sessionId: string }) => {
  const room = useRoomContext();
  const participants = useParticipants();
  const [showParticipants, setShowParticipants] = useState(false);
  const [showAbacus, setShowAbacus] = useState(false);

  // Subscribe to realtime participant updates (hand raise, mute)
  useEffect(() => {
    const channel = supabase
      .channel(`live-participants-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_session_participants',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        // Handle realtime updates (hand raise notifications, etc.)
        if (payload.eventType === 'UPDATE' && payload.new) {
          const p = payload.new as any;
          if (p.is_hand_raised) {
            toast.info(`🙋 Qo'l ko'tardi`, { duration: 3000 });
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  const handleRaiseHand = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: current } = await supabase
      .from('live_session_participants')
      .select('is_hand_raised')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single();

    await supabase
      .from('live_session_participants')
      .update({ is_hand_raised: !current?.is_hand_raised })
      .eq('session_id', sessionId)
      .eq('user_id', user.id);

    toast.success(current?.is_hand_raised ? "Qo'l tushirildi" : "Qo'l ko'tarildi");
  };

  // Listen for teacher opening abacus via broadcast
  useEffect(() => {
    const channel = supabase.channel(`live-abacus-ctrl-${sessionId}`, {
      config: { broadcast: { self: false } },
    });
    channel.on('broadcast', { event: 'abacus-toggle' }, (payload) => {
      if (payload.payload?.open !== undefined) {
        setShowAbacus(payload.payload.open);
      }
    });
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  // Teacher broadcasts abacus open/close
  const toggleAbacusForAll = useCallback((open: boolean) => {
    setShowAbacus(open);
    const channel = supabase.channel(`live-abacus-ctrl-${sessionId}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'abacus-toggle',
          payload: { open },
        });
        setTimeout(() => supabase.removeChannel(channel), 500);
      }
    });
  }, [sessionId]);

  return (
    <div className="h-full flex flex-col">
      {/* Video area */}
      <div className="flex-1 relative">
        <VideoConference />

        {/* Live Abacus overlay */}
        {showAbacus && (
          <LiveAbacus
            sessionId={sessionId}
            isTeacher={isTeacher}
            onClose={() => {
              if (isTeacher) toggleAbacusForAll(false);
              else setShowAbacus(false);
            }}
          />
        )}
      </div>

      {/* Custom controls bar */}
      <div className="flex items-center justify-center gap-2.5 p-3 bg-gradient-to-t from-card to-card/90 backdrop-blur-xl border-t border-border/30 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)]">
        {!isTeacher && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRaiseHand}
            className="gap-2 rounded-2xl h-10 px-5 text-xs font-bold border-amber-300/50 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700 dark:hover:bg-amber-500/10 dark:hover:text-amber-400 transition-all duration-300"
          >
            <Hand className="w-4 h-4" />
            <span className="hidden md:inline">Qo'l ko'tarish</span>
          </Button>
        )}

        <Button
          variant={showParticipants ? "default" : "outline"}
          size="sm"
          onClick={() => {
            const next = !showParticipants;
            setShowParticipants(next);
            if (next) setShowAbacus(false);
          }}
          className="gap-2 rounded-2xl h-10 px-5 text-xs font-bold transition-all duration-300"
        >
          <Users className="w-4 h-4" />
          <span className="font-extrabold tabular-nums">{participants.length}</span>
        </Button>

        {isTeacher && (
          <>
            <Button
              variant={showAbacus ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const next = !showAbacus;
                toggleAbacusForAll(next);
                if (next) setShowParticipants(false);
              }}
              className="gap-2 rounded-2xl h-10 px-5 text-xs font-bold transition-all duration-300"
            >
              <Calculator className="w-4 h-4" />
              <span className="hidden md:inline">Abakus</span>
            </Button>
            <div className="flex items-center gap-2 px-4 h-9 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/15 text-primary text-[11px] font-bold shadow-sm">
              <Shield className="w-3.5 h-3.5" />
              Moderator
            </div>
          </>
        )}

        {!isTeacher && showAbacus === false && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowAbacus(true);
              setShowParticipants(false);
            }}
            className="gap-2 rounded-2xl h-10 px-5 text-xs font-bold transition-all duration-300"
          >
            <Calculator className="w-4 h-4" />
            <span className="hidden md:inline">Abakus</span>
          </Button>
        )}
      </div>

      {/* Participants sidebar */}
      {showParticipants && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-b from-card via-card to-card/90 backdrop-blur-2xl border-l border-border/30 shadow-[-8px_0_30px_-10px_rgba(0,0,0,0.15)] z-10 overflow-y-auto">
          <div className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-sm tracking-tight">Ishtirokchilar</h3>
                  <p className="text-[11px] text-muted-foreground font-medium">{participants.length} nafar onlayn</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                onClick={() => setShowParticipants(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Participants list */}
            <div className="space-y-1.5">
              {participants.map((p, idx) => {
                const initial = (p.name || p.identity).charAt(0).toUpperCase();
                const colors = [
                  'from-blue-500 to-cyan-400',
                  'from-violet-500 to-purple-400',
                  'from-amber-500 to-orange-400',
                  'from-emerald-500 to-teal-400',
                  'from-rose-500 to-pink-400',
                ];
                const gradientClass = colors[idx % colors.length];

                return (
                  <div 
                    key={p.identity} 
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 transition-all duration-300 group cursor-default border border-transparent hover:border-border/40 hover:shadow-sm"
                  >
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white text-sm font-extrabold shadow-md shrink-0 ring-2 ring-white/10`}>
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-[13px] font-bold tracking-tight truncate text-foreground leading-none">
                        {p.name || p.identity}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${p.isMicrophoneEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40'}`} />
                        <p className="text-[11px] font-medium text-muted-foreground leading-none">
                          {p.isMicrophoneEnabled ? 'Mikrofon yoqiq' : 'Ovozi o\'chiq'}
                        </p>
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      p.isMicrophoneEnabled 
                        ? 'bg-emerald-500/15 text-emerald-500' 
                        : 'bg-muted/80 text-muted-foreground/60'
                    }`}>
                      {p.isMicrophoneEnabled 
                        ? <Mic className="w-4 h-4" /> 
                        : <MicOff className="w-4 h-4" />
                      }
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty state */}
            {participants.length === 0 && (
              <div className="text-center py-10">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Hali hech kim qo'shilmadi</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveClassroom;
