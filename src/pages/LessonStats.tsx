import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useSound } from '@/hooks/useSound';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PullToRefresh } from '@/components/PullToRefresh';
import { PageSkeleton } from '@/components/PageSkeleton';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  PlayCircle,
  TrendingUp,
  Trophy,
  Video,
  ArrowRight,
  BarChart3,
  Target
} from 'lucide-react';

interface CourseProgress {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  totalLessons: number;
  completedLessons: number;
  totalWatchedSeconds: number;
  totalDurationMinutes: number;
}

interface LessonProgress {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  course_id: string;
  course_title: string;
  completed: boolean;
  practice_completed: boolean;
  watched_seconds: number;
}

const LessonStats = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { soundEnabled, toggleSound } = useSound();
  
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [recentLessons, setRecentLessons] = useState<LessonProgress[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalLessons: 0,
    completedLessons: 0,
    totalWatchedMinutes: 0,
    totalDurationMinutes: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch all courses
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, description, thumbnail_url')
      .eq('is_published', true)
      .order('order_index');

    // Fetch all lessons with progress
    const { data: lessons } = await supabase
      .from('lessons')
      .select(`
        id, 
        title, 
        description, 
        duration_minutes, 
        course_id,
        courses!inner(title)
      `)
      .eq('is_published', true)
      .order('order_index');

    // Fetch user progress
    const { data: progressData } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, completed, practice_completed, watched_seconds')
      .eq('user_id', user.id);

    // Create progress map
    const progressMap = new Map(
      progressData?.map(p => [p.lesson_id, p]) || []
    );

    // Process courses with progress
    const courseProgressList: CourseProgress[] = [];
    let totalCompletedLessons = 0;
    let totalWatchedSeconds = 0;
    let totalDurationMinutes = 0;
    let completedCourses = 0;

    courses?.forEach(course => {
      const courseLessons = lessons?.filter(l => l.course_id === course.id) || [];
      const completed = courseLessons.filter(l => progressMap.get(l.id)?.completed).length;
      const watched = courseLessons.reduce((sum, l) => {
        return sum + (progressMap.get(l.id)?.watched_seconds || 0);
      }, 0);
      const duration = courseLessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);

      totalCompletedLessons += completed;
      totalWatchedSeconds += watched;
      totalDurationMinutes += duration;

      if (completed === courseLessons.length && courseLessons.length > 0) {
        completedCourses++;
      }

      courseProgressList.push({
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        totalLessons: courseLessons.length,
        completedLessons: completed,
        totalWatchedSeconds: watched,
        totalDurationMinutes: duration
      });
    });

    setCourseProgress(courseProgressList);

    // Get recent lessons with progress
    const lessonsWithProgress: LessonProgress[] = (lessons || []).map(l => {
      const progress = progressMap.get(l.id);
      return {
        id: l.id,
        title: l.title,
        description: l.description,
        duration_minutes: l.duration_minutes || 0,
        course_id: l.course_id,
        course_title: (l.courses as any)?.title || '',
        completed: progress?.completed || false,
        practice_completed: progress?.practice_completed || false,
        watched_seconds: progress?.watched_seconds || 0
      };
    }).filter(l => l.watched_seconds > 0 || l.completed)
      .sort((a, b) => b.watched_seconds - a.watched_seconds)
      .slice(0, 10);

    setRecentLessons(lessonsWithProgress);

    setTotalStats({
      totalCourses: courses?.length || 0,
      completedCourses,
      totalLessons: lessons?.length || 0,
      completedLessons: totalCompletedLessons,
      totalWatchedMinutes: Math.floor(totalWatchedSeconds / 60),
      totalDurationMinutes
    });

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/auth');
      return;
    }
    if (user) fetchData();
  }, [user, authLoading, fetchData, navigate]);

  const handleRefresh = async () => {
    await fetchData();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}s ${mins}d`;
    return `${mins} daqiqa`;
  };

  if (loading || authLoading) {
    return (
      <PageBackground className="min-h-screen">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <PageSkeleton type="default" />
      </PageBackground>
    );
  }

  const overallProgress = totalStats.totalLessons > 0 
    ? Math.round((totalStats.completedLessons / totalStats.totalLessons) * 100) 
    : 0;

  const watchProgress = totalStats.totalDurationMinutes > 0
    ? Math.round((totalStats.totalWatchedMinutes / totalStats.totalDurationMinutes) * 100)
    : 0;

  return (
    <PageBackground className="min-h-screen pb-20 sm:pb-24">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="container px-3 xs:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              Dars statistikasi
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Video darslar va kurslar bo'yicha progress
            </p>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Card className="p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span className="text-xs sm:text-sm font-medium">Kurslar</span>
              </div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-primary">
                {totalStats.completedCourses}/{totalStats.totalCourses}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">tugatildi</p>
            </Card>
            
            <Card className="p-3 sm:p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                <span className="text-xs sm:text-sm font-medium">Darslar</span>
              </div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-emerald-500">
                {totalStats.completedLessons}/{totalStats.totalLessons}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">tugatildi</p>
            </Card>
            
            <Card className="p-3 sm:p-4 bg-gradient-to-br from-kid-purple/10 to-kid-purple/5 border-kid-purple/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-kid-purple" />
                <span className="text-xs sm:text-sm font-medium">Ko'rilgan</span>
              </div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-kid-purple">
                {totalStats.totalWatchedMinutes}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">daqiqa</p>
            </Card>
            
            <Card className="p-3 sm:p-4 bg-gradient-to-br from-kid-yellow/10 to-kid-yellow/5 border-kid-yellow/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-kid-yellow" />
                <span className="text-xs sm:text-sm font-medium">Progress</span>
              </div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-kid-yellow">
                {overallProgress}%
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">umumiy</p>
            </Card>
          </div>

          {/* Overall Progress */}
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Umumiy progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                  <span className="text-muted-foreground">Darslar tugatilishi</span>
                  <span className="font-medium">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-2.5 sm:h-3" />
              </div>
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                  <span className="text-muted-foreground">Video ko'rish</span>
                  <span className="font-medium">{watchProgress}%</span>
                </div>
                <Progress value={watchProgress} className="h-2.5 sm:h-3 bg-secondary/80 [&>*]:bg-gradient-to-r [&>*]:from-kid-purple [&>*]:to-kid-pink" />
              </div>
            </CardContent>
          </Card>

          {/* Course Progress List */}
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Kurslar bo'yicha progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {courseProgress.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Hali kurslar mavjud emas</p>
                </div>
              ) : (
                courseProgress.map(course => {
                  const progress = course.totalLessons > 0 
                    ? Math.round((course.completedLessons / course.totalLessons) * 100) 
                    : 0;
                  const isCompleted = progress === 100;

                  return (
                    <div 
                      key={course.id}
                      className={`p-3 sm:p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all ${
                        isCompleted 
                          ? 'bg-emerald-500/10 border-emerald-500/30' 
                          : 'bg-card border-border/40'
                      }`}
                      onClick={() => navigate(`/courses/${course.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center shrink-0 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-primary/20'
                        }`}>
                          {isCompleted ? (
                            <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          ) : course.thumbnail_url ? (
                            <img src={course.thumbnail_url} alt="" className="h-full w-full rounded-lg object-cover" />
                          ) : (
                            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{course.title}</h3>
                          <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-xs text-muted-foreground">
                            <span>{course.completedLessons}/{course.totalLessons} dars</span>
                            <span>•</span>
                            <span>{formatTime(course.totalWatchedSeconds)}</span>
                          </div>
                          <div className="mt-2">
                            <Progress value={progress} className="h-1.5" />
                          </div>
                        </div>
                        
                        <div className="text-right shrink-0">
                          <span className={`text-lg sm:text-xl font-bold ${
                            isCompleted ? 'text-emerald-500' : 'text-primary'
                          }`}>
                            {progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Recent Lessons */}
          {recentLessons.length > 0 && (
            <Card className="border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Oxirgi ko'rilgan darslar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentLessons.map(lesson => {
                  const watchPercent = lesson.duration_minutes > 0 
                    ? Math.min(Math.round((lesson.watched_seconds / 60 / lesson.duration_minutes) * 100), 100)
                    : 0;

                  return (
                    <div 
                      key={lesson.id}
                      className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => navigate(`/lessons/${lesson.id}`)}
                    >
                      <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center shrink-0 ${
                        lesson.completed ? 'bg-emerald-500' : 'bg-primary/20'
                      }`}>
                        {lesson.completed ? (
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        ) : (
                          <Video className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs sm:text-sm truncate">{lesson.title}</h4>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{lesson.course_title}</p>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className="text-xs sm:text-sm font-medium">{formatTime(lesson.watched_seconds)}</span>
                        <div className="h-1 w-12 sm:w-16 bg-secondary/80 rounded-full mt-1">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${watchPercent}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Action Button */}
          <Button 
            className="w-full h-12 sm:h-14 gap-2"
            onClick={() => navigate('/courses')}
          >
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
            Barcha kurslarni ko'rish
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </PullToRefresh>
    </PageBackground>
  );
};

export default LessonStats;
