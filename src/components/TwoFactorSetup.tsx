import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Shield, Loader2, Check, X, Smartphone, Copy, QrCode, Key, AlertTriangle } from 'lucide-react';

interface TwoFactorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const TwoFactorSetup = ({ open, onOpenChange, onSuccess }: TwoFactorSetupProps) => {
  const [step, setStep] = useState<'start' | 'qr' | 'verify'>('start');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');

  const handleStartSetup = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStep('qr');
    } catch (err: any) {
      console.error('MFA enroll error:', err);
      setError(err.message || "2FA sozlashda xatolik yuz berdi");
      toast.error("2FA sozlashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!factorId || verifyCode.length !== 6) {
      setError("6 xonali kodni kiriting");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Challenge the factor
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      // Verify with the code
      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      toast.success("2FA muvaffaqiyatli yoqildi! 🔒");
      onSuccess?.();
      onOpenChange(false);
      resetState();
    } catch (err: any) {
      console.error('MFA verify error:', err);
      setError(err.message || "Kod noto'g'ri yoki muddati o'tgan");
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      toast.success("Maxfiy kalit nusxalandi!");
    }
  };

  const resetState = () => {
    setStep('start');
    setQrCode(null);
    setSecret(null);
    setFactorId(null);
    setVerifyCode('');
    setError('');
  };

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Ikki bosqichli autentifikatsiya
          </DialogTitle>
          <DialogDescription>
            Hisobingizni qo'shimcha xavfsizlik bilan himoyalang
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'start' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Authenticator ilovasi kerak</p>
                    <p className="text-xs text-muted-foreground">
                      Google Authenticator, Authy yoki shunga o'xshash ilovani telefonga o'rnating
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">2FA qanday ishlaydi:</h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">1</div>
                    QR kodni skanerlang
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">2</div>
                    Ilovadan 6 xonali kodni oling
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">3</div>
                    Har safar kirishda shu kodni kiriting
                  </li>
                </ul>
              </div>

              <Button onClick={handleStartSetup} disabled={loading} className="w-full gap-2">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4" />
                )}
                2FA ni sozlash
              </Button>
            </div>
          )}

          {step === 'qr' && qrCode && (
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
                <p className="text-sm text-muted-foreground mt-3 text-center">
                  Authenticator ilovasi bilan bu QR kodni skanerlang
                </p>
              </div>

              {secret && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Yoki maxfiy kalitni qo'lda kiriting:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-muted rounded text-xs font-mono break-all">
                      {secret}
                    </code>
                    <Button variant="outline" size="icon" onClick={handleCopySecret}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <Button onClick={() => setStep('verify')} className="w-full">
                Davom etish
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Authenticator ilovasidan 6 xonali kodni kiriting
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl font-mono tracking-widest h-14"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('qr')} className="flex-1">
                  Orqaga
                </Button>
                <Button 
                  onClick={handleVerify} 
                  disabled={loading || verifyCode.length !== 6}
                  className="flex-1 gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Tasdiqlash
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
