import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ScrollToTop } from "@/components/ScrollToTop";
import { PageLoader } from "@/components/PageLoader";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { PageTransition } from "@/components/PageTransition";
import { PullToRefresh } from "@/components/PullToRefresh";
import { SessionTimeoutProvider } from "@/components/SessionTimeoutProvider";

// Core pages - loaded immediately
import KidsHome from "@/pages/KidsHome";
import Auth from "@/pages/Auth";

// Lazy loaded pages for better initial load
const Index = lazy(() => import("@/pages/Index"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Settings = lazy(() => import("@/pages/Settings"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Contact = lazy(() => import("@/pages/Contact"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPostPage = lazy(() => import("@/pages/BlogPost"));
const Admin = lazy(() => import("@/pages/Admin"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
const LessonDetail = lazy(() => import("@/pages/LessonDetail"));
const WeeklyGame = lazy(() => import("@/pages/WeeklyGame"));
const Badges = lazy(() => import("@/pages/Badges"));
const Install = lazy(() => import("@/pages/Install"));
// MentalArithmetic removed
const Achievements = lazy(() => import("@/pages/Achievements"));
const ChallengeStats = lazy(() => import("@/pages/ChallengeStats"));
const Statistics = lazy(() => import("@/pages/Statistics"));
const Records = lazy(() => import("@/pages/Records"));
const ProblemSheetGenerator = lazy(() => import("@/pages/ProblemSheetGenerator"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Profile = lazy(() => import("@/pages/Profile"));
const KidsCourses = lazy(() => import("@/pages/KidsCourses"));
const KidsLeaderboard = lazy(() => import("@/pages/KidsLeaderboard"));
const ParentDashboard = lazy(() => import("@/pages/ParentDashboard"));
const LessonStats = lazy(() => import("@/pages/LessonStats"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const About = lazy(() => import("@/pages/About"));
const AbacusSimulator = lazy(() => import("@/pages/AbacusSimulator"));
const AbacusPractice = lazy(() => import("@/pages/AbacusPractice"));
const LiveSessions = lazy(() => import("@/pages/LiveSessions"));
const LiveClassroom = lazy(() => import("@/pages/LiveClassroom"));
const Subjects = lazy(() => import("@/pages/Subjects"));
const SubjectPractice = lazy(() => import("@/pages/SubjectPractice"));
const Wallet = lazy(() => import("@/pages/Wallet"));

// Lazy load heavy widgets
const HelpChatWidget = lazy(() => import("@/components/HelpChatWidget").then(m => ({ default: m.HelpChatWidget })));

// Only show HelpChatWidget on home page
const HomeHelpChat = () => {
  const location = useLocation();
  if (location.pathname !== '/') return null;
  return <Suspense fallback={null}><HelpChatWidget /></Suspense>;
};
// Optimized QueryClient with stale-while-revalidate
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh longer
      gcTime: 1000 * 60 * 30, // 30 minutes cache
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false, // Don't refetch on tab switch (saves bandwidth)
      refetchOnReconnect: true,
    },
  },
});

const handleRefresh = async () => {
  await new Promise(resolve => setTimeout(resolve, 800));
  window.location.reload();
};

// Simple loading fallback for lazy components
const LazyFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <SessionTimeoutProvider>
            <PageLoader />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <PullToRefresh onRefresh={handleRefresh}>
              {/* ENTERPRISE: Main content wrapper - allows natural document flow */}
              <main className="relative min-h-screen pb-16 md:pb-0" style={{ minHeight: '100dvh' }}>
                <PageTransition>
                  <Suspense fallback={<LazyFallback />}>
                    <Routes>
                      <Route path="/" element={<KidsHome />} />
                      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                      <Route path="/train" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:id" element={<BlogPostPage />} />
                      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/courses" element={<ProtectedRoute><KidsCourses /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                      <Route path="/leaderboard" element={<KidsLeaderboard />} />
                      <Route path="/parent-dashboard" element={<ProtectedRoute><ParentDashboard /></ProtectedRoute>} />
                      <Route path="/lesson-stats" element={<ProtectedRoute><LessonStats /></ProtectedRoute>} />
                      <Route path="/courses/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
                      <Route path="/lessons/:lessonId" element={<ProtectedRoute><LessonDetail /></ProtectedRoute>} />
                      <Route path="/weekly-game" element={<ProtectedRoute><WeeklyGame /></ProtectedRoute>} />
                      <Route path="/badges" element={<Badges />} />
                      <Route path="/install" element={<Install />} />
                      
                      <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
                      <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
                      <Route path="/records" element={<ProtectedRoute><Records /></ProtectedRoute>} />
                      <Route path="/problem-sheet" element={<ProtectedRoute><ProblemSheetGenerator /></ProtectedRoute>} />
                      <Route path="/challenge-stats" element={<ChallengeStats />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/abacus-simulator" element={<AbacusSimulator />} />
                      <Route path="/abacus-practice" element={<ProtectedRoute><AbacusPractice /></ProtectedRoute>} />
                      <Route path="/live-sessions" element={<ProtectedRoute><LiveSessions /></ProtectedRoute>} />
                      <Route path="/live/:sessionId" element={<ProtectedRoute><LiveClassroom /></ProtectedRoute>} />
                      <Route path="/subjects" element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
                      <Route path="/subjects/:subjectId" element={<ProtectedRoute><SubjectPractice /></ProtectedRoute>} />
                      <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </PageTransition>
              </main>
            </PullToRefresh>
            <MobileBottomNav />
            <PWAInstallBanner />
            <HomeHelpChat />
          </BrowserRouter>
          </SessionTimeoutProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
