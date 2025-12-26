import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, UserPlus } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Noto\'g\'ri email format'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
});

const signupSchema = loginSchema.extend({
  username: z.string().min(2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak'),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateForm = () => {
    try {
      if (isLogin) {
        loginSchema.parse({ email, password });
      } else {
        signupSchema.parse({ email, password, username });
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
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Xatolik',
            description: error.message === 'Invalid login credentials' 
              ? 'Email yoki parol noto\'g\'ri' 
              : error.message,
          });
        } else {
          toast({
            title: 'Muvaffaqiyat!',
            description: 'Tizimga kirdingiz',
          });
        }
      } else {
        const { error } = await signUp(email, password, username);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              variant: 'destructive',
              title: 'Xatolik',
              description: 'Bu email allaqachon ro\'yxatdan o\'tgan',
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Xatolik',
              description: error.message,
            });
          }
        } else {
          toast({
            title: 'Muvaffaqiyat!',
            description: 'Akkaunt yaratildi. Tizimga kiring.',
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

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
            <CardTitle className="text-2xl font-display">
              {isLogin ? 'Kirish' : 'Ro\'yxatdan o\'tish'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
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
              
              <div className="space-y-2">
                <Label htmlFor="password">Parol</Label>
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

              <Button 
                type="submit" 
                variant="game" 
                size="lg" 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isLogin ? (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Kirish
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Ro'yxatdan o'tish
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-primary hover:underline text-sm"
                disabled={loading}
              >
                {isLogin 
                  ? "Akkauntingiz yo'qmi? Ro'yxatdan o'ting" 
                  : "Akkauntingiz bormi? Kirish"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
