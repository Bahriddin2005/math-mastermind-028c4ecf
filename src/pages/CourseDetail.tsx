import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
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
  ArrowRight,
  Trophy,
  Zap,
  Target
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  thumbnail_url?: string | null;
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

const difficultyConfig: Record<string, { bg: string; text: string; label: string; gradient: string }> = {
  beginner: { bg: 'bg-success/10', text: 'text-success', label: "Boshlang'ich", gradient: 'from-success/20 to-success/5' },
  intermediate: { bg: 'bg-warning/10', text: 'text-warning', label: "O'rta", gradient: 'from-warning/20 to-warning/5' },
  advanced: { bg: 'bg-destructive/10', text: 'text-destructive', label: "Murakkab", gradient: 'from-destructive/20 to-destructive/5' },
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
      <PageBackground className="flex flex-col min-h-screen">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
              <div className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl animate-pulse" />
            </div>
            <p className="text-muted-foreground font-medium">Kurs yuklanmoqda...</p>
          </div>
        </main>
      </PageBackground>
    );
  }

  if (!course) {
    return (
      <PageBackground className="flex flex-col min-h-screen">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <main className="flex-1 container px-4 py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                <GraduationCap className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="absolute -inset-2 bg-secondary/50 rounded-full blur-xl -z-10" />
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
      </PageBackground>
    );
  }

  const completedCount = completedLessons.size;
  const totalCount = lessons.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const difficulty = difficultyConfig[course.difficulty] || difficultyConfig.beginner;
  const totalDuration = lessons.reduce((acc, l) => acc + (l.duration_minutes || 0), 0);
  const isCompleted = completedCount === totalCount && totalCount > 0;

  return (
    <PageBackground className="flex flex-col min-h-screen">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/5 py-12 md:py-20">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
          </div>

          {/* Floating icons */}
          <div className="absolute top-20 right-20 opacity-10 hidden lg:block animate-float">
            <GraduationCap className="h-32 w-32 text-primary" />
          </div>
          <div className="absolute bottom-20 left-20 opacity-10 hidden lg:block animate-float" style={{ animationDelay: '1.5s' }}>
            <BookOpen className="h-24 w-24 text-accent" />
          </div>

          <div className="container px-4 relative">
            {/* Back button */}
            <Button 
              variant="ghost" 
              className="mb-8 gap-2 hover:bg-secondary/50 opacity-0 animate-fade-in"
              style={{ animationFillMode: 'forwards' }}
              onClick={() => navigate('/courses')}
            >
              <ArrowLeft className="h-4 w-4" />
              Barcha kurslar
            </Button>

            <div className="max-w-4xl">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-3 mb-6 opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                <Badge className={`${difficulty.bg} ${difficulty.text} font-semibold px-4 py-1.5 text-sm border ${difficulty.text.replace('text-', 'border-')}/30`}>
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  {difficulty.label}
                </Badge>
                {isCompleted && (
                  <Badge className="bg-success/20 text-success border-success/30 gap-1.5 px-4 py-1.5">
                    <Trophy className="h-3.5 w-3.5" />
                    Tugatilgan
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6 opacity-0 animate-fade-in leading-tight" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
                {course.title}
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed opacity-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                {course.description}
              </p>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-0 animate-fade-in" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
                <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-2xl p-4 hover:bg-card/80 transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">{totalCount}</p>
                  <p className="text-sm text-muted-foreground">Video darslar</p>
                </div>
                
                <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-2xl p-4 hover:bg-card/80 transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">{totalDuration}</p>
                  <p className="text-sm text-muted-foreground">Daqiqa</p>
                </div>
                
                {user && (
                  <>
                    <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-2xl p-4 hover:bg-card/80 transition-colors">
                      <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center mb-3">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      </div>
                      <p className="text-2xl font-display font-bold text-foreground">{completedCount}</p>
                      <p className="text-sm text-muted-foreground">Tugatilgan</p>
                    </div>
                    
                    <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-2xl p-4 hover:bg-card/80 transition-colors">
                      <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center mb-3">
                        <Target className="h-5 w-5 text-warning" />
                      </div>
                      <p className="text-2xl font-display font-bold text-foreground">{totalCount - completedCount}</p>
                      <p className="text-sm text-muted-foreground">Qolgan</p>
                    </div>
                  </>
                )}
              </div>

              {/* Progress bar */}
              {user && totalCount > 0 && (
                <div className="mt-8 max-w-md opacity-0 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Jarayon
                    </span>
                    <span className="font-bold text-foreground">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="relative">
                    <Progress value={progressPercent} className="h-3" />
                    {isCompleted && (
                      <div className="absolute -right-1 -top-1">
                        <Trophy className="h-5 w-5 text-success" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CTA Button */}
              {lessons.length > 0 && (
                <div className="mt-10 opacity-0 animate-fade-in" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
                  <Button 
                    size="lg" 
                    className="gap-2 text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                    onClick={() => {
                      const firstIncomplete = lessons.find(l => !completedLessons.has(l.id));
                      navigate(`/lessons/${firstIncomplete?.id || lessons[0].id}`);
                    }}
                  >
                    {completedCount > 0 ? (
                      <>
                        <Play className="h-5 w-5" />
                        Davom ettirish
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Boshlash
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lessons List */}
        <div className="container px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            {/* Section header */}
            <div className="flex items-center gap-4 mb-10 opacity-0 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
              <div className="relative">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                  <BookOpen className="h-7 w-7 text-primary-foreground" />
                </div>
                <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur-lg -z-10" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold">Darslar ro'yxati</h2>
                <p className="text-muted-foreground">Quyidagi darslarni bosqichma-bosqich o'rganing</p>
              </div>
            </div>
            
            {/* Lessons grid */}
            <div className="space-y-4">
              {lessons.map((lesson, index) => {
                const isLessonCompleted = completedLessons.has(lesson.id);
                const isLocked = !user && index > 0;

                return (
                  <div
                    key={lesson.id}
                    className="opacity-0 animate-fade-in"
                    style={{ animationDelay: `${450 + index * 50}ms`, animationFillMode: 'forwards' }}
                  >
                    <Card 
                      className={`group overflow-hidden border-border/40 transition-all duration-300 ${
                        isLocked 
                          ? 'opacity-60 cursor-not-allowed' 
                          : 'hover:shadow-xl hover:-translate-y-1 cursor-pointer hover:border-primary/30'
                      } ${isLessonCompleted ? 'bg-success/5 border-success/20' : ''}`}
                      onClick={() => !isLocked && navigate(`/lessons/${lesson.id}`)}
                    >
                      <CardContent className="p-0">
                        <div className="flex items-stretch">
                          {/* Lesson number / status indicator */}
                          <div className={`w-20 md:w-24 flex-shrink-0 flex items-center justify-center ${
                            isLessonCompleted 
                              ? 'bg-success/10' 
                              : isLocked 
                                ? 'bg-muted/50'
                                : 'bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10'
                          } transition-all duration-300`}>
                            {isLessonCompleted ? (
                              <div className="relative">
                                <CheckCircle2 className="h-8 w-8 text-success" />
                                <div className="absolute -inset-2 bg-success/20 rounded-full blur-md -z-10" />
                              </div>
                            ) : isLocked ? (
                              <Lock className="h-6 w-6 text-muted-foreground" />
                            ) : (
                              <div className="relative">
                                <span className="text-3xl font-display font-bold text-primary group-hover:scale-110 transition-transform inline-block">
                                  {index + 1}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-4 md:p-6 flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-display font-bold text-lg md:text-xl mb-1 truncate group-hover:text-primary transition-colors">
                                {lesson.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-1 md:line-clamp-2">
                                {lesson.description}
                              </p>
                              
                              {/* Meta info */}
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {lesson.duration_minutes} daqiqa
                                </span>
                                {isLessonCompleted && (
                                  <Badge variant="secondary" className="text-xs bg-success/10 text-success border-0">
                                    Tugatilgan
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Action button */}
                            {!isLocked && (
                              <Button 
                                size="icon" 
                                variant={isLessonCompleted ? "secondary" : "default"}
                                className={`h-12 w-12 rounded-xl flex-shrink-0 ${
                                  isLessonCompleted 
                                    ? 'bg-success/10 hover:bg-success/20 text-success' 
                                    : 'shadow-md group-hover:shadow-lg'
                                } transition-all`}
                              >
                                {isLessonCompleted ? (
                                  <Play className="h-5 w-5" />
                                ) : (
                                  <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>

            {/* Login CTA for guests */}
            {!user && lessons.length > 1 && (
              <div className="opacity-0 animate-fade-in" style={{ animationDelay: `${450 + lessons.length * 50 + 100}ms`, animationFillMode: 'forwards' }}>
                <Card className="mt-12 border-primary/20 overflow-hidden relative">
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
                  
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-bl-full" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-tr-full" />
                  
                  <CardContent className="p-8 md:p-12 text-center relative z-10">
                    <div className="relative inline-block mb-6">
                      <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl">
                        <Lock className="h-10 w-10 text-primary-foreground" />
                      </div>
                      <div className="absolute -inset-2 bg-primary/20 rounded-3xl blur-xl -z-10" />
                      <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-accent-foreground" />
                      </div>
                    </div>
                    
                    <h3 className="font-display font-bold text-2xl md:text-3xl mb-3">Barcha darslarga kirish</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                      Ro'yxatdan o'ting va barcha video darslarga, mashqlarga hamda sertifikatlarga bepul ega bo'ling
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Button onClick={() => navigate('/auth')} size="lg" className="gap-2 px-8 py-6 text-lg rounded-xl shadow-lg">
                        <Users className="h-5 w-5" />
                        Ro'yxatdan o'tish
                      </Button>
                      <Button onClick={() => navigate('/auth')} variant="outline" size="lg" className="px-8 py-6 text-lg rounded-xl">
                        Kirish
                      </Button>
                    </div>
                    
                    {/* Features list */}
                    <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Bepul
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Video darslar
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Mashqlar
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Sertifikat
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </PageBackground>
  );
};

export default CourseDetail;