import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { Mascot } from '@/components/Mascot';
import { LevelMap } from '@/components/kids/LevelMap';
import { useConfettiEffect } from '@/components/kids/Confetti';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PullToRefresh } from '@/components/PullToRefresh';
import { PageSkeleton } from '@/components/PageSkeleton';
import {
  ArrowLeft,
  Lock,
  Star,
  BookOpen,
  GraduationCap,
  CheckCircle,
  ChevronRight,
  Play,
  Clock,
  X,
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

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  order_index: number | null;
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
  beginner: 'from-emerald-500 to-emerald-400',
  intermediate: 'from-amber-500 to-amber-400',
  advanced: 'from-rose-500 to-rose-400',
};

const KidsCourses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { soundEnabled, toggleSound } = useSound();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<Record<string, { total: number; completed: number }>>({});
  
  // Selected course and its lessons
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  const fetchCourses = useCallback(async () => {
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
  }, [user]);

  // Fetch lessons for selected course
  const fetchCourseLessons = useCallback(async (course: Course) => {
    setLessonsLoading(true);
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', course.id)
      .eq('is_published', true)
      .order('order_index', { ascending: true });

    if (lessonsData) {
      setCourseLessons(lessonsData);

      // Fetch user progress for lessons
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
    setLessonsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleRefresh = async () => {
    await fetchCourses();
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

  // Handle course selection - show lessons
  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    fetchCourseLessons(course);
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
    const course = courses.find(c => c.id === level.id);
    if (course) handleCourseClick(course);
  };

  if (loading) {
    return (
      <PageBackground className="min-h-screen">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <PageSkeleton type="courses" />
      </PageBackground>
    );
  }

  return (
    <PageBackground className="min-h-screen pb-24">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="container px-3 xs:px-4 py-4 sm:py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-1.5 h-9 px-3"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden xs:inline">Orqaga</span>
            </Button>
            <Badge className="bg-primary text-primary-foreground border-0 px-3 py-1.5">
              <GraduationCap className="h-4 w-4 mr-1.5" />
              Kurslar
            </Badge>
          </div>

          {/* Hero Section - Compact */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-accent to-primary p-4 sm:p-6 mb-6">
            <div className="absolute top-2 right-4 text-3xl animate-bounce-soft">📚</div>
            <div className="absolute bottom-2 left-4 text-2xl animate-bounce-soft" style={{ animationDelay: '0.3s' }}>🎓</div>
            
            <div className="relative flex flex-col sm:flex-row items-center gap-4">
              <Mascot mood="excited" size="md" message="O'rganamiz!" />
              <div className="text-center sm:text-left text-primary-foreground">
                <h1 className="text-xl sm:text-2xl font-display font-black mb-1">
                  O'rganish sarguzashti
                </h1>
                <p className="text-primary-foreground/80 text-sm mb-3">
                  Har bir kursni tugatib, yangi darajalarni oching!
                </p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <Badge className="bg-background/20 text-primary-foreground border-0 gap-1">
                    <BookOpen className="h-3 w-3" />
                    {courses.length} ta kurs
                  </Badge>
                  <Badge className="bg-background/20 text-primary-foreground border-0 gap-1">
                    <Star className="h-3 w-3 fill-warning text-warning" />
                    {Object.values(userProgress).reduce((sum, p) => sum + p.completed, 0)} tugatilgan
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-12">
              <Mascot mood="thinking" size="lg" message="Kurslar hali mavjud emas. Tez orada qo'shiladi!" />
            </div>
          ) : (
            <>
              {/* Level Map */}
              <div className="mb-6">
                <h2 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                  <span className="text-xl">🗺️</span>
                  Ta'lim xaritasi
                </h2>
                <LevelMap 
                  levels={courseLevels} 
                  onLevelClick={handleLevelClick}
                />
              </div>

              {/* Course Cards */}
              <h2 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                <span className="text-xl">🏝️</span>
                Barcha orollar
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {courses.map((course, index) => {
                  const progress = userProgress[course.id];
                  const progressPercent = getProgressPercent(course.id);
                  const completed = isCompleted(course.id);
                  const isLocked = index > 0 && !isCompleted(courses[index - 1].id) && progressPercent === 0;
                  const emoji = difficultyEmoji[course.difficulty] || '🌱';
                  const gradient = difficultyColor[course.difficulty] || 'from-emerald-500 to-emerald-400';

                  return (
                    <Card 
                      key={course.id}
                      className={`relative overflow-hidden border-2 transition-all active:scale-[0.98] cursor-pointer ${
                        isLocked 
                          ? 'border-muted opacity-60 cursor-not-allowed' 
                          : completed 
                            ? 'border-primary shadow-md' 
                            : 'border-border hover:border-primary/40'
                      }`}
                      onClick={() => !isLocked && handleCourseClick(course)}
                    >
                      {/* Thumbnail */}
                      <div className={`relative h-28 sm:h-32 bg-gradient-to-br ${gradient} overflow-hidden`}>
                        {course.thumbnail_url ? (
                          <img 
                            src={course.thumbnail_url} 
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-5xl">{emoji}</span>
                          </div>
                        )}
                        
                        {isLocked && (
                          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                              <Lock className="h-6 w-6 text-muted-foreground" />
                            </div>
                          </div>
                        )}
                        
                        {completed && (
                          <div className="absolute top-2 right-2 flex gap-0.5">
                            {[1, 2, 3].map((star) => (
                              <Star key={star} className="h-5 w-5 text-warning fill-warning drop-shadow-lg" />
                            ))}
                          </div>
                        )}

                        {!isLocked && !completed && progressPercent > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-background/30">
                            <div 
                              className="h-full bg-warning transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="font-display font-bold text-base sm:text-lg line-clamp-1">{course.title}</h3>
                          {completed && <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />}
                        </div>
                        
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
                          {course.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>{course.lessons_count} ta dars</span>
                          </div>
                          
                          {!isLocked && (
                            <Button 
                              size="sm" 
                              className="h-8 rounded-full gap-1 text-xs px-3"
                            >
                              {completed ? 'Takrorlash' : progressPercent > 0 ? 'Davom' : 'Boshlash'}
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>

                        {progress && !completed && (
                          <div className="mt-2.5 pt-2.5 border-t border-border/50">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Jarayon</span>
                              <span>{progress.completed}/{progress.total}</span>
                            </div>
                            <Progress value={progressPercent} className="h-1.5" />
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
      </PullToRefresh>

      {/* Lessons Drawer/Panel */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedCourse(null)}
          />
          
          {/* Panel */}
          <div className="relative w-full sm:max-w-lg max-h-[85vh] bg-background rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className={`relative p-4 sm:p-5 bg-gradient-to-br ${difficultyColor[selectedCourse.difficulty] || 'from-primary to-primary/80'}`}>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/20 text-white hover:bg-white/30"
                onClick={() => setSelectedCourse(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
                  {difficultyEmoji[selectedCourse.difficulty] || '🌱'}
                </div>
                <div className="text-white">
                  <h2 className="font-display font-bold text-lg sm:text-xl line-clamp-1">{selectedCourse.title}</h2>
                  <p className="text-white/80 text-xs sm:text-sm">{selectedCourse.lessons_count} ta dars</p>
                </div>
              </div>
            </div>

            {/* Lessons List */}
            <div className="p-4 sm:p-5 overflow-y-auto max-h-[60vh]">
              <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Darslar ro'yxati
              </h3>

              {lessonsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : courseLessons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Darslar hali qo'shilmagan</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {courseLessons.map((lesson, index) => {
                    const isLessonCompleted = completedLessons.has(lesson.id);
                    
                    return (
                      <Card
                        key={lesson.id}
                        className={`overflow-hidden border transition-all active:scale-[0.98] cursor-pointer ${
                          isLessonCompleted 
                            ? 'border-primary/30 bg-primary/5' 
                            : 'border-border hover:border-primary/40'
                        }`}
                        onClick={() => navigate(`/lessons/${lesson.id}`)}
                      >
                        <CardContent className="p-3 flex items-center gap-3">
                          {/* Number/Status */}
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isLessonCompleted 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {isLessonCompleted ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <span className="font-bold">{index + 1}</span>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-1">{lesson.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              {lesson.duration_minutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {lesson.duration_minutes} daq
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Play button */}
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                            <Play className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/30">
              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={() => {
                  const firstIncomplete = courseLessons.find(l => !completedLessons.has(l.id));
                  navigate(`/lessons/${firstIncomplete?.id || courseLessons[0]?.id}`);
                }}
                disabled={courseLessons.length === 0}
              >
                <Play className="h-4 w-4" />
                {completedLessons.size > 0 ? 'Davom ettirish' : 'Boshlash'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageBackground>
  );
};

export default KidsCourses;