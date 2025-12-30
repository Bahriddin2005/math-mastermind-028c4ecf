import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Volume2, VolumeX, User, LogOut, Play, Home, Settings, Moon, Sun, ShieldCheck, GraduationCap } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface NavbarProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Navbar = ({ soundEnabled, onToggleSound }: NavbarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const isTrainPage = location.pathname === '/train';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-8">
        <Link to="/">
          <Logo size="md" />
        </Link>
        
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          {/* Video darslar button - only for logged in users */}
          {user && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/courses')}
              className="gap-2 hidden md:flex"
            >
              <GraduationCap className="h-4 w-4" />
              <span>Darslar</span>
            </Button>
          )}

          {/* Navigation buttons - only for logged in users */}
          {user && (
            isTrainPage ? (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/')}
                className="gap-1.5 sm:gap-2 h-9 sm:h-10 px-2 sm:px-3"
              >
                <Home className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Bosh sahifa</span>
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => navigate('/train')}
                className="gap-1.5 sm:gap-2 h-9 sm:h-10 px-2 sm:px-3"
              >
                <Play className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Mashq</span>
              </Button>
            )
          )}

          {/* Theme toggle */}
          {mounted && (
            <Button 
              variant="icon" 
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? "Yorug' rejim" : "Qorong'u rejim"}
              className="h-9 w-9 sm:h-10 sm:w-10"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
              ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          )}

          {/* Sound toggle */}
          <Button 
            variant="icon" 
            size="icon"
            onClick={onToggleSound}
            aria-label={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
            className="h-9 w-9 sm:h-10 sm:w-10"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <VolumeX className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            )}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="gap-1.5 sm:gap-2 h-9 sm:h-10 px-2 sm:px-3">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profil</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/')} className="gap-2">
                  <Home className="h-4 w-4" />
                  Bosh sahifa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/train')} className="gap-2">
                  <Play className="h-4 w-4" />
                  Mashq qilish
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/courses')} className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Video darslar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-2">
                  <Settings className="h-4 w-4" />
                  Sozlamalar
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-2 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    Admin panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive">
                  <LogOut className="h-4 w-4" />
                  Chiqish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => navigate('/auth')} className="h-9 sm:h-10 px-2 sm:px-3 gap-1.5 sm:gap-2">
              <User className="h-4 w-4" />
              <span className="hidden xs:inline">Kirish</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
