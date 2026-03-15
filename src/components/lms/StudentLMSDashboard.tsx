import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Video, BookOpen, Calendar, Clock, Play, ExternalLink,
  GraduationCap, CheckCircle, Users, TrendingUp, Loader2, Wifi
} from 'lucide-react';
import { format, isAfter, isBefore, addMinutes } from 'date-fns';

interface UpcomingLesson {
  id: string;
  title: string;
  description: string | null;
  meeting_type: string;
  zoom_join_url: string | null;
  zoom_password: string | null;
  scheduled_at: string | null;
  status: string;
  teacher_id: string;
}

interface EnrolledCourse {
  id: string;
  course_id: string;
  status: string;
  progress: number;
  enrolled_at: string;
  course_title?: string;
  course_description?: string;
}

interface AttendanceRecord {
  id: string;
  live_session_id: string;
  joined_at: string;
  left_at: string | null;
}

export const StudentLMSDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const now = new Date().toISOString();

    const [lessonsRes, enrollmentsRes, attendanceRes] = await Promise.all([
      supabase
        .from('live_sessions_safe' as any)
        .select('*')
        .gte('scheduled_at', now)
        .in('status', ['scheduled', 'live'])
        .order('scheduled_at', { ascending: true }),
      supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', user.id),
      supabase
        .from('attendance')
        .select('*')
        .eq('student_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(50),
    ]);

    if (lessonsRes.data) setUpcomingLessons(lessonsRes.data as any);
    if (enrollmentsRes.data) {
      // Fetch course titles
      const courseIds = enrollmentsRes.data.map(e => e.course_id);
      if (courseIds.length > 0) {
        const { data: coursesData } = await supabase
          .from('courses')
          .select('id, title, description')
          .in('id', courseIds);
        
        const enriched = enrollmentsRes.data.map(e => ({
          ...e,
          course_title: coursesData?.find(c => c.id === e.course_id)?.title,
          course_description: coursesData?.find(c => c.id === e.course_id)?.description,
        }));
        setEnrolledCourses(enriched);
      } else {
        setEnrolledCourses(enrollmentsRes.data);
      }
    }
    if (attendanceRes.data) setMyAttendance(attendanceRes.data);
    setLoading(false);
  };

  const joinLesson = async (session: UpcomingLesson) => {
    if (!user) return;

    // Record attendance
    try {
      await supabase.from('attendance').upsert({
        live_session_id: session.id,
        student_id: user.id,
        joined_at: new Date().toISOString(),
      }, { onConflict: 'live_session_id,student_id' });
    } catch (e) {
      console.error('Attendance error:', e);
    }

    if (session.meeting_type === 'zoom' && session.zoom_join_url) {
      window.open(session.zoom_join_url, '_blank');
      toast.success('Zoom darsga yo\'naltirilmoqda...');
    } else {
      navigate(`/live/${session.id}`);
    }
  };

  const isLessonLive = (session: UpcomingLesson) => {
    if (!session.scheduled_at) return false;
    const start = new Date(session.scheduled_at);
    const end = addMinutes(start, 90);
    const now = new Date();
    return isAfter(now, addMinutes(start, -5)) && isBefore(now, end);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Video, label: 'Kelgusi darslar', value: upcomingLessons.length, color: 'from-blue-500 to-cyan-500' },
          { icon: BookOpen, label: 'Kurslarim', value: enrolledCourses.length, color: 'from-emerald-500 to-teal-500' },
          { icon: CheckCircle, label: 'Qatnashganlarim', value: myAttendance.length, color: 'from-violet-500 to-purple-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <div className={`h-8 w-8 mx-auto rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-1.5`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Upcoming Live Lessons */}
      <div>
        <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-blue-500" />
          Kelgusi jonli darslar
        </h3>
        
        {upcomingLessons.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <Video className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Hozircha rejalashtirilgan dars yo'q</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingLessons.map((session, i) => {
              const live = isLessonLive(session);
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`hover:shadow-md transition-all ${live ? 'border-l-4 border-l-red-500 ring-1 ring-red-500/20' : 'border-l-4 border-l-blue-500'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {live && (
                              <Badge className="bg-red-500 text-white text-[10px] animate-pulse">
                                🔴 LIVE
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-[10px]">
                              {session.meeting_type === 'zoom' ? '📹 Zoom' : '🎥 LiveKit'}
                            </Badge>
                          </div>
                          <h3 className="font-semibold truncate">{session.title}</h3>
                          {session.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{session.description}</p>
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
                        <Button
                          size="sm"
                          className={`gap-1 shrink-0 ${live ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-blue-600 to-cyan-600'}`}
                          onClick={() => joinLesson(session)}
                        >
                          {live ? (
                            <>
                              <Wifi className="w-3 h-3" />
                              Qo'shilish
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3" />
                              Ochish
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Enrolled Courses */}
      {enrolledCourses.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-emerald-500" />
            Ro'yxatdan o'tgan kurslarim
          </h3>
          <div className="space-y-3">
            {enrolledCourses.map((enrollment, i) => (
              <motion.div
                key={enrollment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{enrollment.course_title || 'Kurs'}</h4>
                        {enrollment.course_description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{enrollment.course_description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Progress value={Number(enrollment.progress) || 0} className="h-1.5 flex-1" />
                          <span className="text-xs font-medium">{Math.round(Number(enrollment.progress) || 0)}%</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/courses/${enrollment.course_id}`)}
                      >
                        Davom etish
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* My Attendance History */}
      {myAttendance.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-500" />
              Qatnashish tarixim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {myAttendance.slice(0, 8).map(a => (
                <div key={a.id} className="flex items-center justify-between text-xs bg-muted/50 rounded-lg px-3 py-2">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    Dars #{a.live_session_id.slice(0, 6)}
                  </span>
                  <span className="text-muted-foreground">
                    {format(new Date(a.joined_at), 'dd.MM.yyyy HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
