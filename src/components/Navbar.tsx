import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Volume2, VolumeX, User, LogOut, Play, Home, Settings, Moon, Sun, ShieldCheck, GraduationCap, Sparkles, ChevronDown, Trophy, Menu, X, BookOpen, Calendar, MessageCircle, BarChart3 } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { XPLevelBar } from './XPLevelBar';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navScrollRef = useRef<HTMLDivElement>(null);
  
  const isTrainPage = location.pathname === '/train';
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open and auto-scroll to active item
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      
      // Auto-scroll to active navigation item
      setTimeout(() => {
        const activeButton = navScrollRef.current?.querySelector('[data-active="true"]');
        if (activeButton) {
          activeButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

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
    setMobileMenuOpen(false);
    navigate('/');
  };

  const handleNavigation = useCallback((path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  }, [navigate]);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: "Bosh sahifa", emoji: "🏠" },
    { path: '/mental-arithmetic', icon: Play, label: "Mashq", highlight: true, emoji: "🎮" },
    { path: '/kids-courses', icon: GraduationCap, label: "Darslar", emoji: "📚" },
    { path: '/weekly-game', icon: Trophy, label: "Musobaqa", emoji: "🏆" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full safe-top">
        {/* Clean glass background */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-lg" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-border/50" />
        
        <div className="container relative flex h-14 items-center justify-between px-3 sm:px-4 lg:px-6">
          {/* Logo - Compact */}
          <Link to="/" className="flex-shrink-0 hover:opacity-80 transition-opacity">
            <Logo size="sm" />
          </Link>
          
          {/* Center Navigation - Desktop - Clean pill design */}
          <nav className="hidden lg:flex items-center gap-1 bg-secondary/60 backdrop-blur-sm rounded-full px-1.5 py-1 border border-border/30">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                  ${isActive(item.path) 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }
                `}
              >
                <item.icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Compact XP Bar - Desktop only */}
            {user && (
              <div className="hidden md:flex items-center gap-2 bg-secondary/60 rounded-full px-3 py-1.5 border border-border/30">
                <XPLevelBar compact />
              </div>
            )}

            {/* Theme toggle - Compact */}
            {mounted && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label={theme === 'dark' ? "Yorug' rejim" : "Qorong'u rejim"}
                className="h-9 w-9 rounded-full hover:bg-secondary/80 transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-warning" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Sound toggle - Desktop only */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onToggleSound}
              aria-label={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
              className="hidden sm:flex h-9 w-9 rounded-full hover:bg-secondary/80 transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-primary" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>

            {/* User menu - Compact design */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="hidden sm:flex items-center gap-2 h-9 px-2 pr-3 rounded-full hover:bg-secondary/80 transition-colors"
                  >
                    <Avatar className="h-7 w-7 border border-primary/30">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                        {profile?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm font-medium max-w-[80px] truncate">
                      {profile?.username || 'Profil'}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 bg-card/98 backdrop-blur-xl border-border/50 shadow-xl rounded-xl">
                  {/* User info header */}
                  <div className="flex items-center gap-3 p-2 mb-2 rounded-lg bg-secondary/50">
                    <Avatar className="h-10 w-10 border border-primary/30">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {profile?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{profile?.username || 'Foydalanuvchi'}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-warning" />
                        {profile?.total_score || 0} ball
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenuGroup>
                    {navItems.map((item) => (
                      <DropdownMenuItem 
                        key={item.path}
                        onClick={() => navigate(item.path)} 
                        className="gap-2.5 py-2 px-2.5 rounded-lg cursor-pointer"
                      >
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{item.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator className="my-1.5" />
                  
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-2.5 py-2 px-2.5 rounded-lg cursor-pointer">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Sozlamalar</span>
                  </DropdownMenuItem>
                  
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-2.5 py-2 px-2.5 rounded-lg cursor-pointer text-primary">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-sm font-medium">Admin panel</span>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator className="my-1.5" />
                  
                  <DropdownMenuItem onClick={handleSignOut} className="gap-2.5 py-2 px-2.5 rounded-lg cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Chiqish</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                size="sm" 
                onClick={() => navigate('/auth')} 
                className="hidden sm:flex h-9 px-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Boshlash
              </Button>
            )}

            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Menyuni ochish"
              className="flex md:hidden h-9 w-9 rounded-full hover:bg-secondary/80 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel - Clean slide design */}
      <div 
        className={`fixed top-0 right-0 h-full w-[85%] max-w-xs z-[70] bg-card shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <Logo size="sm" />
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
            className="h-9 w-9 rounded-full hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User info */}
        {user && profile && (
          <div className="p-4 border-b border-border/50">
            <button
              onClick={() => handleNavigation('/settings')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <Avatar className="h-11 w-11 border-2 border-primary/30">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                  {profile.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="font-semibold truncate">{profile.username}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-warning" />
                  {profile.total_score} ball
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground -rotate-90" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <div ref={navScrollRef} className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              data-active={isActive(item.path)}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary'
              }`}
            >
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                isActive(item.path) ? 'bg-white/20' : 'bg-secondary'
              }`}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className="font-medium">{item.label}</span>
              {isActive(item.path) && (
                <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </button>
          ))}

          <div className="h-px bg-border/50 my-3" />

          {/* Sound toggle */}
          <button
            onClick={() => {
              onToggleSound();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors"
          >
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
              soundEnabled ? 'bg-primary/15' : 'bg-secondary'
            }`}>
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-primary" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <span className="font-medium flex-1 text-left">
              {soundEnabled ? "Ovoz yoqilgan" : "Ovoz o'chirilgan"}
            </span>
            <div className={`w-9 h-5 rounded-full transition-colors ${
              soundEnabled ? 'bg-primary' : 'bg-muted'
            } flex items-center ${soundEnabled ? 'justify-end' : 'justify-start'} px-0.5`}>
              <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </button>

          {/* Settings */}
          <button
            onClick={() => handleNavigation('/settings')}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
              <Settings className="h-4 w-4" />
            </div>
            <span className="font-medium">Sozlamalar</span>
          </button>

          {/* Admin panel */}
          {isAdmin && (
            <button
              onClick={() => handleNavigation('/admin')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary transition-colors"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="font-medium">Admin panel</span>
            </button>
          )}
        </div>

        {/* Bottom action */}
        <div className="p-4 border-t border-border/50">
          {user ? (
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="w-full h-11 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Chiqish
            </Button>
          ) : (
            <Button 
              onClick={() => handleNavigation('/auth')}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Boshlash
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

// Clean navigation button for desktop
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
      flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
      ${active 
        ? 'bg-primary text-primary-foreground shadow-sm' 
        : highlight 
          ? 'text-primary hover:bg-primary/10' 
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
      }
    `}
  >
    <Icon className="h-3.5 w-3.5" />
    <span>{label}</span>
  </button>
);