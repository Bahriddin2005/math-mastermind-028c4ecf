import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PageBackground } from '@/components/layout/PageBackground';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useSound } from '@/hooks/useSound';
import { TeacherLMSDashboard } from '@/components/lms/TeacherLMSDashboard';
import { StudentLMSDashboard } from '@/components/lms/StudentLMSDashboard';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const LMSDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading, isTeacher, isAdmin } = useUserRole();
  const { soundEnabled, toggleSound } = useSound();

  if (authLoading || roleLoading) {
    return (
      <PageBackground className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </PageBackground>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <PageBackground className="flex flex-col min-h-screen">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      <main className="flex-1 container px-3 sm:px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold font-display">
              {isTeacher || isAdmin ? '🎓 O\'qituvchi paneli' : '📚 O\'quv markazi'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isTeacher || isAdmin
                ? 'Zoom darslar yarating, davomatni kuzating va kurslarni boshqaring'
                : 'Jonli darslarga qo\'shiling, kurslarni o\'rganing va natijalaringizni kuzating'
              }
            </p>
          </div>

          {isTeacher || isAdmin ? (
            <TeacherLMSDashboard />
          ) : (
            <StudentLMSDashboard />
          )}
        </div>
      </main>
      <Footer />
    </PageBackground>
  );
};

export default LMSDashboard;
