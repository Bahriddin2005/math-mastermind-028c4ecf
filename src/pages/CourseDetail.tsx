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
import { 
  ArrowLeft, 
  Play, 
  CheckCircle2, 
  Lock,
  Clock,
  BookOpen,
  Loader2,
  GraduationCap
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
  duration_minutes: number;
  order_index: number;
  completed?: boolean;
}

const difficultyLabels: Record<string, string> = {
  beginner: "Boshlang'ich",
  intermediate: "O'rta",
  advanced: "Murakkab",
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
    // Fetch course
    const { data: courseData } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .maybeSingle();

    if (courseData) {
      setCourse(courseData);

      // Fetch lessons
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      if (lessonsData) {
        setLessons(lessonsData);

        // Fetch user progress
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <main className="flex-1 container px-4 py-12 flex items-center justify-center">
          <div className="text-center">
            <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Kurs topilmadi</h1>
            <p className="text-muted-foreground mb-6">Bu kurs mavjud emas yoki o'chirilgan</p>
            <Button onClick={() => navigate('/courses')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 py-12">
          <div className="container px-4">
            <Button 
              variant="ghost" 
              className="mb-6"
              onClick={() => navigate('/courses')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Barcha kurslar
            </Button>

            <div className="max-w-3xl">
              <Badge className="mb-4">{difficultyLabels[course.difficulty]}</Badge>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
                {course.title}
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                {course.description}
              </p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {totalCount} dars
                </span>
                {user && (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {completedCount}/{totalCount} tugatilgan
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lessons List */}
        <div className="container px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Darslar ro'yxati</h2>
            
            <div className="space-y-3">
              {lessons.map((lesson, index) => {
                const isCompleted = completedLessons.has(lesson.id);
                const isLocked = !user && index > 0;

                return (
                  <Card 
                    key={lesson.id}
                    className={`transition-all ${isLocked ? 'opacity-60' : 'hover:shadow-md cursor-pointer'}`}
                    onClick={() => !isLocked && navigate(`/lessons/${lesson.id}`)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted 
                          ? 'bg-green-500/10 text-green-500' 
                          : isLocked 
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-primary/10 text-primary'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : isLocked ? (
                          <Lock className="h-5 w-5" />
                        ) : (
                          <span className="font-bold">{index + 1}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{lesson.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {lesson.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {lesson.duration_minutes} daq
                        </span>
                        {!isLocked && (
                          <Button size="sm" variant={isCompleted ? "secondary" : "default"}>
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {!user && lessons.length > 1 && (
              <div className="mt-8 p-6 bg-primary/5 rounded-xl text-center">
                <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Barcha darslarga kirish</h3>
                <p className="text-muted-foreground mb-4">
                  Ro'yxatdan o'ting va barcha darslarga bepul kiring
                </p>
                <Button onClick={() => navigate('/auth')}>
                  Ro'yxatdan o'tish
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CourseDetail;