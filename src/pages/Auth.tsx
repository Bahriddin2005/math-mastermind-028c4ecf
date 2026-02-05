import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMFA } from '@/hooks/useMFA';
import { Logo } from '@/components/Logo';
import { TwoFactorVerify } from '@/components/TwoFactorVerify';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { supabase } from '@/integrations/supabase/client';
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
  User,
  Zap,
  Star,
  ChevronRight,
  GraduationCap,
  Phone,
  RefreshCw,
  ShieldCheck,
  Send
} from 'lucide-react';
import { z } from 'zod';
import { formatPhoneNumber, unformatPhoneNumber } from '@/lib/phoneFormatter';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const loginSchema = z.object({
  email: z.string().email("Noto'g'ri email format"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
});

const signupSchema = loginSchema.extend({
  username: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  phoneNumber: z.string().optional().refine(
    (val) => !val || /^\+?[0-9]{9,15}$/.test(val.replace(/\s/g, '')),
    { message: "Noto'g'ri telefon raqami formati" }
  ),
  telegramUsername: z.string().min(3, "Telegram username kamida 3 ta belgidan iborat bo'lishi kerak"),
});

const emailSchema = z.object({
  email: z.string().email("Noto'g'ri email format"),
});

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'verify-email';

const features = [
  { icon: Brain, text: "Mental arifmetika mashqlari", color: "from-blue-500 to-cyan-500" },
  { icon: Target, text: "Maqsadga yo'naltirilgan o'rganish", color: "from-orange-500 to-amber-500" },
  { icon: Trophy, text: "Yutuqlar va mukofotlar", color: "from-yellow-500 to-orange-500" },
  { icon: GraduationCap, text: "Professional o'qituvchilar", color: "from-purple-500 to-pink-500" },
];

const stats = [
  { value: "10K+", label: "Foydalanuvchilar" },
  { value: "500K+", label: "Yechilgan misollar" },
  { value: "50+", label: "Video darslar" },
];

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMFAVerify, setShowMFAVerify] = useState(false);
  
  // Email verification states
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pendingSignupData, setPendingSignupData] = useState<{
    email: string;
    password: string;
    username: string;
    phoneNumber?: string;
    telegramUsername: string;
  } | null>(null);
  
  const { signIn, signUp, resetPassword, signOut, user } = useAuth();
  const mfa = useMFA();
  const navigate = useNavigate();
  const { toast: toastHook } = useToast();

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('iqromax_remembered_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Check MFA status after user is available
  useEffect(() => {
    if (user && !mfa.loading) {
      if (mfa.isEnabled && !mfa.isVerified && mfa.currentLevel === 'aal1') {
        setShowMFAVerify(true);
      } else if (!showMFAVerify) {
        navigate('/');
      }
    }
  }, [user, mfa.loading, mfa.isEnabled, mfa.isVerified, mfa.currentLevel, navigate, showMFAVerify]);

  const validateForm = () => {
    try {
      if (mode === 'login') {
        loginSchema.parse({ email, password });
      } else if (mode === 'signup') {
        signupSchema.parse({ email, password, username, phoneNumber, telegramUsername });
      } else if (mode === 'forgot-password') {
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

  const sendTelegramVerificationCode = async (targetTelegramUsername: string, targetEmail: string, targetPhone?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-telegram-code', {
        body: { telegram_username: targetTelegramUsername, email: targetEmail, phone_number: targetPhone }
      });
      
      if (error) throw error;
      if (data && !data.success) {
        return { success: false, error: data.error };
      }
      return { success: true };
    } catch (error: any) {
      console.error('Failed to send Telegram verification code:', error);
      return { success: false, error: error.message };
    }
  };

  const verifyCode = async (targetEmail: string, code: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-code', {
        body: { email: targetEmail, code }
      });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Failed to verify code:', error);
      return { success: false, error: error.message };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (mode === 'login') {
        if (rememberMe) {
          localStorage.setItem('iqromax_remembered_email', email);
        } else {
          localStorage.removeItem('iqromax_remembered_email');
        }
        
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
        // Store signup data and send verification code via Telegram
        setPendingSignupData({
          email,
          password,
          username,
          phoneNumber: phoneNumber ? unformatPhoneNumber(phoneNumber) : undefined,
          telegramUsername: telegramUsername.replace(/^@/, '').trim()
        });
        
        const result = await sendTelegramVerificationCode(
          telegramUsername, 
          email, 
          phoneNumber ? unformatPhoneNumber(phoneNumber) : undefined
        );
        
        if (result.success) {
          setMode('verify-email');
          setResendCooldown(60);
          toastHook({
            title: 'Kod yuborildi!',
            description: `Tasdiqlash kodi Telegram orqali yuborildi`,
          });
        } else {
          toastHook({
            variant: 'destructive',
            title: 'Xatolik',
            description: result.error || 'Kod yuborishda xatolik yuz berdi',
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

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6 || !pendingSignupData) return;
    
    setLoading(true);
    
    try {
      const verifyResult = await verifyCode(pendingSignupData.email, verificationCode);
      
      if (!verifyResult.success) {
        toastHook({
          variant: 'destructive',
          title: 'Xatolik',
          description: verifyResult.error || "Noto'g'ri yoki muddati o'tgan kod",
        });
        setLoading(false);
        return;
      }
      
      // Code verified, now create the account
      const { error } = await signUp(
        pendingSignupData.email,
        pendingSignupData.password,
        pendingSignupData.username,
        pendingSignupData.phoneNumber
      );
      
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
          description: 'Akkaunt yaratildi!',
        });
        navigate('/onboarding');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || !pendingSignupData) return;
    
    setLoading(true);
    const result = await sendTelegramVerificationCode(
      pendingSignupData.telegramUsername, 
      pendingSignupData.email,
      pendingSignupData.phoneNumber
    );
    setLoading(false);
    
    if (result.success) {
      setResendCooldown(60);
      setVerificationCode('');
      toastHook({
        title: 'Kod qayta yuborildi!',
        description: `Yangi kod Telegram orqali yuborildi`,
      });
    } else {
      toastHook({
        variant: 'destructive',
        title: 'Xatolik',
        description: result.error || 'Kod yuborishda xatolik',
      });
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setResetEmailSent(false);
    setVerificationCode('');
    setPendingSignupData(null);
  };

  const handleMFACancel = async () => {
    await signOut();
    setShowMFAVerify(false);
  };

  // Show MFA verification screen
  if (showMFAVerify && user) {
    return (
      <TwoFactorVerify
        onSuccess={() => {
          setShowMFAVerify(false);
          navigate('/');
        }}
        onCancel={handleMFACancel}
      />
    );
  }

  // Telegram verification screen
  if (mode === 'verify-email' && pendingSignupData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5 dark:from-primary/10 dark:via-background dark:to-accent/10">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-72 sm:w-96 h-72 sm:h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="w-full max-w-md relative z-10 px-2 sm:px-0">
          <Card className="border-border/40 dark:border-border/20 shadow-2xl dark:shadow-primary/10 backdrop-blur-sm animate-scale-in bg-card/80 dark:bg-card/90 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
            
            <CardHeader className="text-center pb-3 sm:pb-4 pt-5 sm:pt-6 px-4 sm:px-6">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-sky-500/30 dark:shadow-sky-500/50 animate-bounce-slow">
                <Send className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-display">Telegramni tekshiring</CardTitle>
              <CardDescription className="mt-1.5 sm:mt-2 text-sm">
                Tasdiqlash kodi <strong className="text-foreground">@{pendingSignupData.telegramUsername}</strong> ga yuborildi
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-1 sm:pt-2 pb-5 sm:pb-6 px-4 sm:px-6">
              <div className="space-y-6">
                {/* OTP Input */}
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={verificationCode}
                    onChange={setVerificationCode}
                    disabled={loading}
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot index={0} className="h-12 w-12 sm:h-14 sm:w-14 text-xl sm:text-2xl font-bold border-2" />
                      <InputOTPSlot index={1} className="h-12 w-12 sm:h-14 sm:w-14 text-xl sm:text-2xl font-bold border-2" />
                      <InputOTPSlot index={2} className="h-12 w-12 sm:h-14 sm:w-14 text-xl sm:text-2xl font-bold border-2" />
                      <InputOTPSlot index={3} className="h-12 w-12 sm:h-14 sm:w-14 text-xl sm:text-2xl font-bold border-2" />
                      <InputOTPSlot index={4} className="h-12 w-12 sm:h-14 sm:w-14 text-xl sm:text-2xl font-bold border-2" />
                      <InputOTPSlot index={5} className="h-12 w-12 sm:h-14 sm:w-14 text-xl sm:text-2xl font-bold border-2" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <p className="text-center text-xs sm:text-sm text-muted-foreground">
                  ⏱️ Kod 10 daqiqa davomida amal qiladi
                </p>

                {/* Verify Button */}
                <Button 
                  onClick={handleVerifyCode}
                  size="lg" 
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold gap-2 shadow-lg shadow-primary/20 dark:shadow-primary/40 hover:shadow-xl hover:shadow-primary/30 dark:hover:shadow-primary/50 transition-all hover:-translate-y-0.5"
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                      Tasdiqlash
                    </>
                  )}
                </Button>

                {/* Resend Code */}
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                    Kod kelmadimi?
                  </p>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || loading}
                    className="text-primary hover:text-primary/80 text-xs sm:text-sm font-medium inline-flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 
                      ? `Qayta yuborish (${resendCooldown}s)` 
                      : 'Kodni qayta yuborish'
                    }
                  </button>
                </div>

                {/* Back button */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-muted-foreground hover:text-foreground text-xs sm:text-sm font-medium inline-flex items-center gap-2 transition-colors group"
                    disabled={loading}
                  >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Orqaga qaytish
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Reset email sent success state
  if (resetEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5 dark:from-primary/10 dark:via-background dark:to-accent/10">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-72 sm:w-96 h-72 sm:h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="w-full max-w-md relative z-10 px-2 sm:px-0">
          <Card className="border-border/40 dark:border-border/20 shadow-2xl dark:shadow-primary/10 backdrop-blur-sm animate-scale-in bg-card/80 dark:bg-card/90">
            <CardContent className="pt-8 sm:pt-10 pb-8 sm:pb-10 text-center px-4 sm:px-6">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-success to-emerald-500 flex items-center justify-center mx-auto mb-5 sm:mb-6 shadow-lg shadow-success/30 dark:shadow-success/50 animate-bounce-slow">
                <Check className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold mb-2 sm:mb-3">Email yuborildi!</h2>
              <p className="text-muted-foreground mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base px-2">
                Parolni tiklash havolasi <strong className="text-foreground">{email}</strong> emailiga yuborildi. 
                Spam papkasini ham tekshiring.
              </p>
              <Button 
                variant="outline" 
                onClick={() => switchMode('login')}
                className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all h-11 sm:h-10 px-5 touch-target dark:border-border/30 dark:hover:bg-primary"
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
      {/* Left side - Branding (Hidden on mobile/tablet) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent dark:from-primary/90 dark:via-primary/80 dark:to-accent/90" />
        
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 dark:bg-white/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-40 left-10 w-96 h-96 bg-white/5 dark:bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute -bottom-20 right-40 w-48 h-48 bg-accent/30 dark:bg-accent/40 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="absolute top-1/4 right-1/4 w-4 h-4 bg-white/30 dark:bg-white/40 rotate-45 animate-float" />
          <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-white/20 dark:bg-white/30 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-1/3 right-1/3 w-5 h-5 bg-white/25 dark:bg-white/35 rotate-12 animate-float" style={{ animationDelay: '1s' }} />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

        <div className="relative z-10 flex flex-col justify-between p-8 xl:p-12 text-primary-foreground h-full w-full">
          <div className="flex items-center gap-3">
            <Logo size="lg" />
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl xl:text-5xl font-display font-bold leading-tight mb-4">
                O'yin orqali
                <br />
                <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text">matematik</span>
                <br />
                <span className="text-accent">salohiyatingizni</span>
                <br />
                rivojlantiring
              </h1>
              <p className="text-base xl:text-lg opacity-80 max-w-md">
                Eng zamonaviy mental arifmetika platformasiga qo'shiling va matematika ustasi bo'ling!
              </p>
            </div>
            
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 opacity-0 animate-slide-up group"
                  style={{ animationDelay: `${300 + index * 100}ms`, animationFillMode: 'forwards' }}
                >
                  <div className={`h-10 w-10 xl:h-12 xl:w-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-5 w-5 xl:h-6 xl:w-6 text-white" />
                  </div>
                  <span className="text-base xl:text-lg font-medium group-hover:translate-x-1 transition-transform">{feature.text}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-6 xl:gap-8 pt-4">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="opacity-0 animate-fade-in"
                  style={{ animationDelay: `${800 + index * 100}ms`, animationFillMode: 'forwards' }}
                >
                  <p className="text-2xl xl:text-3xl font-display font-bold">{stat.value}</p>
                  <p className="text-sm opacity-70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm opacity-70">
            <Sparkles className="h-4 w-4" />
            <span>© 2024 IQROMAX. Barcha huquqlar himoyalangan.</span>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-12 bg-gradient-to-br from-background via-background to-secondary/20 dark:from-background dark:via-background dark:to-secondary/10 relative overflow-hidden min-h-screen lg:min-h-0">
        <div className="absolute inset-0 overflow-hidden pointer-events-none lg:hidden">
          <div className="absolute -top-40 -right-40 w-64 sm:w-80 h-64 sm:h-80 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-64 sm:w-80 h-64 sm:h-80 bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="w-full max-w-md relative z-10 px-1 sm:px-0">
          <div className="text-center mb-6 sm:mb-8 lg:hidden">
            <Logo size="lg" className="mx-auto mb-2 sm:mb-3" />
            <p className="text-muted-foreground text-xs sm:text-sm">Mental Matematika Platformasi</p>
          </div>

          <Card className="border-border/40 dark:border-border/20 shadow-2xl dark:shadow-primary/10 backdrop-blur-sm animate-scale-in bg-card/80 dark:bg-card/90 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
            
            <CardHeader className="text-center pb-3 sm:pb-4 pt-5 sm:pt-6 px-4 sm:px-6">
              {mode === 'forgot-password' ? (
                <>
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-primary/30 dark:shadow-primary/50 animate-bounce-slow">
                    <Mail className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl font-display">Parolni tiklash</CardTitle>
                  <CardDescription className="mt-1.5 sm:mt-2 text-sm">
                    Email manzilingizni kiriting, parolni tiklash havolasini yuboramiz
                  </CardDescription>
                </>
              ) : (
                <>
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-primary/30 dark:shadow-primary/50 relative group">
                    {mode === 'login' ? (
                      <LogIn className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground group-hover:scale-110 transition-transform" />
                    ) : (
                      <UserPlus className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground group-hover:scale-110 transition-transform" />
                    )}
                    <div className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-accent rounded-full flex items-center justify-center animate-pulse">
                      <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-accent-foreground" />
                    </div>
                  </div>
                  <CardTitle className="text-xl sm:text-2xl font-display">
                    {mode === 'login' ? 'Xush kelibsiz!' : "Ro'yxatdan o'tish"}
                  </CardTitle>
                  <CardDescription className="mt-1.5 sm:mt-2 text-sm">
                    {mode === 'login' 
                      ? "Hisobingizga kiring va davom eting" 
                      : "Bepul akkaunt yarating va boshlang"}
                  </CardDescription>
                </>
              )}
            </CardHeader>
            
            <CardContent className="pt-1 sm:pt-2 pb-5 sm:pb-6 px-4 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="username" className="text-xs sm:text-sm font-medium">Ism</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Ismingizni kiriting"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                        className={`pl-10 h-11 sm:h-12 transition-all focus:shadow-md focus:shadow-primary/10 bg-background dark:bg-card/50 border-border/50 dark:border-border/30 text-sm sm:text-base ${errors.username ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                    </div>
                    {errors.username && (
                      <p className="text-xs sm:text-sm text-destructive flex items-center gap-1.5 animate-shake">
                        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    {errors.username}
                      </p>
                    )}
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="phoneNumber" className="text-xs sm:text-sm font-medium">Telefon raqami (ixtiyoriy)</Label>
                    <div className="relative group">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+998 90 123 45 67"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                        disabled={loading}
                        className={`pl-10 h-11 sm:h-12 transition-all focus:shadow-md focus:shadow-primary/10 bg-background dark:bg-card/50 border-border/50 dark:border-border/30 text-sm sm:text-base ${errors.phoneNumber ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p className="text-xs sm:text-sm text-destructive flex items-center gap-1.5 animate-shake">
                        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                        {errors.phoneNumber}
                      </p>
                    )}
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="telegramUsername" className="text-xs sm:text-sm font-medium flex items-center gap-2">
                      <Send className="h-3.5 w-3.5 text-sky-500" />
                      Telegram username
                    </Label>
                    <div className="relative group">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors text-sm sm:text-base">@</span>
                      <Input
                        id="telegramUsername"
                        type="text"
                        placeholder="username"
                        value={telegramUsername}
                        onChange={(e) => setTelegramUsername(e.target.value.replace(/^@/, ''))}
                        disabled={loading}
                        className={`pl-8 h-11 sm:h-12 transition-all focus:shadow-md focus:shadow-primary/10 bg-background dark:bg-card/50 border-border/50 dark:border-border/30 text-sm sm:text-base ${errors.telegramUsername ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                    </div>
                    {errors.telegramUsername && (
                      <p className="text-xs sm:text-sm text-destructive flex items-center gap-1.5 animate-shake">
                        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                        {errors.telegramUsername}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      ⚠️ Avval <a href="https://t.me/iqromaxuz_bot" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@iqromaxuz_bot</a> ga /start yuboring
                    </p>
                  </div>
                )}
                
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm font-medium">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className={`pl-10 h-11 sm:h-12 transition-all focus:shadow-md focus:shadow-primary/10 bg-background dark:bg-card/50 border-border/50 dark:border-border/30 text-sm sm:text-base ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs sm:text-sm text-destructive flex items-center gap-1.5 animate-shake">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                      {errors.email}
                    </p>
                  )}
                </div>
                
                {mode !== 'forgot-password' && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs sm:text-sm font-medium">Parol</Label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => switchMode('forgot-password')}
                          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors hover:underline touch-target"
                        >
                          Parolni unutdingizmi?
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className={`pl-10 h-11 sm:h-12 transition-all focus:shadow-md focus:shadow-primary/10 bg-background dark:bg-card/50 border-border/50 dark:border-border/30 text-sm sm:text-base ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-xs sm:text-sm text-destructive flex items-center gap-1.5 animate-shake">
                        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                        {errors.password}
                      </p>
                    )}
                    {mode === 'signup' && password && (
                      <PasswordStrengthIndicator password={password} />
                    )}
                  </div>
                )}

                {mode === 'login' && (
                  <div className="flex items-center space-x-2 pt-1">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="text-xs sm:text-sm font-normal text-muted-foreground cursor-pointer select-none"
                    >
                      Meni eslab qol
                    </Label>
                  </div>
                )}

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold gap-2 mt-4 sm:mt-6 shadow-lg shadow-primary/20 dark:shadow-primary/40 hover:shadow-xl hover:shadow-primary/30 dark:hover:shadow-primary/50 transition-all hover:-translate-y-0.5 touch-target"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  ) : mode === 'login' ? (
                    <>
                      Kirish
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </>
                  ) : mode === 'signup' ? (
                    <>
                      Ro'yxatdan o'tish
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </>
                  ) : (
                    <>
                      Havola yuborish
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                    </>
                  )}
                </Button>
              </form>


              <div className="text-center">
                {mode === 'forgot-password' ? (
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-primary hover:text-primary/80 text-xs sm:text-sm font-medium inline-flex items-center gap-2 transition-colors group touch-target"
                    disabled={loading}
                  >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Kirish sahifasiga qaytish
                  </button>
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {mode === 'login' ? "Akkauntingiz yo'qmi?" : "Akkauntingiz bormi?"}{' '}
                    <button
                      type="button"
                      onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                      className="text-primary hover:text-primary/80 font-semibold transition-colors hover:underline touch-target"
                      disabled={loading}
                    >
                      {mode === 'login' ? "Ro'yxatdan o'ting" : "Kirish"}
                    </button>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-5 sm:mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group touch-target"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Bosh sahifaga qaytish
            </button>
          </div>

          <div className="mt-6 sm:mt-8 lg:hidden">
            <div className="flex justify-center gap-4 sm:gap-6 text-center text-xs text-muted-foreground">
              {stats.map((stat, index) => (
                <div key={index} className="px-2 py-1.5 rounded-lg bg-card/50 dark:bg-card/30 border border-border/30 dark:border-border/20">
                  <p className="text-base sm:text-lg font-bold text-foreground">{stat.value}</p>
                  <p>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
