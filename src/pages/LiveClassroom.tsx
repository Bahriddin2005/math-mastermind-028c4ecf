import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  ArrowLeft, Video, VideoOff, Mic, MicOff, Hand, Users, 
  Shield, Calculator, X, MonitorUp, MessageSquare, 
  PhoneOff, Send, ChevronRight, MoreVertical, Copy,
  Circle
} from 'lucide-react';
import { LiveAbacus } from '@/components/LiveAbacus';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useRoomContext,
  useParticipants,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-[#202124]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-[3px] border-[#1a73e8]/20 border-t-[#1a73e8] rounded-full animate-spin mx-auto" />
          <p className="text-[#5f6368] dark:text-[#9aa0a6] text-sm font-medium">Darsga ulanmoqda...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-[#202124] p-4">
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto">
            <X className="w-10 h-10 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-medium text-[#202124] dark:text-white mb-1">{error}</h2>
            <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">Iltimos, qayta urinib ko'ring</p>
          </div>
          <Button onClick={() => navigate(-1)} className="bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full px-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Orqaga qaytish
          </Button>
        </div>
      </div>
    );
  }

  if (!token || !wsUrl) return null;

  return (
    <div className="h-screen flex flex-col bg-[#202124] overflow-hidden">
      <LiveKitRoom
        serverUrl={wsUrl}
        token={token}
        connect={true}
        onDisconnected={handleDisconnect}
        data-lk-theme="default"
        className="h-full flex flex-col"
      >
        <MeetUI 
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

// ============================
// Google Meet-style UI
// ============================

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
}

const MeetUI = ({ 
  isTeacher, sessionId, sessionInfo, onLeave 
}: { 
  isTeacher: boolean; sessionId: string; sessionInfo: any; onLeave: () => void;
}) => {
  const participants = useParticipants();
  const [activePanel, setActivePanel] = useState<'none' | 'participants' | 'chat' | 'abacus'>('none');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [handRaised, setHandRaised] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Chat broadcast channel
  useEffect(() => {
    const channel = supabase.channel(`live-chat-${sessionId}`, {
      config: { broadcast: { self: false } },
    });
    channel.on('broadcast', { event: 'chat-message' }, (payload) => {
      if (payload.payload) {
        setChatMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          sender: payload.payload.sender,
          content: payload.payload.content,
          timestamp: new Date(),
          isOwn: false,
        }]);
      }
    });
    channel.subscribe();
    chatChannelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: isTeacher ? '👩‍🏫 Ustoz' : '🎓 O\'quvchi',
      content: chatInput.trim(),
      timestamp: new Date(),
      isOwn: true,
    };
    setChatMessages(prev => [...prev, msg]);
    chatChannelRef.current?.send({
      type: 'broadcast',
      event: 'chat-message',
      payload: { sender: msg.sender, content: msg.content },
    });
    setChatInput('');
  };

  // Participant events
  useEffect(() => {
    const channel = supabase
      .channel(`live-participants-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_session_participants',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        if (payload.eventType === 'UPDATE' && (payload.new as any)?.is_hand_raised) {
          toast.info(`🙋 Qo'l ko'tardi`, { duration: 3000 });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  const handleRaiseHand = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const newState = !handRaised;
    setHandRaised(newState);
    await supabase
      .from('live_session_participants')
      .update({ is_hand_raised: newState })
      .eq('session_id', sessionId)
      .eq('user_id', user.id);
    toast.success(newState ? "Qo'l ko'tarildi ✋" : "Qo'l tushirildi");
  };

  // Abacus broadcast
  useEffect(() => {
    const channel = supabase.channel(`live-abacus-ctrl-${sessionId}`, {
      config: { broadcast: { self: false } },
    });
    channel.on('broadcast', { event: 'abacus-toggle' }, (payload) => {
      if (payload.payload?.open) setActivePanel('abacus');
      else if (activePanel === 'abacus') setActivePanel('none');
    });
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId, activePanel]);

  const toggleAbacusForAll = useCallback((open: boolean) => {
    setActivePanel(open ? 'abacus' : 'none');
    const channel = supabase.channel(`live-abacus-ctrl-${sessionId}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({ type: 'broadcast', event: 'abacus-toggle', payload: { open } });
        setTimeout(() => supabase.removeChannel(channel), 500);
      }
    });
  }, [sessionId]);

  const togglePanel = (panel: 'participants' | 'chat' | 'abacus') => {
    setActivePanel(prev => prev === panel ? 'none' : panel);
  };

  const hasSidePanel = activePanel !== 'none';

  return (
    <div className="h-full flex flex-col">
      {/* ===== VIDEO + SIDE PANEL ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className="flex-1 relative bg-[#202124] p-2">
          <div className="h-full rounded-xl overflow-hidden bg-[#3c4043]">
            <VideoConference />
          </div>

          {/* Meeting info overlay - top left */}
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-[#202124]/80 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-white text-xs font-medium truncate max-w-[160px] sm:max-w-[250px]">
                {sessionInfo?.title}
              </span>
              <span className="text-[#9aa0a6] text-[10px]">|</span>
              <span className="text-[#9aa0a6] text-xs font-mono">{formatTime(elapsedTime)}</span>
            </div>
          </div>

          {/* Recording indicator */}
          <div className="absolute top-4 right-4 z-10">
            <div className="flex items-center gap-2">
              <div className="bg-[#202124]/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                <Circle className="w-2.5 h-2.5 fill-red-500 text-red-500 animate-pulse" />
                <span className="text-red-400 text-[10px] font-semibold">REC</span>
              </div>
              {isTeacher && (
                <div className="bg-[#1a73e8]/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-white" />
                  <span className="text-white text-[10px] font-semibold">Ustoz</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <AnimatePresence>
          {hasSidePanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="h-full bg-white dark:bg-[#292a2d] border-l border-[#e0e0e0] dark:border-[#3c4043] flex flex-col overflow-hidden shrink-0"
            >
              {/* Panel: Participants */}
              {activePanel === 'participants' && (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#e0e0e0] dark:border-[#3c4043]">
                    <h3 className="font-medium text-sm text-[#202124] dark:text-white">
                      Ishtirokchilar ({participants.length})
                    </h3>
                    <button onClick={() => setActivePanel('none')} className="w-8 h-8 rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] flex items-center justify-center">
                      <X className="w-4 h-4 text-[#5f6368] dark:text-[#9aa0a6]" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {participants.map((p, idx) => {
                      const initial = (p.name || p.identity).charAt(0).toUpperCase();
                      const avatarColors = ['#1a73e8', '#ea4335', '#fbbc04', '#34a853', '#a142f4', '#ff6d01'];
                      return (
                        <div key={p.identity} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043]/60 transition-colors">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
                            style={{ backgroundColor: avatarColors[idx % avatarColors.length] }}
                          >
                            {initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#202124] dark:text-white font-medium truncate">
                              {p.name || p.identity}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {p.isMicrophoneEnabled ? (
                              <Mic className="w-4 h-4 text-[#5f6368] dark:text-[#9aa0a6]" />
                            ) : (
                              <MicOff className="w-4 h-4 text-[#ea4335]" />
                            )}
                            {p.isCameraEnabled ? (
                              <Video className="w-4 h-4 text-[#5f6368] dark:text-[#9aa0a6]" />
                            ) : (
                              <VideoOff className="w-4 h-4 text-[#ea4335]" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Panel: Chat */}
              {activePanel === 'chat' && (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#e0e0e0] dark:border-[#3c4043]">
                    <h3 className="font-medium text-sm text-[#202124] dark:text-white">Dars chati</h3>
                    <button onClick={() => setActivePanel('none')} className="w-8 h-8 rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] flex items-center justify-center">
                      <X className="w-4 h-4 text-[#5f6368] dark:text-[#9aa0a6]" />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {chatMessages.length === 0 && (
                      <div className="text-center py-10">
                        <MessageSquare className="w-10 h-10 text-[#dadce0] dark:text-[#5f6368] mx-auto mb-3" />
                        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">Xabarlar bu yerda ko'rinadi</p>
                        <p className="text-xs text-[#9aa0a6] mt-1">Birinchi bo'lib yozing!</p>
                      </div>
                    )}
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-[#9aa0a6] mb-0.5 px-1">{msg.sender}</span>
                        <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                          msg.isOwn 
                            ? 'bg-[#1a73e8] text-white rounded-tr-sm' 
                            : 'bg-[#f1f3f4] dark:bg-[#3c4043] text-[#202124] dark:text-white rounded-tl-sm'
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[9px] text-[#9aa0a6] mt-0.5 px-1">
                          {msg.timestamp.toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat input */}
                  <div className="p-3 border-t border-[#e0e0e0] dark:border-[#3c4043]">
                    <div className="flex items-center gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                        placeholder="Xabar yozing..."
                        className="flex-1 bg-[#f1f3f4] dark:bg-[#3c4043] border-0 rounded-full text-sm h-10 px-4 placeholder:text-[#9aa0a6] focus-visible:ring-1 focus-visible:ring-[#1a73e8]"
                      />
                      <button 
                        onClick={sendChatMessage}
                        disabled={!chatInput.trim()}
                        className="w-10 h-10 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] disabled:bg-[#dadce0] dark:disabled:bg-[#3c4043] flex items-center justify-center transition-colors"
                      >
                        <Send className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Panel: Abacus */}
              {activePanel === 'abacus' && (
                <div className="flex flex-col h-full">
                  <LiveAbacus
                    sessionId={sessionId}
                    isTeacher={isTeacher}
                    onClose={() => {
                      if (isTeacher) toggleAbacusForAll(false);
                      else setActivePanel('none');
                    }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== BOTTOM CONTROL BAR (Google Meet style) ===== */}
      <div className="bg-[#202124] px-4 py-2.5 z-20">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          {/* Left: Meeting info (mobile hidden) */}
          <div className="hidden sm:flex items-center gap-3 flex-1">
            <span className="text-[#e8eaed] text-sm font-medium">{formatTime(elapsedTime)}</span>
            <span className="text-[#5f6368]">|</span>
            <span className="text-[#9aa0a6] text-xs truncate max-w-[200px]">{sessionInfo?.title}</span>
          </div>

          {/* Center: Main controls */}
          <div className="flex items-center gap-2 sm:gap-3 mx-auto sm:mx-0">
            {/* Mic (visual only - LiveKit handles internally) */}
            <MeetControlBtn icon={Mic} label="Ovoz" />
            <MeetControlBtn icon={Video} label="Video" />
            
            {/* Screen share */}
            <MeetControlBtn icon={MonitorUp} label="Ekran" accent />

            {/* Raise hand (students) */}
            {!isTeacher && (
              <button
                onClick={handleRaiseHand}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  handRaised 
                    ? 'bg-[#fdd663] text-[#202124]' 
                    : 'bg-[#3c4043] hover:bg-[#4a4d51] text-[#e8eaed]'
                }`}
                title="Qo'l ko'tarish"
              >
                <Hand className="w-5 h-5" />
              </button>
            )}

            {/* Abacus */}
            <button
              onClick={() => isTeacher ? toggleAbacusForAll(activePanel !== 'abacus') : togglePanel('abacus')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                activePanel === 'abacus' 
                  ? 'bg-[#8ab4f8] text-[#202124]' 
                  : 'bg-[#3c4043] hover:bg-[#4a4d51] text-[#e8eaed]'
              }`}
              title="Abakus"
            >
              <Calculator className="w-5 h-5" />
            </button>

            {/* Leave call */}
            <button
              onClick={onLeave}
              className="w-14 h-10 rounded-full bg-[#ea4335] hover:bg-[#d33828] flex items-center justify-center transition-colors ml-2"
              title="Chiqish"
            >
              <PhoneOff className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Right: Side panel toggles */}
          <div className="hidden sm:flex items-center gap-1 flex-1 justify-end">
            {/* Chat */}
            <button
              onClick={() => togglePanel('chat')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors relative ${
                activePanel === 'chat' 
                  ? 'bg-[#8ab4f8]/20 text-[#8ab4f8]' 
                  : 'hover:bg-[#3c4043] text-[#e8eaed]'
              }`}
              title="Chat"
            >
              <MessageSquare className="w-5 h-5" />
              {chatMessages.length > 0 && activePanel !== 'chat' && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#1a73e8] rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {chatMessages.length > 9 ? '9+' : chatMessages.length}
                </span>
              )}
            </button>

            {/* Participants */}
            <button
              onClick={() => togglePanel('participants')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                activePanel === 'participants' 
                  ? 'bg-[#8ab4f8]/20 text-[#8ab4f8]' 
                  : 'hover:bg-[#3c4043] text-[#e8eaed]'
              }`}
              title="Ishtirokchilar"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile: extra controls row */}
        <div className="flex sm:hidden items-center justify-center gap-3 mt-2">
          <button
            onClick={() => togglePanel('chat')}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors relative ${
              activePanel === 'chat' ? 'bg-[#8ab4f8]/20 text-[#8ab4f8]' : 'text-[#e8eaed]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {chatMessages.length > 0 && activePanel !== 'chat' && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#1a73e8] rounded-full text-[8px] text-white flex items-center justify-center">
                {chatMessages.length}
              </span>
            )}
          </button>
          <button
            onClick={() => togglePanel('participants')}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              activePanel === 'participants' ? 'bg-[#8ab4f8]/20 text-[#8ab4f8]' : 'text-[#e8eaed]'
            }`}
          >
            <Users className="w-4 h-4" />
          </button>
          <span className="text-[#9aa0a6] text-xs">{participants.length}</span>
        </div>
      </div>
    </div>
  );
};

// Google Meet style control button
const MeetControlBtn = ({ icon: Icon, label, accent }: { icon: any; label: string; accent?: boolean }) => (
  <button
    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
      accent 
        ? 'bg-[#3c4043] hover:bg-[#8ab4f8]/20 text-[#8ab4f8]' 
        : 'bg-[#3c4043] hover:bg-[#4a4d51] text-[#e8eaed]'
    }`}
    title={label}
  >
    <Icon className="w-5 h-5" />
  </button>
);

export default LiveClassroom;
