import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  BookOpen, 
  Loader2,
  GraduationCap,
  Award,
  Sparkles,
  ArrowRight,
  Users,
  Clock,
  Star,
  TrendingUp
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  difficulty: string;
  lessons_count?: number;
  completed_lessons?: number;
}

const difficultyConfig: Record<string, { bg: string; text: string; label: string; gradient: string }> = {
  beginner: { 
    bg: 'bg-emerald-500/10', 
    text: 'text-emerald-500', 
    label: "Boshlang'ich",
    gradient: 'from-emerald-500/20 via-emerald-400/10 to-teal-500/5'
  },
  intermediate: { 
    bg: 'bg-amber-500/10', 
    text: 'text-amber-500', 
    label: "O'rta",
    gradient: 'from-amber-500/20 via-orange-400/10 to-yellow-500/5'
  },
  advanced: { 
    bg: 'bg-rose-500/10', 
    text: 'text-rose-500', 
    label: "Murakkab",
    gradient: 'from-rose-500/20 via-pink-400/10 to-red-500/5'
  },
};

const Courses = () => {
  const navigate = useNavigate();
  const { soundEnabled, toggleSound } = useSound();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<Record<string, { total: number; completed: number }>>({});

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('order_index', { ascending: true });

    if (coursesData) {
      const coursesWithLessons = await Promise.all(
        coursesData.map(async (course) => {
          const { count } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id)
            .eq('is_published', true);

          return { ...course, lessons_count: count || 0 };
        })
      );

      setCourses(coursesWithLessons);

      if (user) {
        const progressMap: Record<string, { total: number; completed: number }> = {};
        
        for (const course of coursesWithLessons) {
          const { data: lessons } = await supabase
            .from('lessons')
            .select('id')
            .eq('course_id', course.id)
            .eq('is_published', true);

          if (lessons && lessons.length > 0) {
            const lessonIds = lessons.map(l => l.id);
            const { count } = await supabase
              .from('user_lesson_progress')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('completed', true)
              .in('lesson_id', lessonIds);

            progressMap[course.id] = {
              total: lessons.length,
              completed: count || 0
            };
          }
        }
        setUserProgress(progressMap);
      }
    }
    setLoading(false);
  };

  return (
    <PageBackground className="flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1">
        {/* Hero Section - Enhanced Dark Mode & Mobile */}
        <div className="relative overflow-hidden py-12 sm:py-16 md:py-24 lg:py-28">
          {/* Animated background decorations - Dark Mode optimized */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[500px] bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 dark:from-primary/30 dark:via-primary/15 dark:to-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute -bottom-40 -left-40 w-[350px] sm:w-[500px] md:w-[600px] h-[350px] sm:h-[500px] md:h-[600px] bg-gradient-to-tr from-accent/15 via-accent/10 to-accent/5 dark:from-accent/25 dark:via-accent/15 dark:to-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] md:w-[800px] h-[500px] sm:h-[700px] md:h-[800px] bg-gradient-radial from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent rounded-full" />
          </div>
          
          {/* Floating elements - Hidden on mobile */}
          <div className="absolute top-16 right-[15%] opacity-60 hidden lg:block animate-bounce-soft">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/15 backdrop-blur-sm flex items-center justify-center rotate-12 shadow-lg dark:shadow-primary/20">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="absolute bottom-20 left-[10%] opacity-40 hidden lg:block animate-bounce-soft" style={{ animationDelay: '0.5s' }}>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 dark:from-accent/30 dark:to-accent/15 backdrop-blur-sm flex items-center justify-center -rotate-12 shadow-lg dark:shadow-accent/20">
              <BookOpen className="h-7 w-7 text-accent" />
            </div>
          </div>
          <div className="absolute top-32 left-[20%] opacity-30 hidden xl:block animate-bounce-soft" style={{ animationDelay: '1s' }}>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-success/20 to-success/10 dark:from-success/30 dark:to-success/15 backdrop-blur-sm flex items-center justify-center rotate-6 shadow-md dark:shadow-success/20">
              <Star className="h-6 w-6 text-success" />
            </div>
          </div>

          <div className="container px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-primary/15 to-accent/10 dark:from-primary/25 dark:to-accent/20 text-primary mb-6 sm:mb-8 opacity-0 animate-slide-up border border-primary/20 dark:border-primary/30 shadow-lg shadow-primary/5 dark:shadow-primary/20" style={{ animationFillMode: 'forwards' }}>
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-semibold">Professional video darsliklar</span>
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
              </div>
              
              {/* Main title - Mobile optimized */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-bold text-foreground mb-4 sm:mb-6 md:mb-8 opacity-0 animate-slide-up leading-tight" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                Mental arifmetika
                <br />
                <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">kurslari</span>
              </h1>
              
              {/* Subtitle - Mobile optimized */}
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 md:mb-12 opacity-0 animate-slide-up leading-relaxed px-2" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                Boshlang'ich darajadan professional darajagacha video darslarni ko'ring, 
                mashq qiling va natijalaringizni kuzating.
              </p>

              {/* Stats - Mobile optimized grid */}
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-10 opacity-0 animate-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-3 rounded-xl sm:rounded-2xl bg-card/50 dark:bg-card/80 backdrop-blur-sm border border-border/50 dark:border-border/30 shadow-lg dark:shadow-xl dark:shadow-primary/10">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/20 dark:shadow-primary/30">
                    <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{courses.length}+</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Kurslar</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-3 rounded-xl sm:rounded-2xl bg-card/50 dark:bg-card/80 backdrop-blur-sm border border-border/50 dark:border-border/30 shadow-lg dark:shadow-xl dark:shadow-accent/10">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-md shadow-accent/20 dark:shadow-accent/30">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-accent-foreground" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-lg sm:text-2xl font-bold text-foreground">1000+</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">O'quvchilar</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-3 rounded-xl sm:rounded-2xl bg-card/50 dark:bg-card/80 backdrop-blur-sm border border-border/50 dark:border-border/30 shadow-lg dark:shadow-xl dark:shadow-success/10">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-success to-success/80 flex items-center justify-center shadow-md shadow-success/20 dark:shadow-success/30">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-success-foreground" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-lg sm:text-2xl font-bold text-foreground">50+</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Soat video</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="container px-4 py-12 md:py-20">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="text-center">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
                    <GraduationCap className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-muted-foreground mt-6 font-medium">Kurslar yuklanmoqda...</p>
                </div>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-24">
                <div className="h-28 w-28 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center mx-auto mb-8 shadow-xl">
                  <BookOpen className="h-14 w-14 text-primary/60" />
                </div>
                <h2 className="text-3xl font-display font-bold mb-4">Kurslar hali mavjud emas</h2>
                <p className="text-muted-foreground max-w-md mx-auto text-lg">
                  Tez orada yangi professional video darslar qo'shiladi. Kuzatib boring!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {courses.map((course, index) => {
                  const progress = userProgress[course.id];
                  const progressPercent = progress ? (progress.completed / progress.total) * 100 : 0;
                  const isCompleted = progress && progress.completed === progress.total && progress.total > 0;
                  const difficulty = difficultyConfig[course.difficulty] || difficultyConfig.beginner;

                  return (
                    <Card 
                      key={course.id} 
                      className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-3 opacity-0 animate-slide-up bg-card/80 backdrop-blur-sm dark-glow-card"
                      style={{ animationDelay: `${400 + index * 100}ms`, animationFillMode: 'forwards' }}
                      onClick={() => navigate(`/courses/${course.id}`)}
                    >
                      {/* Gradient border effect */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl" />
                      
                      {/* Thumbnail */}
                      <div className={`relative h-52 bg-gradient-to-br ${difficulty.gradient} overflow-hidden`}>
                        {course.thumbnail_url ? (
                          <img 
                            src={course.thumbnail_url} 
                            alt={course.title}
                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center relative">
                            {/* Decorative circles */}
                            <div className="absolute top-4 right-4 h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-2xl" />
                            <div className="absolute bottom-4 left-4 h-16 w-16 rounded-full bg-gradient-to-br from-accent/20 to-transparent blur-xl" />
                            <GraduationCap className="h-24 w-24 text-primary/40 group-hover:scale-110 group-hover:text-primary/60 transition-all duration-500" />
                          </div>
                        )}
                        
                        {/* Top gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-card dark:from-card/90 via-transparent to-transparent opacity-60" />
                        
                        {/* Completed badge - Mobile optimized */}
                        {isCompleted && (
                          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
                            <Badge className="bg-gradient-to-r from-success to-emerald-400 text-white shadow-lg shadow-success/30 dark:shadow-success/50 gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
                              <Award className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              Tugatilgan
                            </Badge>
                          </div>
                        )}
                        
                        {/* Difficulty badge - Mobile optimized */}
                        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10">
                          <Badge className={`${difficulty.bg} ${difficulty.text} font-semibold shadow-md dark:shadow-lg px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm`}>
                            {difficulty.label}
                          </Badge>
                        </div>
                        
                        {/* Play button overlay - Mobile touch friendly */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 sm:transition-all sm:duration-500">
                          <div className="h-14 w-14 sm:h-18 sm:w-18 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-2xl shadow-primary/40 dark:shadow-primary/60 transform scale-75 group-hover:scale-100 transition-transform duration-500">
                            <Play className="h-7 w-7 sm:h-10 sm:w-10 text-primary-foreground ml-0.5 sm:ml-1" fill="currentColor" />
                          </div>
                        </div>
                      </div>
                      
                      <CardHeader className="pb-2 pt-3 sm:pt-5 px-3 sm:px-6">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
                          <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span>{course.lessons_count} ta dars</span>
                        </div>
                        <CardTitle className="text-base sm:text-lg lg:text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300">
                          {course.title}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="pt-0 pb-4 sm:pb-6 px-3 sm:px-6">
                        <CardDescription className="line-clamp-2 mb-4 sm:mb-5 text-sm sm:text-base leading-relaxed">
                          {course.description}
                        </CardDescription>
                        
                        {/* Progress - Mobile optimized */}
                        {user && progress && (
                          <div className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-5">
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-muted-foreground font-medium">Jarayon</span>
                              <span className="font-bold text-foreground">{progress.completed}/{progress.total} dars</span>
                            </div>
                            <div className="relative">
                              <Progress value={progressPercent} className="h-2 sm:h-2.5" />
                              {progressPercent > 0 && (
                                <div 
                                  className="absolute top-0 left-0 h-2 sm:h-2.5 rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              )}
                            </div>
                          </div>
                        )}

                        <Button 
                          className={`w-full gap-2 group-hover:gap-3 transition-all duration-300 h-10 sm:h-12 text-sm sm:text-base font-semibold touch-target ${
                            isCompleted 
                              ? 'bg-secondary hover:bg-secondary/80 dark:bg-secondary/80 dark:hover:bg-secondary/60' 
                              : 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 dark:shadow-primary/40'
                          }`}
                          variant={isCompleted ? "secondary" : "default"}
                        >
                          {isCompleted ? (
                            <>
                              Qayta ko'rish
                              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                            </>
                          ) : progress?.completed ? (
                            <>
                              Davom ettirish
                              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" />
                              Boshlash
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </PageBackground>
  );
};

export default Courses;
