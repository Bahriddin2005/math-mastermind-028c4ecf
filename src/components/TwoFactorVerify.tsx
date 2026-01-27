import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';

interface TwoFactorVerifyProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const TwoFactorVerify = ({ onSuccess, onCancel }: TwoFactorVerifyProps) => {
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      setError("6 xonali kodni kiriting");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get list of factors
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) throw factorsError;

      const totpFactor = factorsData.totp[0];
      
      if (!totpFactor) {
        throw new Error("TOTP faktor topilmadi");
      }

      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });

      if (challengeError) throw challengeError;

      // Verify the code
      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      toast.success("Muvaffaqiyatli tasdiqlandi!");
      onSuccess();
    } catch (err: any) {
      console.error('MFA verify error:', err);
      setError(err.message || "Kod noto'g'ri yoki muddati o'tgan");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verifyCode.length === 6) {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-72 sm:w-96 h-72 sm:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="w-full max-w-md border-border/40 shadow-2xl backdrop-blur-sm bg-card/80 relative z-10">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-display">2FA Tasdiqlash</CardTitle>
          <CardDescription>
            Authenticator ilovasidan 6 xonali kodni kiriting
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={verifyCode}
              onChange={(e) => {
                setVerifyCode(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              onKeyPress={handleKeyPress}
              className="text-center text-3xl font-mono tracking-[0.5em] h-16"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive p-3 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button 
            onClick={handleVerify} 
            disabled={loading || verifyCode.length !== 6}
            className="w-full h-12 text-lg gap-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Shield className="h-5 w-5" />
                Tasdiqlash
              </>
            )}
          </Button>

          <Button 
            variant="ghost" 
            onClick={onCancel}
            className="w-full gap-2 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Orqaga qaytish
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Authenticator ilovangizni oching va hozirgi kodni kiriting. Kod har 30 soniyada yangilanadi.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
