import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useSound } from '@/hooks/useSound';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Video, Calendar, Users, Clock, ArrowRight, Trash2 } from 'lucide-react';
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

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('live_sessions')
      .select('*')
      .in('status', ['scheduled', 'live'])
      .order('scheduled_at', { ascending: true });

    if (!error && data) setSessions(data);
    setLoading(false);
  };

  const generateRoomName = () => {
    return `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Sarlavha kiriting");
      return;
    }
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
      console.error(error);
    } else if (data) {
      toast.success("Dars xonasi yaratildi!");
      setCreateOpen(false);
      setTitle('');
      setDescription('');
      setScheduledAt('');

      // If starting now, navigate to room
      if (!scheduledAt) {
        navigate(`/live/${data.id}`);
      } else {
        fetchSessions();
      }
    }
    setCreating(false);
  };

  const handleStartSession = async (session: any) => {
    // Update status to live
    await supabase
      .from('live_sessions')
      .update({ status: 'live', started_at: new Date().toISOString() })
      .eq('id', session.id);

    navigate(`/live/${session.id}`);
  };

  const handleJoinSession = (session: any) => {
    navigate(`/live/${session.id}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Bu sessiyani o'chirishni xohlaysizmi?")) return;

    // Delete participants first
    await supabase
      .from('live_session_participants')
      .delete()
      .eq('session_id', sessionId);

    const { error } = await supabase
      .from('live_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      toast.error("O'chirishda xatolik yuz berdi");
      console.error(error);
    } else {
      toast.success("Sessiya o'chirildi");
      fetchSessions();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500 text-white animate-pulse">🔴 Jonli</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="text-blue-600">📅 Rejalashtirilgan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Live Darslar</h1>
            <p className="text-muted-foreground mt-1">
              Real vaqtda dars o'tish va qatnashish
            </p>
          </div>

          {(isTeacher || isAdmin) && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline">Yangi dars</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yangi Live Dars</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Sarlavha *</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Masalan: Abakus asoslari"
                    />
                  </div>
                  <div>
                    <Label>Tavsif</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Dars haqida qisqacha..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Vaqt (ixtiyoriy - bo'sh qoldirsangiz hozir boshlanadi)</Label>
                    <Input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setCreateOpen(false)}>
                      Bekor qilish
                    </Button>
                    <Button onClick={handleCreate} disabled={creating}>
                      {creating ? "Yaratilmoqda..." : scheduledAt ? "Rejalashtirish" : "Hozir boshlash"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Video className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Hozircha darslar yo'q</h3>
              <p className="text-muted-foreground">
                {isTeacher || isAdmin
                  ? "Yangi live dars yarating"
                  : "O'qituvchi dars boshlaganda bu yerda ko'rinadi"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(session.status)}
                        <h3 className="font-bold text-lg">{session.title}</h3>
                      </div>
                      {session.description && (
                        <p className="text-sm text-muted-foreground">{session.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {session.scheduled_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(session.scheduled_at), 'dd.MM.yyyy HH:mm')}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Max {session.max_participants}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {session.status === 'live' ? (
                        <Button onClick={() => handleJoinSession(session)} className="gap-1">
                          <ArrowRight className="w-4 h-4" /> Kirish
                        </Button>
                      ) : session.teacher_id === user?.id ? (
                        <Button onClick={() => handleStartSession(session)} variant="default" className="gap-1">
                          <Video className="w-4 h-4" /> Boshlash
                        </Button>
                      ) : (
                        <Badge variant="outline">Kutilmoqda</Badge>
                      )}
                      {(session.teacher_id === user?.id || isAdmin) && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default LiveSessions;
