import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, Users, BookOpen, Calendar, Plus, Clock,
  TrendingUp, Play, ExternalLink, Trash2, Monitor,
  BarChart3, GraduationCap, Eye, Loader2, Wifi
} from 'lucide-react';
import { format } from 'date-fns';

interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  meeting_type: string;
  zoom_join_url: string | null;
  zoom_start_url: string | null;
  zoom_meeting_id: string | null;
  scheduled_at: string | null;
  status: string;
  created_at: string;
  course_id: string | null;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  joined_at: string;
  left_at: string | null;
  duration_minutes: number | null;
  live_session_id: string;
}

interface CourseInfo {
  id: string;
  title: string;
  description: string | null;
}

export const TeacherLMSDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'attendance'>('upcoming');

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDuration, setNewDuration] = useState('60');
  const [newCourseId, setNewCourseId] = useState('');

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [sessionsRes, coursesRes, attendanceRes] = await Promise.all([
      supabase
        .from('live_sessions_safe' as any)
        .select('*')
        .eq('teacher_id', user.id)
        .order('scheduled_at', { ascending: false }),
      supabase
        .from('courses')
        .select('id, title, description')
        .eq('teacher_id', user.id),
      supabase
        .from('attendance')
        .select('*')
        .order('joined_at', { ascending: false })
        .limit(100),
    ]);

    if (sessionsRes.data) setSessions(sessionsRes.data as any);
    if (coursesRes.data) setCourses(coursesRes.data);
    if (attendanceRes.data) setAttendance(attendanceRes.data);
    setLoading(false);
  };

  const createZoomMeeting = async () => {
    if (!newTitle || !newDate || !newTime) {
      toast.error('Mavzu, sana va vaqtni kiriting');
      return;
    }
    setCreating(true);
    try {
      const startTime = `${newDate}T${newTime}:00`;
      const { data, error } = await supabase.functions.invoke('zoom-meeting', {
        body: {
          action: 'create',
          title: newTitle,
          description: newDesc,
          start_time: startTime,
          duration: parseInt(newDuration),
          course_id: newCourseId || null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Zoom dars muvaffaqiyatli yaratildi!');
      setShowCreate(false);
      setNewTitle('');
      setNewDesc('');
      setNewDate('');
      setNewTime('');
      setNewDuration('60');
      setNewCourseId('');
      fetchData();
    } catch (err: any) {
      toast.error(`Xatolik: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('zoom-meeting', {
        body: { action: 'delete', session_id: sessionId },
      });
      if (error) throw error;
      toast.success('Dars o\'chirildi');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const now = new Date();
  const upcomingSessions = sessions.filter(s =>
    s.scheduled_at && new Date(s.scheduled_at) >= now && s.status !== 'ended'
  );
  const pastSessions = sessions.filter(s =>
    !s.scheduled_at || new Date(s.scheduled_at) < now || s.status === 'ended'
  );

  const getSessionAttendance = (sessionId: string) =>
    attendance.filter(a => a.live_session_id === sessionId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Video, label: 'Jami darslar', value: sessions.length, color: 'from-blue-500 to-cyan-500' },
          { icon: Calendar, label: 'Rejalashtirilgan', value: upcomingSessions.length, color: 'from-emerald-500 to-teal-500' },
          { icon: Users, label: 'Davomat yozuvlari', value: attendance.length, color: 'from-violet-500 to-purple-500' },
          { icon: BookOpen, label: 'Kurslarim', value: courses.length, color: 'from-amber-500 to-orange-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shrink-0`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Create Button + Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {(['upcoming', 'past', 'attendance'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'upcoming' ? '📅 Kelgusi' : tab === 'past' ? '📁 O\'tgan' : '📊 Davomat'}
            </button>
          ))}
        </div>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
              <Plus className="w-4 h-4" />
              Zoom dars yaratish
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-500" />
                Yangi Zoom dars
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Mavzu *</label>
                <Input
                  placeholder="Dars mavzusini kiriting"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tavsif</label>
                <Textarea
                  placeholder="Qisqacha tavsif"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Sana *</label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Vaqt *</label>
                  <Input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Davomiyligi (daqiqa)</label>
                <Input
                  type="number"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  min="15"
                  max="300"
                />
              </div>
              {courses.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Kursga bog'lash</label>
                  <select
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    value={newCourseId}
                    onChange={(e) => setNewCourseId(e.target.value)}
                  >
                    <option value="">-- Tanlanmagan --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              )}
              <Button
                className="w-full gap-2"
                onClick={createZoomMeeting}
                disabled={creating}
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Video className="w-4 h-4" />
                )}
                {creating ? 'Yaratilmoqda...' : 'Zoom meeting yaratish'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'upcoming' && (
          <motion.div
            key="upcoming"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {upcomingSessions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Rejalashtirilgan darslar yo'q</p>
                  <p className="text-xs text-muted-foreground mt-1">Yangi Zoom dars yarating</p>
                </CardContent>
              </Card>
            ) : (
              upcomingSessions.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-all border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400">
                              <Wifi className="w-3 h-3 mr-1" />
                              Zoom
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {session.status}
                            </Badge>
                          </div>
                          <h3 className="font-semibold truncate">{session.title}</h3>
                          {session.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{session.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {session.scheduled_at ? format(new Date(session.scheduled_at), 'dd.MM.yyyy') : '-'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {session.scheduled_at ? format(new Date(session.scheduled_at), 'HH:mm') : '-'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {session.zoom_start_url && (
                            <Button
                              size="sm"
                              className="gap-1 bg-gradient-to-r from-blue-600 to-cyan-600"
                              onClick={() => window.open(session.zoom_start_url!, '_blank')}
                            >
                              <Play className="w-3 h-3" />
                              Boshlash
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteSession(session.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'past' && (
          <motion.div
            key="past"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {pastSessions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">O'tgan darslar yo'q</p>
                </CardContent>
              </Card>
            ) : (
              pastSessions.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-all opacity-80">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{session.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {session.scheduled_at ? format(new Date(session.scheduled_at), 'dd.MM.yyyy HH:mm') : 'Sana belgilanmagan'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px]">
                              {session.meeting_type === 'zoom' ? '📹 Zoom' : '🎥 LiveKit'}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {getSessionAttendance(session.id).length} ta ishtirokchi
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteSession(session.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'attendance' && (
          <motion.div
            key="attendance"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-violet-500" />
                  Davomat hisoboti
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Hali darslar yaratilmagan
                  </p>
                ) : (
                  <div className="space-y-4">
                    {sessions.slice(0, 10).map(session => {
                      const sessionAttendance = getSessionAttendance(session.id);
                      return (
                        <div key={session.id} className="border rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{session.title}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {session.scheduled_at ? format(new Date(session.scheduled_at), 'dd.MM.yyyy HH:mm') : '-'}
                              </p>
                            </div>
                            <Badge variant="outline">{sessionAttendance.length} ta</Badge>
                          </div>
                          {sessionAttendance.length > 0 ? (
                            <div className="space-y-1">
                              {sessionAttendance.map(a => (
                                <div key={a.id} className="flex items-center justify-between text-xs bg-muted/50 rounded-lg px-2 py-1.5">
                                  <span className="flex items-center gap-1">
                                    <GraduationCap className="w-3 h-3" />
                                    {a.student_id.slice(0, 8)}...
                                  </span>
                                  <span className="text-muted-foreground">
                                    {format(new Date(a.joined_at), 'HH:mm')}
                                    {a.left_at && ` - ${format(new Date(a.left_at), 'HH:mm')}`}
                                    {a.duration_minutes && ` (${a.duration_minutes} min)`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Davomat yozuvi yo'q</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
