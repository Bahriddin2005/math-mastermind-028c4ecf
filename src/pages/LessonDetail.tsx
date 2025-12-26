import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LessonQA } from '@/components/LessonQA';
import { LessonPractice } from '@/components/LessonPractice';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageCircle,
  Target,
  Loader2,
  GraduationCap,
  Sparkles
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
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [practiceCompleted, setPracticeCompleted] = useState(false);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [prevLesson, setPrevLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState('practice');
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);

  useEffect(() => {
    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId, user]);

  const fetchLesson = async () => {
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

      const { data: courseData } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', lessonData.course_id)
        .maybeSingle();

      if (courseData) {
        setCourse(courseData);
      }

      const { data: allLessons } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', lessonData.course_id)
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      if (allLessons) {
        setTotalLessons(allLessons.length);
        const currentIndex = allLessons.findIndex(l => l.id === lessonId);
        setCurrentLessonIndex(currentIndex + 1);
        if (currentIndex > 0) setPrevLesson({ ...allLessons[currentIndex - 1], practice_config: (allLessons[currentIndex - 1].practice_config as unknown) as PracticeConfig });
        if (currentIndex < allLessons.length - 1) setNextLesson({ ...allLessons[currentIndex + 1], practice_config: (allLessons[currentIndex + 1].practice_config as unknown) as PracticeConfig });
      }

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
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Dars yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <main className="flex-1 container px-4 py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="h-24 w-24 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-3">Dars topilmadi</h1>
            <p className="text-muted-foreground mb-6">Bu dars mavjud emas yoki o'chirilgan</p>
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1">
        {/* Breadcrumb Header */}
        <div className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
          <div className="container px-4 py-3">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm"
                className="gap-2"
                onClick={() => navigate(`/courses/${lesson.course_id}`)}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{course?.title || 'Kursga qaytish'}</span>
                <span className="sm:hidden">Orqaga</span>
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Dars {currentLessonIndex}/{totalLessons}</span>
                {isCompleted && (
                  <Badge className="bg-success/10 text-success gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Tugatilgan
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container px-4 py-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Video Player Section */}
            <div className="space-y-4">
              <div className="shadow-2xl border border-border/40 rounded-2xl overflow-hidden">
                <VideoPlayer
                  src={lesson.video_url}
                  onEnded={markAsCompleted}
                  onPrevious={prevLesson ? () => navigate(`/lessons/${prevLesson.id}`) : undefined}
                  onNext={nextLesson ? () => navigate(`/lessons/${nextLesson.id}`) : undefined}
                  hasPrevious={!!prevLesson}
                  hasNext={!!nextLesson}
                />
              </div>

              {/* Lesson Info */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {lesson.duration_minutes} daqiqa
                    </Badge>
                    {practiceCompleted && (
                      <Badge className="bg-accent/10 text-accent gap-1">
                        <Target className="h-3 w-3" />
                        Mashq bajarildi
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
                    {lesson.title}
                  </h1>
                  <p className="text-muted-foreground leading-relaxed">
                    {lesson.description}
                  </p>
                </div>

                {!isCompleted && user && (
                  <Button 
                    onClick={markAsCompleted} 
                    variant="outline"
                    className="gap-2 shrink-0"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Tugatildi deb belgilash
                  </Button>
                )}
              </div>
            </div>

            {/* Tabs Section */}
            <Card className="border-border/40 shadow-lg overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader className="pb-0 bg-gradient-to-r from-secondary/50 to-transparent">
                  <TabsList className="grid w-full grid-cols-2 bg-secondary/60">
                    <TabsTrigger value="practice" className="gap-2 data-[state=active]:bg-card">
                      <Target className="h-4 w-4" />
                      Mashq
                      {practiceCompleted && <CheckCircle2 className="h-3 w-3 text-success" />}
                    </TabsTrigger>
                    <TabsTrigger value="qa" className="gap-2 data-[state=active]:bg-card">
                      <MessageCircle className="h-4 w-4" />
                      Savol-javob
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="pt-6">
                  <TabsContent value="practice" className="mt-0">
                    <LessonPractice 
                      lessonId={lesson.id}
                      config={lesson.practice_config}
                      onComplete={handlePracticeComplete}
                      isCompleted={practiceCompleted}
                    />
                  </TabsContent>

                  <TabsContent value="qa" className="mt-0">
                    <LessonQA lessonId={lesson.id} />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

            {/* Navigation */}
            <Card className="border-border/40">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between gap-4">
                  {prevLesson ? (
                    <Button 
                      variant="outline"
                      className="gap-2 flex-1 md:flex-none"
                      onClick={() => navigate(`/lessons/${prevLesson.id}`)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Oldingi dars</span>
                      <span className="sm:hidden">Oldingi</span>
                    </Button>
                  ) : (
                    <div />
                  )}

                  <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Davom eting, ajoyib natija!</span>
                  </div>

                  {nextLesson ? (
                    <Button 
                      className="gap-2 flex-1 md:flex-none"
                      onClick={() => navigate(`/lessons/${nextLesson.id}`)}
                    >
                      <span className="hidden sm:inline">Keyingi dars</span>
                      <span className="sm:hidden">Keyingi</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      className="gap-2 flex-1 md:flex-none"
                      onClick={() => navigate(`/courses/${lesson.course_id}`)}
                    >
                      <span className="hidden sm:inline">Kursni tugatish</span>
                      <span className="sm:hidden">Tugatish</span>
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LessonDetail;