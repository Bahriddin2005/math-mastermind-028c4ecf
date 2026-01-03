import { Link, useLocation } from 'react-router-dom';
import { Home, Dumbbell, BookOpen, Trophy, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { icon: Home, label: "Bosh sahifa", path: "/" },
  { icon: Dumbbell, label: "Mashq", path: "/train" },
  { icon: Calculator, label: "Abakus", path: "/mental-arithmetic" },
  { icon: BookOpen, label: "Kurslar", path: "/courses" },
  { icon: Trophy, label: "Haftalik", path: "/weekly-game" },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Hide on auth page or if user is not logged in
  if (!user || location.pathname === '/auth' || location.pathname === '/reset-password') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-xl border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          
          // If not logged in, show auth for protected routes
          const href = !user && ['/train', '/courses', '/weekly-game', '/mental-arithmetic'].includes(item.path) 
            ? '/auth' 
            : item.path;

          return (
            <Link
              key={item.path}
              to={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 px-1 rounded-xl transition-all duration-200 touch-target",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <div className={cn(
                "relative p-1.5 rounded-xl transition-all duration-200",
                isActive && "bg-primary/10"
              )}>
                <item.icon className={cn(
                  "w-5 h-5 transition-all duration-200",
                  isActive && "scale-110"
                )} />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all duration-200",
                isActive && "text-primary font-semibold"
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
