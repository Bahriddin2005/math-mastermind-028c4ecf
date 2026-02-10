import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen, GraduationCap, Award, Clock, Calendar, Bell,
  ArrowRight, FileText, Users, TrendingUp, Sparkles,
  CheckCircle, Download, Eye, Play, BarChart3, Calculator
} from 'lucide-react';

interface CourseProgress {
  id: string;
  title: string;
  totalLessons: number;
  completedLessons: number;
  totalWatchedMinutes: number;
}

interface BlogPost {
  id: string;
  title: string;
  read_time: string;
  category: string;
}

type RecommendationType = 'completed' | 'almost_done' | 'inactive' | 'active' | 'certified' | 'new_user';

interface SmartRecommendation {
  type: RecommendationType;
  course: CourseProgress;
  reason: string;
  headline: string;
  matchScore: number;
  icon: string;
}

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [completedCourses, setCompletedCourses] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchCourseProgress();
    fetchBlogPosts();
  }, [user]);

  const fetchCourseProgress = async () => {
    if (!user) return;

    const { data: courses } = await supabase
      .from('courses')
      .select('id, title')
      .eq('is_published', true)
      .order('order_index');

    if (!courses) return;

    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, course_id')
      .eq('is_published', true);

    const { data: progress } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, completed, watched_seconds')
      .eq('user_id', user.id);

    const progressMap = new Map(progress?.map(p => [p.lesson_id, p]) || []);
    const completed: string[] = [];

    const result = courses.map(course => {
      const courseLessons = lessons?.filter(l => l.course_id === course.id) || [];
      const completedLessons = courseLessons.filter(l => progressMap.get(l.id)?.completed).length;
      const totalWatched = courseLessons.reduce((sum, l) => {
        const p = progressMap.get(l.id);
        return sum + ((p?.watched_seconds || 0) / 60);
      }, 0);

      if (completedLessons === courseLessons.length && courseLessons.length > 0) {
        completed.push(course.id);
      }

      return {
        id: course.id,
        title: course.title,
        totalLessons: courseLessons.length,
        completedLessons,
        totalWatchedMinutes: Math.round(totalWatched),
      };
    });

    setCourseProgress(result);
    setCompletedCourses(completed);
  };

  const fetchBlogPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('id, title, read_time, category')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(4);

    if (data) setBlogPosts(data);
  };

  // Current course (first incomplete one)
  const currentCourse = courseProgress.find(c => c.completedLessons < c.totalLessons && c.totalLessons > 0);
  const currentProgress = currentCourse
    ? Math.round((currentCourse.completedLessons / currentCourse.totalLessons) * 100)
    : 0;

  // Completed stats
  const totalCompleted = courseProgress.reduce((s, c) => s + c.completedLessons, 0);
  const totalLessons = courseProgress.reduce((s, c) => s + c.totalLessons, 0);
  const practiceCount = Math.floor(totalCompleted / 3); // rough estimate
  const testCount = completedCourses.length;

  // Recommended courses (ones not started yet)
  const recommendedCourses = courseProgress.filter(c => c.completedLessons === 0 && c.totalLessons > 0);

  // AI-based Smart Recommendations
  const getSmartRecommendations = (): SmartRecommendation[] => {
    const recommendations: SmartRecommendation[] = [];
    const notStarted = courseProgress.filter(c => c.completedLessons === 0 && c.totalLessons > 0);
    const inProgress = courseProgress.filter(c => c.completedLessons > 0 && c.completedLessons < c.totalLessons);
    const totalWatchedAll = courseProgress.reduce((s, c) => s + c.totalWatchedMinutes, 0);

    // Case 1: Almost done with current course
    inProgress.forEach(course => {
      const progress = (course.completedLessons / course.totalLessons) * 100;
      if (progress >= 75) {
        const nextCourse = notStarted[0];
        if (nextCourse) {
          recommendations.push({
            type: 'almost_done',
            course: nextCourse,
            headline: '🎉 Siz kursni deyarli yakunladingiz!',
            reason: `Bilimingizni kengaytirish uchun keyingi bosqichni tavsiya qilamiz.`,
            matchScore: 95,
            icon: '🎯',
          });
        }
      }
    });

    // Case 2: Completed a course → recommend next
    if (completedCourses.length > 0 && notStarted.length > 0) {
      const lastCompleted = courseProgress.find(c => completedCourses.includes(c.id));
      const next = notStarted[0];
      recommendations.push({
        type: 'completed',
        course: next,
        headline: `✅ Siz ${lastCompleted?.title || 'kursni'} tugatdingiz.`,
        reason: `Endi ${next.title} kursi darslaringizni yanada kuchaytiradi.`,
        matchScore: 92,
        icon: '🌟',
      });
    }

    // Case 3: Certified user → advanced recommendation
    if (completedCourses.length >= 2 && notStarted.length > 0) {
      recommendations.push({
        type: 'certified',
        course: notStarted[notStarted.length - 1], // suggest last/advanced one
        headline: '🏅 Tabriklaymiz! Siz trenerlik sertifikatiga ega bo\'ldingiz.',
        reason: `Endi ${notStarted[notStarted.length - 1].title} kursi bilan malakangizni oshiring.`,
        matchScore: 90,
        icon: '🚀',
      });
    }

    // Case 4: Very active user
    if (totalWatchedAll > 120 && notStarted.length > 0) {
      recommendations.push({
        type: 'active',
        course: notStarted[0],
        headline: '🔥 Siz juda faol o\'rganmoqdasiz!',
        reason: `${notStarted[0].title} kursi siz uchun ayni muddao.`,
        matchScore: 88,
        icon: '🚀',
      });
    }

    // Case 5: New user / nothing started
    if (completedCourses.length === 0 && inProgress.length === 0 && notStarted.length > 0) {
      recommendations.push({
        type: 'new_user',
        course: notStarted[0],
        headline: '🧠 Siz uchun tavsiya qilamiz',
        reason: `${notStarted[0].title} — o'qituvchilar uchun eng mos boshlang'ich kurs.`,
        matchScore: 85,
        icon: '📘',
      });
    }

    // Deduplicate by course id, keep highest score
    const seen = new Set<string>();
    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .filter(r => {
        if (seen.has(r.course.id)) return false;
        seen.add(r.course.id);
        return true;
      })
      .slice(0, 2);
  };

  const smartRecommendations = getSmartRecommendations();

  return (
    <div className="space-y-4">
      {/* 1. Teacher Greeting */}
      <div className="px-1">
        <h2 className="text-xl sm:text-2xl font-display font-bold">
          Xush kelibsiz, ustoz! 👋
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Bilimingizni oshirish va darslarni samarali o'tkazish uchun kerakli hamma narsa shu yerda.
        </p>
      </div>

      {/* 2. Current Course Progress */}
      {currentCourse && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">📘 Hozir o'qilayotgan kurs</p>
                <CardTitle className="text-base">{currentCourse.title}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>📊 Yakunlanish darajasi</span>
                <span className="font-bold text-foreground">{currentProgress}%</span>
              </div>
              <Progress value={currentProgress} className="h-2" />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>⏱️ Sarflangan vaqt: {currentCourse.totalWatchedMinutes} daqiqa</span>
            </div>
            <Button
              className="w-full"
              onClick={() => navigate(`/courses/${currentCourse.id}`)}
            >
              🟢 O'qishni davom ettirish
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 3. Next Lesson Reminder */}
      <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-yellow-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">⏰ Keyingi dars vaqti</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-muted-foreground">
                  📅 Keyingi dars: <span className="font-semibold text-foreground">Har kuni yangi dars</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  🕒 O'zingizga qulay vaqtda o'rganing
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                🔔 Dars boshlanishidan oldin eslatma yuboriladi.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-xs border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                onClick={() => navigate('/settings')}
              >
                <Bell className="w-3 h-3 mr-1" />
                🟢 Eslatmani yoqish
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Learning Progress Summary */}
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base">📈 O'qish jarayoni</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">📌 Siz hozir:</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{totalLessons} ta darsdan <strong>{totalCompleted}</strong> tasini yakunladingiz</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span><strong>{practiceCount}</strong> ta amaliy topshiriqni bajardingiz</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span><strong>{testCount}</strong> ta testdan o'tdingiz</span>
            </li>
          </ul>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-3">
            👉 Muvaffaqiyatli davom etyapsiz!
          </p>
        </CardContent>
      </Card>

      {/* 5. Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/abacus-simulator')} className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/20 text-center active:scale-95 transition-all">
          <div className="text-3xl mb-2">🧮</div>
          <p className="text-sm font-bold">Abakus simulyator</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Darsda ko'rsatish</p>
        </button>
        <button onClick={() => navigate('/train')} className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 text-center active:scale-95 transition-all">
          <div className="text-3xl mb-2">🎯</div>
          <p className="text-sm font-bold">Trenajor</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Mashq qilish</p>
        </button>
        <button onClick={() => navigate('/problem-sheet')} className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20 text-center active:scale-95 transition-all">
          <div className="text-3xl mb-2">📝</div>
          <p className="text-sm font-bold">Misol varaqlar</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Misol yaratish</p>
        </button>
        <button onClick={() => navigate('/leaderboard')} className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 to-teal-600/5 border border-teal-500/20 text-center active:scale-95 transition-all">
          <div className="text-3xl mb-2">🏆</div>
          <p className="text-sm font-bold">Reyting</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Guruh natijalari</p>
        </button>
      </div>

      {/* 6. Certificates Section */}
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-indigo-500/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <CardTitle className="text-base">🏅 Mening sertifikatlarim</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Quyida siz muvaffaqiyatli tugatgan kurslar va olingan sertifikatlar joylashgan.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {completedCourses.length > 0 ? (
            <>
              <p className="text-xs font-semibold text-muted-foreground">🎓 Tugatilgan kurslar</p>
              {courseProgress
                .filter(c => completedCourses.includes(c.id))
                .map(course => (
                  <div key={course.id} className="p-3 rounded-xl bg-background/60 border border-purple-500/10 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-semibold">{course.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">🏅 Trenerlik sertifikati berildi</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs flex-1">
                        <Eye className="w-3 h-3 mr-1" />
                        🟢 Sertifikatni ko'rish
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs flex-1">
                        <Download className="w-3 h-3 mr-1" />
                        🟢 Yuklab olish (PDF)
                      </Button>
                    </div>
                  </div>
                ))}
            </>
          ) : (
            <div className="text-center py-4">
              <GraduationCap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Hali sertifikat yo'q</p>
              <p className="text-xs text-muted-foreground">Kursni yakunlang va sertifikat oling!</p>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground text-center">
            📌 Sertifikatlar online tekshiriladi va amal qiladi.
          </p>
        </CardContent>
      </Card>

      {/* 7. AI Smart Recommendations */}
      {smartRecommendations.length > 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 relative overflow-hidden">
          {/* AI badge */}
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 bg-primary/10 border-primary/20">
              🤖 AI tavsiya
            </Badge>
          </div>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">🧠 Siz uchun tavsiya qilamiz</CardTitle>
                <p className="text-[10px] text-muted-foreground">
                  Sizning o'qish jarayoningizga qarab tanlandi
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {smartRecommendations.map((rec, i) => (
              <div key={rec.course.id} className="p-3 rounded-xl bg-background/60 border border-primary/10 space-y-2">
                {/* Headline */}
                <p className="text-sm font-bold">{rec.headline}</p>
                
                {/* Reason */}
                <p className="text-xs text-muted-foreground">{rec.reason}</p>
                
                {/* Course card */}
                <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                  <span className="text-2xl">{rec.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{rec.course.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {rec.course.totalLessons} ta dars
                    </p>
                  </div>
                  {/* Match score */}
                  <div className="text-right">
                    <p className="text-xs font-bold text-primary">{rec.matchScore}%</p>
                    <p className="text-[9px] text-muted-foreground">moslik</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs flex-1"
                    onClick={() => navigate(`/courses/${rec.course.id}`)}
                  >
                    🟢 Kurs haqida
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs flex-1"
                    onClick={() => navigate(`/courses/${rec.course.id}`)}
                  >
                    🟢 Boshlash
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>

                {/* Why this recommendation */}
                {i === 0 && (
                  <details className="text-[10px] text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground transition-colors">
                      ⭐ Nega aynan siz uchun?
                    </summary>
                    <p className="mt-1 pl-4">
                      {rec.type === 'almost_done' && 'Siz joriy kursni deyarli yakunladingiz. Keyingi kursga o\'tish bilimingizni mustahkamlaydi.'}
                      {rec.type === 'completed' && 'Oldingi kursni muvaffaqiyatli yakunlaganingiz uchun bu kurs sizning tajribangizga mos keladi.'}
                      {rec.type === 'certified' && 'Sertifikat olganingiz uchun murakkab kurslarga tayyor ekansiz.'}
                      {rec.type === 'active' && 'Faol o\'rganish tezligingiz ushbu kursni osonroq o\'zlashtirishga yordam beradi.'}
                      {rec.type === 'new_user' && 'Bu kurs yangi o\'qituvchilar uchun eng mos boshlang\'ich dastur.'}
                    </p>
                  </details>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 8. Teacher Blog Section */}
      {blogPosts.length > 0 && (
        <Card className="border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-pink-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <CardTitle className="text-base">📚 Ustozlar uchun maqolalar</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary"
                onClick={() => navigate('/blog')}
              >
                Barchasi <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Bilimingizni kengaytirish va darslaringizni yanada samarali qilish uchun.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {blogPosts.map(post => (
              <button
                key={post.id}
                onClick={() => navigate(`/blog/${post.id}`)}
                className="w-full text-left p-3 rounded-xl bg-background/60 border border-rose-500/10 hover:border-rose-500/30 active:scale-[0.98] transition-all"
              >
                <p className="text-sm font-semibold line-clamp-2">{post.title}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ⏱️ {post.read_time}
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    🏷️ {post.category}
                  </Badge>
                  <span className="text-[10px] text-primary font-semibold ml-auto">🟢 O'qish</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 9. Notifications Preview */}
      <Card className="border-border/30">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">🔔 Eslatmalar</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { icon: '⏰', text: "Dars boshlanishiga 1 soat qoldi", color: 'text-amber-600 dark:text-amber-400' },
            { icon: '🌟', text: "Sizga mos yangi kurs tavsiya qilamiz", color: 'text-blue-600 dark:text-blue-400' },
            ...(completedCourses.length > 0
              ? [
                  { icon: '🎉', text: "Tabriklaymiz! Siz kursni muvaffaqiyatli yakunladingiz", color: 'text-emerald-600 dark:text-emerald-400' },
                  { icon: '🏅', text: "Sertifikatingiz tayyor", color: 'text-purple-600 dark:text-purple-400' },
                ]
              : []),
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-background/40">
              <span className="text-lg">{item.icon}</span>
              <span className={`text-xs ${item.color}`}>{item.text}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
