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

const difficultyConfig: Record<string, { gradient: string; glow: string; text: string }> = {
  beginner: { 
    gradient: 'from-emerald-500 via-green-500 to-teal-500', 
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.5)]',
    text: 'Boshlang\'ich'
  },
  intermediate: { 
    gradient: 'from-amber-500 via-orange-500 to-yellow-500', 
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.5)]',
    text: 'O\'rta'
  },
  advanced: { 
    gradient: 'from-rose-500 via-pink-500 to-red-500', 
    glow: 'shadow-[0_0_30px_rgba(244,63,94,0.5)]',
    text: 'Murakkab'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 pb-24">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="container px-3 xs:px-4 py-4 sm:py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-1.5 h-9 px-3 text-white/80 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden xs:inline">Orqaga</span>
            </Button>
            <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 px-4 py-2 shadow-[0_0_20px_rgba(139,92,246,0.5)]">
              <GraduationCap className="h-4 w-4 mr-1.5" />
              Kurslar
            </Badge>
          </div>

          {/* Hero Section - Neon Glow Style */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 sm:p-8 mb-8 shadow-[0_0_60px_rgba(139,92,246,0.4)]">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 left-1/4 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            
            {/* Floating emojis */}
            <div className="absolute top-4 right-6 text-4xl animate-bounce" style={{ animationDuration: '2s' }}>📚</div>
            <div className="absolute bottom-4 left-6 text-3xl animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>🎓</div>
            <div className="absolute top-1/2 right-1/4 text-2xl animate-bounce" style={{ animationDuration: '3s', animationDelay: '1s' }}>⭐</div>
            
            <div className="relative flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-xl animate-pulse" />
                <Mascot mood="excited" size="lg" message="O'rganamiz!" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-4xl font-display font-black text-white mb-2 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  O'rganish sarguzashti
                </h1>
                <p className="text-cyan-100 text-sm sm:text-base mb-4 max-w-md">
                  Har bir kursni tugatib, yangi darajalarni oching va yulduzlar to'plang! ✨
                </p>
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 gap-1.5 px-3 py-1.5 shadow-lg">
                    <BookOpen className="h-4 w-4" />
                    {courses.length} ta kurs
                  </Badge>
                  <Badge className="bg-amber-500/30 backdrop-blur-sm text-amber-100 border-amber-400/30 gap-1.5 px-3 py-1.5 shadow-lg">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {Object.values(userProgress).reduce((sum, p) => sum + p.completed, 0)} tugatilgan
                  </Badge>
                  <Badge className="bg-emerald-500/30 backdrop-blur-sm text-emerald-100 border-emerald-400/30 gap-1.5 px-3 py-1.5 shadow-lg">
                    <Trophy className="h-4 w-4" />
                    Davom eting!
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
              <div className="mb-8">
                <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2 text-white">
                  <span className="text-2xl">🗺️</span>
                  Ta'lim xaritasi
                  <Sparkles className="h-5 w-5 text-cyan-400" />
                </h2>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <LevelMap 
                    levels={courseLevels} 
                    onLevelClick={handleLevelClick}
                  />
                </div>
              </div>

              {/* Course Cards */}
              <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2 text-white">
                <span className="text-2xl">🏝️</span>
                Barcha orollar
                <Zap className="h-5 w-5 text-amber-400" />
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
                      className={`relative overflow-hidden border-0 bg-white/10 backdrop-blur-sm transition-all duration-300 cursor-pointer group ${
                        isLocked 
                          ? 'opacity-50 cursor-not-allowed grayscale' 
                          : completed 
                            ? `${config.glow} hover:scale-[1.02]` 
                            : 'hover:bg-white/15 hover:scale-[1.02]'
                      }`}
                      onClick={() => !isLocked && handleCourseClick(course)}
                    >
                      {/* Thumbnail */}
                      <div className={`relative h-36 sm:h-40 bg-gradient-to-br ${config.gradient} overflow-hidden`}>
                        {course.thumbnail_url ? (
                          <img 
                            src={course.thumbnail_url} 
                            alt={course.title}
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-6xl drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] group-hover:scale-110 transition-transform">{emoji}</span>
                          </div>
                        )}
                        
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        
                        {isLocked && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center border-2 border-slate-600">
                              <Lock className="h-7 w-7 text-slate-400" />
                            </div>
                          </div>
                        )}
                        
                        {completed && (
                          <div className="absolute top-3 right-3 flex gap-1">
                            {[1, 2, 3].map((star) => (
                              <Star key={star} className="h-6 w-6 text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                            ))}
                          </div>
                        )}

                        {/* Difficulty badge */}
                        <Badge className={`absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white border-0 text-xs`}>
                          {config.text}
                        </Badge>

                        {!isLocked && !completed && progressPercent > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-display font-bold text-lg text-white line-clamp-1 group-hover:text-cyan-300 transition-colors">
                            {course.title}
                          </h3>
                          {completed && <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />}
                        </div>
                        
                        <p className="text-sm text-white/60 line-clamp-2 mb-4">
                          {course.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-white/70">
                            <BookOpen className="h-4 w-4" />
                            <span>{course.lessons_count} ta dars</span>
                          </div>
                          
                          {!isLocked && (
                            <Button 
                              size="sm" 
                              className={`h-9 rounded-full gap-1.5 text-sm px-4 bg-gradient-to-r ${config.gradient} text-white border-0 shadow-lg hover:opacity-90`}
                            >
                              {completed ? 'Takrorlash' : progressPercent > 0 ? 'Davom' : 'Boshlash'}
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {progress && !completed && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="flex justify-between text-xs text-white/60 mb-2">
                              <span>Jarayon</span>
                              <span className="text-cyan-400">{progress.completed}/{progress.total}</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
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
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedCourse(null)}
          />
          
          {/* Panel */}
          <div className="relative w-full sm:max-w-lg max-h-[85vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-fade-in border border-white/10">
            {/* Header */}
            <div className={`relative p-5 sm:p-6 bg-gradient-to-br ${difficultyConfig[selectedCourse.difficulty]?.gradient || 'from-violet-600 to-purple-600'}`}>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 text-white hover:bg-white/30"
                onClick={() => setSelectedCourse(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg">
                  {difficultyEmoji[selectedCourse.difficulty] || '🌱'}
                </div>
                <div className="text-white">
                  <h2 className="font-display font-bold text-xl sm:text-2xl line-clamp-1 drop-shadow-lg">{selectedCourse.title}</h2>
                  <p className="text-white/80 text-sm">{selectedCourse.lessons_count} ta dars</p>
                </div>
              </div>
            </div>

            {/* Lessons List */}
            <div className="p-5 overflow-y-auto max-h-[55vh]">
              <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2 text-white">
                <BookOpen className="h-4 w-4 text-cyan-400" />
                Darslar ro'yxati
              </h3>

              {lessonsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : courseLessons.length === 0 ? (
                <div className="text-center py-8 text-white/50">
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
                            ? 'border-emerald-500/30 bg-emerald-500/10' 
                            : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-500/30'
                        }`}
                        onClick={() => navigate(`/lessons/${lesson.id}`)}
                      >
                        <div className="p-3 flex items-center gap-3">
                          {/* Number/Status */}
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isLessonCompleted 
                              ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                              : 'bg-white/10 text-white/60'
                          }`}>
                            {isLessonCompleted ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <span className="font-bold">{index + 1}</span>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-white line-clamp-1">{lesson.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
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
                            className="h-8 w-8 rounded-full text-white/60 hover:text-white hover:bg-white/10"
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
            <div className="p-5 border-t border-white/10 bg-black/20">
              <Button 
                className={`w-full gap-2 h-12 rounded-xl bg-gradient-to-r ${difficultyConfig[selectedCourse.difficulty]?.gradient || 'from-violet-600 to-purple-600'} text-white border-0 shadow-lg font-bold text-base`}
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
    </div>
  );
};

export default KidsCourses;
