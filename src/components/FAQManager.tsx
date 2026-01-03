import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  HelpCircle,
  Loader2,
  GripVertical
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: string;
  order_index: number;
  is_active: boolean;
}

const iconOptions = [
  { value: 'HelpCircle', label: 'Yordam' },
  { value: 'Calculator', label: 'Kalkulyator' },
  { value: 'GraduationCap', label: 'Kurs' },
  { value: 'Trophy', label: 'Kubok' },
  { value: 'Settings', label: 'Sozlamalar' },
  { value: 'BookOpen', label: 'Kitob' },
  { value: 'Target', label: 'Nishon' },
  { value: 'User', label: 'Foydalanuvchi' },
];

export const FAQManager = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    icon: 'HelpCircle',
    is_active: true,
  });

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('faq_items')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (data) {
      setFaqs(data);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      icon: 'HelpCircle',
      is_active: true,
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error("Savol va javobni kiriting");
      return;
    }

    const payload = {
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      icon: formData.icon,
      is_active: formData.is_active,
      order_index: editingId ? undefined : faqs.length,
    };

    if (editingId) {
      const { error } = await supabase
        .from('faq_items')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        toast.error("Xatolik yuz berdi");
      } else {
        toast.success("FAQ yangilandi");
        resetForm();
        fetchFAQs();
      }
    } else {
      const { error } = await supabase
        .from('faq_items')
        .insert([payload]);

      if (error) {
        toast.error("Xatolik yuz berdi");
      } else {
        toast.success("FAQ qo'shildi");
        resetForm();
        fetchFAQs();
      }
    }
  };

  const handleEdit = (faq: FAQItem) => {
    setFormData({
      question: faq.question,
      answer: faq.answer,
      icon: faq.icon,
      is_active: faq.is_active,
    });
    setEditingId(faq.id);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("FAQ ni o'chirmoqchimisiz?")) return;

    const { error } = await supabase
      .from('faq_items')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Xatolik yuz berdi");
    } else {
      toast.success("FAQ o'chirildi");
      fetchFAQs();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('faq_items')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) {
      fetchFAQs();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 blur-xl animate-pulse" />
          <div className="relative p-4 rounded-full bg-gradient-to-br from-card/80 to-muted/50 border border-border/50 shadow-lg dark:from-slate-800/80 dark:to-slate-900/50 dark:border-slate-600/50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Form Card */}
      <Card className="border-border/40 dark:border-slate-600/50 bg-gradient-to-br from-card via-card/95 to-muted/30 dark:from-slate-800/90 dark:via-slate-800/70 dark:to-slate-900/80">
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/30 dark:to-accent/30">
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            {editingId ? "FAQ tahrirlash" : "Yangi FAQ qo'shish"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Savol *</Label>
                <Input
                  placeholder="Masalan: Mashq qanday ishlaydi?"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="text-sm dark:bg-slate-800/50 dark:border-slate-600/50 focus:border-primary/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Ikonka</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(v) => setFormData({ ...formData, icon: v })}
                  >
                    <SelectTrigger className="text-sm dark:bg-slate-800/50 dark:border-slate-600/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:border-slate-600/50">
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-sm">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Holat</Label>
                  <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-lg bg-muted/50 dark:bg-slate-800/50 border border-border/30 dark:border-slate-600/30">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                    />
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {formData.is_active ? "Faol" : "Nofaol"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Javob *</Label>
              <Textarea
                placeholder="Savolga to'liq javob yozing..."
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                rows={3}
                className="text-sm min-h-[80px] dark:bg-slate-800/50 dark:border-slate-600/50 focus:border-primary/50"
              />
            </div>

            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 pt-2">
              <Button type="submit" className="gap-2 w-full xs:w-auto text-sm bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                {editingId ? (
                  <>
                    <Save className="h-4 w-4" />
                    Saqlash
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Qo'shish
                  </>
                )}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={resetForm} className="w-full xs:w-auto text-sm dark:bg-slate-800/50 dark:border-slate-600/50 dark:hover:bg-slate-700/50">
                  <X className="h-4 w-4 mr-2" />
                  Bekor qilish
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* FAQ List */}
      <Card className="border-border/40 dark:border-slate-600/50 bg-gradient-to-br from-card via-card/95 to-muted/30 dark:from-slate-800/90 dark:via-slate-800/70 dark:to-slate-900/80">
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
          <CardTitle className="flex items-center justify-between text-sm sm:text-base">
            <span className="text-foreground">FAQ ro'yxati</span>
            <Badge variant="secondary" className="text-[10px] sm:text-xs dark:bg-slate-700 dark:text-slate-300">{faqs.length} ta</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
          {faqs.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="p-4 rounded-full bg-gradient-to-br from-muted to-muted/50 dark:from-slate-700 dark:to-slate-800 w-fit mx-auto mb-4">
                <HelpCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium text-sm sm:text-base">FAQ lar topilmadi</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Yangi FAQ qo'shish uchun yuqoridagi formani to'ldiring</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className={`flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all ${
                    faq.is_active 
                      ? 'bg-gradient-to-r from-secondary/60 to-secondary/40 dark:from-slate-700/60 dark:to-slate-700/40 border-border/40 dark:border-slate-600/40 hover:border-primary/30 dark:hover:border-primary/40' 
                      : 'bg-muted/30 dark:bg-slate-800/30 border-border/20 dark:border-slate-700/20 opacity-60'
                  }`}
                >
                  <div className="hidden sm:block pt-1">
                    <GripVertical className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
                      <Badge variant="outline" className="text-[10px] sm:text-xs dark:border-slate-600 dark:text-slate-300">{faq.icon}</Badge>
                      {!faq.is_active && (
                        <Badge variant="secondary" className="text-[10px] sm:text-xs text-muted-foreground dark:bg-slate-700">Nofaol</Badge>
                      )}
                    </div>
                    <p className="font-semibold text-sm sm:text-base mb-1 text-foreground">{faq.question}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground/80 dark:text-slate-400 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-end sm:justify-start self-end sm:self-auto">
                    <Switch
                      checked={faq.is_active}
                      onCheckedChange={() => toggleActive(faq.id, faq.is_active)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(faq)}
                      className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-primary/10 dark:hover:bg-primary/20"
                    >
                      <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(faq.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
