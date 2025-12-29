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
        className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Quote className="h-5 w-5" />
            Foydalanuvchilar sharhlari
          </CardTitle>
          <CardDescription>Sharhlarni qo'shish va boshqarish</CardDescription>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Yangi sharh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Quote className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Hali sharhlar yo'q</p>
          </div>
        ) : (
          <div className="space-y-3">
            {testimonials.map((testimonial) => (
              <div 
                key={testimonial.id} 
                className={`p-4 rounded-xl border transition-all ${testimonial.is_active ? 'bg-secondary/30' : 'bg-muted/50 opacity-60'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {testimonial.avatar_url ? (
                        <img 
                          src={testimonial.avatar_url} 
                          alt={testimonial.name} 
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{testimonial.name}</span>
                        <span className="text-sm text-muted-foreground">- {testimonial.role}</span>
                      </div>
                      <div className="flex gap-0.5 mb-2">
                        {renderStars(testimonial.rating)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">"{testimonial.content}"</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => toggleActive(testimonial)}
                      title={testimonial.is_active ? "Yashirish" : "Faollashtirish"}
                    >
                      <div className={`w-3 h-3 rounded-full ${testimonial.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDialog(testimonial)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(testimonial.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTestimonial ? 'Sharhni tahrirlash' : 'Yangi sharh'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ism</Label>
                <Input 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  placeholder="Foydalanuvchi ismi" 
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Input 
                  value={form.role} 
                  onChange={(e) => setForm({ ...form, role: e.target.value })} 
                  placeholder="O'quvchi, O'qituvchi..." 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sharh matni</Label>
              <Textarea 
                value={form.content} 
                onChange={(e) => setForm({ ...form, content: e.target.value })} 
                placeholder="Foydalanuvchi fikri..." 
                rows={4} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reyting (1-5)</Label>
                <Input 
                  type="number" 
                  min={1} 
                  max={5} 
                  value={form.rating} 
                  onChange={(e) => setForm({ ...form, rating: Math.min(5, Math.max(1, parseInt(e.target.value) || 5)) })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Tartib raqami</Label>
                <Input 
                  type="number" 
                  min={0} 
                  value={form.order_index} 
                  onChange={(e) => setForm({ ...form, order_index: parseInt(e.target.value) || 0 })} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Avatar URL (ixtiyoriy)</Label>
              <Input 
                value={form.avatar_url} 
                onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} 
                placeholder="https://..." 
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={form.is_active} 
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} 
              />
              <Label>Faol (saytda ko'rinadi)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
