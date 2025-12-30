import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
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
import { Progress } from '@/components/ui/progress';
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
  Sparkles,
  Play,
  Trophy,
  Zap
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

  const progressPercent = totalLessons > 0 ? (currentLessonIndex / totalLessons) * 100 : 0;

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
            <p className="text-muted-foreground font-medium">Dars yuklanmoqda...</p>
          </div>
        </main>
      </PageBackground>
    );
  }

  if (!lesson) {
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
            <h1 className="text-2xl font-display font-bold mb-3">Dars topilmadi</h1>
            <p className="text-muted-foreground mb-6">Bu dars mavjud emas yoki o'chirilgan</p>
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

  return (
    <PageBackground className="flex flex-col min-h-screen">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1">
        {/* Hero Header with gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/5">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
          </div>

          {/* Floating decorative elements */}
          <div className="absolute top-20 right-10 opacity-20 hidden lg:block animate-float">
            <Play className="h-16 w-16 text-primary" />
          </div>
          <div className="absolute bottom-10 left-10 opacity-10 hidden lg:block animate-float" style={{ animationDelay: '1s' }}>
            <GraduationCap className="h-20 w-20 text-accent" />
          </div>

          <div className="container px-4 py-6 relative">
            {/* Navigation Bar */}
            <div className="flex items-center justify-between mb-6">
              <Button 
                variant="ghost" 
                size="sm"
                className="gap-2 hover:bg-secondary/50"
                onClick={() => navigate(`/courses/${lesson.course_id}`)}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{course?.title || 'Kursga qaytish'}</span>
                <span className="sm:hidden">Orqaga</span>
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>Dars {currentLessonIndex}/{totalLessons}</span>
                </div>
                {isCompleted && (
                  <Badge className="bg-success/20 text-success border-success/30 gap-1.5 px-3">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Tugatilgan
                  </Badge>
                )}
              </div>
            </div>

            {/* Progress indicator */}
            <div className="max-w-3xl mx-auto mb-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                <span>Jarayon</span>
                <div className="flex-1" />
                <span className="font-semibold text-foreground">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>
        </div>

        <div className="container px-4 py-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Video Player Section */}
            <div className="space-y-6 opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              <div className="relative group">
                {/* Glow effect behind video */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
                
                <div className="relative shadow-2xl border border-border/40 rounded-2xl overflow-hidden bg-card">
                  <VideoPlayer
                    src={lesson.video_url}
                    onEnded={markAsCompleted}
                    onPrevious={prevLesson ? () => navigate(`/lessons/${prevLesson.id}`) : undefined}
                    onNext={nextLesson ? () => navigate(`/lessons/${nextLesson.id}`) : undefined}
                    hasPrevious={!!prevLesson}
                    hasNext={!!nextLesson}
                  />
                </div>
              </div>

              {/* Lesson Info Card */}
              <Card className="border-border/40 bg-gradient-to-br from-card via-card to-secondary/20 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="gap-1.5 bg-secondary/80">
                          <Clock className="h-3.5 w-3.5" />
                          {lesson.duration_minutes} daqiqa
                        </Badge>
                        <Badge variant="secondary" className="gap-1.5 bg-primary/10 text-primary border-primary/20">
                          <Zap className="h-3.5 w-3.5" />
                          Dars {currentLessonIndex}
                        </Badge>
                        {practiceCompleted && (
                          <Badge className="bg-accent/20 text-accent border-accent/30 gap-1.5">
                            <Target className="h-3.5 w-3.5" />
                            Mashq bajarildi
                          </Badge>
                        )}
                      </div>
                      
                      {/* Title and description */}
                      <div>
                        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
                          {lesson.title}
                        </h1>
                        <p className="text-muted-foreground leading-relaxed">
                          {lesson.description}
                        </p>
                      </div>
                    </div>

                    {/* Action button */}
                    {!isCompleted && user && (
                      <Button 
                        onClick={markAsCompleted} 
                        variant="outline"
                        className="gap-2 shrink-0 border-success/30 text-success hover:bg-success/10 hover:text-success"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Tugatildi deb belgilash
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs Section */}
            <Card className="border-border/40 shadow-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader className="pb-0 bg-gradient-to-r from-secondary/50 via-secondary/30 to-transparent border-b border-border/40">
                  <TabsList className="grid w-full grid-cols-2 bg-background/50 backdrop-blur-sm p-1">
                    <TabsTrigger 
                      value="practice" 
                      className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md transition-all"
                    >
                      <Target className="h-4 w-4" />
                      <span>Mashq</span>
                      {practiceCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="qa" 
                      className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md transition-all"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Savol-javob</span>
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

            {/* Navigation Card */}
            <Card className="border-border/40 bg-gradient-to-r from-card via-card to-secondary/10 overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {prevLesson ? (
                    <Button 
                      variant="outline"
                      className="gap-2 w-full sm:w-auto group"
                      onClick={() => navigate(`/lessons/${prevLesson.id}`)}
                    >
                      <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                      <div className="text-left">
                        <span className="block text-xs text-muted-foreground">Oldingi</span>
                        <span className="hidden sm:block text-sm truncate max-w-[150px]">{prevLesson.title}</span>
                      </div>
                    </Button>
                  ) : (
                    <div className="hidden sm:block" />
                  )}

                  <div className="hidden md:flex items-center gap-3 text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span>Davom eting, ajoyib natija!</span>
                    <Sparkles className="h-4 w-4 text-accent" />
                  </div>

                  {nextLesson ? (
                    <Button 
                      className="gap-2 w-full sm:w-auto group"
                      onClick={() => navigate(`/lessons/${nextLesson.id}`)}
                    >
                      <div className="text-left">
                        <span className="block text-xs opacity-80">Keyingi</span>
                        <span className="hidden sm:block text-sm truncate max-w-[150px]">{nextLesson.title}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  ) : (
                    <Button 
                      className="gap-2 w-full sm:w-auto bg-success hover:bg-success/90"
                      onClick={() => navigate(`/courses/${lesson.course_id}`)}
                    >
                      <Trophy className="h-4 w-4" />
                      <span>Kursni tugatish</span>
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
    </PageBackground>
  );
};

export default LessonDetail;