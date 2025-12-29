import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from './ui/dialog';
import { toast } from 'sonner';
import { Star, MessageSquarePlus, Loader2, CheckCircle } from 'lucide-react';
import { z } from 'zod';

const testimonialSchema = z.object({
  content: z.string()
    .trim()
    .min(10, { message: "Sharh kamida 10 ta belgidan iborat bo'lishi kerak" })
    .max(500, { message: "Sharh 500 ta belgidan oshmasligi kerak" }),
  rating: z.number().min(1).max(5)
});

interface TestimonialFormProps {
  onSuccess?: () => void;
}

export const TestimonialForm = ({ onSuccess }: TestimonialFormProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user]);

  const handleSubmit = async () => {
    setErrors([]);
    
    // Validate input
    const result = testimonialSchema.safeParse({ content, rating });
    if (!result.success) {
      setErrors(result.error.errors.map(e => e.message));
      return;
    }

    if (!user || !profile) {
      toast.error("Sharh qoldirish uchun tizimga kiring");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('testimonials')
        .insert({
          name: profile.username,
          role: "O'quvchi",
          content: result.data.content,
          rating: result.data.rating,
          avatar_url: profile.avatar_url,
          is_active: false, // Admin tasdiqlashi kerak
          order_index: 999
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Sharhingiz yuborildi! Admin tasdiqlangandan so'ng ko'rinadi.");
      
      setTimeout(() => {
        setOpen(false);
        setContent('');
        setRating(5);
        setSubmitted(false);
        onSuccess?.();
      }, 2000);
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      toast.error("Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarButton = (value: number) => {
    const isActive = (hoveredRating || rating) >= value;
    return (
      <button
        key={value}
        type="button"
        onClick={() => setRating(value)}
        onMouseEnter={() => setHoveredRating(value)}
        onMouseLeave={() => setHoveredRating(0)}
        className="p-1 transition-transform hover:scale-110"
      >
        <Star 
          className={`h-8 w-8 transition-colors ${
            isActive 
              ? 'text-yellow-500 fill-yellow-500' 
              : 'text-gray-300 hover:text-yellow-400'
          }`} 
        />
      </button>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquarePlus className="h-4 w-4" />
          Sharh qoldirish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Fikringizni bildiring</DialogTitle>
        </DialogHeader>
        
        {submitted ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Rahmat!</h3>
            <p className="text-muted-foreground">
              Sharhingiz yuborildi. Admin tasdiqlangandan so'ng saytda ko'rinadi.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Baholang</Label>
                <div className="flex gap-1 justify-center py-2">
                  {[1, 2, 3, 4, 5].map(renderStarButton)}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Sharhingiz</Label>
                <Textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Platforma haqida fikringizni yozing..."
                  rows={4}
                  maxLength={500}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {content.length}/500
                </p>
              </div>
              
              {errors.length > 0 && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {errors.map((error, i) => (
                    <p key={i}>{error}</p>
                  ))}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Bekor qilish
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Yuborish
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
