import { Link, useNavigate } from 'react-router-dom';
import { Volume2, VolumeX, User, LogOut, BarChart3 } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/useAuth';
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        <Link to="/">
          <Logo size="md" />
        </Link>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="icon" 
            size="icon"
            onClick={onToggleSound}
            aria-label={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
          >
            {soundEnabled ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profil</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/dashboard')} className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive">
                  <LogOut className="h-4 w-4" />
                  Chiqish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => navigate('/auth')}>
              <User className="h-4 w-4 mr-2" />
              Kirish
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
