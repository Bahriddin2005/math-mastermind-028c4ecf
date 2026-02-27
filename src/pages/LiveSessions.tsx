import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useSound } from '@/hooks/useSound';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Video, Calendar, Users, ArrowRight, Clock, Copy, LinkIcon } from 'lucide-react';
import { format } from 'date-fns';

const LiveSessions = () => {
  const { user } = useAuth();
  const { isTeacher, isAdmin } = useUserRole();
  const navigate = useNavigate();
  const { soundEnabled, toggleSound } = useSound();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('live_sessions')
      .select('*')
      .in('status', ['scheduled', 'live'])
      .order('scheduled_at', { ascending: true });
    if (!error && data) setSessions(data);
    setLoading(false);
  };

  const generateRoomName = () => `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  const handleCreate = async () => {
    if (!title.trim()) { toast.error("Sarlavha kiriting"); return; }
    if (!user) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('live_sessions')
      .insert({
        teacher_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        room_name: generateRoomName(),
        scheduled_at: scheduledAt || null,
        status: scheduledAt ? 'scheduled' : 'live',
        started_at: scheduledAt ? null : new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast.error("Xona yaratishda xatolik");
    } else if (data) {
      toast.success("Dars xonasi yaratildi!");
      setCreateOpen(false);
      setTitle(''); setDescription(''); setScheduledAt('');
      if (!scheduledAt) navigate(`/live/${data.id}`);
      else fetchSessions();
    }
    setCreating(false);
  };

  const handleStartSession = async (session: any) => {
    await supabase
      .from('live_sessions')
      .update({ status: 'live', started_at: new Date().toISOString() })
      .eq('id', session.id);
    navigate(`/live/${session.id}`);
  };

  const handleJoinSession = (session: any) => {
    navigate(`/live/${session.id}`);
  };

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/live/${id}`);
    toast.success("Havola nusxalandi!");
  };

  const liveSessions = sessions.filter(s => s.status === 'live');
  const scheduledSessions = sessions.filter(s => s.status === 'scheduled');

  return (
    <div className="min-h-screen bg-background">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Live Darslar</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Real vaqtda dars o'tish va qatnashish
            </p>
          </div>
          {(isTeacher || isAdmin) && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-full px-5 bg-[#1a73e8] hover:bg-[#1557b0] text-white">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Yangi dars</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Yangi Live Dars</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label>Sarlavha *</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: Abakus asoslari" className="mt-1" />
                  </div>
                  <div>
                    <Label>Tavsif</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Dars haqida qisqacha..." rows={3} className="mt-1" />
                  </div>
                  <div>
                    <Label>Vaqt (ixtiyoriy)</Label>
                    <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="mt-1" />
                    <p className="text-xs text-muted-foreground mt-1">Bo'sh qoldirsangiz hozir boshlanadi</p>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" onClick={() => setCreateOpen(false)}>Bekor</Button>
                    <Button onClick={handleCreate} disabled={creating} className="bg-[#1a73e8] hover:bg-[#1557b0] text-white">
                      {creating ? "Yaratilmoqda..." : scheduledAt ? "📅 Rejalashtirish" : "▶️ Hozir boshlash"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-[3px] border-[#1a73e8]/20 border-t-[#1a73e8] rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Video className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Hozircha darslar yo'q</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {isTeacher || isAdmin ? "Yangi live dars yaratib, o'quvchilaringiz bilan bog'laning" : "O'qituvchi dars boshlaganda bu yerda ko'rinadi"}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Live sessions */}
            {liveSessions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <h2 className="font-semibold text-lg">Hozir jonli</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {liveSessions.map(session => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      isOwner={session.teacher_id === user?.id}
                      isTeacher={isTeacher || isAdmin}
                      onJoin={() => handleJoinSession(session)}
                      onStart={() => handleStartSession(session)}
                      onCopyLink={() => copyLink(session.id)}
                      isLive
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled sessions */}
            {scheduledSessions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-semibold text-lg">Rejalashtirilgan</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {scheduledSessions.map(session => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      isOwner={session.teacher_id === user?.id}
                      isTeacher={isTeacher || isAdmin}
                      onJoin={() => handleJoinSession(session)}
                      onStart={() => handleStartSession(session)}
                      onCopyLink={() => copyLink(session.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

// Session Card Component
const SessionCard = ({ 
  session, isOwner, isTeacher, isLive, onJoin, onStart, onCopyLink 
}: { 
  session: any; isOwner: boolean; isTeacher: boolean; isLive?: boolean;
  onJoin: () => void; onStart: () => void; onCopyLink: () => void;
}) => (
  <Card className={`overflow-hidden transition-all hover:shadow-lg ${isLive ? 'border-red-500/30 bg-red-50/5' : ''}`}>
    <CardContent className="p-0">
      {/* Color bar */}
      <div className={`h-1 ${isLive ? 'bg-red-500' : 'bg-[#1a73e8]'}`} />
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isLive && (
                <Badge className="bg-red-500 text-white border-0 text-[10px] px-1.5 h-4 animate-pulse">
                  LIVE
                </Badge>
              )}
              <h3 className="font-semibold text-base truncate">{session.title}</h3>
            </div>
            {session.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{session.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          {session.scheduled_at && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(session.scheduled_at), 'dd.MM.yyyy HH:mm')}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {session.max_participants}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isLive ? (
            <Button onClick={onJoin} size="sm" className="flex-1 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full gap-1.5">
              <ArrowRight className="w-3.5 h-3.5" /> Darsga kirish
            </Button>
          ) : isOwner ? (
            <Button onClick={onStart} size="sm" className="flex-1 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full gap-1.5">
              <Video className="w-3.5 h-3.5" /> Boshlash
            </Button>
          ) : (
            <Badge variant="secondary" className="text-xs">Kutilmoqda</Badge>
          )}
          <Button onClick={onCopyLink} variant="outline" size="icon" className="h-8 w-8 rounded-full shrink-0">
            <LinkIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default LiveSessions;
