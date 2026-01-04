import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, KeyRound, ArrowLeft, Check, Eye, EyeOff, Lock } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z.object({
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Parollar mos kelmaydi',
  path: ['confirmPassword'],
});

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { updatePassword, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user came from password reset email
    if (!user) {
      // User might not be loaded yet, wait a bit
      const timer = setTimeout(() => {
        if (!user) {
          toast.error('Parolni tiklash havolasi yaroqsiz yoki muddati tugagan');
          navigate('/auth');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  const validateForm = () => {
    try {
      passwordSchema.parse({ password, confirmPassword });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast.error(error.message);
      } else {
        setSuccess(true);
        toast.success('Parol muvaffaqiyatli yangilandi!');
        setTimeout(() => navigate('/'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10">
        {/* Background decorations */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-72 sm:w-96 h-72 sm:h-96 bg-success/10 dark:bg-success/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <Card className="w-full max-w-md animate-fade-in border-border/40 dark:border-border/20 shadow-2xl dark:shadow-success/10 bg-card/80 dark:bg-card/90 backdrop-blur-sm relative z-10">
          <CardContent className="pt-8 sm:pt-10 pb-8 sm:pb-10 text-center px-4 sm:px-6">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-success to-emerald-500 flex items-center justify-center mx-auto mb-5 sm:mb-6 shadow-lg shadow-success/30 dark:shadow-success/50 animate-bounce-slow">
              <Check className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold mb-2 sm:mb-3">Parol yangilandi!</h2>
            <p className="text-muted-foreground dark:text-muted-foreground/80 text-sm sm:text-base">Bosh sahifaga yo'naltirilmoqdasiz...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10">
      {/* Background decorations - Dark Mode optimized */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-72 sm:w-96 h-72 sm:h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      {/* Subtle grid pattern - Dark mode enhanced */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="w-full max-w-md space-y-6 sm:space-y-8 relative z-10 px-1 sm:px-0">
        <div className="text-center">
          <Logo size="lg" className="mx-auto" />
          <p className="text-muted-foreground text-xs sm:text-sm mt-2">Mental Matematika Platformasi</p>
        </div>

        <Card className="animate-fade-in border-border/40 dark:border-border/20 shadow-2xl dark:shadow-primary/10 bg-card/80 dark:bg-card/90 backdrop-blur-sm overflow-hidden">
          {/* Card top decoration */}
          <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
          
          <CardHeader className="text-center pt-6 sm:pt-8 px-4 sm:px-6">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-primary/30 dark:shadow-primary/50">
              <KeyRound className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-display">Yangi parol</CardTitle>
            <CardDescription className="text-sm mt-1.5">
              Yangi parolingizni kiriting
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="password" className="text-xs sm:text-sm font-medium">Yangi parol</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className={`pl-10 pr-10 h-11 sm:h-12 transition-all focus:shadow-md focus:shadow-primary/10 bg-background dark:bg-card/50 border-border/50 dark:border-border/30 text-sm sm:text-base ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs sm:text-sm text-destructive flex items-center gap-1.5 animate-shake">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-medium">Parolni tasdiqlang</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className={`pl-10 pr-10 h-11 sm:h-12 transition-all focus:shadow-md focus:shadow-primary/10 bg-background dark:bg-card/50 border-border/50 dark:border-border/30 text-sm sm:text-base ${errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs sm:text-sm text-destructive flex items-center gap-1.5 animate-shake">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                variant="game" 
                size="lg" 
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold rounded-xl shadow-lg shadow-primary/20 dark:shadow-primary/30 hover:shadow-xl hover:shadow-primary/30 dark:hover:shadow-primary/40 transition-all group mt-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                    Parolni yangilash
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="text-primary hover:text-primary/80 text-sm inline-flex items-center gap-1.5 transition-colors hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Kirish sahifasiga qaytish
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
