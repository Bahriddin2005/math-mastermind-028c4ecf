import { useState, useEffect, useRef } from 'react';
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
  Loader2, LogIn, UserPlus, Mail, ArrowLeft, Check, Sparkles,
  Brain, Target, Trophy, Lock, User, Zap, Star, ChevronRight,
  GraduationCap, Send, ExternalLink, ShieldCheck, RefreshCw, AtSign
} from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email("Noto'g'ri email format"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
});

const signupSchema = z.object({
  email: z.string().email("Noto'g'ri email format"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  username: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  telegramUsername: z.string().min(3, "Telegram username kamida 3 ta belgidan iborat bo'lishi kerak"),
});

const emailSchema = z.object({
  email: z.string().email("Noto'g'ri email format"),
});

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'verify-otp' | 'reset-via-telegram' | 'reset-verify-otp';

const features = [
  { icon: Brain, text: "Mental arifmetika mashqlari", color: "from-blue-500 to-cyan-500" },
  { icon: Target, text: "Maqsadga yo'naltirilgan o'rganish", color: "from-orange-500 to-amber-500" },
  { icon: Trophy, text: "Yutuqlar va mukofotlar", color: "from-yellow-500 to-orange-500" },
  { icon: GraduationCap, text: "Professional o'qituvchilar", color: "from-purple-500 to-pink-500" },
];

const formatStatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M+`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K+`;
  return `${num}+`;
};

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [userType, setUserType] = useState<'student' | 'parent' | 'teacher'>('student');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMFAVerify, setShowMFAVerify] = useState(false);
  const [stats, setStats] = useState([
    { value: "0+", label: "Foydalanuvchilar" },
    { value: "0+", label: "Yechilgan misollar" },
    { value: "0+", label: "Video darslar" },
  ]);
  
  // OTP verification states
  const [sessionToken, setSessionToken] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'verified' | 'error' | 'creating'>('idle');
  const [verifiedTelegramData, setVerifiedTelegramData] = useState<{
    telegram_id: string;
    telegram_username: string;
    telegram_first_name: string;
  } | null>(null);
  const [verifyError, setVerifyError] = useState('');
  
  // Reset via Telegram states
  const [resetTelegramUsername, setResetTelegramUsername] = useState('');
  const [resetSessionToken, setResetSessionToken] = useState('');
  const [resetOtpInput, setResetOtpInput] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetNewEmail, setResetNewEmail] = useState('');
  const [resetOtpExpiresAt, setResetOtpExpiresAt] = useState<Date | null>(null);
  const [resetOtpCountdown, setResetOtpCountdown] = useState(0);
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'verifying' | 'success' | 'error'>('idle');
  const [resetError, setResetError] = useState('');
  const [resetEmailHint, setResetEmailHint] = useState('');
  
  const pendingSignupDataRef = useRef<{
    email: string;
    password: string;
    username: string;
    userType: string;
    telegramUsername: string;
  } | null>(null);
  
  const { signIn, signUp, resetPassword, signOut, user } = useAuth();
  const mfa = useMFA();
  const navigate = useNavigate();
  const { toast: toastHook } = useToast();

  // Load remembered email and fetch stats
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('iqromax_remembered_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }

    const fetchStats = async () => {
      const { data } = await supabase.rpc('get_platform_stats') as { data: any[] | null };
      if (data && data.length > 0) {
        const s = data[0];
        setStats([
          { value: formatStatNumber(s.total_users || 0), label: "Foydalanuvchilar" },
          { value: formatStatNumber(s.total_problems_solved || 0), label: "Yechilgan misollar" },
          { value: formatStatNumber(s.total_lessons || 0), label: "Video darslar" },
        ]);
      }
    };
    fetchStats();
  }, []);

  // OTP countdown timer
  useEffect(() => {
    if (otpExpiresAt) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, Math.floor((otpExpiresAt.getTime() - Date.now()) / 1000));
        setOtpCountdown(remaining);
        if (remaining <= 0) clearInterval(timer);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [otpExpiresAt]);

  // Reset OTP countdown timer
  useEffect(() => {
    if (resetOtpExpiresAt) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, Math.floor((resetOtpExpiresAt.getTime() - Date.now()) / 1000));
        setResetOtpCountdown(remaining);
        if (remaining <= 0) clearInterval(timer);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resetOtpExpiresAt]);

  // Check MFA status
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
        signupSchema.parse({ email, password, username, telegramUsername: telegramUsername.replace(/^@/, '') });
      } else if (mode === 'forgot-password') {
        emailSchema.parse({ email });
      }
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) newErrors[e.path[0] as string] = e.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleCreateAccount = async () => {
    const data = pendingSignupDataRef.current;
    if (!data || !verifiedTelegramData) return;
    
    setVerifyStatus('creating');
    try {
      const { error } = await signUp(data.email, data.password, data.username, undefined, data.userType);
      
      if (error) {
        const msg = error.message.includes('already registered')
          ? "Bu email allaqachon ro'yxatdan o'tgan"
          : error.message;
        toastHook({ variant: 'destructive', title: 'Xatolik', description: msg });
        setVerifyStatus('error');
        setVerifyError(msg);
        return;
      }

      // Bind telegram data and consume OTP
      setTimeout(async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        
        if (userId) {
          await supabase
            .from('profiles')
            .update({
              telegram_id: verifiedTelegramData.telegram_id,
              telegram_username: verifiedTelegramData.telegram_username,
            })
            .eq('user_id', userId);
        }

        // Consume OTP
        await supabase.functions.invoke('verify-otp-website', {
          body: { session_token: sessionToken, otp_code: otpInput, consume: true }
        });
      }, 1500);

      toastHook({
        title: 'Muvaffaqiyat!',
        description: `Akkaunt yaratildi! Telegram: @${verifiedTelegramData.telegram_username}`,
      });
      navigate('/onboarding');
    } catch (err: any) {
      setVerifyStatus('error');
      setVerifyError(err.message);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpInput || otpInput.length !== 6) {
      setVerifyError("6 raqamli kodni kiriting");
      return;
    }

    setVerifyStatus('verifying');
    setVerifyError('');

    try {
      const { data, error } = await supabase.functions.invoke('verify-otp-website', {
        body: { session_token: sessionToken, otp_code: otpInput, consume: false }
      });

      if (error) {
        setVerifyStatus('error');
        setVerifyError('Tekshirishda xatolik yuz berdi');
        return;
      }

      if (!data?.success) {
        setVerifyStatus('error');
        setVerifyError(data?.error || 'Noto\'g\'ri kod');
        return;
      }

      // OTP verified! Save telegram data and create account
      setVerifiedTelegramData({
        telegram_id: data.telegram_id,
        telegram_username: data.telegram_username,
        telegram_first_name: data.telegram_first_name,
      });
      setVerifyStatus('verified');
    } catch (err: any) {
      setVerifyStatus('error');
      setVerifyError(err.message);
    }
  };

  // Auto-create account after verification
  useEffect(() => {
    if (verifyStatus === 'verified' && verifiedTelegramData && pendingSignupDataRef.current) {
      handleCreateAccount();
    }
  }, [verifyStatus, verifiedTelegramData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    
    try {
      if (mode === 'login') {
        if (rememberMe) localStorage.setItem('iqromax_remembered_email', email);
        else localStorage.removeItem('iqromax_remembered_email');
        
        const { error } = await signIn(email, password);
        if (error) {
          toastHook({
            variant: 'destructive',
            title: 'Xatolik',
            description: error.message === 'Invalid login credentials' 
              ? "Email yoki parol noto'g'ri" : error.message,
          });
        } else {
          toastHook({ title: 'Muvaffaqiyat!', description: 'Tizimga kirdingiz' });
        }
      } else if (mode === 'signup') {
        // Send OTP to user's Telegram
        const cleanTgUsername = telegramUsername.replace(/^@/, '').trim();
        
        const { data, error } = await supabase.functions.invoke('generate-otp', {
          body: { email, telegram_username: cleanTgUsername }
        });
        
        if (error) {
          toastHook({ variant: 'destructive', title: 'Xatolik', description: 'OTP yuborishda xatolik yuz berdi' });
          return;
        }
        
        if (data && !data.success) {
          toastHook({ variant: 'destructive', title: 'Xatolik', description: data.error || 'OTP yaratishda xatolik' });
          return;
        }

        // Store pending signup data
        pendingSignupDataRef.current = { email, password, username, userType, telegramUsername: cleanTgUsername };

        // Show OTP entry screen
        setSessionToken(data.session_token);
        setOtpExpiresAt(new Date(Date.now() + (data.expires_in || 180) * 1000));
        setOtpCountdown(data.expires_in || 180);
        setOtpInput('');
        setVerifyStatus('idle');
        setVerifiedTelegramData(null);
        setVerifyError('');
        setMode('verify-otp');
        
        toastHook({ title: 'OTP yuborildi!', description: 'Telegram ga kelgan kodni kiriting' });
      } else if (mode === 'forgot-password') {
        const { error } = await resetPassword(email);
        if (error) {
          toastHook({ variant: 'destructive', title: 'Xatolik', description: error.message });
        } else {
          setResetEmailSent(true);
          toast.success('Parolni tiklash havolasi emailingizga yuborildi');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingSignupDataRef.current) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-otp', {
        body: { 
          email: pendingSignupDataRef.current.email, 
          telegram_username: pendingSignupDataRef.current.telegramUsername 
        }
      });
      
      if (error || !data?.success) {
        toastHook({ variant: 'destructive', title: 'Xatolik', description: data?.error || 'Yangi kod yuborishda xatolik' });
        return;
      }

      setSessionToken(data.session_token);
      setOtpExpiresAt(new Date(Date.now() + (data.expires_in || 180) * 1000));
      setOtpCountdown(data.expires_in || 180);
      setOtpInput('');
      setVerifyStatus('idle');
      setVerifyError('');
      toast.success('Yangi OTP kod Telegram ga yuborildi!');
    } finally {
      setLoading(false);
    }
  };

  // Handle sending reset OTP via Telegram
  const handleSendResetOtp = async () => {
    const cleanTg = resetTelegramUsername.replace(/^@/, '').trim();
    if (!cleanTg || cleanTg.length < 3) {
      setResetError("Telegram username kiriting");
      return;
    }
    setResetStatus('sending');
    setResetError('');
    try {
      const { data, error } = await supabase.functions.invoke('reset-password-otp', {
        body: { telegram_username: cleanTg }
      });
      if (error || !data?.success) {
        setResetStatus('error');
        setResetError(data?.error || 'Xatolik yuz berdi');
        return;
      }
      setResetSessionToken(data.session_token);
      setResetEmailHint(data.email_hint || '');
      setResetOtpExpiresAt(new Date(Date.now() + (data.expires_in || 180) * 1000));
      setResetOtpCountdown(data.expires_in || 180);
      setResetOtpInput('');
      setResetNewPassword('');
      setResetStatus('idle');
      setMode('reset-verify-otp');
      toastHook({ title: 'OTP yuborildi!', description: 'Telegram ga kelgan kodni kiriting' });
    } catch (err: any) {
      setResetStatus('error');
      setResetError(err.message);
    }
  };

  // Handle confirming password reset with OTP
  const handleConfirmReset = async () => {
    if (!resetOtpInput || resetOtpInput.length !== 6) {
      setResetError("6 raqamli kodni kiriting");
      return;
    }
    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetError("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    setResetStatus('verifying');
    setResetError('');
    try {
      const body: any = { session_token: resetSessionToken, otp_code: resetOtpInput, new_password: resetNewPassword };
      if (resetNewEmail.trim()) body.new_email = resetNewEmail.trim();
      const { data, error } = await supabase.functions.invoke('reset-password-confirm', { body });
      if (error || !data?.success) {
        setResetStatus('error');
        setResetError(data?.error || 'Xatolik yuz berdi');
        return;
      }
      setResetStatus('success');
      toastHook({ title: 'Muvaffaqiyat!', description: 'Parol yangilandi. Endi kirish mumkin.' });
    } catch (err: any) {
      setResetStatus('error');
      setResetError(err.message);
    }
  };

  // Handle resending reset OTP
  const handleResendResetOtp = async () => {
    const cleanTg = resetTelegramUsername.replace(/^@/, '').trim();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-password-otp', {
        body: { telegram_username: cleanTg }
      });
      if (error || !data?.success) {
        toastHook({ variant: 'destructive', title: 'Xatolik', description: data?.error || 'Yangi kod yuborishda xatolik' });
        return;
      }
      setResetSessionToken(data.session_token);
      setResetOtpExpiresAt(new Date(Date.now() + (data.expires_in || 180) * 1000));
      setResetOtpCountdown(data.expires_in || 180);
      setResetOtpInput('');
      setResetStatus('idle');
      setResetError('');
      toast.success('Yangi kod Telegram ga yuborildi!');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setResetEmailSent(false);
    setOtpInput('');
    setSessionToken('');
    setVerifyStatus('idle');
    setVerifiedTelegramData(null);
    setVerifyError('');
    setResetTelegramUsername('');
    setResetSessionToken('');
    setResetOtpInput('');
    setResetNewPassword('');
    setResetNewEmail('');
    setResetStatus('idle');
    setResetError('');
    setResetEmailHint('');
  };

  const handleMFACancel = async () => {
    await signOut();
    setShowMFAVerify(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // MFA verification screen
  if (showMFAVerify && user) {
    return (
      <TwoFactorVerify
        onSuccess={() => { setShowMFAVerify(false); navigate('/'); }}
        onCancel={handleMFACancel}
      />
    );
  }

  // OTP Entry Screen (NEW FLOW: user enters OTP received from Telegram)
  if (mode === 'verify-otp') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5 dark:from-primary/10 dark:via-background dark:to-accent/10">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-72 sm:w-96 h-72 sm:h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="w-full max-w-md relative z-10 px-2 sm:px-0">
          <Card className="border-border/40 dark:border-border/20 shadow-2xl dark:shadow-primary/10 backdrop-blur-sm animate-scale-in bg-card/80 dark:bg-card/90 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-sky-500" />
            
            <CardHeader className="text-center pb-3 sm:pb-4 pt-5 sm:pt-6 px-4 sm:px-6">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-sky-500/30 dark:shadow-sky-500/50">
                <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-display">OTP kodni kiriting</CardTitle>
              <CardDescription className="mt-1.5 sm:mt-2 text-sm">
                Telegram ga yuborilgan 6 raqamli kodni kiriting
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-1 sm:pt-2 pb-5 sm:pb-6 px-4 sm:px-6">
              <div className="space-y-5">
                {/* Info banner */}
                <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border border-sky-200 dark:border-sky-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Send className="h-5 w-5 text-sky-500 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-sky-700 dark:text-sky-300">
                        OTP kod <a href="https://t.me/iqromaxuzbot" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">@iqromaxuzbot <ExternalLink className="h-3 w-3" /></a> ga yuborildi
                      </p>
                      {otpCountdown > 0 && (
                        <p className="text-xs text-sky-600 dark:text-sky-400 mt-1">
                          ⏱️ Kod amal qiladi: <span className="font-mono font-bold">{formatTime(otpCountdown)}</span>
                        </p>
                      )}
                      {otpCountdown <= 0 && (
                        <p className="text-xs text-destructive mt-1 font-medium">⏰ Kod muddati tugadi</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* OTP Input */}
                <div className="space-y-2">
                  <Label htmlFor="otp-input" className="text-sm font-medium">6 raqamli kod</Label>
                  <Input
                    id="otp-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={otpInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpInput(val);
                      setVerifyError('');
                    }}
                    disabled={verifyStatus === 'verifying' || verifyStatus === 'creating' || verifyStatus === 'verified'}
                    className={`text-center text-3xl font-mono tracking-[0.5em] h-16 ${verifyError ? 'border-destructive' : ''}`}
                    autoFocus
                  />
                  {verifyError && (
                    <p className="text-xs text-destructive flex items-center gap-1.5 animate-shake">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                      {verifyError}
                    </p>
                  )}
                </div>

                {/* Verify button */}
                {verifyStatus !== 'verified' && verifyStatus !== 'creating' && (
                  <Button
                    onClick={handleVerifyOtp}
                    disabled={otpInput.length !== 6 || verifyStatus === 'verifying' || otpCountdown <= 0}
                    className="w-full h-12 text-base font-semibold gap-2 rounded-full bg-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-500/20"
                  >
                    {verifyStatus === 'verifying' ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> Tekshirilmoqda...</>
                    ) : (
                      <><ShieldCheck className="h-5 w-5" /> Tasdiqlash</>
                    )}
                  </Button>
                )}

                {/* Status */}
                {verifyStatus === 'verified' && verifiedTelegramData && (
                  <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Tasdiqlandi! ✅</p>
                        <p className="text-xs text-muted-foreground">
                          @{verifiedTelegramData.telegram_username || 'N/A'} — {verifiedTelegramData.telegram_first_name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {verifyStatus === 'creating' && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm font-medium">Akkaunt yaratilmoqda...</span>
                  </div>
                )}

                {/* Resend OTP */}
                {(otpCountdown <= 0) && (
                  <Button 
                    onClick={handleResendOtp}
                    variant="outline"
                    className="w-full gap-2"
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Yangi kod yuborish
                  </Button>
                )}

                {/* Back button */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-muted-foreground hover:text-foreground text-xs sm:text-sm font-medium inline-flex items-center gap-2 transition-colors group"
                    disabled={verifyStatus === 'creating'}
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

  // Reset via Telegram - enter username
  if (mode === 'reset-via-telegram') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5 dark:from-primary/10 dark:via-background dark:to-accent/10">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-72 sm:w-96 h-72 sm:h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="w-full max-w-md relative z-10 px-2 sm:px-0">
          <Card className="border-border/40 dark:border-border/20 shadow-2xl dark:shadow-primary/10 backdrop-blur-sm animate-scale-in bg-card/80 dark:bg-card/90 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
            <CardHeader className="text-center pb-3 pt-5 px-4 sm:px-6">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-amber-500/30">
                <Lock className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-display">Parolni tiklash</CardTitle>
              <CardDescription className="mt-1.5 text-sm">
                Telegram username'ingizni kiriting — sizga OTP kod yuboramiz
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-1 pb-5 px-4 sm:px-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-tg" className="text-xs sm:text-sm font-medium">Telegram username</Label>
                  <div className="relative group">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-amber-500 transition-colors" />
                    <Input
                      id="reset-tg"
                      placeholder="username"
                      value={resetTelegramUsername}
                      onChange={(e) => { setResetTelegramUsername(e.target.value); setResetError(''); }}
                      disabled={resetStatus === 'sending'}
                      className="pl-10 h-11 sm:h-12"
                      autoFocus
                    />
                  </div>
                  {resetError && (
                    <p className="text-xs text-destructive flex items-center gap-1.5 animate-shake">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                      {resetError}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleSendResetOtp}
                  disabled={!resetTelegramUsername.trim() || resetStatus === 'sending'}
                  className="w-full h-12 text-base font-semibold gap-2 rounded-full bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20"
                >
                  {resetStatus === 'sending' ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Yuborilmoqda...</>
                  ) : (
                    <><Send className="h-5 w-5" /> OTP kod yuborish</>
                  )}
                </Button>
                <div className="text-center pt-1">
                  <button type="button" onClick={() => switchMode('login')} className="text-muted-foreground hover:text-foreground text-xs sm:text-sm font-medium inline-flex items-center gap-2 transition-colors group">
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Kirish sahifasiga qaytish
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Reset verify OTP + new password
  if (mode === 'reset-verify-otp') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5 dark:from-primary/10 dark:via-background dark:to-accent/10">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-72 sm:w-96 h-72 sm:h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="w-full max-w-md relative z-10 px-2 sm:px-0">
          <Card className="border-border/40 dark:border-border/20 shadow-2xl dark:shadow-primary/10 backdrop-blur-sm animate-scale-in bg-card/80 dark:bg-card/90 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
            <CardHeader className="text-center pb-3 pt-5 px-4 sm:px-6">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-amber-500/30">
                <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-display">
                {resetStatus === 'success' ? 'Parol yangilandi!' : 'Parolni tiklash'}
              </CardTitle>
              <CardDescription className="mt-1.5 text-sm">
                {resetStatus === 'success' 
                  ? "Endi yangi parol bilan kirishingiz mumkin"
                  : `Telegram ga yuborilgan kodni kiriting${resetEmailHint ? ` (${resetEmailHint})` : ''}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-1 pb-5 px-4 sm:px-6">
              {resetStatus === 'success' ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4 text-center">
                    <Check className="h-10 w-10 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Parol muvaffaqiyatli yangilandi!</p>
                  </div>
                  <Button onClick={() => switchMode('login')} className="w-full h-12 rounded-full gap-2">
                    <LogIn className="h-5 w-5" /> Kirish sahifasiga o'tish
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Timer */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Send className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-amber-700 dark:text-amber-300 font-medium">
                        @{resetTelegramUsername.replace(/^@/, '')} ga kod yuborildi
                      </span>
                    </div>
                    {resetOtpCountdown > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 ml-6">
                        ⏱️ <span className="font-mono font-bold">{formatTime(resetOtpCountdown)}</span>
                      </p>
                    )}
                    {resetOtpCountdown <= 0 && (
                      <p className="text-xs text-destructive mt-1 ml-6 font-medium">⏰ Kod muddati tugadi</p>
                    )}
                  </div>

                  {/* OTP Input */}
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium">6 raqamli kod</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000"
                      value={resetOtpInput}
                      onChange={(e) => { setResetOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6)); setResetError(''); }}
                      disabled={resetStatus === 'verifying'}
                      className="text-center text-3xl font-mono tracking-[0.5em] h-16"
                      autoFocus
                    />
                  </div>

                  {/* New Email (optional) */}
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium">Yangi email <span className="text-muted-foreground">(ixtiyoriy)</span></Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-amber-500 transition-colors" />
                      <Input
                        type="email"
                        placeholder={resetEmailHint || "Yangi email kiriting"}
                        value={resetNewEmail}
                        onChange={(e) => { setResetNewEmail(e.target.value); setResetError(''); }}
                        disabled={resetStatus === 'verifying'}
                        className="pl-10 h-11 sm:h-12"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Bo'sh qoldirsangiz, email o'zgarmaydi</p>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium">Yangi parol</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-amber-500 transition-colors" />
                      <Input
                        type="password"
                        placeholder="Kamida 6 ta belgi"
                        value={resetNewPassword}
                        onChange={(e) => { setResetNewPassword(e.target.value); setResetError(''); }}
                        disabled={resetStatus === 'verifying'}
                        className="pl-10 h-11 sm:h-12"
                      />
                    </div>
                    {resetNewPassword && <PasswordStrengthIndicator password={resetNewPassword} />}
                  </div>

                  {resetError && (
                    <p className="text-xs text-destructive flex items-center gap-1.5 animate-shake">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                      {resetError}
                    </p>
                  )}

                  <Button
                    onClick={handleConfirmReset}
                    disabled={resetOtpInput.length !== 6 || resetNewPassword.length < 6 || resetStatus === 'verifying' || resetOtpCountdown <= 0}
                    className="w-full h-12 text-base font-semibold gap-2 rounded-full bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20"
                  >
                    {resetStatus === 'verifying' ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> Tiklanmoqda...</>
                    ) : (
                      <><Lock className="h-5 w-5" /> Parolni yangilash</>
                    )}
                  </Button>

                  {resetOtpCountdown <= 0 && (
                    <Button onClick={handleResendResetOtp} variant="outline" className="w-full gap-2" disabled={loading}>
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      Yangi kod yuborish
                    </Button>
                  )}

                  <div className="text-center pt-1">
                    <button type="button" onClick={() => switchMode('reset-via-telegram')} className="text-muted-foreground hover:text-foreground text-xs sm:text-sm font-medium inline-flex items-center gap-2 transition-colors group">
                      <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                      Orqaga qaytish
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Reset email sent success state (legacy email flow)
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
            <p className="text-muted-foreground text-xs sm:text-sm">O'yinlashtirilgan ta'lim platformasi</p>
            <p className="text-muted-foreground/70 text-[10px] sm:text-xs mt-1">O'rganing. Rivojlaning. Natijani ko'ring.</p>
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
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-emerald-500/30 dark:shadow-emerald-500/50 relative group">
                    {mode === 'login' ? (
                      <LogIn className="h-7 w-7 sm:h-8 sm:w-8 text-white group-hover:scale-110 transition-transform" />
                    ) : (
                      <UserPlus className="h-7 w-7 sm:h-8 sm:w-8 text-white group-hover:scale-110 transition-transform" />
                    )}
                    <div className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                      <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-900" />
                    </div>
                  </div>
                  <CardTitle className="text-xl sm:text-2xl font-display">
                    {mode === 'login' ? 'Xush kelibsiz!' : "Ro'yxatdan o'tish"}
                  </CardTitle>
                  <CardDescription className="mt-1.5 sm:mt-2 text-sm">
                    {mode === 'login' 
                      ? "Hisobingizga kiring va o'rganishni davom ettiring" 
                      : "Bepul akkaunt yarating va boshlang"}
                  </CardDescription>
                </>
              )}
            </CardHeader>
            
            <CardContent className="pt-1 sm:pt-2 pb-5 sm:pb-6 px-4 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium">Platformadan kim sifatida foydalanasiz?</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'student' as const, emoji: '🧒', label: "O'quvchi", desc: "O'yinlar va mashqlar" },
                        { value: 'parent' as const, emoji: '👨‍👩‍👧', label: "Ota-ona", desc: "Farzandimni kuzataman" },
                        { value: 'teacher' as const, emoji: '👩‍🏫', label: "O'qituvchi", desc: "Guruh va darslar" },
                      ].map((role) => (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => setUserType(role.value)}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            userType === role.value
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-md'
                              : 'border-border/50 bg-card hover:border-emerald-300'
                          }`}
                        >
                          <div className="text-2xl mb-1">{role.emoji}</div>
                          <p className="text-xs font-bold">{role.label}</p>
                          <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{role.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm font-medium">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@namuna.uz"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className={`pl-10 h-11 sm:h-12 rounded-full transition-all focus:shadow-md focus:shadow-primary/10 bg-secondary/50 dark:bg-card/50 border-border/50 dark:border-border/30 text-sm sm:text-base ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
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
                          onClick={() => switchMode('reset-via-telegram')}
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
                        className={`pl-10 h-11 sm:h-12 rounded-full transition-all focus:shadow-md focus:shadow-primary/10 bg-secondary/50 dark:bg-card/50 border-border/50 dark:border-border/30 text-sm sm:text-base ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
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

                {/* Telegram setup instruction + username field - only for signup */}
                {mode === 'signup' && (
                  <div className="space-y-3">
                    {/* Instruction banner */}
                    <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border border-sky-200 dark:border-sky-800 rounded-xl p-3.5">
                      <div className="flex items-start gap-2.5">
                        <Send className="h-4 w-4 text-sky-500 mt-0.5 shrink-0" />
                        <div className="text-xs space-y-1.5">
                          <p className="font-semibold text-sky-700 dark:text-sky-300">Avval Telegram botni sozlang:</p>
                          <ol className="list-decimal list-inside space-y-1 text-sky-600 dark:text-sky-400">
                            <li>
                              <a href="https://t.me/iqromaxuzbot" target="_blank" rel="noopener noreferrer" className="underline font-medium inline-flex items-center gap-0.5">
                                @iqromaxuzbot <ExternalLink className="h-2.5 w-2.5" />
                              </a> ni oching
                            </li>
                            <li><span className="font-mono bg-sky-100 dark:bg-sky-900/50 px-1 rounded">/start</span> buyrug'ini yuboring</li>
                            <li>📱 <strong>Telefon raqamni yuborish</strong> tugmasini bosing</li>
                          </ol>
                          <p className="text-sky-500 dark:text-sky-500 mt-1">✅ Shundan keyin username'ingizni pastga kiriting</p>
                        </div>
                      </div>
                    </div>

                    {/* Username input */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="telegram-username" className="text-xs sm:text-sm font-medium">Telegram username</Label>
                      <div className="relative group">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-sky-500 transition-colors" />
                        <Input
                          id="telegram-username"
                          type="text"
                          placeholder="username"
                          value={telegramUsername}
                          onChange={(e) => setTelegramUsername(e.target.value)}
                          disabled={loading}
                          className={`pl-10 h-11 sm:h-12 transition-all focus:shadow-md focus:shadow-sky-500/10 bg-background dark:bg-card/50 border-border/50 dark:border-border/30 text-sm sm:text-base ${errors.telegramUsername ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        />
                      </div>
                      {errors.telegramUsername && (
                        <p className="text-xs sm:text-sm text-destructive flex items-center gap-1.5 animate-shake">
                          <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                          {errors.telegramUsername}
                        </p>
                      )}
                    </div>
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
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold gap-2 mt-4 sm:mt-6 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/30 dark:hover:shadow-emerald-500/50 transition-all hover:-translate-y-0.5 touch-target"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  ) : mode === 'login' ? (
                    <>Kirish <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" /></>
                  ) : mode === 'signup' ? (
                    <>OTP yuborish <Send className="h-4 w-4 sm:h-5 sm:w-5" /></>
                  ) : (
                    <>Havola yuborish <Mail className="h-4 w-4 sm:h-5 sm:w-5" /></>
                  )}
                </Button>
              </form>

              <div className="text-center mt-4">
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
            <div className="flex justify-center gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-lg font-display font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
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
