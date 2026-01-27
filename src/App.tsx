import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { HelpChatWidget } from "@/components/HelpChatWidget";
import { ScrollToTop } from "@/components/ScrollToTop";
import { PageLoader } from "@/components/PageLoader";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { PageTransition } from "@/components/PageTransition";
import { PullToRefresh } from "@/components/PullToRefresh";

import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import KidsHome from "@/pages/KidsHome";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import ResetPassword from "@/pages/ResetPassword";
import Contact from "@/pages/Contact";
import Pricing from "@/pages/Pricing";
import Blog from "@/pages/Blog";
import BlogPostPage from "@/pages/BlogPost";
import Admin from "@/pages/Admin";
import FAQ from "@/pages/FAQ";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import LessonDetail from "@/pages/LessonDetail";
import WeeklyGame from "@/pages/WeeklyGame";
import Badges from "@/pages/Badges";
import Install from "@/pages/Install";
import MentalArithmetic from "@/pages/MentalArithmetic";
import Achievements from "@/pages/Achievements";
import ChallengeStats from "@/pages/ChallengeStats";
import Statistics from "@/pages/Statistics";
import Records from "@/pages/Records";
import ProblemSheetGenerator from "@/pages/ProblemSheetGenerator";
import NotFound from "@/pages/NotFound";
import Profile from "@/pages/Profile";
import KidsCourses from "@/pages/KidsCourses";
import KidsLeaderboard from "@/pages/KidsLeaderboard";
import ParentDashboard from "@/pages/ParentDashboard";
import LessonStats from "@/pages/LessonStats";

const queryClient = new QueryClient();

const handleRefresh = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  window.location.reload();
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <PageLoader />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <PullToRefresh onRefresh={handleRefresh}>
              <div className="pb-16 md:pb-0">
                <PageTransition>
                  <Routes>
                    <Route path="/" element={<KidsHome />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/train" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                    <Route path="/auth" element={<Auth />} />
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
                    <Route path="/mental-arithmetic" element={<ProtectedRoute><MentalArithmetic /></ProtectedRoute>} />
                    <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
                    <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
                    <Route path="/records" element={<ProtectedRoute><Records /></ProtectedRoute>} />
                    <Route path="/problem-sheet" element={<ProtectedRoute><ProblemSheetGenerator /></ProtectedRoute>} />
                    <Route path="/challenge-stats" element={<ChallengeStats />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </PageTransition>
              </div>
            </PullToRefresh>
            <MobileBottomNav />
            <PWAInstallBanner />
            <HelpChatWidget />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
