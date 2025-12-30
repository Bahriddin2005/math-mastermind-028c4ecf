import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Volume2, VolumeX, User, LogOut, Play, Home, Settings, Moon, Sun, ShieldCheck, GraduationCap, Sparkles, ChevronDown, Trophy, BookOpen } from 'lucide-react';
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
  DropdownMenuGroup,
  DropdownMenuLabel,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';

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
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null; total_score: number } | null>(null);
  
  const isTrainPage = location.pathname === '/train';
  const isHomePage = location.pathname === '/';

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

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url, total_score')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setProfile(data);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/70 backdrop-blur-xl">
      {/* Gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-8">
        {/* Logo with hover effect */}
        <Link to="/" className="group relative">
          <div className="absolute -inset-2 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Logo size="md" />
        </Link>
        
        {/* Center Navigation - Desktop only */}
        <nav className="hidden lg:flex items-center gap-1 bg-secondary/50 rounded-full px-1.5 py-1 border border-border/30">
          <NavButton 
            active={isHomePage} 
            onClick={() => navigate('/')}
            icon={Home}
            label="Bosh sahifa"
          />
          <NavButton 
            active={location.pathname === '/train'} 
            onClick={() => navigate('/train')}
            icon={Play}
            label="Mashq"
            highlight
          />
          <NavButton 
            active={location.pathname === '/courses'} 
            onClick={() => navigate('/courses')}
            icon={GraduationCap}
            label="Darslar"
          />
          <NavButton 
            active={location.pathname === '/weekly-game'} 
            onClick={() => navigate('/weekly-game')}
            icon={Trophy}
            label="Musobaqa"
          />
        </nav>
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Navigation Buttons */}
          {user && (
            <div className="flex lg:hidden items-center gap-1">
              {isTrainPage ? (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/')}
                  className="h-9 w-9 p-0"
                >
                  <Home className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => navigate('/train')}
                  className="gap-1.5 h-9 px-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-glow"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline text-xs font-semibold">Mashq</span>
                </Button>
              )}
            </div>
          )}

          {/* Desktop: Train button for non-logged users */}
          {!user && (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => navigate('/auth')}
              className="hidden sm:flex gap-2 h-9 px-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-glow"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">Boshlash</span>
            </Button>
          )}

          {/* Theme toggle */}
          {mounted && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? "Yorug' rejim" : "Qorong'u rejim"}
              className="h-9 w-9 rounded-full hover:bg-secondary/80 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-warning transition-transform hover:rotate-45" />
              ) : (
                <Moon className="h-4 w-4 transition-transform hover:-rotate-12" />
              )}
            </Button>
          )}

          {/* Sound toggle */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onToggleSound}
            aria-label={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
            className="h-9 w-9 rounded-full hover:bg-secondary/80 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="gap-2 h-10 px-2 pr-3 rounded-full bg-secondary/50 hover:bg-secondary/80 border border-border/30 transition-all"
                >
                  <Avatar className="h-7 w-7 border-2 border-primary/30">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {profile?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium max-w-[80px] truncate">
                    {profile?.username || 'Profil'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2">
                {/* User info header */}
                <div className="flex items-center gap-3 p-2 mb-2 rounded-lg bg-secondary/50">
                  <Avatar className="h-10 w-10 border-2 border-primary/30">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {profile?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{profile?.username || 'Foydalanuvchi'}</p>
                    <div className="flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-warning" />
                      <span className="text-xs text-muted-foreground">{profile?.total_score || 0} ball</span>
                    </div>
                  </div>
                </div>
                
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate('/')} className="gap-3 py-2.5 rounded-lg cursor-pointer">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span>Bosh sahifa</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/train')} className="gap-3 py-2.5 rounded-lg cursor-pointer">
                    <Play className="h-4 w-4 text-muted-foreground" />
                    <span>Mashq qilish</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/courses')} className="gap-3 py-2.5 rounded-lg cursor-pointer">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>Video darslar</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/weekly-game')} className="gap-3 py-2.5 rounded-lg cursor-pointer">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span>Haftalik musobaqa</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator className="my-2" />
                
                <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-3 py-2.5 rounded-lg cursor-pointer">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Sozlamalar</span>
                </DropdownMenuItem>
                
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-3 py-2.5 rounded-lg cursor-pointer">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-primary font-medium">Admin panel</span>
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary">
                      Admin
                    </Badge>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator className="my-2" />
                
                <DropdownMenuItem onClick={handleSignOut} className="gap-3 py-2.5 rounded-lg cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  <span>Chiqish</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => navigate('/auth')} 
              className="h-9 px-3 gap-2 rounded-full border border-border/30"
            >
              <User className="h-4 w-4" />
              <span className="hidden xs:inline text-sm">Kirish</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

// Desktop navigation button component
const NavButton = ({ 
  active, 
  onClick, 
  icon: Icon, 
  label, 
  highlight 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ElementType; 
  label: string;
  highlight?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
      ${active 
        ? 'bg-primary text-primary-foreground shadow-md' 
        : highlight 
          ? 'text-primary hover:bg-primary/10' 
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
      }
    `}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
  </button>
);
