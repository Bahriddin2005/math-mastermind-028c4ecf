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
  Clock
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

const difficultyConfig: Record<string, { bg: string; text: string; label: string }> = {
  beginner: { bg: 'bg-success/10', text: 'text-success', label: "Boshlang'ich" },
  intermediate: { bg: 'bg-warning/10', text: 'text-warning', label: "O'rta" },
  advanced: { bg: 'bg-destructive/10', text: 'text-destructive', label: "Murakkab" },
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
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/5 py-16 md:py-24">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          </div>
          
          {/* Floating icons */}
          <div className="absolute top-20 right-20 opacity-20 hidden lg:block">
            <GraduationCap className="h-24 w-24 text-primary animate-bounce-soft" />
          </div>
          <div className="absolute bottom-20 left-20 opacity-10 hidden lg:block">
            <BookOpen className="h-20 w-20 text-accent" />
          </div>

          <div className="container px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 opacity-0 animate-slide-up" style={{ animationFillMode: 'forwards' }}>
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-semibold">Professional video darsliklar</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6 opacity-0 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                Mental arifmetika
                <span className="text-gradient-primary"> kurslari</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 opacity-0 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                Boshlang'ich darajadan professional darajagacha video darslarni ko'ring, 
                mashq qiling va natijalaringizni kuzating.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground opacity-0 animate-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-foreground">{courses.length}+ kurs</p>
                    <p className="text-xs">Mavjud</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-accent" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-foreground">1000+</p>
                    <p className="text-xs">O'quvchilar</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-success" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-foreground">50+ soat</p>
                    <p className="text-xs">Video darslar</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="container px-4 py-12 md:py-16">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Kurslar yuklanmoqda...</p>
                </div>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-20">
                <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-display font-bold mb-3">Kurslar hali mavjud emas</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Tez orada yangi professional video darslar qo'shiladi. Kuzatib boring!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {courses.map((course, index) => {
                  const progress = userProgress[course.id];
                  const progressPercent = progress ? (progress.completed / progress.total) * 100 : 0;
                  const isCompleted = progress && progress.completed === progress.total && progress.total > 0;
                  const difficulty = difficultyConfig[course.difficulty] || difficultyConfig.beginner;

                  return (
                    <Card 
                      key={course.id} 
                      className="group relative overflow-hidden border-border/40 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 opacity-0 animate-slide-up h-[420px] flex flex-col"
                      style={{ animationDelay: `${400 + index * 100}ms`, animationFillMode: 'forwards' }}
                      onClick={() => navigate(`/courses/${course.id}`)}
                    >
                      {/* Thumbnail */}
                      <div className="relative h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/5 overflow-hidden flex-shrink-0">
                        {course.thumbnail_url ? (
                          <img 
                            src={course.thumbnail_url} 
                            alt={course.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <GraduationCap className="h-20 w-20 text-primary/30 group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        )}
                        
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Completed badge */}
                        {isCompleted && (
                          <div className="absolute top-4 right-4">
                            <Badge className="bg-success text-success-foreground shadow-lg gap-1">
                              <Award className="h-3 w-3" />
                              Tugatilgan
                            </Badge>
                          </div>
                        )}
                        
                        {/* Play button overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="h-16 w-16 rounded-full gradient-primary flex items-center justify-center shadow-glow transform scale-90 group-hover:scale-100 transition-transform">
                            <Play className="h-8 w-8 text-primary-foreground ml-1" />
                          </div>
                        </div>
                      </div>
                      
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={`${difficulty.bg} ${difficulty.text} font-semibold`}>
                            {difficulty.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {course.lessons_count} dars
                          </span>
                        </div>
                        <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
                          {course.title}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="pt-0 flex flex-col flex-1">
                        <CardDescription className="line-clamp-2 mb-5 flex-1">
                          {course.description}
                        </CardDescription>
                        
                        {/* Progress */}
                        {user && progress && (
                          <div className="space-y-2 mb-5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Jarayon</span>
                              <span className="font-semibold text-foreground">{progress.completed}/{progress.total}</span>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                          </div>
                        )}

                        <Button 
                          className="w-full gap-2 group-hover:gap-3 transition-all" 
                          variant={isCompleted ? "secondary" : "default"}
                        >
                          {isCompleted ? (
                            <>
                              Qayta ko'rish
                              <ArrowRight className="h-4 w-4" />
                            </>
                          ) : progress?.completed ? (
                            <>
                              Davom ettirish
                              <ArrowRight className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
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