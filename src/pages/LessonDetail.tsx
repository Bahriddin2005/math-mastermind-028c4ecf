import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LessonQA } from '@/components/LessonQA';
import { LessonPractice } from '@/components/LessonPractice';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  ArrowRight,
  Play, 
  CheckCircle2,
  Clock,
  BookOpen,
  MessageCircle,
  Target,
  Loader2,
  GraduationCap
} from 'lucide-react';

interface PracticeConfig {
  enabled: boolean;
  difficulty: string;
  problems_count: number;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_url: string | null;
  duration_minutes: number;
  order_index: number;
  practice_config: PracticeConfig;
}

interface Course {
  id: string;
  title: string;
}

const LessonDetail = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { soundEnabled, toggleSound } = useSound();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [practiceCompleted, setPracticeCompleted] = useState(false);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [prevLesson, setPrevLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState('video');

  useEffect(() => {
    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId, user]);

  const fetchLesson = async () => {
    // Fetch lesson
    const { data: lessonData } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .maybeSingle();

    if (lessonData) {
      setLesson({
        ...lessonData,
        practice_config: (lessonData.practice_config as unknown) as PracticeConfig
      });

      // Fetch course
      const { data: courseData } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', lessonData.course_id)
        .maybeSingle();

      if (courseData) {
        setCourse(courseData);
      }

      // Fetch adjacent lessons
      const { data: allLessons } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', lessonData.course_id)
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      if (allLessons) {
        const currentIndex = allLessons.findIndex(l => l.id === lessonId);
        if (currentIndex > 0) setPrevLesson({ ...allLessons[currentIndex - 1], practice_config: (allLessons[currentIndex - 1].practice_config as unknown) as PracticeConfig });
        if (currentIndex < allLessons.length - 1) setNextLesson({ ...allLessons[currentIndex + 1], practice_config: (allLessons[currentIndex + 1].practice_config as unknown) as PracticeConfig });
      }

      // Fetch user progress
      if (user) {
        const { data: progressData } = await supabase
          .from('user_lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .maybeSingle();

        if (progressData) {
          setIsCompleted(progressData.completed);
          setPracticeCompleted(progressData.practice_completed);
        }
      }
    }
    setLoading(false);
  };

  const markAsCompleted = async () => {
    if (!user || !lesson) return;

    const { error } = await supabase
      .from('user_lesson_progress')
      .upsert({
        user_id: user.id,
        lesson_id: lesson.id,
        completed: true,
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,lesson_id'
      });

    if (!error) {
      setIsCompleted(true);
      toast.success('Dars tugatildi!');
    }
  };

  const handlePracticeComplete = async (score: number) => {
    if (!user || !lesson) return;

    const { error } = await supabase
      .from('user_lesson_progress')
      .upsert({
        user_id: user.id,
        lesson_id: lesson.id,
        practice_completed: true,
        practice_score: score,
        completed: true,
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,lesson_id'
      });

    if (!error) {
      setPracticeCompleted(true);
      setIsCompleted(true);
      toast.success(`Mashq tugatildi! Ball: ${score}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <main className="flex-1 container px-4 py-12 flex items-center justify-center">
          <div className="text-center">
            <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Dars topilmadi</h1>
            <p className="text-muted-foreground mb-6">Bu dars mavjud emas yoki o'chirilgan</p>
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1">
        {/* Header */}
        <div className="bg-secondary/30 border-b py-4">
          <div className="container px-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(`/courses/${lesson.course_id}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {course?.title || 'Kursga qaytish'}
            </Button>
          </div>
        </div>

        <div className="container px-4 py-8">
          <div className="max-w-5xl mx-auto">
            {/* Video Player */}
            <div className="mb-8">
              <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4">
                {lesson.video_url ? (
                  <video
                    ref={videoRef}
                    src={lesson.video_url}
                    controls
                    className="w-full h-full"
                    onEnded={markAsCompleted}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Video hali yuklanmagan</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {isCompleted && (
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Tugatilgan
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {lesson.duration_minutes} daqiqa
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">{lesson.title}</h1>
                  <p className="text-muted-foreground">{lesson.description}</p>
                </div>

                {!isCompleted && user && (
                  <Button onClick={markAsCompleted} variant="outline">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Tugatildi
                  </Button>
                )}
              </div>
            </div>

            {/* Tabs for Practice and Q&A */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="practice" className="gap-2">
                  <Target className="h-4 w-4" />
                  Mashq
                  {practiceCompleted && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                </TabsTrigger>
                <TabsTrigger value="qa" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Savol-javob
                </TabsTrigger>
              </TabsList>

              <TabsContent value="practice" className="mt-6">
                <LessonPractice 
                  lessonId={lesson.id}
                  config={lesson.practice_config}
                  onComplete={handlePracticeComplete}
                  isCompleted={practiceCompleted}
                />
              </TabsContent>

              <TabsContent value="qa" className="mt-6">
                <LessonQA lessonId={lesson.id} />
              </TabsContent>
            </Tabs>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-8 border-t">
              {prevLesson ? (
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/lessons/${prevLesson.id}`)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Oldingi dars
                </Button>
              ) : (
                <div />
              )}

              {nextLesson ? (
                <Button onClick={() => navigate(`/lessons/${nextLesson.id}`)}>
                  Keyingi dars
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={() => navigate(`/courses/${lesson.course_id}`)}>
                  Kursni tugatish
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LessonDetail;