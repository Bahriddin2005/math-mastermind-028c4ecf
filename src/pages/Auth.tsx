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
import { 
  Loader2, 
  LogIn, 
  UserPlus, 
  Mail, 
  ArrowLeft, 
  Check, 
  Sparkles,
  Brain,
  Target,
  Trophy,
  Lock,
  User
} from 'lucide-react';
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

const features = [
  { icon: Brain, text: "Mental arifmetika mashqlari" },
  { icon: Target, text: "Maqsadga yo'naltirilgan o'rganish" },
  { icon: Trophy, text: "Yutuqlar va mukofotlar" },
];

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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {/* Background decorations */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <Card className="border-border/40 shadow-2xl backdrop-blur-sm animate-scale-in">
            <CardContent className="pt-10 pb-10 text-center">
              <div className="h-20 w-20 rounded-3xl bg-success/10 flex items-center justify-center mx-auto mb-6">
                <Check className="h-10 w-10 text-success" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-3">Email yuborildi!</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Parolni tiklash havolasi <strong className="text-foreground">{email}</strong> emailiga yuborildi. 
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
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground p-12 flex-col justify-between overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-40 left-10 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 right-40 w-40 h-40 bg-accent/30 rounded-full blur-2xl" />
        </div>

        {/* Floating sparkles */}
        <div className="absolute top-32 right-32 opacity-40">
          <Sparkles className="h-8 w-8 animate-pulse" />
        </div>
        <div className="absolute bottom-40 left-20 opacity-30">
          <Sparkles className="h-6 w-6 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        <div className="relative z-10">
          <Logo size="lg" className="mb-4" />
          <p className="text-lg opacity-90">Mental Matematika Platformasi</p>
        </div>

        <div className="relative z-10 space-y-8">
          <h1 className="text-4xl font-display font-bold leading-tight">
            O'yin orqali
            <br />
            <span className="text-accent">matematik salohiyatingizni</span>
            <br />
            rivojlantiring
          </h1>
          
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 opacity-0 animate-slide-up"
                style={{ animationDelay: `${300 + index * 100}ms`, animationFillMode: 'forwards' }}
              >
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <feature.icon className="h-6 w-6" />
                </div>
                <span className="text-lg font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm opacity-70">
          © 2024 IQROMAX. Barcha huquqlar himoyalangan.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-gradient-to-br from-background via-background to-secondary/30">
        {/* Mobile background decorations */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none lg:hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <Logo size="lg" className="mx-auto mb-2" />
            <p className="text-muted-foreground">Mental Matematika mashqlari</p>
          </div>

          <Card className="border-border/40 shadow-2xl backdrop-blur-sm animate-scale-in">
            <CardHeader className="text-center pb-2">
              {mode === 'forgot-password' ? (
                <>
                  <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <Mail className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl font-display">Parolni tiklash</CardTitle>
                  <CardDescription className="mt-2">
                    Email manzilingizni kiriting, parolni tiklash havolasini yuboramiz
                  </CardDescription>
                </>
              ) : (
                <>
                  <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
                    {mode === 'login' ? (
                      <LogIn className="h-8 w-8 text-primary-foreground" />
                    ) : (
                      <UserPlus className="h-8 w-8 text-primary-foreground" />
                    )}
                  </div>
                  <CardTitle className="text-2xl font-display">
                    {mode === 'login' ? 'Xush kelibsiz!' : "Ro'yxatdan o'tish"}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {mode === 'login' 
                      ? "Hisobingizga kiring va davom eting" 
                      : "Bepul akkaunt yarating va boshlang"}
                  </CardDescription>
                </>
              )}
            </CardHeader>
            
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">Ism</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Ismingizni kiriting"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                        className={`pl-10 h-12 ${errors.username ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                    </div>
                    {errors.username && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-destructive" />
                        {errors.username}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className={`pl-10 h-12 ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-destructive" />
                      {errors.email}
                    </p>
                  )}
                </div>
                
                {mode !== 'forgot-password' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium">Parol</Label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => switchMode('forgot-password')}
                          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          Parolni unutdingizmi?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className={`pl-10 h-12 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-destructive" />
                        {errors.password}
                      </p>
                    )}
                  </div>
                )}

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-12 text-base font-semibold gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : mode === 'login' ? (
                    <>
                      <LogIn className="h-5 w-5" />
                      Kirish
                    </>
                  ) : mode === 'signup' ? (
                    <>
                      <UserPlus className="h-5 w-5" />
                      Ro'yxatdan o'tish
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5" />
                      Havola yuborish
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                {mode === 'forgot-password' ? (
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-primary hover:text-primary/80 text-sm font-medium inline-flex items-center gap-2 transition-colors"
                    disabled={loading}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Kirish sahifasiga qaytish
                  </button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {mode === 'login' ? "Akkauntingiz yo'qmi?" : "Akkauntingiz bormi?"}{' '}
                    <button
                      type="button"
                      onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                      className="text-primary hover:text-primary/80 font-semibold transition-colors"
                      disabled={loading}
                    >
                      {mode === 'login' ? "Ro'yxatdan o'ting" : "Kirish"}
                    </button>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Back to home */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Bosh sahifaga qaytish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;