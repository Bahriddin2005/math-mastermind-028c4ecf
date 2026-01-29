import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { Mascot } from '@/components/Mascot';
import { LevelMap } from '@/components/kids/LevelMap';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Sparkles,
  Trophy,
  Zap,
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

const difficultyConfig: Record<string, { gradient: string; bgLight: string; text: string; textColor: string }> = {
  beginner: { 
    gradient: 'from-emerald-500 to-green-600', 
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'Boshlang\'ich',
    textColor: 'text-emerald-700 dark:text-emerald-400'
  },
  intermediate: { 
    gradient: 'from-amber-500 to-orange-600', 
    bgLight: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'O\'rta',
    textColor: 'text-amber-700 dark:text-amber-400'
  },
  advanced: { 
    gradient: 'from-rose-500 to-pink-600', 
    bgLight: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'Murakkab',
    textColor: 'text-rose-700 dark:text-rose-400'
  },
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
    <PageBackground className="min-h-screen pb-20 sm:pb-24">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="container px-3 xs:px-4 py-4 sm:py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-1.5 h-9 px-3"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden xs:inline">Orqaga</span>
            </Button>
            <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1.5">
              <GraduationCap className="h-4 w-4 mr-1.5" />
              Kurslar
            </Badge>
          </div>

          {/* Hero Card */}
          <Card className="mb-6 overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="relative">
                  <Mascot mood="excited" size="lg" message="O'rganamiz!" />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h1 className="text-xl sm:text-2xl font-display font-black text-foreground mb-2 flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-2xl">📚</span>
                    O'rganish sarguzashti
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base mb-4 max-w-md">
                    Har bir kursni tugatib, yangi darajalarni oching va yulduzlar to'plang! ✨
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <Badge className="bg-primary/10 text-primary border-primary/20 gap-1.5 px-3 py-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      {courses.length} ta kurs
                    </Badge>
                    <Badge className="bg-kids-yellow/20 text-kids-yellow border-kids-yellow/30 gap-1.5 px-3 py-1.5">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {Object.values(userProgress).reduce((sum, p) => sum + p.completed, 0)} tugatilgan
                    </Badge>
                    <Badge className="bg-kids-orange/20 text-kids-orange border-kids-orange/30 gap-1.5 px-3 py-1.5">
                      <Trophy className="h-3.5 w-3.5" />
                      Davom eting!
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {courses.length === 0 ? (
            <div className="text-center py-12">
              <Mascot mood="thinking" size="lg" message="Kurslar hali mavjud emas. Tez orada qo'shiladi!" />
            </div>
          ) : (
            <>
              {/* Level Map */}
              <div className="mb-6">
                <h2 className="text-lg font-display font-bold mb-3 flex items-center gap-2 text-foreground">
                  <span className="text-xl">🗺️</span>
                  Ta'lim xaritasi
                  <Sparkles className="h-4 w-4 text-primary" />
                </h2>
                <Card className="p-4 border-primary/10">
                  <LevelMap 
                    levels={courseLevels} 
                    onLevelClick={handleLevelClick}
                  />
                </Card>
              </div>

              {/* Course Cards */}
              <h2 className="text-lg font-display font-bold mb-3 flex items-center gap-2 text-foreground">
                <span className="text-xl">🏝️</span>
                Barcha orollar
                <Zap className="h-4 w-4 text-kids-yellow" />
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course, index) => {
                  const progress = userProgress[course.id];
                  const progressPercent = getProgressPercent(course.id);
                  const completed = isCompleted(course.id);
                  const isLocked = index > 0 && !isCompleted(courses[index - 1].id) && progressPercent === 0;
                  const emoji = difficultyEmoji[course.difficulty] || '🌱';
                  const config = difficultyConfig[course.difficulty] || difficultyConfig.beginner;

                  return (
                    <Card 
                      key={course.id}
                      className={`relative overflow-hidden transition-all duration-300 cursor-pointer group border-border/50 ${
                        isLocked 
                          ? 'opacity-50 cursor-not-allowed grayscale' 
                          : 'hover:shadow-lg hover:scale-[1.02] hover:border-primary/30'
                      }`}
                      onClick={() => !isLocked && handleCourseClick(course)}
                    >
                      {/* Thumbnail */}
                      <div className={`relative h-32 sm:h-36 bg-gradient-to-br ${config.gradient} overflow-hidden`}>
                        {course.thumbnail_url ? (
                          <img 
                            src={course.thumbnail_url} 
                            alt={course.title}
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-5xl sm:text-6xl drop-shadow-lg group-hover:scale-110 transition-transform">{emoji}</span>
                          </div>
                        )}
                        
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        
                        {isLocked && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center border-2 border-muted-foreground/30">
                              <Lock className="h-6 w-6 text-muted-foreground" />
                            </div>
                          </div>
                        )}
                        
                        {completed && (
                          <div className="absolute top-2 right-2 flex gap-0.5">
                            {[1, 2, 3].map((star) => (
                              <Star key={star} className="h-5 w-5 text-kids-yellow fill-kids-yellow drop-shadow" />
                            ))}
                          </div>
                        )}

                        {/* Difficulty badge */}
                        <Badge className={`absolute top-2 left-2 ${config.bgLight} ${config.textColor} border-0 text-xs`}>
                          {config.text}
                        </Badge>

                        {!isLocked && !completed && progressPercent > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30">
                            <div 
                              className="h-full bg-kids-yellow transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-display font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {course.title}
                          </h3>
                          {completed && <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />}
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
                              className={`h-8 rounded-full gap-1 text-xs px-3 bg-gradient-to-r ${config.gradient} text-white border-0 shadow hover:opacity-90`}
                            >
                              {completed ? 'Takror' : progressPercent > 0 ? 'Davom' : 'Boshlash'}
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>

                        {progress && !completed && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                              <span>Jarayon</span>
                              <span className="text-primary font-medium">{progress.completed}/{progress.total}</span>
                            </div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className={`h-full bg-gradient-to-r ${config.gradient} rounded-full transition-all duration-500`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
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
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedCourse(null)}
          />
          
          {/* Panel */}
          <div className="relative w-full sm:max-w-lg max-h-[85vh] bg-background rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-fade-in border border-border">
            {/* Header */}
            <div className={`relative p-5 sm:p-6 bg-gradient-to-br ${difficultyConfig[selectedCourse.difficulty]?.gradient || 'from-primary to-primary/80'}`}>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 text-white hover:bg-white/30"
                onClick={() => setSelectedCourse(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl shadow-lg">
                  {difficultyEmoji[selectedCourse.difficulty] || '🌱'}
                </div>
                <div className="text-white">
                  <h2 className="font-display font-bold text-lg sm:text-xl line-clamp-1">{selectedCourse.title}</h2>
                  <p className="text-white/80 text-sm">{selectedCourse.lessons_count} ta dars</p>
                </div>
              </div>
            </div>

            {/* Lessons List */}
            <div className="p-5 overflow-y-auto max-h-[55vh]">
              <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2 text-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                Darslar ro'yxati
              </h3>

              {lessonsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
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
                      <div
                        key={lesson.id}
                        className={`overflow-hidden rounded-xl border transition-all active:scale-[0.98] cursor-pointer ${
                          isLessonCompleted 
                            ? 'border-primary/30 bg-primary/5' 
                            : 'border-border bg-card hover:bg-accent hover:border-primary/20'
                        }`}
                        onClick={() => navigate(`/lessons/${lesson.id}`)}
                      >
                        <div className="p-3 flex items-center gap-3">
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
                            <h4 className="font-medium text-sm text-foreground line-clamp-1">{lesson.title}</h4>
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
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 rounded-full"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-border bg-muted/30">
              <Button 
                className={`w-full gap-2 h-12 rounded-xl bg-gradient-to-r ${difficultyConfig[selectedCourse.difficulty]?.gradient || 'from-primary to-primary/80'} text-white border-0 shadow-lg font-bold text-base`}
                onClick={() => {
                  const firstIncomplete = courseLessons.find(l => !completedLessons.has(l.id));
                  navigate(`/lessons/${firstIncomplete?.id || courseLessons[0]?.id}`);
                }}
                disabled={courseLessons.length === 0}
              >
                <Play className="h-5 w-5" />
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
