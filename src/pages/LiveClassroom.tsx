import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ArrowLeft, Video, VideoOff, Mic, MicOff, Hand, Users, LogOut, 
  Shield, Calculator, X, MonitorUp, MessageSquare, MoreHorizontal,
  PhoneOff, Settings, Maximize2, ChevronUp
} from 'lucide-react';
import { LiveAbacus } from '@/components/LiveAbacus';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useRoomContext,
  useTracks,
  useParticipants,
  TrackToggle,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';

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
      <div className="h-screen flex items-center justify-center bg-[#1a1a2e]">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-white/60 text-sm">Xonaga ulanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1a1a2e] p-4">
        <Card className="max-w-md w-full bg-[#242442] border-white/10">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white">{error}</h2>
            <Button onClick={() => navigate(-1)} variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" /> Orqaga
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token || !wsUrl) return null;

  return (
    <div className="h-screen flex flex-col bg-[#1a1a2e] overflow-hidden">
      <LiveKitRoom
        serverUrl={wsUrl}
        token={token}
        connect={true}
        onDisconnected={handleDisconnect}
        data-lk-theme="default"
        className="h-full flex flex-col"
      >
        <ZoomUI 
          isTeacher={isTeacher} 
          sessionId={sessionId!} 
          sessionInfo={sessionInfo}
          onLeave={handleDisconnect}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};

// ========================
// Zoom-like UI Component
// ========================
const ZoomUI = ({ 
  isTeacher, 
  sessionId, 
  sessionInfo, 
  onLeave 
}: { 
  isTeacher: boolean; 
  sessionId: string; 
  sessionInfo: any;
  onLeave: () => void;
}) => {
  const participants = useParticipants();
  const [showParticipants, setShowParticipants] = useState(false);
  const [showAbacus, setShowAbacus] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Realtime participant updates
  useEffect(() => {
    const channel = supabase
      .channel(`live-participants-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_session_participants',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
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
    toast.success(current?.is_hand_raised ? "Qo'l tushirildi" : "Qo'l ko'tarildi ✋");
  };

  // Abacus broadcast
  useEffect(() => {
    const channel = supabase.channel(`live-abacus-ctrl-${sessionId}`, {
      config: { broadcast: { self: false } },
    });
    channel.on('broadcast', { event: 'abacus-toggle' }, (payload) => {
      if (payload.payload?.open !== undefined) setShowAbacus(payload.payload.open);
    });
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  const toggleAbacusForAll = useCallback((open: boolean) => {
    setShowAbacus(open);
    const channel = supabase.channel(`live-abacus-ctrl-${sessionId}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({ type: 'broadcast', event: 'abacus-toggle', payload: { open } });
        setTimeout(() => supabase.removeChannel(channel), 500);
      }
    });
  }, [sessionId]);

  return (
    <div className="h-full flex flex-col relative">
      {/* ===== TOP BAR ===== */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e]/95 backdrop-blur-md z-20 border-b border-white/5">
        <div className="flex items-center gap-3">
          {/* Shield icon for security feel */}
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
            <Video className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm leading-tight truncate max-w-[200px] sm:max-w-none">
              {sessionInfo?.title || 'Live Dars'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-[10px] font-bold tracking-wider">LIVE</span>
              </span>
              <span className="text-white/30 text-[10px]">•</span>
              <span className="text-white/40 text-[10px] font-mono">{formatTime(elapsedTime)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isTeacher && (
            <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 h-5 rounded-md">
              <Shield className="w-3 h-3 mr-1" /> Ustoz
            </Badge>
          )}
          <Badge className="bg-white/5 text-white/60 border-white/10 text-[10px] font-medium px-2 h-5 rounded-md">
            <Users className="w-3 h-3 mr-1" /> {participants.length}
          </Badge>
        </div>
      </div>

      {/* ===== VIDEO AREA ===== */}
      <div className="flex-1 relative overflow-hidden">
        <VideoConference />

        {/* Abacus overlay */}
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

        {/* Participants sidebar */}
        {showParticipants && (
          <div className="absolute right-0 top-0 bottom-0 w-72 sm:w-80 bg-[#242442]/98 backdrop-blur-2xl border-l border-white/5 shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-white font-semibold text-sm">Ishtirokchilar</span>
                <Badge className="bg-blue-500/15 text-blue-400 border-0 text-[10px] h-4 px-1.5 rounded">
                  {participants.length}
                </Badge>
              </div>
              <button
                onClick={() => setShowParticipants(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {participants.map((p, idx) => {
                const initial = (p.name || p.identity).charAt(0).toUpperCase();
                const colors = [
                  'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 
                  'bg-emerald-500', 'bg-rose-500', 'bg-cyan-500'
                ];
                return (
                  <div key={p.identity} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                    <div className={`w-8 h-8 rounded-full ${colors[idx % colors.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{p.name || p.identity}</p>
                      <p className="text-white/30 text-[10px]">
                        {p.isCameraEnabled && p.isMicrophoneEnabled ? 'Video & Audio' :
                         p.isCameraEnabled ? 'Faqat video' :
                         p.isMicrophoneEnabled ? 'Faqat audio' : 'O\'chirilgan'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                        p.isMicrophoneEnabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-white/20'
                      }`}>
                        {p.isMicrophoneEnabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                      </div>
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                        p.isCameraEnabled ? 'bg-blue-500/15 text-blue-400' : 'bg-white/5 text-white/20'
                      }`}>
                        {p.isCameraEnabled ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {participants.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 text-white/10 mx-auto mb-3" />
                  <p className="text-white/30 text-sm">Hali hech kim qo'shilmadi</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== BOTTOM CONTROL BAR (Zoom-style) ===== */}
      <div className="bg-[#1a1a2e]/95 backdrop-blur-md border-t border-white/5 px-2 sm:px-6 py-2 z-20">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {/* Left controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <ControlButton icon={Mic} label="Ovoz" activeColor="bg-white/10" />
            <ControlButton icon={Video} label="Video" activeColor="bg-white/10" />
          </div>

          {/* Center controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {!isTeacher && (
              <button
                onClick={handleRaiseHand}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 flex items-center justify-center transition-colors">
                  <Hand className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-[9px] text-white/50 font-medium hidden sm:block">Qo'l</span>
              </button>
            )}

            <button
              onClick={() => { setShowParticipants(!showParticipants); }}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors group"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                showParticipants ? 'bg-blue-500/20' : 'bg-white/5 group-hover:bg-white/10'
              }`}>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-[9px] text-white/50 font-medium hidden sm:block">
                {participants.length} kishi
              </span>
            </button>

            {(isTeacher || !showAbacus) && (
              <button
                onClick={() => isTeacher ? toggleAbacusForAll(!showAbacus) : setShowAbacus(true)}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors group"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  showAbacus ? 'bg-violet-500/20' : 'bg-white/5 group-hover:bg-white/10'
                }`}>
                  <Calculator className="w-4 h-4 text-violet-400" />
                </div>
                <span className="text-[9px] text-white/50 font-medium hidden sm:block">Abakus</span>
              </button>
            )}
          </div>

          {/* Right - Leave button */}
          <div className="flex items-center">
            <button
              onClick={onLeave}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-red-500/20"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable control button placeholder (LiveKit handles actual mic/cam toggles)
const ControlButton = ({ icon: Icon, label, activeColor }: { icon: any; label: string; activeColor: string }) => (
  <div className="flex flex-col items-center gap-0.5 px-2 py-1.5">
    <div className={`w-9 h-9 rounded-xl ${activeColor} flex items-center justify-center`}>
      <Icon className="w-4 h-4 text-white/70" />
    </div>
    <span className="text-[9px] text-white/50 font-medium hidden sm:block">{label}</span>
  </div>
);

export default LiveClassroom;
