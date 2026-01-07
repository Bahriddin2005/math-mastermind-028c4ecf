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
    { path: '/challenge-stats', icon: BarChart3, label: "Statistika" },
    { path: '/blog', icon: BookOpen, label: "Blog" },
    { path: '/contact', icon: MessageCircle, label: "Aloqa" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full safe-top">
        {/* Glass morphism background with gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/90 to-background/95 backdrop-blur-xl" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        {/* Animated glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-pulse" />
        
        <div className="container relative flex h-16 sm:h-18 items-center justify-between px-3 sm:px-4 md:px-8">
          {/* Logo with animated hover */}
          <Link to="/" className="group relative flex-shrink-0">
            <div className="absolute -inset-3 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500" />
            <div className="relative">
              <Logo size="md" />
            </div>
          </Link>
          
          {/* Center Navigation - Desktop only - Premium glass design */}
          <nav className="hidden lg:flex items-center gap-0.5 bg-gradient-to-r from-card/80 via-card/90 to-card/80 backdrop-blur-md rounded-2xl px-2 py-1.5 border border-border/40 shadow-lg shadow-primary/5">
            {navItems.slice(0, 5).map((item, index) => (
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
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop: Start button for non-logged users */}
            {!user && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => navigate('/auth')}
                className="hidden sm:flex gap-2 h-11 px-5 rounded-xl bg-gradient-to-r from-primary via-primary to-kid-purple hover:opacity-90 shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-[1.02] touch-target"
              >
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-bold">Boshlash</span>
              </Button>
            )}

            {/* Theme toggle - Premium design */}
            {mounted && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label={theme === 'dark' ? "Yorug' rejim" : "Qorong'u rejim"}
                className="h-11 w-11 rounded-xl bg-card/50 backdrop-blur-sm border border-border/30 hover:bg-secondary/80 hover:border-primary/30 transition-all duration-300 hover:scale-[1.05] touch-target"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-warning transition-transform duration-500 hover:rotate-180" />
                ) : (
                  <Moon className="h-5 w-5 transition-transform duration-500 hover:-rotate-45" />
                )}
              </Button>
            )}

            {/* Sound toggle - Desktop only */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onToggleSound}
              aria-label={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
              className="hidden sm:flex h-11 w-11 rounded-xl bg-card/50 backdrop-blur-sm border border-border/30 hover:bg-secondary/80 hover:border-primary/30 transition-all duration-300 hover:scale-[1.05] touch-target"
            >
              {soundEnabled ? (
                <Volume2 className="h-5 w-5 text-kid-green" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>

            {/* User menu - Desktop - Premium glass design */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="hidden sm:flex gap-3 h-12 px-3 pr-4 rounded-2xl bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-md hover:from-primary/10 hover:to-accent/10 border border-border/40 hover:border-primary/40 transition-all duration-300 hover:scale-[1.02] touch-target group"
                  >
                    <div className="relative">
                      <Avatar className="h-9 w-9 border-2 border-primary/40 ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-all group-hover:ring-primary/40">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-kid-purple text-primary-foreground text-sm font-bold">
                          {profile?.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-kid-green rounded-full border-2 border-background" />
                    </div>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-bold max-w-[100px] truncate">
                        {profile?.username || 'Profil'}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Trophy className="h-2.5 w-2.5 text-warning" />
                        {profile?.total_score || 0} ball
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:rotate-180" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-3 bg-card/95 backdrop-blur-xl border-border/30 shadow-2xl shadow-primary/10 rounded-2xl">
                  {/* User info header - Premium design */}
                  <div className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20">
                    <Avatar className="h-12 w-12 border-2 border-primary/40 ring-2 ring-primary/20">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-kid-purple text-primary-foreground text-lg font-bold">
                        {profile?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base truncate">{profile?.username || 'Foydalanuvchi'}</p>
                      <div className="flex items-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5 text-warning" />
                        <span className="text-sm text-muted-foreground font-medium">{profile?.total_score || 0} ball</span>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenuGroup>
                    {navItems.map((item) => (
                      <DropdownMenuItem 
                        key={item.path}
                        onClick={() => navigate(item.path)} 
                        className="gap-3 py-2.5 px-3 rounded-xl cursor-pointer touch-target hover:bg-secondary/80 transition-all duration-200"
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                          item.highlight ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
                        }`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{item.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator className="my-2 bg-border/30" />
                  
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-3 py-2.5 px-3 rounded-xl cursor-pointer touch-target hover:bg-secondary/80 transition-all duration-200">
                    <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium">Sozlamalar</span>
                  </DropdownMenuItem>
                  
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-3 py-2.5 px-3 rounded-xl cursor-pointer touch-target hover:bg-primary/10 transition-all duration-200">
                      <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-primary">Admin panel</span>
                      <Badge variant="secondary" className="ml-auto text-[10px] px-2 py-0.5 bg-primary/15 text-primary font-bold">
                        Admin
                      </Badge>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator className="my-2 bg-border/30" />
                  
                  <DropdownMenuItem onClick={handleSignOut} className="gap-3 py-2.5 px-3 rounded-xl cursor-pointer text-destructive focus:text-destructive touch-target hover:bg-destructive/10 transition-all duration-200">
                    <div className="h-8 w-8 rounded-lg bg-destructive/15 flex items-center justify-center">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Chiqish</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => navigate('/auth')} 
                className="hidden sm:flex h-11 px-5 gap-2 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 hover:bg-secondary/80 hover:border-primary/40 transition-all duration-300 hover:scale-[1.02] touch-target"
              >
                <User className="h-4 w-4" />
                <span className="text-sm font-semibold">Kirish</span>
              </Button>
            )}

            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Menyuni ochish"
              className="flex sm:hidden h-11 w-11 rounded-xl bg-card/50 backdrop-blur-sm border border-border/30 hover:bg-secondary/80 hover:border-primary/30 transition-all duration-300 touch-target"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Premium glass effect */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60] animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel - Premium glass morphism design */}
      <div 
        className={`fixed top-0 right-0 h-full w-[88%] max-w-sm z-[70] transform transition-all duration-500 ease-out flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Glass background */}
        <div className="absolute inset-0 bg-gradient-to-b from-card/95 via-card/90 to-card/95 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-primary/30 via-border/50 to-primary/30" />
        
        {/* Content wrapper */}
        <div className="relative flex flex-col h-full">
          {/* Mobile menu header - Premium design */}
          <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg" />
                <div className="relative">
                  <Logo size="sm" />
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
              className="h-11 w-11 rounded-xl bg-secondary/50 hover:bg-destructive/10 hover:text-destructive transition-all duration-300 touch-target"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* User info in mobile menu - Premium glass card */}
          {user && profile && (
            <div className="flex-shrink-0 p-4">
              <button
                onClick={() => handleNavigation('/settings')}
                className="w-full relative overflow-hidden rounded-2xl group"
              >
                {/* Card background with gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 group-hover:from-primary/20 group-hover:to-primary/20 transition-all duration-300" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-[1px] rounded-2xl border border-primary/20 group-hover:border-primary/40 transition-colors duration-300" />
                
                <div className="relative flex items-center gap-4 p-4">
                  <div className="relative">
                    <Avatar className="h-14 w-14 border-2 border-primary/40 ring-2 ring-primary/20 ring-offset-2 ring-offset-card shadow-xl">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-kid-purple text-primary-foreground text-xl font-bold">
                        {profile.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-kid-green rounded-full border-2 border-card shadow-lg" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-bold text-lg truncate">{profile.username}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-warning/20">
                        <Trophy className="h-3.5 w-3.5 text-warning" />
                        <span className="text-xs font-bold text-warning">{profile.total_score} ball</span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors -rotate-90" />
                </div>
              </button>
            </div>
          )}

          {/* Login/Logout button - Premium design */}
          <div className="flex-shrink-0 px-4 pb-4">
            {user ? (
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                className="w-full h-12 text-sm font-bold rounded-xl shadow-lg shadow-destructive/20 hover:shadow-destructive/40 transition-all duration-300 hover:scale-[1.02]"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Chiqish
              </Button>
            ) : (
              <Button 
                onClick={() => handleNavigation('/auth')}
                className="w-full h-12 text-sm font-bold rounded-xl bg-gradient-to-r from-primary via-kid-purple to-primary bg-[length:200%_100%] animate-shimmer shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-[1.02]"
              >
                <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                Boshlash
              </Button>
            )}
          </div>

          {/* Divider with gradient */}
          <div className="mx-4 h-[1px] bg-gradient-to-r from-transparent via-border/50 to-transparent" />

          {/* Mobile menu navigation - Premium cards */}
          <div ref={navScrollRef} className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-4 space-y-2">
            {navItems.map((item, index) => (
              <button
                key={item.path}
                data-active={isActive(item.path)}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/30 scale-[1.02]'
                    : item.highlight
                      ? 'bg-primary/10 hover:bg-primary/20 text-primary'
                      : 'hover:bg-secondary/80'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive(item.path)
                    ? 'bg-white/20 shadow-inner'
                    : item.highlight
                      ? 'bg-primary/20 group-hover:bg-primary/30 group-hover:scale-110'
                      : 'bg-secondary group-hover:bg-secondary/80 group-hover:scale-110'
                }`}>
                  <item.icon className={`h-5 w-5 transition-transform duration-300 ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'}`} />
                </div>
                <span className="text-base font-bold">{item.label}</span>
                {isActive(item.path) && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </button>
            ))}

            {/* Gradient divider */}
            <div className="h-[1px] bg-gradient-to-r from-transparent via-border/50 to-transparent my-4" />

            {/* Sound toggle - Premium design */}
            <button
              onClick={() => {
                onToggleSound();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-secondary/80 transition-all duration-300 group"
            >
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                soundEnabled ? 'bg-kid-green/20 group-hover:bg-kid-green/30' : 'bg-secondary group-hover:bg-secondary/80'
              } group-hover:scale-110`}>
                {soundEnabled ? (
                  <Volume2 className="h-5 w-5 text-kid-green" />
                ) : (
                  <VolumeX className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <span className="text-base font-bold">
                {soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
              </span>
              <div className={`ml-auto w-10 h-6 rounded-full transition-all duration-300 ${
                soundEnabled ? 'bg-kid-green' : 'bg-muted'
              } flex items-center ${soundEnabled ? 'justify-end' : 'justify-start'} px-1`}>
                <div className="w-4 h-4 bg-white rounded-full shadow-md" />
              </div>
            </button>

            {/* Settings - Premium design */}
            <button
              onClick={() => handleNavigation('/settings')}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-secondary/80 transition-all duration-300 group"
            >
              <div className="h-12 w-12 rounded-xl bg-secondary group-hover:bg-secondary/80 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-90">
                <Settings className="h-5 w-5" />
              </div>
              <span className="text-base font-bold">Sozlamalar</span>
            </button>

            {/* Admin panel - Premium design */}
            {isAdmin && (
              <button
                onClick={() => handleNavigation('/admin')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border border-primary/20 transition-all duration-300 group"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <span className="text-base font-bold text-primary">Admin panel</span>
                <span className="ml-auto px-2 py-1 text-[10px] font-bold bg-primary/20 text-primary rounded-full">ADMIN</span>
              </button>
            )}
          </div>
          
          {/* Bottom branding */}
          <div className="flex-shrink-0 p-4 border-t border-border/30">
            <p className="text-center text-xs text-muted-foreground">
              © 2024 IqroMax. Barcha huquqlar himoyalangan.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

// Desktop navigation button component - Premium design
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
      relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300
      ${active 
        ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]' 
        : highlight 
          ? 'text-primary hover:bg-primary/10 hover:scale-[1.02]' 
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 hover:scale-[1.02]'
      }
    `}
  >
    {active && (
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-primary/90 animate-pulse opacity-20" />
    )}
    <Icon className={`h-4 w-4 ${active ? 'animate-bounce-subtle' : ''}`} />
    <span className="relative">{label}</span>
  </button>
);