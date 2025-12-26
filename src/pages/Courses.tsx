import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Clock, 
  BookOpen, 
  CheckCircle2,
  Loader2,
  GraduationCap,
  Award
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

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-600',
  intermediate: 'bg-yellow-500/10 text-yellow-600',
  advanced: 'bg-red-500/10 text-red-600',
};

const difficultyLabels: Record<string, string> = {
  beginner: "Boshlang'ich",
  intermediate: "O'rta",
  advanced: "Murakkab",
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
      // Get lessons count for each course
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

      // Get user progress if logged in
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
    <div className="min-h-screen flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1 container px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
              <GraduationCap className="h-3 w-3 mr-1" />
              Video darsliklar
            </Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              O'quv kurslari
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Mental arifmetika bo'yicha video darslarni ko'ring, mashq qiling va savollaringizga javob oling.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Kurslar hali mavjud emas</h2>
              <p className="text-muted-foreground">Tez orada yangi kurslar qo'shiladi</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                const progress = userProgress[course.id];
                const progressPercent = progress ? (progress.completed / progress.total) * 100 : 0;
                const isCompleted = progress && progress.completed === progress.total && progress.total > 0;

                return (
                  <Card 
                    key={course.id} 
                    className="group border-border/40 shadow-lg hover:shadow-xl transition-all overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <GraduationCap className="h-16 w-16 text-primary/40" />
                      )}
                      {isCompleted && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-green-500 text-white">
                            <Award className="h-3 w-3 mr-1" />
                            Tugatilgan
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={difficultyColors[course.difficulty]}>
                          {difficultyLabels[course.difficulty]}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {course.lessons_count} dars
                        </span>
                      </div>
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {course.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="line-clamp-2 mb-4">
                        {course.description}
                      </CardDescription>
                      
                      {user && progress && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Jarayon</span>
                            <span className="font-medium">{progress.completed}/{progress.total}</span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                      )}

                      <Button className="w-full mt-4" variant={isCompleted ? "secondary" : "default"}>
                        <Play className="h-4 w-4 mr-2" />
                        {isCompleted ? "Qayta ko'rish" : progress?.completed ? "Davom ettirish" : "Boshlash"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Courses;