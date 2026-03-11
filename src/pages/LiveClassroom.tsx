import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { LiveKitRoom, VideoConference, RoomAudioRenderer, useRoomContext, useParticipants, useLocalParticipant } from '@livekit/components-react';
import '@livekit/components-styles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, MonitorUp, PhoneOff,
  MessageSquare, Users, Hand, Send, Smile, MoreVertical,
  Lock, Unlock, Circle, Settings, UserMinus, Volume2, VolumeX,
  ChevronRight, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track } from 'livekit-client';

/* ─── Main page ─── */
const LiveClassroom = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [url, setUrl] = useState('');
  const [isTeacher, setIsTeacher] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId || !user) return;
    (async () => {
      // Fetch session
      const { data: sess } = await supabase.from('live_sessions').select('*').eq('id', sessionId).single();
      if (!sess) { setError("Dars topilmadi"); setLoading(false); return; }
      setSession(sess);

      // Check lock
      if (sess.is_locked && sess.teacher_id !== user.id) {
        setError("Bu dars qulflangan");
        setLoading(false);
        return;
      }

      // Get LiveKit token
      const { data, error: fnErr } = await supabase.functions.invoke('livekit-token', {
        body: { roomName: sess.room_name, sessionId }
      });
      if (fnErr || !data?.success) {
        setError(data?.error || "Token olishda xatolik");
        setLoading(false);
        return;
      }
      setToken(data.token);
      setUrl(data.url);
      setIsTeacher(data.isTeacher);
      setLoading(false);
    })();
  }, [sessionId, user]);

  const handleDisconnect = useCallback(async () => {
    if (isTeacher && session) {
      await supabase.from('live_sessions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', session.id);
    }
    navigate('/live-sessions');
  }, [isTeacher, session, navigate]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[hsl(var(--background))]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Darsga ulanilmoqda...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="h-screen flex items-center justify-center bg-[hsl(var(--background))]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <X className="w-8 h-8 text-destructive" />
        </div>
        <p className="text-lg font-medium">{error}</p>
        <Button onClick={() => navigate('/live-sessions')} variant="outline">Orqaga qaytish</Button>
      </div>
    </div>
  );

  return (
    <LiveKitRoom
      token={token}
      serverUrl={url}
      connect={true}
      onDisconnected={handleDisconnect}
      className="h-screen"
      data-lk-theme="default"
    >
      <RoomAudioRenderer />
      <MeetUI session={session} isTeacher={isTeacher} sessionId={sessionId!} onLeave={handleDisconnect} />
    </LiveKitRoom>
  );
};

/* ─── Zoom/Meet-style UI ─── */
const MeetUI = ({ session, isTeacher, sessionId, onLeave }: {
  session: any; isTeacher: boolean; sessionId: string; onLeave: () => void;
}) => {
  const [sidePanel, setSidePanel] = useState<'chat' | 'participants' | null>(null);
  const [handRaised, setHandRaised] = useState(false);
  const [isLocked, setIsLocked] = useState(session?.is_locked || false);
  const [isRecording, setIsRecording] = useState(session?.is_recording || false);
  const [timer, setTimer] = useState(0);

  // Timer
  useEffect(() => {
    const iv = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${m}:${String(sec).padStart(2, '0')}`;
  };

  const toggleLock = async () => {
    const newState = !isLocked;
    await supabase.from('live_sessions').update({ is_locked: newState }).eq('id', sessionId);
    setIsLocked(newState);
    toast.success(newState ? "Xona qulflandi" : "Xona ochildi");
  };

  const toggleRecording = async () => {
    const newState = !isRecording;
    await supabase.from('live_sessions').update({ is_recording: newState }).eq('id', sessionId);
    setIsRecording(newState);
    toast.success(newState ? "Yozib olish boshlandi" : "Yozib olish to'xtatildi");
  };

  const toggleHand = () => {
    setHandRaised(prev => !prev);
    toast.info(handRaised ? "Qo'l tushirildi" : "Qo'l ko'tarildi ✋");
  };

  return (
    <div className="h-screen flex flex-col bg-[hsl(var(--background))]">
      {/* ── Top bar ── */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-border/50 bg-card/80 backdrop-blur-sm shrink-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-sm truncate max-w-[200px] md:max-w-none">{session?.title}</h1>
          {isRecording && (
            <Badge variant="destructive" className="gap-1 text-[10px] h-5 animate-pulse">
              <Circle className="w-2 h-2 fill-current" /> REC
            </Badge>
          )}
          {isLocked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground tabular-nums">{formatTime(timer)}</span>
          {isTeacher && (
            <Badge variant="secondary" className="text-[10px] h-5">Ustoz</Badge>
          )}
        </div>
      </header>

      {/* ── Content area ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className="flex-1 relative">
          <VideoConference />
        </div>

        {/* Side panel */}
        <AnimatePresence>
          {sidePanel && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-border bg-card overflow-hidden shrink-0"
            >
              <div className="flex flex-col h-full w-[340px]">
                <div className="h-12 flex items-center justify-between px-4 border-b border-border">
                  <span className="font-medium text-sm">
                    {sidePanel === 'chat' ? 'Chat' : 'Ishtirokchilar'}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidePanel(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {sidePanel === 'chat' ? (
                  <ChatPanel sessionId={sessionId} />
                ) : (
                  <ParticipantsPanel sessionId={sessionId} isTeacher={isTeacher} />
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom control bar ── */}
      <footer className="h-16 md:h-[72px] flex items-center justify-center gap-2 md:gap-3 px-4 border-t border-border bg-card/90 backdrop-blur-sm shrink-0 z-10">
        {/* Mic/Camera handled by LiveKit defaults, we add extra buttons */}

        {/* Chat */}
        <ControlButton
          icon={<MessageSquare className="w-5 h-5" />}
          label="Chat"
          active={sidePanel === 'chat'}
          onClick={() => setSidePanel(p => p === 'chat' ? null : 'chat')}
        />

        {/* Participants */}
        <ControlButton
          icon={<Users className="w-5 h-5" />}
          label="Ishtirokchilar"
          active={sidePanel === 'participants'}
          onClick={() => setSidePanel(p => p === 'participants' ? null : 'participants')}
        />

        {/* Raise hand (students) */}
        {!isTeacher && (
          <ControlButton
            icon={<Hand className="w-5 h-5" />}
            label="Qo'l"
            active={handRaised}
            onClick={toggleHand}
          />
        )}

        {/* Teacher controls */}
        {isTeacher && (
          <>
            <ControlButton
              icon={isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
              label={isLocked ? "Qulfli" : "Ochiq"}
              active={isLocked}
              onClick={toggleLock}
            />
            <ControlButton
              icon={<Circle className={`w-5 h-5 ${isRecording ? 'fill-destructive text-destructive' : ''}`} />}
              label="Yozish"
              active={isRecording}
              onClick={toggleRecording}
            />
          </>
        )}

        {/* Leave button */}
        <Button
          onClick={onLeave}
          className="rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground h-10 md:h-12 px-5 md:px-6 gap-2"
        >
          <PhoneOff className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden md:inline text-sm">
            {isTeacher ? "Tugatish" : "Chiqish"}
          </span>
        </Button>
      </footer>
    </div>
  );
};

/* ─── Control Button ─── */
const ControlButton = ({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active?: boolean; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-xl transition-colors
      ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
  >
    {icon}
    <span className="text-[10px] mt-0.5">{label}</span>
  </button>
);

/* ─── Chat Panel ─── */
const ChatPanel = ({ sessionId }: { sessionId: string }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch existing messages
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('live_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(200);
      if (data) setMessages(data);
    })();
  }, [sessionId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`live-chat-${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_chat_messages',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !user || sending) return;
    setSending(true);
    const { error } = await supabase.from('live_chat_messages').insert({
      session_id: sessionId,
      user_id: user.id,
      content: newMsg.trim(),
      message_type: 'text',
    });
    if (!error) setNewMsg('');
    setSending(false);
  };

  // Get username cache
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  useEffect(() => {
    const userIds = [...new Set(messages.map(m => m.user_id))].filter(id => !usernames[id]);
    if (userIds.length === 0) return;
    (async () => {
      const { data } = await supabase.from('profiles').select('user_id, username').in('user_id', userIds);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(p => { map[p.user_id] = p.username; });
        setUsernames(prev => ({ ...prev, ...map }));
      }
    })();
  }, [messages]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ScrollArea className="flex-1 px-3 py-2" ref={scrollRef}>
        <div className="space-y-2">
          {messages.map(msg => (
            <div key={msg.id} className={`text-sm ${msg.user_id === user?.id ? 'text-right' : ''}`}>
              <span className="text-xs font-medium text-primary">
                {usernames[msg.user_id] || 'User'}
              </span>
              <p className={`mt-0.5 px-3 py-1.5 rounded-xl inline-block max-w-[85%] text-left
                ${msg.user_id === user?.id
                  ? 'bg-primary text-primary-foreground ml-auto'
                  : 'bg-muted'}`}>
                {msg.content}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-3 border-t border-border">
        <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <Input
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            placeholder="Xabar yozing..."
            className="text-sm h-9"
          />
          <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={sending || !newMsg.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

/* ─── Participants Panel ─── */
const ParticipantsPanel = ({ sessionId, isTeacher }: { sessionId: string; isTeacher: boolean }) => {
  const [participants, setParticipants] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('live_session_participants')
        .select('*')
        .eq('session_id', sessionId)
        .is('left_at', null);
      if (data) {
        setParticipants(data);
        // Fetch profiles
        const uids = data.map(p => p.user_id);
        if (uids.length) {
          const { data: profs } = await supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', uids);
          if (profs) {
            const map: Record<string, any> = {};
            profs.forEach(p => { map[p.user_id] = p; });
            setProfiles(map);
          }
        }
      }
    })();
  }, [sessionId]);

  const removeParticipant = async (userId: string) => {
    await supabase.from('live_session_participants')
      .update({ left_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('user_id', userId);
    setParticipants(prev => prev.filter(p => p.user_id !== userId));
    toast.success("Ishtirokchi chiqarildi");
  };

  const teachers = participants.filter(p => p.role === 'teacher');
  const students = participants.filter(p => p.role === 'student');

  return (
    <ScrollArea className="flex-1 px-3 py-2">
      <div className="space-y-4">
        {teachers.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">O'qituvchi</p>
            {teachers.map(p => (
              <ParticipantItem key={p.id} participant={p} profile={profiles[p.user_id]} isTeacher={false} />
            ))}
          </div>
        )}
        {students.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">O'quvchilar ({students.length})</p>
            {students.map(p => (
              <ParticipantItem key={p.id} participant={p} profile={profiles[p.user_id]}
                isTeacher={isTeacher}
                onRemove={() => removeParticipant(p.user_id)} />
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

const ParticipantItem = ({ participant, profile, isTeacher, onRemove }: {
  participant: any; profile: any; isTeacher: boolean; onRemove?: () => void;
}) => (
  <div className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 group">
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
      {(profile?.username || 'U')[0].toUpperCase()}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{profile?.username || 'User'}</p>
      <p className="text-[10px] text-muted-foreground">{participant.role === 'teacher' ? 'Ustoz' : "O'quvchi"}</p>
    </div>
    {participant.is_hand_raised && <Hand className="w-4 h-4 text-accent" />}
    {isTeacher && onRemove && (
      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"
        onClick={onRemove}>
        <UserMinus className="w-3.5 h-3.5 text-destructive" />
      </Button>
    )}
  </div>
);

export default LiveClassroom;
