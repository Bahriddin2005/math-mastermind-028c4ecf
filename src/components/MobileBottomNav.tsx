import { Link, useLocation } from 'react-router-dom';
import { Home, Dumbbell, BookOpen, Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Capacitor } from '@capacitor/core';

const navItems = [
  { icon: Home, label: "Asosiy", path: "/" },
  { icon: Dumbbell, label: "Mashq", path: "/train" },
  { icon: BookOpen, label: "Kurslar", path: "/courses" },
  { icon: Trophy, label: "Haftalik", path: "/weekly-game" },
  { icon: User, label: "Profil", path: "/settings" },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isNative = Capacitor.isNativePlatform();

  // Hide on auth page
  if (location.pathname === '/auth' || location.pathname === '/reset-password') {
    return null;
  }

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background/98 backdrop-blur-xl border-t border-border/50",
        "transition-transform duration-200 ease-out",
        isNative ? "pb-[env(safe-area-inset-bottom,0.5rem)]" : "pb-2"
      )}
      style={{ height: 'var(--bottom-nav-height)' }}
    >
      <div className="flex items-center justify-around h-full px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          
          // If not logged in, show auth for protected routes
          const protectedRoutes = ['/train', '/courses', '/weekly-game', '/settings'];
          const href = !user && protectedRoutes.includes(item.path) 
            ? '/auth' 
            : item.path;

          return (
            <Link
              key={item.path}
              to={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 px-1 rounded-xl transition-all duration-150",
                "active:scale-95 touch-target",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "relative p-2 rounded-xl transition-all duration-150",
                isActive && "bg-primary/15"
              )}>
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-150",
                  isActive && "scale-110"
                )} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all",
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
