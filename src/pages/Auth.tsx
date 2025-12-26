import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { Loader2, LogIn, UserPlus, Mail, ArrowLeft, Check } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email("Noto'g'ri email format"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
});

const signupSchema = loginSchema.extend({
  username: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
});

const emailSchema = z.object({
  email: z.string().email("Noto'g'ri email format"),
});

type AuthMode = 'login' | 'signup' | 'forgot-password';

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const { toast: toastHook } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateForm = () => {
    try {
      if (mode === 'login') {
        loginSchema.parse({ email, password });
      } else if (mode === 'signup') {
        signupSchema.parse({ email, password, username });
      } else {
        emailSchema.parse({ email });
      }
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
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toastHook({
            variant: 'destructive',
            title: 'Xatolik',
            description: error.message === 'Invalid login credentials' 
              ? "Email yoki parol noto'g'ri" 
              : error.message,
          });
        } else {
          toastHook({
            title: 'Muvaffaqiyat!',
            description: 'Tizimga kirdingiz',
          });
        }
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password, username);
        if (error) {
          if (error.message.includes('already registered')) {
            toastHook({
              variant: 'destructive',
              title: 'Xatolik',
              description: "Bu email allaqachon ro'yxatdan o'tgan",
            });
          } else {
            toastHook({
              variant: 'destructive',
              title: 'Xatolik',
              description: error.message,
            });
          }
        } else {
          toastHook({
            title: 'Muvaffaqiyat!',
            description: 'Akkaunt yaratildi. Tizimga kiring.',
          });
        }
      } else if (mode === 'forgot-password') {
        const { error } = await resetPassword(email);
        if (error) {
          toastHook({
            variant: 'destructive',
            title: 'Xatolik',
            description: error.message,
          });
        } else {
          setResetEmailSent(true);
          toast.success('Parolni tiklash havolasi emailingizga yuborildi');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setResetEmailSent(false);
  };

  // Reset email sent success state
  if (resetEmailSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Logo size="lg" className="mx-auto" />
          </div>

          <Card className="animate-fade-in">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">Email yuborildi!</h2>
              <p className="text-muted-foreground mb-6">
                Parolni tiklash havolasi <strong>{email}</strong> emailiga yuborildi. 
                Spam papkasini ham tekshiring.
              </p>
              <Button 
                variant="outline" 
                onClick={() => switchMode('login')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kirish sahifasiga qaytish
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Logo size="lg" className="mx-auto" />
          <p className="mt-4 text-muted-foreground">
            Mental Matematika mashqlari
          </p>
        </div>

        <Card className="animate-fade-in">
          <CardHeader className="text-center">
            {mode === 'forgot-password' ? (
              <>
                <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-2">
                  <Mail className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl font-display">Parolni tiklash</CardTitle>
                <CardDescription>
                  Email manzilingizni kiriting, parolni tiklash havolasini yuboramiz
                </CardDescription>
              </>
            ) : (
              <CardTitle className="text-2xl font-display">
                {mode === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}
              </CardTitle>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="username">Ism</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Ismingizni kiriting"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className={errors.username ? 'border-destructive' : ''}
                  />
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username}</p>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              
              {mode !== 'forgot-password' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Parol</Label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot-password')}
                        className="text-xs text-primary hover:underline"
                      >
                        Parolni unutdingizmi?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className={errors.password ? 'border-destructive' : ''}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
              )}

              <Button 
                type="submit" 
                variant="game" 
                size="lg" 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Kirish
                  </>
                ) : mode === 'signup' ? (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Ro'yxatdan o'tish
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5 mr-2" />
                    Havola yuborish
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              {mode === 'forgot-password' ? (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-primary hover:underline text-sm inline-flex items-center gap-1"
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kirish sahifasiga qaytish
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-primary hover:underline text-sm"
                  disabled={loading}
                >
                  {mode === 'login' 
                    ? "Akkauntingiz yo'qmi? Ro'yxatdan o'ting" 
                    : "Akkauntingiz bormi? Kirish"}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
