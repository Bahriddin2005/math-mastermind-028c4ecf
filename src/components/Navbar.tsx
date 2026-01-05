import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Volume2, VolumeX, User, LogOut, Play, Home, Settings, Moon, Sun, ShieldCheck, Sparkles, ChevronDown, Menu, X, Map, Users } from 'lucide-react';
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
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

  // Game-first navigation items only
  const navItems = [
    { path: '/', icon: Home, label: "Uy" },
    { path: '/game-hub', icon: Map, label: "Xarita" },
    { path: '/mental-arithmetic', icon: Play, label: "O'ynash", highlight: true },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl safe-top">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-8 max-w-[1920px] mx-auto">
          {/* Logo */}
          <Link to="/" className="group relative flex-shrink-0">
            <div className="absolute -inset-2 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Logo size="md" />
          </Link>
          
          {/* Center Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-secondary/50 rounded-full px-1.5 py-1 border border-border/30">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive(item.path)
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : item.highlight
                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                    : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Guest CTA */}
            {!user && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => navigate('/auth')}
                className="hidden sm:flex gap-2 h-10 px-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-semibold">Boshlash</span>
              </Button>
            )}

            {/* Theme toggle */}
            {mounted && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-10 w-10 rounded-full hover:bg-secondary/80 transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-warning" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            )}

            {/* Sound toggle - Desktop */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onToggleSound}
              className="hidden sm:flex h-10 w-10 rounded-full hover:bg-secondary/80 transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>

            {/* User menu - Desktop */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="hidden sm:flex gap-2 h-11 px-2 pr-3 rounded-full bg-secondary/50 hover:bg-secondary/80 border border-border/30 transition-all"
                  >
                    <Avatar className="h-8 w-8 border-2 border-primary/30">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {profile?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm font-medium max-w-[100px] truncate">
                      {profile?.username || 'Profil'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 p-2">
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-3 py-3 rounded-xl cursor-pointer">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <span>Sozlamalar</span>
                  </DropdownMenuItem>
                  
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-3 py-3 rounded-xl cursor-pointer text-primary">
                      <ShieldCheck className="h-5 w-5" />
                      <span>Admin</span>
                      <Badge variant="secondary" className="ml-auto text-xs">Admin</Badge>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator className="my-2" />
                  
                  <DropdownMenuItem onClick={handleSignOut} className="gap-3 py-3 rounded-xl cursor-pointer text-destructive">
                    <LogOut className="h-5 w-5" />
                    <span>Chiqish</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => navigate('/auth')} 
                className="hidden sm:flex h-10 px-4 gap-2 rounded-full border border-border/30"
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
              className="flex sm:hidden h-10 w-10 rounded-full hover:bg-secondary/80 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-md z-[60] animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-card border-l border-border z-[70] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border/50">
          <Logo size="sm" />
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
            className="h-10 w-10 rounded-full"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* User info */}
        {user && profile && (
          <div className="flex-shrink-0 p-3 border-b border-border/50">
            <button
              onClick={() => handleNavigation('/settings')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 hover:from-primary/15 hover:to-accent/15 transition-all"
            >
              <Avatar className="h-12 w-12 border-2 border-primary/30 shadow-lg">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                  {profile.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-bold text-base truncate">{profile.username}</p>
                <p className="text-xs text-muted-foreground">{profile.total_score} ball</p>
              </div>
            </button>
          </div>
        )}

        {/* Navigation */}
        <div ref={navScrollRef} className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : item.highlight
                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                  : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-base font-medium">{item.label}</span>
            </button>
          ))}
          
          <div className="border-t border-border/50 my-4" />
          
          <button
            onClick={() => handleNavigation('/settings')}
            className="w-full flex items-center gap-3 p-4 rounded-2xl text-muted-foreground hover:bg-secondary transition-all"
          >
            <Users className="h-6 w-6" />
            <span className="text-base font-medium">Ota-ona</span>
          </button>
          
          {isAdmin && (
            <button
              onClick={() => handleNavigation('/admin')}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-primary bg-primary/10 hover:bg-primary/20 transition-all"
            >
              <ShieldCheck className="h-6 w-6" />
              <span className="text-base font-medium">Admin</span>
            </button>
          )}
        </div>

        {/* Bottom actions */}
        <div className="flex-shrink-0 p-3 border-t border-border/50">
          {user ? (
            <Button 
              variant="destructive" 
              onClick={handleSignOut}
              className="w-full h-12 text-base font-medium rounded-xl"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Chiqish
            </Button>
          ) : (
            <Button 
              onClick={() => handleNavigation('/auth')}
              className="w-full h-12 text-base font-medium rounded-xl bg-gradient-to-r from-primary to-primary/90"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Boshlash
            </Button>
          )}
        </div>
      </div>
    </>
  );
};
