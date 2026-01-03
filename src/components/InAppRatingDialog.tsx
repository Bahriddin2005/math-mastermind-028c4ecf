import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Heart, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const RATING_KEY = 'iqromax_last_rating';
const RATING_PROMPT_KEY = 'iqromax_rating_prompt_count';

interface InAppRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerType?: 'manual' | 'auto';
}

export const useRatingPrompt = () => {
  const [shouldPrompt, setShouldPrompt] = useState(false);

  useEffect(() => {
    const lastRating = localStorage.getItem(RATING_KEY);
    const promptCount = parseInt(localStorage.getItem(RATING_PROMPT_KEY) || '0');
    
    // Don't prompt if already rated in the last 30 days
    if (lastRating) {
      const lastDate = new Date(lastRating);
      const daysSinceRating = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceRating < 30) {
        return;
      }
    }
    
    // Prompt after 5 app opens
    if (promptCount >= 5) {
      setShouldPrompt(true);
    }
    
    // Increment prompt count
    localStorage.setItem(RATING_PROMPT_KEY, String(promptCount + 1));
  }, []);

  const markAsPrompted = () => {
    setShouldPrompt(false);
    localStorage.setItem(RATING_KEY, new Date().toISOString());
  };

  const resetPrompt = () => {
    localStorage.removeItem(RATING_KEY);
    localStorage.removeItem(RATING_PROMPT_KEY);
  };

  return { shouldPrompt, markAsPrompted, resetPrompt };
};

export const InAppRatingDialog = ({ 
  open, 
  onOpenChange,
  triggerType = 'manual'
}: InAppRatingDialogProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [step, setStep] = useState<'rating' | 'feedback' | 'thanks'>('rating');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingClick = (value: number) => {
    setRating(value);
    // If high rating, go to thanks, otherwise ask for feedback
    if (value >= 4) {
      setStep('thanks');
      localStorage.setItem(RATING_KEY, new Date().toISOString());
    } else {
      setStep('feedback');
    }
  };

  const handleSubmitFeedback = async () => {
    setIsSubmitting(true);
    
    // Simulate sending feedback (in real app, send to backend)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    localStorage.setItem(RATING_KEY, new Date().toISOString());
    setStep('thanks');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setRating(0);
      setHoveredRating(0);
      setFeedback('');
      setStep('rating');
    }, 200);
  };

  const handleOpenAppStore = () => {
    // Detect platform and open appropriate store
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      window.open('https://apps.apple.com/app/iqromax', '_blank');
    } else {
      window.open('https://play.google.com/store/apps/details?id=dev.iqromax.app', '_blank');
    }
    handleClose();
    toast.success("Bahoyingiz uchun rahmat!");
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/50 dark:border-border/30">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary via-primary/90 to-accent p-6 text-center relative">
          <button 
            onClick={handleClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
          
          {step === 'thanks' ? (
            <div className="animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
                <Heart className="h-8 w-8 text-white fill-white animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-white">Rahmat!</h2>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
                <Star className="h-8 w-8 text-white fill-white" />
              </div>
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-xl font-bold text-white">
                  IQroMax sizga yoqdimi?
                </DialogTitle>
                <DialogDescription className="text-white/80 text-sm">
                  Fikringizni bildiring va ilovani yaxshilashga yordam bering
                </DialogDescription>
              </DialogHeader>
            </>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'rating' && (
            <div className="space-y-4 animate-fade-in">
              {/* Star Rating */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleRatingClick(value)}
                    onMouseEnter={() => setHoveredRating(value)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star 
                      className={cn(
                        "h-10 w-10 transition-colors",
                        value <= displayRating 
                          ? "text-yellow-400 fill-yellow-400" 
                          : "text-muted-foreground/30"
                      )} 
                    />
                  </button>
                ))}
              </div>
              
              <p className="text-center text-sm text-muted-foreground">
                {displayRating === 0 && "Yulduzlarni bosib baholang"}
                {displayRating === 1 && "Yomon 😞"}
                {displayRating === 2 && "Qoniqarsiz 😐"}
                {displayRating === 3 && "Yaxshi 🙂"}
                {displayRating === 4 && "Juda yaxshi! 😊"}
                {displayRating === 5 && "Zo'r! 🎉"}
              </p>

              {triggerType === 'auto' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClose}
                  className="w-full text-muted-foreground"
                >
                  Keyinroq
                </Button>
              )}
            </div>
          )}

          {step === 'feedback' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star 
                    key={value}
                    className={cn(
                      "h-5 w-5",
                      value <= rating 
                        ? "text-yellow-400 fill-yellow-400" 
                        : "text-muted-foreground/30"
                    )} 
                  />
                ))}
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Nimani yaxshilashimiz mumkin?</p>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Fikr va takliflaringizni yozing..."
                  className="min-h-[100px] resize-none"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('rating')}
                  className="flex-1"
                >
                  Orqaga
                </Button>
                <Button 
                  onClick={handleSubmitFeedback}
                  disabled={isSubmitting || !feedback.trim()}
                  className="flex-1 gap-2"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Yuborish
                </Button>
              </div>
            </div>
          )}

          {step === 'thanks' && (
            <div className="space-y-4 text-center animate-fade-in">
              <p className="text-muted-foreground">
                {rating >= 4 
                  ? "Bahoyingiz biz uchun juda muhim! Agar vaqtingiz bo'lsa, App Store'da ham baholang."
                  : "Fikringiz uchun rahmat! Biz ilovani yaxshilash ustida ishlaymiz."
                }
              </p>
              
              {rating >= 4 && (
                <Button 
                  onClick={handleOpenAppStore}
                  className="gap-2 w-full"
                >
                  <Star className="h-4 w-4" />
                  App Store'da baholash
                </Button>
              )}
              
              <Button 
                variant={rating >= 4 ? "outline" : "default"}
                onClick={handleClose}
                className="w-full"
              >
                Yopish
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
