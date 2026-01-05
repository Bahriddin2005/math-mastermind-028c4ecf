import { Link, useLocation } from 'react-router-dom';
import { Home, Map, Play, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { icon: Home, label: "Uy", path: "/" },
  { icon: Map, label: "Xarita", path: "/game-hub" },
  { icon: Play, label: "O'ynash", path: "/mental-arithmetic", highlight: true },
  { icon: Users, label: "Ota-ona", path: "/settings" },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Hide on auth page or if user is not logged in
  if (!user || location.pathname === '/auth' || location.pathname === '/reset-password') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-xl border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          
          const href = !user && ['/mental-arithmetic', '/game-hub', '/settings'].includes(item.path) 
            ? '/auth' 
            : item.path;

          return (
            <Link
              key={item.path}
              to={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 px-2 rounded-2xl transition-all duration-200 touch-target",
                item.highlight && !isActive && "relative",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <div className={cn(
                "relative p-2 rounded-2xl transition-all duration-200",
                item.highlight && !isActive && "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
                isActive && "bg-primary/10"
              )}>
                <item.icon className={cn(
                  "w-6 h-6 transition-all duration-200",
                  isActive && "scale-110",
                  item.highlight && !isActive && "text-primary-foreground"
                )} />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </div>
              <span className={cn(
                "text-[11px] font-medium transition-all duration-200",
                isActive && "text-primary font-semibold",
                item.highlight && !isActive && "text-primary font-semibold"
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
