import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle2, 
  Lock,
  Clock,
  BookOpen,
  Loader2,
  GraduationCap,
  Sparkles,
  Users,
  Award,
  ArrowRight
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string | null;
  duration_minutes: number;
  order_index: number;
  completed?: boolean;
}

const difficultyConfig: Record<string, { bg: string; text: string; label: string }> = {
  beginner: { bg: 'bg-success/10', text: 'text-success', label: "Boshlang'ich" },
  intermediate: { bg: 'bg-warning/10', text: 'text-warning', label: "O'rta" },
  advanced: { bg: 'bg-destructive/10', text: 'text-destructive', label: "Murakkab" },
};

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { soundEnabled, toggleSound } = useSound();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (courseId) {
      fetchCourseAndLessons();
    }
  }, [courseId, user]);

  const fetchCourseAndLessons = async () => {
    const { data: courseData } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .maybeSingle();

    if (courseData) {
      setCourse(courseData);

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      if (lessonsData) {
        setLessons(lessonsData);

        if (user) {
          const lessonIds = lessonsData.map(l => l.id);
          const { data: progressData } = await supabase
            .from('user_lesson_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('completed', true)
            .in('lesson_id', lessonIds);

          if (progressData) {
            setCompletedLessons(new Set(progressData.map(p => p.lesson_id)));
          }
        }
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Kurs yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <main className="flex-1 container px-4 py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="h-24 w-24 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-3">Kurs topilmadi</h1>
            <p className="text-muted-foreground mb-6 max-w-md">Bu kurs mavjud emas yoki o'chirilgan</p>
            <Button onClick={() => navigate('/courses')} size="lg" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Kurslarga qaytish
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const completedCount = completedLessons.size;
  const totalCount = lessons.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const difficulty = difficultyConfig[course.difficulty] || difficultyConfig.beginner;
  const totalDuration = lessons.reduce((acc, l) => acc + (l.duration_minutes || 0), 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/5 py-12 md:py-20">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          </div>

          {/* Floating icon */}
          <div className="absolute top-20 right-20 opacity-10 hidden lg:block">
            <GraduationCap className="h-40 w-40 text-primary" />
          </div>

          <div className="container px-4 relative">
            <Button 
              variant="ghost" 
              className="mb-6 gap-2 hover:bg-secondary/50"
              onClick={() => navigate('/courses')}
            >
              <ArrowLeft className="h-4 w-4" />
              Barcha kurslar
            </Button>

            <div className="max-w-4xl">
              {/* Badge */}
              <div className="flex items-center gap-3 mb-4 opacity-0 animate-slide-up" style={{ animationFillMode: 'forwards' }}>
                <Badge className={`${difficulty.bg} ${difficulty.text} font-semibold px-3 py-1`}>
                  {difficulty.label}
                </Badge>
                {user && completedCount === totalCount && totalCount > 0 && (
                  <Badge className="bg-success text-success-foreground gap-1">
                    <Award className="h-3 w-3" />
                    Tugatilgan
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4 opacity-0 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                {course.title}
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl opacity-0 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                {course.description}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 opacity-0 animate-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{totalCount} dars</p>
                    <p className="text-xs">Video darslar</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{totalDuration} daqiqa</p>
                    <p className="text-xs">Umumiy vaqt</p>
                  </div>
                </div>
                {user && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{completedCount}/{totalCount}</p>
                      <p className="text-xs">Tugatilgan</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {user && totalCount > 0 && (
                <div className="mt-8 max-w-md opacity-0 animate-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Jarayon</span>
                    <span className="font-semibold">{Math.round(progressPercent)}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-3" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lessons List */}
        <div className="container px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold">Darslar ro'yxati</h2>
                <p className="text-sm text-muted-foreground">Quyidagi darslarni bosqichma-bosqich o'rganing</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {lessons.map((lesson, index) => {
                const isCompleted = completedLessons.has(lesson.id);
                const isLocked = !user && index > 0;

                return (
                  <Card 
                    key={lesson.id}
                    className={`group overflow-hidden border-border/40 transition-all duration-300 opacity-0 animate-slide-up ${
                      isLocked 
                        ? 'opacity-60 cursor-not-allowed' 
                        : 'hover:shadow-lg hover:-translate-y-1 cursor-pointer hover:border-primary/30'
                    }`}
                    style={{ animationDelay: `${500 + index * 80}ms`, animationFillMode: 'forwards' }}
                    onClick={() => !isLocked && navigate(`/lessons/${lesson.id}`)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      {/* Thumbnail */}
                      {lesson.thumbnail_url ? (
                        <img 
                          src={lesson.thumbnail_url} 
                          alt={lesson.title}
                          className="w-24 h-16 md:w-32 md:h-20 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className={`w-24 h-16 md:w-32 md:h-20 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                          isCompleted 
                            ? 'bg-success/10 text-success' 
                            : isLocked 
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="h-8 w-8" />
                          ) : isLocked ? (
                            <Lock className="h-6 w-6" />
                          ) : (
                            <span className="text-2xl font-display font-bold">{index + 1}</span>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {lesson.thumbnail_url && (
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCompleted 
                                ? 'bg-success/10 text-success' 
                                : 'bg-primary/10 text-primary'
                            }`}>
                              {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                            </span>
                          )}
                          <h3 className="font-display font-bold text-lg truncate group-hover:text-primary transition-colors">
                            {lesson.title}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {lesson.description}
                        </p>
                      </div>

                      {/* Duration & Action */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {lesson.duration_minutes} daq
                          </span>
                        </div>
                        {!isLocked && (
                          <Button 
                            size="icon" 
                            variant={isCompleted ? "secondary" : "default"}
                            className="h-10 w-10 rounded-xl"
                          >
                            {isCompleted ? (
                              <Play className="h-4 w-4" />
                            ) : (
                              <ArrowRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Login CTA for guests */}
            {!user && lessons.length > 1 && (
              <Card className="mt-10 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
                <CardContent className="p-8 text-center relative">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full" />
                  
                  <div className="relative z-10">
                    <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
                      <Lock className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h3 className="font-display font-bold text-xl mb-2">Barcha darslarga kirish</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Ro'yxatdan o'ting va barcha video darslarga, mashqlarga hamda sertifikatlarga bepul ega bo'ling
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <Button onClick={() => navigate('/auth')} size="lg" className="gap-2">
                        <Users className="h-4 w-4" />
                        Ro'yxatdan o'tish
                      </Button>
                      <Button onClick={() => navigate('/auth')} variant="outline" size="lg">
                        Kirish
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CourseDetail;