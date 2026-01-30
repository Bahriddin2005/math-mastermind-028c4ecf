import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Upload, 
  CheckCircle2, 
  Copy, 
  Loader2,
  Image as ImageIcon,
  X,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planType: string;
  planName: string;
  amount: number;
}

// Karta ma'lumotlari - bu yerga o'z kartangizni qo'shing
const CARD_INFO = {
  number: "8600 1234 5678 9012",
  holder: "IQROMAX LLC",
  bank: "Uzcard"
};

export const CardPaymentModal = ({
  open,
  onOpenChange,
  planType,
  planName,
  amount
}: CardPaymentModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<'info' | 'upload' | 'success'>('info');
  const [uploading, setUploading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const copyCardNumber = async () => {
    await navigator.clipboard.writeText(CARD_INFO.number.replace(/\s/g, ''));
    setCopied(true);
    toast({ title: "Karta raqami nusxalandi", description: "Endi to'lov ilovasida qo'ying" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Fayl juda katta", description: "5 MB dan kichik rasm tanlang", variant: "destructive" });
        return;
      }
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!user || !receiptFile) return;

    setUploading(true);
    try {
      // Chekni storage'ga yuklash
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      // Public URL olish
      const { data: urlData } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(fileName);

      // Payment request yaratish
      const { error: insertError } = await supabase
        .from('payment_requests')
        .insert({
          user_id: user.id,
          plan_type: planType,
          amount: amount,
          receipt_url: urlData.publicUrl,
          status: 'pending'
        });

      if (insertError) throw insertError;

      setStep('success');
      toast({ 
        title: "So'rov yuborildi!", 
        description: "Admin tekshirgandan so'ng obunangiz faollashtiriladi" 
      });

    } catch (error: any) {
      console.error('Payment request error:', error);
      toast({ 
        title: "Xatolik yuz berdi", 
        description: error.message || "Qayta urinib ko'ring",
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setStep('info');
    setReceiptFile(null);
    setReceiptPreview(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            {step === 'success' ? "So'rov yuborildi" : "Plastik karta orqali to'lov"}
          </DialogTitle>
          <DialogDescription>
            {step === 'info' && `${planName} obunasi uchun to'lov`}
            {step === 'upload' && "To'lov chekini yuklang"}
            {step === 'success' && "So'rovingiz admin tomonidan ko'rib chiqiladi"}
          </DialogDescription>
        </DialogHeader>

        {step === 'info' && (
          <div className="space-y-4">
            {/* Summa */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 text-center">
              <p className="text-sm text-muted-foreground mb-1">To'lov summasi</p>
              <p className="text-2xl font-bold text-primary">{formatAmount(amount)}</p>
              <Badge variant="secondary" className="mt-2">{planName}</Badge>
            </div>

            {/* Karta ma'lumotlari */}
            <div className="space-y-3">
              <Label className="text-muted-foreground">Quyidagi kartaga pul o'tkazing:</Label>
              
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white relative overflow-hidden">
                {/* Card design elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative">
                  <div className="flex justify-between items-start mb-6">
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                      {CARD_INFO.bank}
                    </Badge>
                    <CreditCard className="w-8 h-8 text-white/60" />
                  </div>
                  
                  <button
                    onClick={copyCardNumber}
                    className="flex items-center gap-2 text-xl font-mono tracking-wider hover:text-primary transition-colors"
                  >
                    {CARD_INFO.number}
                    {copied ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 opacity-60" />
                    )}
                  </button>
                  
                  <p className="mt-4 text-sm text-white/60">{CARD_INFO.holder}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                👆 Karta raqamini bosib nusxalang
              </p>
            </div>

            {/* Qo'llanma */}
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-600 dark:text-amber-400">
                  <p className="font-medium mb-1">To'lov qilish tartibi:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Bank ilovangizni oching</li>
                    <li>Yuqoridagi kartaga {formatAmount(amount)} o'tkazing</li>
                    <li>To'lov chekini saqlang</li>
                    <li>"Keyingi" tugmasini bosing</li>
                  </ol>
                </div>
              </div>
            </div>

            <Button onClick={() => setStep('upload')} className="w-full">
              To'lov qildim - Keyingi
            </Button>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {!receiptPreview ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-primary/30 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium">To'lov chekini yuklang</p>
                  <p className="text-sm text-muted-foreground">PNG, JPG (max 5MB)</p>
                </div>
              </button>
            ) : (
              <div className="relative">
                <img
                  src={receiptPreview}
                  alt="Receipt preview"
                  className="w-full h-48 object-cover rounded-xl border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => {
                    setReceiptFile(null);
                    setReceiptPreview(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
                <div className="absolute bottom-2 left-2 right-2">
                  <Badge className="bg-black/60 text-white">
                    <ImageIcon className="w-3 h-3 mr-1" />
                    {receiptFile?.name}
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('info')} className="flex-1">
                Orqaga
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!receiptFile || uploading}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Yuklanmoqda...
                  </>
                ) : (
                  "So'rov yuborish"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-1">So'rov qabul qilindi!</h3>
              <p className="text-sm text-muted-foreground">
                Admin to'lovni tekshirgandan so'ng obunangiz faollashtiriladi. 
                Bu odatda 1-2 soat ichida amalga oshiriladi.
              </p>
            </div>

            <Button onClick={handleClose} className="w-full">
              Tushunarli
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
