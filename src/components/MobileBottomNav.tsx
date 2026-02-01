import { Link, useLocation } from 'react-router-dom';
import { Home, Play, Trophy, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { icon: Home, label: "Uy", path: "/", emoji: "🏠" },
  { icon: Play, label: "Mashq", path: "/train", emoji: "🎮" },
  { icon: Trophy, label: "Musobaqa", path: "/weekly-game", emoji: "🏆" },
  { icon: BookOpen, label: "Darslar", path: "/courses", emoji: "📚" },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Hide on auth page
  if (location.pathname === '/auth' || location.pathname === '/reset-password') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Glass background with gradient border */}
      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/98 to-card/95 backdrop-blur-xl" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      
      {/* Safe area for notched phones */}
      <div className="relative flex items-center justify-around px-2 pt-2" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          
          // If not logged in, show auth for protected routes
          const href = !user && ['/mental-arithmetic', '/weekly-game'].includes(item.path) 
            ? '/auth' 
            : item.path;

          return (
            <Link
              key={item.path}
              to={href}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 py-1.5 rounded-2xl transition-all duration-300",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground active:scale-95"
              )}
            >
              {/* Active indicator background */}
              <div className={cn(
                "absolute inset-x-2 -top-1 h-1 rounded-full transition-all duration-300",
                isActive ? "bg-primary shadow-lg shadow-primary/50" : "bg-transparent"
              )} />
              
              {/* Icon container */}
              <div className={cn(
                "relative flex items-center justify-center w-12 h-10 xs:w-14 xs:h-11 rounded-2xl transition-all duration-300",
                isActive && "bg-primary/15 scale-110"
              )}>
                {isActive ? (
                  <span className="text-2xl xs:text-[1.75rem] drop-shadow-sm">{item.emoji}</span>
                ) : (
                  <item.icon className="w-5 h-5 xs:w-6 xs:h-6" />
                )}
                
                {/* Glow effect for active */}
                {isActive && (
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-lg -z-10" />
                )}
              </div>
              
              {/* Label */}
              <span className={cn(
                "text-[10px] xs:text-xs font-semibold mt-0.5 transition-all duration-200",
                isActive ? "text-primary font-bold" : "text-muted-foreground"
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
