import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from './ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2, Star, Quote, User } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar_url: string | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export const TestimonialsManager = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    role: "O'quvchi",
    content: '',
    rating: 5,
    avatar_url: '',
    is_active: true,
    order_index: 0
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .order('order_index', { ascending: true });
    if (data) setTestimonials(data);
    setLoading(false);
  };

  const openDialog = (testimonial?: Testimonial) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      setForm({
        name: testimonial.name,
        role: testimonial.role,
        content: testimonial.content,
        rating: testimonial.rating,
        avatar_url: testimonial.avatar_url || '',
        is_active: testimonial.is_active,
        order_index: testimonial.order_index
      });
    } else {
      setEditingTestimonial(null);
      setForm({
        name: '',
        role: "O'quvchi",
        content: '',
        rating: 5,
        avatar_url: '',
        is_active: true,
        order_index: testimonials.length
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.content) {
      toast.error("Ism va sharh matnini kiriting");
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        role: form.role,
        content: form.content,
        rating: form.rating,
        avatar_url: form.avatar_url || null,
        is_active: form.is_active,
        order_index: form.order_index
      };

      if (editingTestimonial) {
        const { error } = await supabase
          .from('testimonials')
          .update(payload)
          .eq('id', editingTestimonial.id);
        if (error) throw error;
        toast.success("Sharh yangilandi");
      } else {
        const { error } = await supabase
          .from('testimonials')
          .insert(payload);
        if (error) throw error;
        toast.success("Sharh qo'shildi");
      }
      
      setDialogOpen(false);
      fetchTestimonials();
    } catch (error) {
      console.error('Error saving testimonial:', error);
      toast.error("Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', id);
    if (!error) {
      setTestimonials(prev => prev.filter(t => t.id !== id));
      toast.success("Sharh o'chirildi");
    }
  };

  const toggleActive = async (testimonial: Testimonial) => {
    const { error } = await supabase
      .from('testimonials')
      .update({ is_active: !testimonial.is_active })
      .eq('id', testimonial.id);
    if (!error) {
      setTestimonials(prev => 
        prev.map(t => t.id === testimonial.id ? { ...t, is_active: !t.is_active } : t)
      );
      toast.success(testimonial.is_active ? "Sharh yashirildi" : "Sharh faollashtirildi");
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-3 w-3 sm:h-4 sm:w-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-slate-600'}`} 
      />
    ));
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-card via-card/95 to-muted/30 dark:from-slate-800/90 dark:via-slate-800/70 dark:to-slate-900/80 border-border/50 dark:border-slate-600/50">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 sm:px-6 py-3 sm:py-6 border-b border-border/30 dark:border-slate-700/30">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 dark:from-yellow-500/30 dark:to-orange-500/30">
              <Quote className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            Foydalanuvchilar sharhlari
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm mt-1">Sharhlarni qo'shish va boshqarish</CardDescription>
        </div>
        <Button onClick={() => openDialog()} size="sm" className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
          <Plus className="h-4 w-4 mr-2" />
          Yangi sharh
        </Button>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 py-4 sm:py-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 blur-xl animate-pulse" />
              <div className="relative p-4 rounded-full bg-gradient-to-br from-card/80 to-muted/50 border border-border/50 shadow-lg dark:from-slate-800/80 dark:to-slate-900/50 dark:border-slate-600/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="p-4 rounded-full bg-gradient-to-br from-muted to-muted/50 dark:from-slate-700 dark:to-slate-800 w-fit mx-auto mb-4">
              <Quote className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium text-sm sm:text-base">Hali sharhlar yo'q</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Yangi sharh qo'shish uchun yuqoridagi tugmani bosing</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {testimonials.map((testimonial) => (
              <div 
                key={testimonial.id} 
                className={`p-3 sm:p-4 rounded-xl border transition-all ${
                  testimonial.is_active 
                    ? 'bg-gradient-to-r from-secondary/60 to-secondary/40 dark:from-slate-700/60 dark:to-slate-700/40 border-border/40 dark:border-slate-600/40 hover:border-primary/30 dark:hover:border-primary/40' 
                    : 'bg-muted/30 dark:bg-slate-800/30 border-border/20 dark:border-slate-700/20 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/30 dark:to-accent/30 flex items-center justify-center shrink-0">
                      {testimonial.avatar_url ? (
                        <img 
                          src={testimonial.avatar_url} 
                          alt={testimonial.name} 
                          className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                        <span className="font-semibold text-sm sm:text-base text-foreground">{testimonial.name}</span>
                        <span className="text-xs sm:text-sm text-muted-foreground">- {testimonial.role}</span>
                      </div>
                      <div className="flex gap-0.5 mb-1.5 sm:mb-2">
                        {renderStars(testimonial.rating)}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground/80 dark:text-slate-400 line-clamp-2">"{testimonial.content}"</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-end sm:justify-start self-end sm:self-auto">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => toggleActive(testimonial)}
                      title={testimonial.is_active ? "Yashirish" : "Faollashtirish"}
                      className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-primary/10 dark:hover:bg-primary/20"
                    >
                      <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${testimonial.is_active ? 'bg-green-500' : 'bg-gray-400 dark:bg-slate-500'}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDialog(testimonial)} className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-primary/10 dark:hover:bg-primary/20">
                      <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(testimonial.id)} className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Testimonial Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-background to-muted/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 dark:from-yellow-500/30 dark:to-orange-500/30">
                <Quote className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              {editingTestimonial ? 'Sharhni tahrirlash' : 'Yangi sharh'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Ism</Label>
                <Input 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  placeholder="Foydalanuvchi ismi"
                  className="text-sm dark:bg-slate-800/50 dark:border-slate-600/50 focus:border-primary/50"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Rol</Label>
                <Input 
                  value={form.role} 
                  onChange={(e) => setForm({ ...form, role: e.target.value })} 
                  placeholder="O'quvchi, O'qituvchi..."
                  className="text-sm dark:bg-slate-800/50 dark:border-slate-600/50 focus:border-primary/50"
                />
              </div>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Sharh matni</Label>
              <Textarea 
                value={form.content} 
                onChange={(e) => setForm({ ...form, content: e.target.value })} 
                placeholder="Foydalanuvchi fikri..." 
                rows={3}
                className="text-sm min-h-[80px] dark:bg-slate-800/50 dark:border-slate-600/50 focus:border-primary/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Reyting (1-5)</Label>
                <Input 
                  type="number" 
                  min={1} 
                  max={5} 
                  value={form.rating} 
                  onChange={(e) => setForm({ ...form, rating: Math.min(5, Math.max(1, parseInt(e.target.value) || 5)) })}
                  className="text-sm dark:bg-slate-800/50 dark:border-slate-600/50 focus:border-primary/50"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Tartib raqami</Label>
                <Input 
                  type="number" 
                  min={0} 
                  value={form.order_index} 
                  onChange={(e) => setForm({ ...form, order_index: parseInt(e.target.value) || 0 })}
                  className="text-sm dark:bg-slate-800/50 dark:border-slate-600/50 focus:border-primary/50"
                />
              </div>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Avatar URL (ixtiyoriy)</Label>
              <Input 
                value={form.avatar_url} 
                onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} 
                placeholder="https://..."
                className="text-sm dark:bg-slate-800/50 dark:border-slate-600/50 focus:border-primary/50"
              />
            </div>
            <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-muted/50 dark:bg-slate-800/50">
              <Switch 
                checked={form.is_active} 
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} 
              />
              <Label className="text-xs sm:text-sm">Faol (saytda ko'rinadi)</Label>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto text-sm dark:bg-slate-800/50 dark:border-slate-600/50 dark:hover:bg-slate-700/50">Bekor qilish</Button>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto text-sm bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
