import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./hooks/useAuth";
import { HelpChatWidget } from "./components/HelpChatWidget";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { ScrollToTop } from "./components/ScrollToTop";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import ResetPassword from "./pages/ResetPassword";
import Contact from "./pages/Contact";
import Pricing from "./pages/Pricing";
import Blog from "./pages/Blog";
import BlogPostPage from "./pages/BlogPost";
import Admin from "./pages/Admin";
import FAQ from "./pages/FAQ";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import LessonDetail from "./pages/LessonDetail";
import WeeklyGame from "./pages/WeeklyGame";
import Badges from "./pages/Badges";
import Install from "./pages/Install";
import MentalArithmetic from "./pages/MentalArithmetic";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <div className="pb-16 md:pb-0">
              <Routes>
                <Route path="/" element={<Dashboard />} />
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
                <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
                <Route path="/courses/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
                <Route path="/lessons/:lessonId" element={<ProtectedRoute><LessonDetail /></ProtectedRoute>} />
                <Route path="/weekly-game" element={<ProtectedRoute><WeeklyGame /></ProtectedRoute>} />
                <Route path="/badges" element={<Badges />} />
                <Route path="/install" element={<Install />} />
                <Route path="/mental-arithmetic" element={<ProtectedRoute><MentalArithmetic /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
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
