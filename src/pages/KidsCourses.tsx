import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { Mascot } from '@/components/Mascot';
import { LevelMap } from '@/components/kids/LevelMap';
import { useConfettiEffect } from '@/components/kids/Confetti';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  Play,
  Lock,
  Star,
  Trophy,
  BookOpen,
  Sparkles,
  GraduationCap,
  Zap,
  CheckCircle,
  ChevronRight,
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

interface Level {
  id: string;
  number: number;
  title: string;
  status: 'locked' | 'available' | 'completed';
  stars?: number;
}

const difficultyEmoji: Record<string, string> = {
  beginner: '🌱',
  intermediate: '🌿',
  advanced: '🌳',
};

const difficultyColor: Record<string, string> = {
  beginner: 'from-kids-green to-emerald-400',
  intermediate: 'from-kids-yellow to-amber-400',
  advanced: 'from-kids-pink to-rose-400',
};

const KidsCourses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { soundEnabled, toggleSound } = useSound();
  const { triggerConfetti } = useConfettiEffect();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<Record<string, { total: number; completed: number }>>({});
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

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

  const getProgressPercent = (courseId: string) => {
    const progress = userProgress[courseId];
    if (!progress) return 0;
    return (progress.completed / progress.total) * 100;
  };

  const isCompleted = (courseId: string) => {
    const progress = userProgress[courseId];
    return progress && progress.completed === progress.total && progress.total > 0;
  };

  // Transform courses to level map format
  const courseLevels: Level[] = courses.map((course, index) => {
    const completed = isCompleted(course.id);
    const progressPercent = getProgressPercent(course.id);
    const isLocked = index > 0 && !isCompleted(courses[index - 1].id) && progressPercent === 0;
    
    return {
      id: course.id,
      number: index + 1,
      title: course.title,
      status: completed ? 'completed' : (isLocked ? 'locked' : 'available'),
      stars: completed ? 3 : progressPercent > 66 ? 2 : progressPercent > 33 ? 1 : 0,
    };
  });

  const handleLevelClick = (level: Level) => {
    if (level.status === 'locked') return;
    navigate(`/courses/${level.id}`);
  };

  if (loading) {
    return (
      <PageBackground className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Mascot mood="thinking" size="lg" animate />
          <p className="text-lg font-bold text-kids-purple animate-pulse">Kurslar yuklanmoqda...</p>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground className="min-h-screen pb-24">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <div className="container px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Orqaga
          </Button>
          <Badge className="bg-gradient-to-r from-kids-green to-emerald-400 text-white border-0 px-4 py-1.5">
            <GraduationCap className="h-4 w-4 mr-1.5" />
            Kurslar
          </Badge>
        </div>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-kids-blue via-kids-purple to-kids-pink p-6 mb-8">
          {/* Floating decorations */}
          <div className="absolute top-4 right-8 text-4xl animate-bounce-soft">📚</div>
          <div className="absolute bottom-4 left-8 text-3xl animate-bounce-soft" style={{ animationDelay: '0.3s' }}>🎓</div>
          <div className="absolute top-1/2 right-1/4 text-2xl animate-bounce-soft" style={{ animationDelay: '0.6s' }}>⭐</div>
          
          <div className="relative flex flex-col sm:flex-row items-center gap-6">
            <Mascot mood="excited" size="lg" message="Yangi narsalar o'rganamiz!" />
            <div className="text-center sm:text-left text-white">
              <h1 className="text-2xl sm:text-3xl font-display font-black mb-2">
                O'rganish sarguzashti
              </h1>
              <p className="text-white/80 mb-4">
                Har bir kursni tugatib, yangi darajalarni oching!
              </p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                <Badge className="bg-white/20 text-white border-0 gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  {courses.length} ta kurs
                </Badge>
                <Badge className="bg-white/20 text-white border-0 gap-1.5">
                  <Star className="h-4 w-4 fill-kids-yellow text-kids-yellow" />
                  {Object.values(userProgress).reduce((sum, p) => sum + p.completed, 0)} ta tugatilgan
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-16">
            <Mascot mood="thinking" size="lg" message="Kurslar hali mavjud emas. Tez orada qo'shiladi!" />
          </div>
        ) : (
          <>
            {/* Level Map Style */}
            <div className="mb-8">
              <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🗺️</span>
                Ta'lim xaritasi
              </h2>
              <LevelMap 
                levels={courseLevels} 
                onLevelClick={handleLevelClick}
              />
            </div>

            {/* Course Cards - Island Style */}
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🏝️</span>
              Barcha orollar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course, index) => {
                const progress = userProgress[course.id];
                const progressPercent = getProgressPercent(course.id);
                const completed = isCompleted(course.id);
                const isLocked = index > 0 && !isCompleted(courses[index - 1].id) && progressPercent === 0;
                const emoji = difficultyEmoji[course.difficulty] || '🌱';
                const gradient = difficultyColor[course.difficulty] || 'from-kids-green to-emerald-400';

                return (
                  <Card 
                    key={course.id}
                    className={`relative overflow-hidden border-2 transition-all cursor-pointer hover:scale-[1.02] ${
                      isLocked 
                        ? 'border-gray-300 opacity-60' 
                        : completed 
                          ? 'border-kids-green shadow-lg shadow-kids-green/20' 
                          : 'border-kids-purple/20 hover:border-kids-purple/40'
                    }`}
                    onClick={() => !isLocked && navigate(`/courses/${course.id}`)}
                  >
                    {/* Thumbnail / Icon area */}
                    <div className={`relative h-32 bg-gradient-to-br ${gradient} overflow-hidden`}>
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-6xl">{emoji}</span>
                        </div>
                      )}
                      
                      {/* Status overlay */}
                      {isLocked && (
                        <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                            <Lock className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      )}
                      
                      {completed && (
                        <div className="absolute top-3 right-3">
                          <div className="flex gap-1">
                            {[1, 2, 3].map((star) => (
                              <Star 
                                key={star} 
                                className="h-6 w-6 text-kids-yellow fill-kids-yellow drop-shadow-lg" 
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Progress bar overlay */}
                      {!isLocked && !completed && progressPercent > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/20">
                          <div 
                            className="h-full bg-kids-yellow transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-display font-bold text-lg line-clamp-1">{course.title}</h3>
                        {completed && <CheckCircle className="h-5 w-5 text-kids-green flex-shrink-0" />}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {course.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BookOpen className="h-4 w-4" />
                          <span>{course.lessons_count} ta dars</span>
                        </div>
                        
                        {!isLocked && (
                          <Button 
                            size="sm" 
                            className={`rounded-full gap-1 ${
                              completed 
                                ? 'bg-kids-green hover:bg-kids-green/90' 
                                : 'bg-kids-purple hover:bg-kids-purple/90'
                            }`}
                          >
                            {completed ? 'Takrorlash' : progressPercent > 0 ? 'Davom etish' : 'Boshlash'}
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Progress info */}
                      {progress && !completed && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Jarayon</span>
                            <span>{progress.completed}/{progress.total} dars</span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </PageBackground>
  );
};

export default KidsCourses;
