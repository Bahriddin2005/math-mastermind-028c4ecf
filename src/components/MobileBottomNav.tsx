import { Link, useLocation } from 'react-router-dom';
import { Home, Play, Trophy, BarChart3, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { icon: Home, label: "Uy", path: "/", emoji: "🏠" },
  { icon: Play, label: "O'yin", path: "/train", emoji: "🎮" },
  { icon: Medal, label: "Yutuqlar", path: "/achievements", emoji: "🏅" },
  { icon: BarChart3, label: "Statistika", path: "/statistics", emoji: "📊" },
  { icon: Trophy, label: "Rekordlar", path: "/records", emoji: "🏆" },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Hide on auth page
  if (location.pathname === '/auth' || location.pathname === '/reset-password') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-xl border-t border-border/30 safe-bottom shadow-lg">
      <div className="flex items-center justify-around h-[4.5rem] px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          
          // If not logged in, show auth for protected routes
          const href = !user && ['/train', '/achievements', '/statistics', '/records'].includes(item.path) 
            ? '/auth' 
            : item.path;

          return (
            <Link
              key={item.path}
              to={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-1 rounded-2xl transition-all duration-200",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <div className={cn(
                "relative flex items-center justify-center w-12 h-10 rounded-xl transition-all duration-300",
                isActive && "bg-primary/15 scale-110 shadow-sm"
              )}>
                {isActive ? (
                  <span className="text-xl">{item.emoji}</span>
                ) : (
                  <item.icon className="w-5 h-5" />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all duration-200",
                isActive && "text-primary font-bold"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
