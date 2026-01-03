import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Volume2, VolumeX, User, LogOut, Play, Home, Settings, Moon, Sun, ShieldCheck, GraduationCap, Sparkles, ChevronDown, Trophy, Menu, X, BookOpen, Calendar, MessageCircle } from 'lucide-react';
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
    { path: '/', icon: Home, label: "Bosh sahifa" },
    { path: '/train', icon: Play, label: "Mashq", highlight: true },
    { path: '/courses', icon: GraduationCap, label: "Darslar" },
    { path: '/weekly-game', icon: Trophy, label: "Musobaqa" },
    { path: '/blog', icon: BookOpen, label: "Blog" },
    { path: '/contact', icon: MessageCircle, label: "Aloqa" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/30 dark:border-border/20 bg-background/80 dark:bg-background/90 backdrop-blur-xl safe-top">
        {/* Gradient line at top - Enhanced for dark mode */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 dark:via-primary/70 to-transparent" />
        
        <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-8">
          {/* Logo with hover effect */}
          <Link to="/" className="group relative flex-shrink-0">
            <div className="absolute -inset-2 rounded-xl bg-primary/5 dark:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Logo size="md" />
          </Link>
          
          {/* Center Navigation - Desktop only - Enhanced dark mode */}
          <nav className="hidden lg:flex items-center gap-1 bg-secondary/50 dark:bg-secondary/30 rounded-full px-1.5 py-1 border border-border/30 dark:border-border/20 shadow-sm dark:shadow-lg dark:shadow-primary/5">
            {navItems.slice(0, 4).map((item) => (
              <NavButton 
                key={item.path}
                active={isActive(item.path)} 
                onClick={() => navigate(item.path)}
                icon={item.icon}
                label={item.label}
                highlight={item.highlight}
              />
            ))}
          </nav>
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop: Train button for non-logged users - Enhanced dark mode */}
            {!user && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => navigate('/auth')}
                className="hidden sm:flex gap-2 h-10 px-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-glow dark:shadow-lg dark:shadow-primary/30 touch-target"
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-semibold">Boshlash</span>
              </Button>
            )}

            {/* Theme toggle - Enhanced dark mode */}
            {mounted && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label={theme === 'dark' ? "Yorug' rejim" : "Qorong'u rejim"}
                className="h-10 w-10 rounded-full hover:bg-secondary/80 dark:hover:bg-secondary/60 transition-colors touch-target"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-warning transition-transform hover:rotate-45" />
                ) : (
                  <Moon className="h-5 w-5 transition-transform hover:-rotate-12" />
                )}
              </Button>
            )}

            {/* Sound toggle - Desktop only */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onToggleSound}
              aria-label={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
              className="hidden sm:flex h-10 w-10 rounded-full hover:bg-secondary/80 dark:hover:bg-secondary/60 transition-colors touch-target"
            >
              {soundEnabled ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>

            {/* User menu - Desktop - Enhanced dark mode */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="hidden sm:flex gap-2 h-11 px-2 pr-3 rounded-full bg-secondary/50 dark:bg-secondary/30 hover:bg-secondary/80 dark:hover:bg-secondary/50 border border-border/30 dark:border-border/20 transition-all touch-target"
                  >
                    <Avatar className="h-8 w-8 border-2 border-primary/30 dark:border-primary/40">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-primary text-sm font-bold">
                        {profile?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm font-medium max-w-[100px] truncate">
                      {profile?.username || 'Profil'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 p-2 bg-card dark:bg-card/95 border-border/40 dark:border-border/20 shadow-xl dark:shadow-2xl dark:shadow-primary/10">
                  {/* User info header - Dark mode enhanced */}
                  <div className="flex items-center gap-3 p-3 mb-2 rounded-xl bg-secondary/50 dark:bg-secondary/30 border border-border/20">
                    <Avatar className="h-12 w-12 border-2 border-primary/30 dark:border-primary/40">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-primary text-lg font-bold">
                        {profile?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base truncate">{profile?.username || 'Foydalanuvchi'}</p>
                      <div className="flex items-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5 text-warning" />
                        <span className="text-sm text-muted-foreground">{profile?.total_score || 0} ball</span>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenuGroup>
                    {navItems.map((item) => (
                      <DropdownMenuItem 
                        key={item.path}
                        onClick={() => navigate(item.path)} 
                        className="gap-3 py-3 rounded-xl cursor-pointer touch-target hover:bg-secondary dark:hover:bg-secondary/60"
                      >
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-base">{item.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator className="my-2 bg-border/50 dark:bg-border/30" />
                  
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-3 py-3 rounded-xl cursor-pointer touch-target hover:bg-secondary dark:hover:bg-secondary/60">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <span className="text-base">Sozlamalar</span>
                  </DropdownMenuItem>
                  
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-3 py-3 rounded-xl cursor-pointer touch-target hover:bg-primary/10 dark:hover:bg-primary/20">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <span className="text-base text-primary font-medium">Admin panel</span>
                      <Badge variant="secondary" className="ml-auto text-xs px-2 py-0.5 bg-primary/10 dark:bg-primary/20 text-primary">
                        Admin
                      </Badge>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator className="my-2 bg-border/50 dark:bg-border/30" />
                  
                  <DropdownMenuItem onClick={handleSignOut} className="gap-3 py-3 rounded-xl cursor-pointer text-destructive focus:text-destructive touch-target hover:bg-destructive/10 dark:hover:bg-destructive/20">
                    <LogOut className="h-5 w-5" />
                    <span className="text-base">Chiqish</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => navigate('/auth')} 
                className="hidden sm:flex h-10 px-4 gap-2 rounded-full border border-border/30 dark:border-border/20 dark:bg-secondary/50 dark:hover:bg-secondary/70 touch-target"
              >
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">Kirish</span>
              </Button>
            )}

            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Menyuni ochish"
              className="flex sm:hidden h-10 w-10 rounded-full hover:bg-secondary/80 dark:hover:bg-secondary/60 transition-colors touch-target"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Enhanced for dark mode */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 dark:bg-background/90 backdrop-blur-md z-[60] animate-fade-in-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel - Enhanced dark mode */}
      <div 
        className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-card dark:bg-card/95 border-l border-border dark:border-border/30 z-[70] shadow-2xl dark:shadow-primary/10 transform transition-transform duration-300 ease-out flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Mobile menu header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border/50 dark:border-border/30">
          <Logo size="sm" />
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
            className="h-10 w-10 rounded-full touch-target hover:bg-secondary/80 dark:hover:bg-secondary/60"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* User info in mobile menu - Enhanced dark mode */}
        {user && profile && (
          <div className="flex-shrink-0 p-3 border-b border-border/50 dark:border-border/30">
            <button
              onClick={() => handleNavigation('/settings')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 border border-primary/20 dark:border-primary/30 hover:from-primary/15 hover:to-accent/15 dark:hover:from-primary/25 dark:hover:to-accent/25 transition-all duration-200"
            >
              <Avatar className="h-12 w-12 border-2 border-primary/30 dark:border-primary/40 shadow-lg dark:shadow-primary/20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 dark:bg-primary/30 text-primary text-lg font-bold">
                  {profile.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-bold text-base truncate">{profile.username}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Trophy className="h-3.5 w-3.5 text-warning" />
                  <span className="text-xs font-medium text-muted-foreground">{profile.total_score} ball</span>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Logout/Login button at top - Enhanced dark mode */}
        <div className="flex-shrink-0 px-2 py-1.5 border-b border-border/50 dark:border-border/30">
          {user ? (
            <Button 
              variant="destructive" 
              onClick={handleSignOut}
              className="w-full h-9 text-sm font-medium rounded-md shadow-sm dark:shadow-destructive/20"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Chiqish
            </Button>
          ) : (
            <Button 
              onClick={() => handleNavigation('/auth')}
              className="w-full h-9 text-sm font-medium rounded-md gradient-primary shadow-lg shadow-primary/20 dark:shadow-primary/40"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Boshlash
            </Button>
          )}
        </div>

        {/* Mobile menu navigation - Enhanced dark mode */}
        <div ref={navScrollRef} className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-3 space-y-1">
          {navItems.map((item, index) => (
            <button
              key={item.path}
              data-active={isActive(item.path)}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-primary text-primary-foreground shadow-md dark:shadow-lg dark:shadow-primary/30'
                  : item.highlight
                    ? 'bg-primary/10 dark:bg-primary/20 text-primary hover:bg-primary/20 dark:hover:bg-primary/30'
                    : 'hover:bg-secondary/80 dark:hover:bg-secondary/60'
              }`}
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                isActive(item.path)
                  ? 'bg-primary-foreground/20'
                  : item.highlight
                    ? 'bg-primary/20 dark:bg-primary/30'
                    : 'bg-secondary dark:bg-secondary/60'
              }`}>
                <item.icon className="h-5 w-5" />
              </div>
              <span className="text-base font-semibold">{item.label}</span>
            </button>
          ))}

          <div className="h-px bg-border/50 dark:bg-border/30 my-3" />

          <button
            onClick={() => {
              onToggleSound();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/80 dark:hover:bg-secondary/60 transition-all duration-200"
          >
            <div className="h-10 w-10 rounded-lg bg-secondary dark:bg-secondary/60 flex items-center justify-center">
              {soundEnabled ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <span className="text-base font-semibold">
              {soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
            </span>
          </button>

          <button
            onClick={() => handleNavigation('/settings')}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/80 dark:hover:bg-secondary/60 transition-all duration-200"
          >
            <div className="h-10 w-10 rounded-lg bg-secondary dark:bg-secondary/60 flex items-center justify-center">
              <Settings className="h-5 w-5" />
            </div>
            <span className="text-base font-semibold">Sozlamalar</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => handleNavigation('/admin')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-all duration-200"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <span className="text-base font-semibold text-primary">Admin panel</span>
            </button>
          )}
        </div>

      </div>
    </>
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
      flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200
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