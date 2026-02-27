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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Xonaga ulanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-4xl">❌</div>
            <h2 className="text-xl font-bold">{error}</h2>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Orqaga
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
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleDisconnect}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-sm md:text-base truncate max-w-[200px] md:max-w-none">
              {sessionInfo?.title}
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant={isTeacher ? "default" : "secondary"} className="text-xs">
                {isTeacher ? "O'qituvchi" : "O'quvchi"}
              </Badge>
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                🔴 Jonli
              </Badge>
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
      <div className="flex items-center justify-center gap-1.5 px-3 py-2 bg-card/90 backdrop-blur-sm border-t border-border/50">
        {!isTeacher && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRaiseHand}
            className="h-8 px-2.5 rounded-full hover:bg-secondary/80 gap-1.5 text-xs"
          >
            <Hand className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Qo'l</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowParticipants(!showParticipants)}
          className={`h-8 px-2.5 rounded-full gap-1.5 text-xs ${showParticipants ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/80'}`}
        >
          <Users className="w-3.5 h-3.5" />
          <span className="font-semibold">{participants.length}</span>
        </Button>

        {isTeacher && (
          <>
            <Button
              variant={showAbacus ? "default" : "ghost"}
              size="sm"
              onClick={() => toggleAbacusForAll(!showAbacus)}
              className={`h-8 px-2.5 rounded-full gap-1.5 text-xs ${!showAbacus ? 'hover:bg-secondary/80' : ''}`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Abakus</span>
            </Button>
            <div className="h-4 w-px bg-border/50 mx-0.5" />
            <Badge variant="secondary" className="h-6 px-2 gap-1 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-600 border-0">
              <Shield className="w-3 h-3" /> Ustoz
            </Badge>
          </>
        )}

        {/* Student also sees abacus button (read-only) */}
        {!isTeacher && showAbacus === false && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAbacus(true)}
            className="gap-1"
          >
            <Calculator className="w-4 h-4" />
            <span className="hidden md:inline">Abakus</span>
          </Button>
        )}
      </div>

      {/* Participants sidebar */}
      {showParticipants && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-b from-card to-card/95 backdrop-blur-xl border-l border-border/50 shadow-2xl z-10 overflow-y-auto">
          <div className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Ishtirokchilar</h3>
                  <p className="text-[11px] text-muted-foreground">{participants.length} nafar onlayn</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => setShowParticipants(false)}
              >
                <X className="w-3.5 h-3.5" />
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
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-all duration-200 group cursor-default"
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0`}>
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.name || p.identity}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {p.isMicrophoneEnabled ? 'Mikrofon yoqiq' : 'Ovozi o\'chiq'}
                      </p>
                    </div>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      p.isMicrophoneEnabled 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {p.isMicrophoneEnabled 
                        ? <Mic className="w-3.5 h-3.5" /> 
                        : <MicOff className="w-3.5 h-3.5" />
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
